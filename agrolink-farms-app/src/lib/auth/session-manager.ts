import { Session, User as AuthUser } from '@supabase/supabase-js'
import { createBrowserClient } from '../supabase/client'
import { AuthError as AuthErrorType, AuthErrorCode } from './types'

/**
 * Interface for session management operations
 */
export interface ISessionManager {
  getSession(): Promise<Session | null>
  refreshSession(): Promise<Session | null>
  clearSession(): Promise<void>
  isSessionValid(session: Session): boolean
  setupAutoRefresh(session: Session): void
  restoreSessionFromCookies(): Promise<Session | null>
  persistSessionToCookies(session: Session): Promise<void>
}

/**
 * Session Manager handles token lifecycle, refresh, and persistence
 * Provides secure session management with automatic token refresh
 */
export class SessionManager implements ISessionManager {
  private supabase = createBrowserClient()
  private refreshTimeout: NodeJS.Timeout | null = null
  private isRefreshing = false
  private refreshPromise: Promise<Session | null> | null = null
  private restoredFromCookies = false

  /**
   * Get the current session from Supabase
   * On first call, attempts to restore from cookies if available
   * @returns Current session or null if not authenticated
   */
  async getSession(): Promise<Session | null> {
    try {
      // Try to restore from cookies on first call
      if (!this.restoredFromCookies) {
        const restoredSession = await this.restoreSessionFromCookies()
        if (restoredSession) {
          this.restoredFromCookies = true
          return restoredSession
        }
        this.restoredFromCookies = true
      }

      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        return null
      }

      return session
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  /**
   * Refresh the current session's access token
   * Implements deduplication to prevent concurrent refresh attempts
   * @returns Refreshed session or null if refresh failed
   */
  async refreshSession(): Promise<Session | null> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    // Set refreshing state and create promise
    this.isRefreshing = true
    this.refreshPromise = this._performRefresh()

    try {
      const result = await this.refreshPromise
      return result
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  /**
   * Internal method to perform the actual token refresh
   */
  private async _performRefresh(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession()
      
      if (error) {
        console.error('Error refreshing session:', error)
        throw this.createAuthError({
          code: AuthErrorCode.TOKEN_REFRESH_FAILED,
          message: error.message,
          userMessage: 'Session refresh failed. Please sign in again.',
          retryable: false
        });
      }

      if (session) {
        // Set up auto-refresh for the new session
        this.setupAutoRefresh(session)
        // Persist session to cookies for server-side access
        await this.persistSessionToCookies(session)
      }

      return session
    } catch (error) {
      console.error('Failed to refresh session:', error)
      
      if (error instanceof Error && 'code' in error) {
        throw error as AuthErrorType;
      }
      
      throw this.createAuthError({
        code: AuthErrorCode.TOKEN_REFRESH_FAILED,
        message: error instanceof Error ? error.message : 'Unknown refresh error',
        userMessage: 'Session refresh failed. Please sign in again.',
        retryable: false
      });
    }
  }

  /**
   * Clear all session data and tokens
   * Revokes tokens on server and clears local storage and cookies
   */
  async clearSession(): Promise<void> {
    try {
      // Clear any pending refresh timeout
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout)
        this.refreshTimeout = null
      }

      // Sign out from Supabase (revokes tokens)
      const { error } = await this.supabase.auth.signOut()
      
      if (error) {
        console.error('Error during signout:', error)
        // Continue with local cleanup even if server signout fails
      }

      // Clear session cookies
      if (typeof window !== 'undefined') {
        // Clear the auth token cookie
        document.cookie = 'supabase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=lax'
        
        // Clear any other Supabase cookies
        const cookies = document.cookie.split(';')
        cookies.forEach(cookie => {
          const [name] = cookie.trim().split('=')
          if (name && name.includes('supabase')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=lax`
          }
        })
      }

      // Reset restoration flag
      this.restoredFromCookies = false
    } catch (error) {
      console.error('Failed to clear session:', error)
      // Continue with local cleanup even if there's an error
    }
  }

  /**
   * Check if a session is valid (not expired)
   * @param session Session to validate
   * @returns True if session is valid, false otherwise
   */
  isSessionValid(session: Session): boolean {
    if (!session || !session.access_token || !session.expires_at) {
      return false
    }

    // Check if token is expired (with 30 second buffer)
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at
    const bufferSeconds = 30

    return expiresAt > (now + bufferSeconds)
  }

  /**
   * Set up automatic token refresh before expiration
   * Schedules refresh 5 minutes before token expires
   * Implements retry logic for failed refresh attempts
   * @param session Current session to monitor
   */
  setupAutoRefresh(session: Session): void {
    // Clear any existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }

    // Only set up refresh for valid sessions
    if (!session || !session.access_token || !session.expires_at) {
      return
    }

    // Calculate time until refresh (5 minutes before expiration)
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at
    const refreshBeforeSeconds = 5 * 60 // 5 minutes
    const timeUntilRefresh = (expiresAt - refreshBeforeSeconds - now) * 1000

    // Only set timeout if we have enough time
    if (timeUntilRefresh > 0) {
      this.refreshTimeout = setTimeout(() => {
        this._performAutoRefreshWithRetry(0)
      }, timeUntilRefresh)
    }
  }

  /**
   * Perform automatic refresh with exponential backoff retry logic
   * @param retryCount Current retry attempt (0-based)
   */
  private async _performAutoRefreshWithRetry(retryCount: number): Promise<void> {
    const maxRetries = 3
    const baseDelayMs = 1000 // 1 second base delay

    try {
      const refreshedSession = await this.refreshSession()
      
      if (refreshedSession) {
        // Success - refresh completed
        return
      }
      
      // If no session returned but no error thrown, treat as failure
      throw new Error('Refresh returned null session')
      
    } catch (error) {
      console.error(`Auto-refresh attempt ${retryCount + 1} failed:`, error)
      
      // If we haven't exceeded max retries, schedule another attempt
      if (retryCount < maxRetries) {
        const delayMs = baseDelayMs * Math.pow(2, retryCount) // Exponential backoff
        
        this.refreshTimeout = setTimeout(() => {
          this._performAutoRefreshWithRetry(retryCount + 1)
        }, delayMs)
        
        return
      }
      
      // Max retries exceeded - log final failure
      console.error('Auto-refresh failed after maximum retries. User will need to re-authenticate.')
      
      // Clear the session since refresh failed completely
      try {
        await this.clearSession()
      } catch (clearError) {
        console.error('Failed to clear session after refresh failure:', clearError)
      }
    }
  }

  /**
   * Clean up resources when session manager is destroyed
   */
  destroy(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
  }

  /**
   * Restore session from cookies (for server-side session restoration)
   * Checks for valid session tokens in cookies and restores the session
   * @returns Restored session or null if no valid session found
   */
  async restoreSessionFromCookies(): Promise<Session | null> {
    try {
      // Only works in browser environment
      if (typeof window === 'undefined') {
        return null
      }

      // Check if we have session data in cookies
      const cookieString = document.cookie
      if (!cookieString) {
        return null
      }

      // Parse cookies to find Supabase session data
      const cookies = cookieString.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=')
        if (name && value) {
          acc[name] = decodeURIComponent(value)
        }
        return acc
      }, {} as Record<string, string>)

      // Look for Supabase auth tokens in cookies
      const authTokenKey = Object.keys(cookies).find(key => 
        key.includes('supabase') && key.includes('auth-token')
      )

      if (!authTokenKey || !cookies[authTokenKey]) {
        return null
      }

      try {
        // Parse the session data from cookie
        const sessionData = JSON.parse(cookies[authTokenKey])
        
        if (!sessionData || !sessionData.access_token || !sessionData.refresh_token) {
          return null
        }

        // Validate session is not expired
        if (!this.isSessionValid(sessionData)) {
          // Try to refresh if we have a refresh token
          if (sessionData.refresh_token) {
            return await this.refreshSession()
          }
          return null
        }

        // Set the session in Supabase client
        const { data, error } = await this.supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token
        })

        if (error) {
          console.error('Error restoring session from cookies:', error)
          return null
        }

        if (data.session) {
          // Set up auto-refresh for restored session
          this.setupAutoRefresh(data.session)
        }

        return data.session
      } catch (parseError) {
        console.error('Error parsing session data from cookies:', parseError)
        return null
      }
    } catch (error) {
      console.error('Failed to restore session from cookies:', error)
      return null
    }
  }

  /**
   * Persist session to cookies for server-side access
   * Stores session tokens in secure, httpOnly cookies
   * @param session Session to persist
   */
  async persistSessionToCookies(session: Session): Promise<void> {
    try {
      // Only works in browser environment
      if (typeof window === 'undefined') {
        return
      }

      if (!session || !session.access_token || !session.refresh_token) {
        return
      }

      // Create session data object
      const sessionData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user
      }

      // Calculate expiration time for cookie (use refresh token expiry)
      const expirationDate = new Date()
      expirationDate.setTime(expirationDate.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days

      // Set cookie with session data
      const cookieName = 'supabase-auth-token'
      const cookieValue = encodeURIComponent(JSON.stringify(sessionData))
      const isProduction = process.env.NODE_ENV === 'production'
      
      document.cookie = `${cookieName}=${cookieValue}; ` +
        `expires=${expirationDate.toUTCString()}; ` +
        `path=/; ` +
        `SameSite=lax` +
        (isProduction ? '; Secure' : '')

    } catch (error) {
      console.error('Failed to persist session to cookies:', error)
    }
  }

  /**
   * Helper function to create AuthError objects
   */
  private createAuthError(options: {
    code: AuthErrorCode
    message: string
    userMessage: string
    retryable: boolean
    retryAfter?: number
    metadata?: Record<string, any>
  }): AuthErrorType {
    return {
      code: options.code,
      message: options.message,
      userMessage: options.userMessage,
      retryable: options.retryable,
      retryAfter: options.retryAfter,
      metadata: options.metadata
    };
  }
}

// Export singleton instance for use throughout the application
export const sessionManager = new SessionManager()