import { AuthService, SignUpParams, SignUpResult, SignInResult } from '../auth-service'
import { SessionManager } from '../session-manager'
import { ErrorHandler } from '../error-handler'
import { ProfileSyncService, UserMetadata } from '../profile-sync'
import { AuthErrorCode } from '../types'
import { User, UserRole } from '../../../types'
import { SupabaseClient, Session, User as AuthUser } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('../session-manager')
jest.mock('../error-handler')
jest.mock('../profile-sync')
jest.mock('../../supabase/client')

describe('AuthService', () => {
  let authService: AuthService
  let mockSupabase: jest.Mocked<SupabaseClient>
  let mockSessionManager: jest.Mocked<SessionManager>
  let mockErrorHandler: jest.Mocked<ErrorHandler>
  let mockProfileSync: jest.Mocked<ProfileSyncService>

  beforeEach(() => {
    // Create mock instances
    mockSupabase = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        updateUser: jest.fn(),
        resend: jest.fn(),
        getSession: jest.fn(),
        getUser: jest.fn()
      }
    } as any

    mockSessionManager = {
      getSession: jest.fn(),
      setupAutoRefresh: jest.fn(),
      clearSession: jest.fn()
    } as any

    mockErrorHandler = {
      parseAuthError: jest.fn(),
      logError: jest.fn()
    } as any

    mockProfileSync = {
      getProfile: jest.fn(),
      retryProfileCreation: jest.fn(),
      syncProfile: jest.fn(),
      updateProfile: jest.fn()
    } as any

    // Create auth service with mocked dependencies
    authService = new AuthService(
      mockSupabase,
      mockSessionManager,
      mockErrorHandler,
      mockProfileSync
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('signUp', () => {
    const validSignUpParams: SignUpParams = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'buyer'
    }

    it('should successfully sign up a new user', async () => {
      const mockAuthUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        user_metadata: { name: 'Test User', role: 'buyer' },
        app_metadata: {}
      } as any

      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser, session: null },
        error: null
      })

      mockProfileSync.retryProfileCreation.mockResolvedValue(mockUser)

      const result = await authService.signUp(validSignUpParams)

      expect(result.success).toBe(true)
      expect(result.needsVerification).toBe(false)
      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeUndefined()

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: validSignUpParams.email,
        password: validSignUpParams.password,
        options: {
          data: {
            name: validSignUpParams.name,
            role: validSignUpParams.role
          }
        }
      })
    })

    it('should handle signup requiring email verification', async () => {
      const mockAuthUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: null, // Not confirmed
        user_metadata: { name: 'Test User', role: 'buyer' },
        app_metadata: {}
      } as any

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser, session: null },
        error: null
      })

      const result = await authService.signUp(validSignUpParams)

      expect(result.success).toBe(true)
      expect(result.needsVerification).toBe(true)
      expect(result.user).toBeUndefined()
      expect(result.error).toBeUndefined()

      // Profile creation should not be called for unverified users
      expect(mockProfileSync.retryProfileCreation).not.toHaveBeenCalled()
    })

    it('should handle invalid email format', async () => {
      const invalidParams = { ...validSignUpParams, email: 'invalid-email' }

      const result = await authService.signUp(invalidParams)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe(AuthErrorCode.INVALID_EMAIL)
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should handle weak password', async () => {
      const invalidParams = { ...validSignUpParams, password: '123' }

      const result = await authService.signUp(invalidParams)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe(AuthErrorCode.WEAK_PASSWORD)
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should handle rate limiting', async () => {
      // First signup
      const mockAuthUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        user_metadata: { name: 'Test User', role: 'buyer' },
        app_metadata: {}
      } as any

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser, session: null },
        error: null
      })

      mockProfileSync.retryProfileCreation.mockResolvedValue({} as User)

      // First signup should succeed
      await authService.signUp(validSignUpParams)

      // Second signup immediately should be rate limited
      const result = await authService.signUp(validSignUpParams)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe(AuthErrorCode.SIGNUP_COOLDOWN)
      expect(result.error?.retryable).toBe(true)
      expect(result.error?.retryAfter).toBeGreaterThan(0)
    })

    it('should handle Supabase signup errors', async () => {
      const supabaseError = new Error('Email already registered')
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: supabaseError
      })

      const mockAuthError = {
        code: AuthErrorCode.INVALID_EMAIL,
        message: 'Email already registered',
        userMessage: 'This email is already registered.',
        retryable: false
      }

      mockErrorHandler.parseAuthError.mockReturnValue(mockAuthError)

      const result = await authService.signUp(validSignUpParams)

      expect(result.success).toBe(false)
      expect(result.error).toEqual(mockAuthError)
      expect(mockErrorHandler.parseAuthError).toHaveBeenCalledWith(supabaseError)
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(mockAuthError, 'signUp')
    })
  })

  describe('signIn', () => {
    const email = 'test@example.com'
    const password = 'password123'

    it('should successfully sign in a user', async () => {
      const mockAuthUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User', role: 'buyer' },
        app_metadata: {}
      } as any

      const mockSession: Session = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() / 1000 + 3600,
        user: mockAuthUser
      } as any

      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser, session: mockSession },
        error: null
      })

      mockProfileSync.getProfile.mockResolvedValue(mockUser)
      mockProfileSync.syncProfile.mockResolvedValue(mockUser)

      const result = await authService.signIn(email, password)

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeUndefined()

      expect(mockSessionManager.setupAutoRefresh).toHaveBeenCalledWith(mockSession)
      expect(mockProfileSync.syncProfile).toHaveBeenCalledWith('user-123')
    })

    it('should create profile if it does not exist', async () => {
      const mockAuthUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User', role: 'buyer' },
        app_metadata: {}
      } as any

      const mockSession: Session = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() / 1000 + 3600,
        user: mockAuthUser
      } as any

      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser, session: mockSession },
        error: null
      })

      mockProfileSync.getProfile.mockResolvedValue(null) // No existing profile
      mockProfileSync.retryProfileCreation.mockResolvedValue(mockUser)

      const result = await authService.signIn(email, password)

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)

      expect(mockProfileSync.retryProfileCreation).toHaveBeenCalledWith(
        mockAuthUser,
        { name: 'Test User', role: 'buyer' }
      )
    })

    it('should handle missing credentials', async () => {
      const result = await authService.signIn('', '')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe(AuthErrorCode.MISSING_FIELDS)
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should handle invalid credentials', async () => {
      const supabaseError = new Error('Invalid login credentials')
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: supabaseError
      })

      const mockAuthError = {
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid login credentials',
        userMessage: 'Invalid email or password.',
        retryable: false
      }

      mockErrorHandler.parseAuthError.mockReturnValue(mockAuthError)

      const result = await authService.signIn(email, password)

      expect(result.success).toBe(false)
      expect(result.error).toEqual(mockAuthError)
    })
  })

  describe('signOut', () => {
    it('should successfully sign out and revoke tokens', async () => {
      mockSessionManager.clearSession.mockResolvedValue()

      await authService.signOut()

      expect(mockSessionManager.clearSession).toHaveBeenCalledTimes(1)
    })

    it('should handle signout errors gracefully and not throw', async () => {
      const error = new Error('Network error')
      mockSessionManager.clearSession.mockRejectedValue(error)

      const mockAuthError = {
        code: AuthErrorCode.NETWORK_ERROR,
        message: 'Network error',
        userMessage: 'Connection problem.',
        retryable: true
      }

      mockErrorHandler.parseAuthError.mockReturnValue(mockAuthError)

      // Should not throw, just log the error
      await expect(authService.signOut()).resolves.toBeUndefined()

      expect(mockSessionManager.clearSession).toHaveBeenCalledTimes(1)
      expect(mockErrorHandler.parseAuthError).toHaveBeenCalledWith(error)
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(mockAuthError, 'signOut')
    })

    it('should handle session manager clearSession failure', async () => {
      const sessionError = new Error('Failed to revoke tokens')
      mockSessionManager.clearSession.mockRejectedValue(sessionError)

      const mockAuthError = {
        code: AuthErrorCode.UNKNOWN_ERROR,
        message: 'Failed to revoke tokens',
        userMessage: 'Logout failed. Please try again.',
        retryable: true
      }

      mockErrorHandler.parseAuthError.mockReturnValue(mockAuthError)

      // Should complete without throwing
      await expect(authService.signOut()).resolves.toBeUndefined()

      expect(mockSessionManager.clearSession).toHaveBeenCalledTimes(1)
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(mockAuthError, 'signOut')
    })

    it('should ensure session cleanup even when server signout fails', async () => {
      const serverError = new Error('Server unavailable')
      mockSessionManager.clearSession.mockRejectedValue(serverError)

      const mockAuthError = {
        code: AuthErrorCode.NETWORK_ERROR,
        message: 'Server unavailable',
        userMessage: 'Network error during logout.',
        retryable: true
      }

      mockErrorHandler.parseAuthError.mockReturnValue(mockAuthError)

      // Should not throw - local cleanup should still happen
      await expect(authService.signOut()).resolves.toBeUndefined()

      // Verify session manager was called (it handles local cleanup internally)
      expect(mockSessionManager.clearSession).toHaveBeenCalledTimes(1)
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(mockAuthError, 'signOut')
    })

    it('should handle multiple concurrent signout calls', async () => {
      mockSessionManager.clearSession.mockResolvedValue()

      // Call signOut multiple times concurrently
      const promises = [
        authService.signOut(),
        authService.signOut(),
        authService.signOut()
      ]

      await Promise.all(promises)

      // All should complete successfully
      expect(mockSessionManager.clearSession).toHaveBeenCalledTimes(3)
    })
  })

  describe('requestPasswordReset', () => {
    it('should successfully request password reset', async () => {
      const email = 'test@example.com'
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      await authService.requestPasswordReset(email)

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        email,
        { redirectTo: `${window.location.origin}/auth/reset-password/confirm` }
      )
    })

    it('should handle invalid email format', async () => {
      const invalidEmail = 'invalid-email'
      const mockAuthError = {
        code: AuthErrorCode.INVALID_EMAIL,
        message: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        retryable: false
      }

      mockErrorHandler.parseAuthError.mockReturnValue(mockAuthError)

      await expect(authService.requestPasswordReset(invalidEmail))
        .rejects.toEqual(mockAuthError)
    })
  })

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      const token = 'reset-token'
      const newPassword = 'newpassword123'

      mockSupabase.auth.updateUser.mockResolvedValue({ error: null })
      mockSessionManager.clearSession.mockResolvedValue()

      await authService.resetPassword(token, newPassword)

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword
      })
      expect(mockSessionManager.clearSession).toHaveBeenCalled()
    })

    it('should handle weak password', async () => {
      const token = 'reset-token'
      const weakPassword = '123'
      const mockAuthError = {
        code: AuthErrorCode.WEAK_PASSWORD,
        message: 'Password too short',
        userMessage: 'Password must be at least 8 characters long.',
        retryable: false
      }

      mockErrorHandler.parseAuthError.mockReturnValue(mockAuthError)

      await expect(authService.resetPassword(token, weakPassword))
        .rejects.toEqual(mockAuthError)
    })
  })

  describe('resendVerificationEmail', () => {
    it('should successfully resend verification email', async () => {
      const email = 'test@example.com'
      mockSupabase.auth.resend.mockResolvedValue({ error: null })

      await authService.resendVerificationEmail(email)

      expect(mockSupabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
    })

    it('should handle invalid email format', async () => {
      const invalidEmail = 'invalid-email'
      const mockAuthError = {
        code: AuthErrorCode.INVALID_EMAIL,
        message: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        retryable: false
      }

      mockErrorHandler.parseAuthError.mockReturnValue(mockAuthError)

      await expect(authService.resendVerificationEmail(invalidEmail))
        .rejects.toEqual(mockAuthError)
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      const mockSession: Session = {
        user: { id: 'user-123' } as AuthUser
      } as any

      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSessionManager.getSession.mockResolvedValue(mockSession)
      mockProfileSync.getProfile.mockResolvedValue(mockUser)

      const result = await authService.getCurrentUser()

      expect(result).toEqual(mockUser)
    })

    it('should return null when not authenticated', async () => {
      mockSessionManager.getSession.mockResolvedValue(null)

      const result = await authService.getCurrentUser()

      expect(result).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('should successfully update profile', async () => {
      const userId = 'user-123'
      const updates = { name: 'Updated Name' }
      
      const mockSession: Session = {
        user: { id: userId } as AuthUser
      } as any

      const mockUpdatedUser: User = {
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockSessionManager.getSession.mockResolvedValue(mockSession)
      mockProfileSync.updateProfile.mockResolvedValue(mockUpdatedUser)

      const result = await authService.updateProfile(userId, updates)

      expect(result).toEqual(mockUpdatedUser)
      expect(mockProfileSync.updateProfile).toHaveBeenCalledWith(userId, updates)
    })

    it('should handle unauthorized profile update', async () => {
      const userId = 'user-123'
      const updates = { name: 'Updated Name' }
      
      const mockSession: Session = {
        user: { id: 'different-user' } as AuthUser
      } as any

      const mockAuthError = {
        code: AuthErrorCode.SESSION_EXPIRED,
        message: 'Invalid session for profile update',
        userMessage: 'Your session has expired. Please log in again.',
        retryable: false
      }

      mockSessionManager.getSession.mockResolvedValue(mockSession)
      mockErrorHandler.parseAuthError.mockReturnValue(mockAuthError)

      await expect(authService.updateProfile(userId, updates))
        .rejects.toEqual(mockAuthError)
    })
  })
})