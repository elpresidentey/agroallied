import { SupabaseClient, User as AuthUser } from '@supabase/supabase-js'
import { createBrowserClient } from '../supabase/client'
import { User, UserRole } from '../../types'
import { AuthError, AuthErrorCode } from './types'
import { SessionManager, sessionManager } from './session-manager'
import { ErrorHandler, errorHandler } from './error-handler'
import { ProfileSyncService, UserMetadata } from './profile-sync'

/**
 * Parameters for user signup
 */
export interface SignUpParams {
  email: string
  password: string
  name: string
  role: UserRole
}

/**
 * Result of signup operation
 */
export interface SignUpResult {
  success: boolean
  needsVerification: boolean
  user?: User
  error?: AuthError
}

/**
 * Result of signin operation
 */
export interface SignInResult {
  success: boolean
  user?: User
  error?: AuthError
}

/**
 * Core authentication service providing business logic for auth operations
 * Integrates with session manager, error handler, and profile sync services
 */
export class AuthService {
  private supabase: SupabaseClient
  private sessionManager: SessionManager
  private errorHandler: ErrorHandler
  private profileSync: ProfileSyncService
  private signupAttempts: Map<string, number> = new Map()
  private readonly SIGNUP_COOLDOWN_MS = 5000 // 5 seconds

  constructor(
    supabaseClient?: SupabaseClient,
    sessionManager?: SessionManager,
    errorHandler?: ErrorHandler,
    profileSync?: ProfileSyncService
  ) {
    this.supabase = supabaseClient || createBrowserClient()
    this.sessionManager = sessionManager || new SessionManager()
    this.errorHandler = errorHandler || new ErrorHandler()
    this.profileSync = profileSync || new ProfileSyncService(this.supabase)
  }

  /**
   * Sign up a new user with email, password, name, and role
   * Implements rate limiting and profile creation
   * @param params Signup parameters
   * @returns Promise resolving to signup result
   */
  async signUp(params: SignUpParams): Promise<SignUpResult> {
    try {
      // Check rate limiting
      const rateLimitError = this.checkSignupRateLimit(params.email)
      if (rateLimitError) {
        return {
          success: false,
          needsVerification: false,
          error: rateLimitError
        }
      }

      // Record signup attempt
      this.recordSignupAttempt(params.email)

      // Validate input parameters
      const validationError = this.validateSignupParams(params)
      if (validationError) {
        return {
          success: false,
          needsVerification: false,
          error: validationError
        }
      }

      // Attempt signup with Supabase
      const { data, error } = await this.supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            name: params.name,
            role: params.role
          }
        }
      })

      if (error) {
        const authError = this.errorHandler.parseAuthError(error)
        this.errorHandler.logError(authError, 'signUp')
        return {
          success: false,
          needsVerification: false,
          error: authError
        }
      }

      if (!data.user) {
        const authError = this.createAuthError({
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: 'Signup succeeded but no user returned',
          userMessage: 'An unexpected error occurred during signup. Please try again.',
          retryable: true
        });
        return {
          success: false,
          needsVerification: false,
          error: authError
        }
      }

      // Check if email verification is needed
      const needsVerification = !data.user.email_confirmed_at

      // If email is already confirmed, create profile immediately
      let userProfile: User | undefined
      if (!needsVerification) {
        try {
          const metadata: UserMetadata = {
            name: params.name,
            role: params.role
          }
          userProfile = await this.profileSync.retryProfileCreation(data.user, metadata)
        } catch (profileError) {
          // Profile creation failed, but signup succeeded
          // User can still verify email and profile will be created later
          const authError = this.errorHandler.parseAuthError(profileError)
          this.errorHandler.logError(authError, 'signUp.profileCreation')
          
          return {
            success: true,
            needsVerification: false,
            error: authError
          }
        }
      }

      return {
        success: true,
        needsVerification,
        user: userProfile
      }

    } catch (error) {
      const authError = this.errorHandler.parseAuthError(error)
      this.errorHandler.logError(authError, 'signUp')
      return {
        success: false,
        needsVerification: false,
        error: authError
      }
    }
  }

  /**
   * Sign in an existing user with email and password
   * @param email User email
   * @param password User password
   * @returns Promise resolving to signin result
   */
  async signIn(email: string, password: string): Promise<SignInResult> {
    try {
      // Validate input
      if (!email || !password) {
        const authError = this.createAuthError({
          code: AuthErrorCode.MISSING_FIELDS,
          message: 'Email and password are required',
          userMessage: 'Please enter both email and password.',
          retryable: false
        });
        return {
          success: false,
          error: authError
        }
      }

      // Attempt signin with Supabase
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        const authError = this.errorHandler.parseAuthError(error)
        this.errorHandler.logError(authError, 'signIn')
        return {
          success: false,
          error: authError
        }
      }

      if (!data.user || !data.session) {
        const authError = this.createAuthError({
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: 'Signin succeeded but no user or session returned',
          userMessage: 'An unexpected error occurred during signin. Please try again.',
          retryable: true
        });
        return {
          success: false,
          error: authError
        }
      }

      // Set up automatic token refresh
      this.sessionManager.setupAutoRefresh(data.session)

      // Get or create user profile
      let userProfile: User
      try {
        const existingProfile = await this.profileSync.getProfile(data.user.id)
        
        if (!existingProfile) {
          // Profile doesn't exist, create it from auth metadata
          const metadata: UserMetadata = {
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            role: (data.user.user_metadata?.role as UserRole) || 'buyer'
          }
          userProfile = await this.profileSync.retryProfileCreation(data.user, metadata)
        } else {
          // Sync existing profile with auth metadata
          userProfile = await this.profileSync.syncProfile(data.user.id)
        }
      } catch (profileError) {
        const authError = this.errorHandler.parseAuthError(profileError)
        this.errorHandler.logError(authError, 'signIn.profileSync')
        return {
          success: false,
          error: authError
        }
      }

      return {
        success: true,
        user: userProfile
      }

    } catch (error) {
      const authError = this.errorHandler.parseAuthError(error)
      this.errorHandler.logError(authError, 'signIn')
      return {
        success: false,
        error: authError
      }
    }
  }

  /**
   * Sign out the current user and terminate session
   * Clears all session data and revokes tokens
   */
  async signOut(): Promise<void> {
    try {
      // Clear session through session manager (handles token revocation)
      await this.sessionManager.clearSession()
    } catch (error) {
      // Log error but don't throw - we want to ensure local cleanup happens
      const authError = this.errorHandler.parseAuthError(error)
      this.errorHandler.logError(authError, 'signOut')
      
      // Even if server signout fails, we should clear local session
      // The session manager handles this gracefully
    }
  }

  /**
   * Get the current authenticated user
   * @returns Promise resolving to current user or null if not authenticated
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const session = await this.sessionManager.getSession()
      if (!session || !session.user) {
        return null
      }

      // Get user profile from database
      const userProfile = await this.profileSync.getProfile(session.user.id)
      return userProfile
    } catch (error) {
      const authError = this.errorHandler.parseAuthError(error)
      this.errorHandler.logError(authError, 'getCurrentUser')
      return null
    }
  }

  /**
   * Update user profile
   * @param userId User ID to update
   * @param updates Partial user data to update
   * @returns Promise resolving to updated user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      // Verify user is authenticated and can update this profile
      const session = await this.sessionManager.getSession()
      if (!session || session.user.id !== userId) {
        throw this.createAuthError({
          code: AuthErrorCode.SESSION_EXPIRED,
          message: 'Invalid session for profile update',
          userMessage: 'Your session has expired. Please log in again.',
          retryable: false
        });
      }

      return await this.profileSync.updateProfile(userId, updates)
    } catch (error) {
      const authError = this.errorHandler.parseAuthError(error)
      this.errorHandler.logError(authError, 'updateProfile')
      throw authError
    }
  }

  /**
   * Request password reset email
   * @param email Email address to send reset link to
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw this.createAuthError({
          code: AuthErrorCode.INVALID_EMAIL,
          message: 'Invalid email format',
          userMessage: 'Please enter a valid email address.',
          retryable: false
        });
      }

      // Send password reset email
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`
      })

      if (error) {
        const authError = this.errorHandler.parseAuthError(error)
        this.errorHandler.logError(authError, 'requestPasswordReset')
        throw authError
      }

      // Success - email sent (Supabase doesn't reveal if email exists for security)
    } catch (error) {
      const authError = this.errorHandler.parseAuthError(error)
      this.errorHandler.logError(authError, 'requestPasswordReset')
      throw authError
    }
  }

  /**
   * Reset password with token from email
   * @param token Reset token from email
   * @param newPassword New password to set
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Validate new password
      if (newPassword.length < 8) {
        throw this.createAuthError({
          code: AuthErrorCode.WEAK_PASSWORD,
          message: 'Password too short',
          userMessage: 'Password must be at least 8 characters long.',
          retryable: false
        });
      }

      // Update password using the token
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        // Handle specific token errors
        if (error.message.includes('Invalid token') || error.message.includes('Token expired')) {
          throw this.createAuthError({
            code: AuthErrorCode.INVALID_RESET_TOKEN,
            message: error.message,
            userMessage: 'Invalid or expired password reset link. Please request a new one.',
            retryable: false
          });
        }

        const authError = this.errorHandler.parseAuthError(error)
        this.errorHandler.logError(authError, 'resetPassword')
        throw authError
      }

      // Password reset successful - invalidate all existing sessions
      // This is handled automatically by Supabase when password is changed
      // Clear local session to ensure user needs to sign in with new password
      await this.sessionManager.clearSession()

    } catch (error) {
      const authError = this.errorHandler.parseAuthError(error)
      this.errorHandler.logError(authError, 'resetPassword')
      throw authError
    }
  }

  /**
   * Resend verification email to user
   * @param email Email address to send verification to
   */
  async resendVerificationEmail(email: string): Promise<void> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw this.createAuthError({
          code: AuthErrorCode.INVALID_EMAIL,
          message: 'Invalid email format',
          userMessage: 'Please enter a valid email address.',
          retryable: false
        });
      }

      // Resend verification email
      const { error } = await this.supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        const authError = this.errorHandler.parseAuthError(error)
        this.errorHandler.logError(authError, 'resendVerificationEmail')
        throw authError
      }

      // Success - verification email sent
    } catch (error) {
      const authError = this.errorHandler.parseAuthError(error)
      this.errorHandler.logError(authError, 'resendVerificationEmail')
      throw authError
    }
  }

  /**
   * Verify email with token from verification email
   * This method handles the callback after user clicks verification link
   * @param token Verification token from email
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      if (!token) {
        throw this.createAuthError({
          code: AuthErrorCode.INVALID_VERIFICATION_TOKEN,
          message: 'No verification token provided',
          userMessage: 'Invalid verification link. Please check your email for the correct link.',
          retryable: false
        });
      }

      // The token verification is handled by Supabase auth callback
      // This method is called after successful verification to handle profile creation
      const session = await this.sessionManager.getSession()
      
      if (!session || !session.user) {
        throw this.createAuthError({
          code: AuthErrorCode.SESSION_EXPIRED,
          message: 'No session found after email verification',
          userMessage: 'Verification completed but session not found. Please try signing in.',
          retryable: false
        });
      }

      // Check if user profile exists, create if not
      let userProfile = await this.profileSync.getProfile(session.user.id)
      
      if (!userProfile) {
        // Create profile from auth metadata
        const metadata: UserMetadata = {
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: (session.user.user_metadata?.role as UserRole) || 'buyer'
        }
        
        userProfile = await this.profileSync.retryProfileCreation(session.user, metadata)
      }

      // Profile activation is handled by the verification status in the profile
      // For buyers, they're immediately active after email verification
      // For sellers, they need admin approval (verification_status remains 'pending')

    } catch (error) {
      const authError = this.errorHandler.parseAuthError(error)
      this.errorHandler.logError(authError, 'verifyEmail')
      throw authError
    }
  }

  /**
   * Check signup rate limiting for an email
   * @param email Email to check
   * @returns AuthError if rate limited, null otherwise
   */
  private checkSignupRateLimit(email: string): AuthError | null {
    const lastAttempt = this.signupAttempts.get(email)
    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - lastAttempt
      if (timeSinceLastAttempt < this.SIGNUP_COOLDOWN_MS) {
        const retryAfter = this.SIGNUP_COOLDOWN_MS - timeSinceLastAttempt
        return this.createAuthError({
          code: AuthErrorCode.SIGNUP_COOLDOWN,
          message: `Signup cooldown active for ${email}`,
          userMessage: `Please wait ${Math.ceil(retryAfter / 1000)} seconds before trying again.`,
          retryable: true,
          retryAfter
        });
      }
    }
    return null
  }

  /**
   * Record a signup attempt for rate limiting
   * @param email Email that attempted signup
   */
  private recordSignupAttempt(email: string): void {
    this.signupAttempts.set(email, Date.now())
    
    // Clean up old entries after cooldown period
    setTimeout(() => {
      this.signupAttempts.delete(email)
    }, this.SIGNUP_COOLDOWN_MS)
  }

  /**
   * Validate signup parameters
   * @param params Signup parameters to validate
   * @returns AuthError if validation fails, null otherwise
   */
  private validateSignupParams(params: SignUpParams): AuthError | null {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(params.email)) {
      return this.createAuthError({
        code: AuthErrorCode.INVALID_EMAIL,
        message: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        retryable: false
      });
    }

    // Validate password strength
    if (params.password.length < 8) {
      return this.createAuthError({
        code: AuthErrorCode.WEAK_PASSWORD,
        message: 'Password too short',
        userMessage: 'Password must be at least 8 characters long.',
        retryable: false
      });
    }

    // Validate name
    if (!params.name || params.name.trim().length === 0) {
      return this.createAuthError({
        code: AuthErrorCode.MISSING_FIELDS,
        message: 'Name is required',
        userMessage: 'Please enter your name.',
        retryable: false
      });
    }

    // Validate role
    const validRoles: UserRole[] = ['buyer', 'seller', 'admin']
    if (!validRoles.includes(params.role)) {
      return this.createAuthError({
        code: AuthErrorCode.MISSING_FIELDS,
        message: 'Invalid role',
        userMessage: 'Please select a valid role.',
        retryable: false
      });
    }

    return null
  }

  /**
   * Helper function to create AuthError objects
   */
  private createAuthError(options: {
    code: AuthErrorCode
    message: string
    userMessage?: string
    retryable?: boolean
    retryAfter?: number
    metadata?: Record<string, any>
  }): AuthError {
    return {
      code: options.code,
      message: options.message,
      userMessage: options.userMessage || options.message,
      retryable: options.retryable ?? false,
      retryAfter: options.retryAfter,
      metadata: options.metadata
    };
  }
}

// Export singleton instance for use throughout the application
export const authService = new AuthService()