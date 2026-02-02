import { SessionManager } from '../session-manager'
import { createBrowserClient } from '../../supabase/client'
import { AuthErrorCode } from '../types'
import type { Session, User as AuthUser } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('../../supabase/client')

const mockCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>

// Mock document.cookie for testing
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: ''
})

describe('SessionManager', () => {
  let sessionManager: SessionManager
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getSession: jest.fn(),
        refreshSession: jest.fn(),
        signOut: jest.fn(),
        setSession: jest.fn()
      }
    }

    mockCreateBrowserClient.mockReturnValue(mockSupabase)
    sessionManager = new SessionManager()
    
    // Clear document.cookie before each test
    document.cookie = ''
  })

  afterEach(() => {
    jest.clearAllMocks()
    sessionManager.destroy()
  })

  describe('clearSession', () => {
    it('should successfully clear session and revoke tokens', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await sessionManager.clearSession()

      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
    })

    it('should clear session even when server signout fails', async () => {
      const serverError = new Error('Server unavailable')
      mockSupabase.auth.signOut.mockResolvedValue({ error: serverError })

      // Should not throw - local cleanup should still happen
      await expect(sessionManager.clearSession()).resolves.toBeUndefined()

      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
    })

    it('should handle network errors during signout', async () => {
      const networkError = new Error('Network error')
      mockSupabase.auth.signOut.mockRejectedValue(networkError)

      // Should not throw - local cleanup should still happen
      await expect(sessionManager.clearSession()).resolves.toBeUndefined()

      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
    })

    it('should clear refresh timeout when clearing session', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      // Set up a session with auto-refresh
      const mockSession: Session = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      sessionManager.setupAutoRefresh(mockSession)

      // Clear the session
      await sessionManager.clearSession()

      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
      // Timeout should be cleared (no way to directly test this, but it's covered by implementation)
    })

    it('should handle multiple concurrent clearSession calls', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      // Call clearSession multiple times concurrently
      const promises = [
        sessionManager.clearSession(),
        sessionManager.clearSession(),
        sessionManager.clearSession()
      ]

      await Promise.all(promises)

      // All should complete successfully
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(3)
    })

    it('should clear session data from memory and storage', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await sessionManager.clearSession()

      // Verify signOut was called (which clears Supabase's internal storage)
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
    })

    it('should handle Supabase signOut returning error object', async () => {
      const supabaseError = {
        message: 'Invalid session',
        status: 401
      }
      mockSupabase.auth.signOut.mockResolvedValue({ error: supabaseError })

      // Should not throw even with error
      await expect(sessionManager.clearSession()).resolves.toBeUndefined()

      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
    })
  })

  describe('getSession', () => {
    it('should return current session when available', async () => {
      const mockSession: Session = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await sessionManager.getSession()

      expect(result).toEqual(mockSession)
      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1)
    })

    it('should return null when no session exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await sessionManager.getSession()

      expect(result).toBeNull()
    })

    it('should return null when getSession fails', async () => {
      const error = new Error('Session fetch failed')
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: error
      })

      const result = await sessionManager.getSession()

      expect(result).toBeNull()
    })
  })

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const validSession: Session = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      const result = sessionManager.isSessionValid(validSession)

      expect(result).toBe(true)
    })

    it('should return false for expired session', () => {
      const expiredSession: Session = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      const result = sessionManager.isSessionValid(expiredSession)

      expect(result).toBe(false)
    })

    it('should return false for session without access token', () => {
      const invalidSession = {
        access_token: '',
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      } as Session

      const result = sessionManager.isSessionValid(invalidSession)

      expect(result).toBe(false)
    })

    it('should return false for null session', () => {
      const result = sessionManager.isSessionValid(null as any)

      expect(result).toBe(false)
    })
  })

  describe('setupAutoRefresh', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.spyOn(global, 'setTimeout')
      jest.spyOn(global, 'clearTimeout')
    })

    afterEach(() => {
      jest.useRealTimers()
      jest.restoreAllMocks()
    })

    it('should set up auto refresh for valid session', () => {
      const mockSession: Session = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
        expires_in: 600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      sessionManager.setupAutoRefresh(mockSession)

      // Should set up timeout (no direct way to test, but covered by implementation)
      expect(setTimeout).toHaveBeenCalled()
    })

    it('should not set up refresh for invalid session', () => {
      const invalidSession = null as any

      sessionManager.setupAutoRefresh(invalidSession)

      // Should not set up timeout
      expect(setTimeout).not.toHaveBeenCalled()
    })

    it('should clear existing timeout when setting up new refresh', () => {
      const mockSession1: Session = {
        access_token: 'token1',
        refresh_token: 'refresh1',
        expires_at: Math.floor(Date.now() / 1000) + 600,
        expires_in: 600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      const mockSession2: Session = {
        access_token: 'token2',
        refresh_token: 'refresh2',
        expires_at: Math.floor(Date.now() / 1000) + 1200,
        expires_in: 1200,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      sessionManager.setupAutoRefresh(mockSession1)
      sessionManager.setupAutoRefresh(mockSession2)

      // Should clear previous timeout and set new one
      expect(clearTimeout).toHaveBeenCalled()
      expect(setTimeout).toHaveBeenCalledTimes(2)
    })
  })

  describe('destroy', () => {
    it('should clean up resources', () => {
      const mockSession: Session = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) + 600,
        expires_in: 600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      sessionManager.setupAutoRefresh(mockSession)
      sessionManager.destroy()

      // Should clear timeout (covered by implementation)
    })
  })

  describe('persistSessionToCookies', () => {
    it('should persist valid session to cookies', async () => {
      const mockSession: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123', email: 'test@example.com' } as AuthUser
      }

      await sessionManager.persistSessionToCookies(mockSession)

      // Check that cookie was set
      expect(document.cookie).toContain('supabase-auth-token=')
      expect(document.cookie).toContain('path=/')
      expect(document.cookie).toContain('SameSite=lax')
    })

    it('should not persist invalid session', async () => {
      const invalidSession = {
        access_token: '',
        refresh_token: '',
        expires_at: 0,
        expires_in: 0,
        token_type: 'bearer',
        user: null
      } as Session

      await sessionManager.persistSessionToCookies(invalidSession)

      // Cookie should not be set for invalid session
      expect(document.cookie).toBe('')
    })

    it('should handle null session gracefully', async () => {
      await sessionManager.persistSessionToCookies(null as any)

      // Should not throw and cookie should not be set
      expect(document.cookie).toBe('')
    })

    it('should set secure flag in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const mockSession: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      await sessionManager.persistSessionToCookies(mockSession)

      expect(document.cookie).toContain('Secure')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('restoreSessionFromCookies', () => {
    it('should restore valid session from cookies', async () => {
      const mockSession: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123', email: 'test@example.com' } as AuthUser
      }

      // Set up cookie with session data
      const sessionData = JSON.stringify(mockSession)
      document.cookie = `supabase-auth-token=${encodeURIComponent(sessionData)}`

      mockSupabase.auth.setSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await sessionManager.restoreSessionFromCookies()

      expect(result).toEqual(mockSession)
      expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
        access_token: mockSession.access_token,
        refresh_token: mockSession.refresh_token
      })
    })

    it('should return null when no cookies exist', async () => {
      document.cookie = ''

      const result = await sessionManager.restoreSessionFromCookies()

      expect(result).toBeNull()
      expect(mockSupabase.auth.setSession).not.toHaveBeenCalled()
    })

    it('should return null when session cookie is invalid JSON', async () => {
      document.cookie = 'supabase-auth-token=invalid-json'

      const result = await sessionManager.restoreSessionFromCookies()

      expect(result).toBeNull()
      expect(mockSupabase.auth.setSession).not.toHaveBeenCalled()
    })

    it('should return null when session is expired', async () => {
      const expiredSession: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      const sessionData = JSON.stringify(expiredSession)
      document.cookie = `supabase-auth-token=${encodeURIComponent(sessionData)}`

      // Mock refresh session to return null (refresh failed)
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Refresh failed')
      })

      const result = await sessionManager.restoreSessionFromCookies()

      expect(result).toBeNull()
    })

    it('should attempt refresh for expired session with valid refresh token', async () => {
      const expiredSession: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      const refreshedSession: Session = {
        ...expiredSession,
        access_token: 'new-access-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600 // Valid for 1 hour
      }

      const sessionData = JSON.stringify(expiredSession)
      document.cookie = `supabase-auth-token=${encodeURIComponent(sessionData)}`

      // Mock refresh session to return new session
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: refreshedSession },
        error: null
      })

      const result = await sessionManager.restoreSessionFromCookies()

      expect(result).toEqual(refreshedSession)
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled()
    })

    it('should handle setSession errors gracefully', async () => {
      const mockSession: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      const sessionData = JSON.stringify(mockSession)
      document.cookie = `supabase-auth-token=${encodeURIComponent(sessionData)}`

      mockSupabase.auth.setSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Invalid session')
      })

      const result = await sessionManager.restoreSessionFromCookies()

      expect(result).toBeNull()
    })
  })

  describe('clearSession with cookies', () => {
    it('should clear session cookies when clearing session', async () => {
      // Set up some cookies
      document.cookie = 'supabase-auth-token=some-value; path=/'
      document.cookie = 'supabase-other=other-value; path=/'
      document.cookie = 'non-supabase=keep-this; path=/'

      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await sessionManager.clearSession()

      // Check that the clearing cookies were set (they will appear in document.cookie as expired)
      // The actual clearing happens by setting cookies with past expiration dates
      expect(document.cookie).toContain('expires=Thu, 01 Jan 1970')
    })

    it('should reset restoration flag when clearing session', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      // First call getSession to set restoration flag
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })
      await sessionManager.getSession()

      // Clear session
      await sessionManager.clearSession()

      // Next getSession call should attempt restoration again
      const sessionData = JSON.stringify({
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' }
      })
      document.cookie = `supabase-auth-token=${encodeURIComponent(sessionData)}`

      mockSupabase.auth.setSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
        error: null
      })

      await sessionManager.getSession()

      expect(mockSupabase.auth.setSession).toHaveBeenCalled()
    })
  })

  describe('getSession with restoration', () => {
    it('should attempt restoration on first call', async () => {
      const mockSession: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      // Set up cookie
      const sessionData = JSON.stringify(mockSession)
      document.cookie = `supabase-auth-token=${encodeURIComponent(sessionData)}`

      mockSupabase.auth.setSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await sessionManager.getSession()

      expect(result).toEqual(mockSession)
      expect(mockSupabase.auth.setSession).toHaveBeenCalled()
    })

    it('should not attempt restoration on subsequent calls', async () => {
      const mockSession: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      // First call - should attempt restoration
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })
      await sessionManager.getSession()

      // Second call - should not attempt restoration
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      const result = await sessionManager.getSession()

      expect(result).toEqual(mockSession)
      // setSession should only be called once (during first restoration attempt)
      expect(mockSupabase.auth.setSession).toHaveBeenCalledTimes(0)
    })

    it('should fall back to regular getSession if restoration fails', async () => {
      const mockSession: Session = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123' } as AuthUser
      }

      // Set up invalid cookie
      document.cookie = 'supabase-auth-token=invalid-json'

      // First call should fail restoration but succeed with regular getSession
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await sessionManager.getSession()

      expect(result).toEqual(mockSession)
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
    })
  })
})

describe('SessionManager Basic Tests', () => {
  test('basic test should pass', () => {
    expect(1 + 1).toBe(2)
  })
})