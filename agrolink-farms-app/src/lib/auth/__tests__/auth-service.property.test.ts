import * as fc from 'fast-check'
import { AuthService, SignUpParams } from '../auth-service'
import { SessionManager } from '../session-manager'
import { ErrorHandler } from '../error-handler'
import { ProfileSyncService } from '../profile-sync'
import { AuthErrorCode } from '../types'
import { UserRole } from '../../../types'
import { SupabaseClient, User as AuthUser } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('../session-manager')
jest.mock('../error-handler')
jest.mock('../profile-sync')
jest.mock('../../supabase/client')

describe('AuthService Property Tests', () => {
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
      parseAuthError: jest.fn().mockImplementation((error) => {
        // Default error parsing behavior
        if (error && typeof error === 'object' && 'code' in error) {
          return error
        }
        return {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: error?.message || 'Unknown error',
          userMessage: 'An unexpected error occurred. Please try again.',
          retryable: true
        }
      }),
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

  /**
   * Property 7: Concurrent Signup Prevention
   * For any sequence of signup attempts with the same email address within the cooldown period,
   * only the first attempt should proceed to account creation, and subsequent attempts should be
   * rejected with a rate limit error.
   * 
   * **Validates: Requirements 10.3, 10.4**
   */
  test('Feature: authentication-refactor, Property 7: Concurrent Signup Prevention', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }).map(s => s.replace(/\s/g, 'a')), // Replace spaces with 'a'
          name: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim() || 'TestUser'), // Ensure non-empty
          role: fc.constantFrom('buyer' as UserRole, 'seller' as UserRole),
          attemptCount: fc.integer({ min: 2, max: 5 }) // Multiple attempts
        }),
        async (testData) => {
          // Reset mocks for this iteration
          jest.clearAllMocks()
          
          // Create a fresh AuthService instance to reset rate limiting state
          const freshAuthService = new AuthService(
            mockSupabase,
            mockSessionManager,
            mockErrorHandler,
            mockProfileSync
          )

          // Setup successful signup response for first attempt
          const mockAuthUser: AuthUser = {
            id: `user-${Math.random()}`,
            email: testData.email,
            email_confirmed_at: new Date().toISOString(),
            user_metadata: { name: testData.name, role: testData.role },
            app_metadata: {}
          } as any

          mockSupabase.auth.signUp.mockResolvedValue({
            data: { user: mockAuthUser, session: null },
            error: null
          })

          mockProfileSync.retryProfileCreation.mockResolvedValue({
            id: mockAuthUser.id,
            email: testData.email,
            name: testData.name,
            role: testData.role,
            verification_status: 'unverified',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

          const signUpParams: SignUpParams = {
            email: testData.email,
            password: testData.password,
            name: testData.name,
            role: testData.role
          }

          // Perform multiple concurrent signup attempts
          const signupPromises = Array.from({ length: testData.attemptCount }, () =>
            freshAuthService.signUp(signUpParams)
          )

          const results = await Promise.all(signupPromises)

          // Verify rate limiting behavior
          const successfulAttempts = results.filter(result => result.success)
          const rateLimitedAttempts = results.filter(result => 
            !result.success && result.error?.code === AuthErrorCode.SIGNUP_COOLDOWN
          )

          // Property: Only the first attempt should succeed
          expect(successfulAttempts.length).toBe(1)
          
          // Property: Subsequent attempts should be rate limited
          expect(rateLimitedAttempts.length).toBe(testData.attemptCount - 1)

          // Property: Rate limited attempts should have retry information
          rateLimitedAttempts.forEach(result => {
            expect(result.error?.retryable).toBe(true)
            expect(result.error?.retryAfter).toBeGreaterThan(0)
            expect(result.error?.retryAfter).toBeLessThanOrEqual(5000) // 5 second cooldown
          })

          // Property: Only one call to Supabase should be made (first attempt only)
          expect(mockSupabase.auth.signUp).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 3 }
    )
  }, 30000) // 30 second timeout for property test

  /**
   * Additional property test: Rate limiting should reset after cooldown period
   */
  test('Feature: authentication-refactor, Property 7b: Rate Limiting Reset After Cooldown', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }).map(s => s.replace(/\s/g, 'a')), // Replace spaces with 'a'
          name: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim() || 'TestUser'), // Ensure non-empty
          role: fc.constantFrom('buyer' as UserRole, 'seller' as UserRole)
        }),
        async (testData) => {
          // Reset mocks for this iteration
          jest.clearAllMocks()
          
          // Create a fresh AuthService instance to reset rate limiting state
          const freshAuthService = new AuthService(
            mockSupabase,
            mockSessionManager,
            mockErrorHandler,
            mockProfileSync
          )

          // Setup successful signup response
          const mockAuthUser: AuthUser = {
            id: `user-${Math.random()}`,
            email: testData.email,
            email_confirmed_at: new Date().toISOString(),
            user_metadata: { name: testData.name, role: testData.role },
            app_metadata: {}
          } as any

          mockSupabase.auth.signUp.mockResolvedValue({
            data: { user: mockAuthUser, session: null },
            error: null
          })

          mockProfileSync.retryProfileCreation.mockResolvedValue({
            id: mockAuthUser.id,
            email: testData.email,
            name: testData.name,
            role: testData.role,
            verification_status: 'unverified',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

          const signUpParams: SignUpParams = {
            email: testData.email,
            password: testData.password,
            name: testData.name,
            role: testData.role
          }

          // First signup attempt
          const firstResult = await freshAuthService.signUp(signUpParams)
          expect(firstResult.success).toBe(true)

          // Immediate second attempt should be rate limited
          const secondResult = await freshAuthService.signUp(signUpParams)
          expect(secondResult.success).toBe(false)
          expect(secondResult.error?.code).toBe(AuthErrorCode.SIGNUP_COOLDOWN)

          // Wait for cooldown period (5 seconds + buffer)
          await new Promise(resolve => setTimeout(resolve, 5100))

          // Third attempt after cooldown should succeed
          const thirdResult = await freshAuthService.signUp(signUpParams)
          expect(thirdResult.success).toBe(true)

          // Verify Supabase was called twice (first and third attempts)
          expect(mockSupabase.auth.signUp).toHaveBeenCalledTimes(2)
        }
      ),
      { numRuns: 3 } // Fewer runs due to timeout requirements
    )
  }, 60000) // 60 second timeout for cooldown test

  /**
   * Property test: Rate limiting should be per-email address
   */
  test('Feature: authentication-refactor, Property 7c: Rate Limiting Per Email Address', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email1: fc.emailAddress(),
          email2: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }).map(s => s.replace(/\s/g, 'a')), // Replace spaces with 'a'
          name: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim() || 'TestUser'), // Ensure non-empty
          role: fc.constantFrom('buyer' as UserRole, 'seller' as UserRole)
        }).filter(data => data.email1 !== data.email2), // Ensure different emails
        async (testData) => {
          // Reset mocks for this iteration
          jest.clearAllMocks()
          
          // Create a fresh AuthService instance to reset rate limiting state
          const freshAuthService = new AuthService(
            mockSupabase,
            mockSessionManager,
            mockErrorHandler,
            mockProfileSync
          )

          // Setup successful signup responses
          const mockAuthUser1: AuthUser = {
            id: `user1-${Math.random()}`,
            email: testData.email1,
            email_confirmed_at: new Date().toISOString(),
            user_metadata: { name: testData.name, role: testData.role },
            app_metadata: {}
          } as any

          const mockAuthUser2: AuthUser = {
            id: `user2-${Math.random()}`,
            email: testData.email2,
            email_confirmed_at: new Date().toISOString(),
            user_metadata: { name: testData.name, role: testData.role },
            app_metadata: {}
          } as any

          mockSupabase.auth.signUp
            .mockResolvedValueOnce({
              data: { user: mockAuthUser1, session: null },
              error: null
            })
            .mockResolvedValueOnce({
              data: { user: mockAuthUser2, session: null },
              error: null
            })

          mockProfileSync.retryProfileCreation
            .mockResolvedValueOnce({
              id: mockAuthUser1.id,
              email: testData.email1,
              name: testData.name,
              role: testData.role,
              verification_status: 'unverified',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .mockResolvedValueOnce({
              id: mockAuthUser2.id,
              email: testData.email2,
              name: testData.name,
              role: testData.role,
              verification_status: 'unverified',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          const signUpParams1: SignUpParams = {
            email: testData.email1,
            password: testData.password,
            name: testData.name,
            role: testData.role
          }

          const signUpParams2: SignUpParams = {
            email: testData.email2,
            password: testData.password,
            name: testData.name,
            role: testData.role
          }

          // First signup with email1
          const result1 = await freshAuthService.signUp(signUpParams1)
          expect(result1.success).toBe(true)

          // Concurrent signup with email2 should also succeed (different email)
          const result2 = await freshAuthService.signUp(signUpParams2)
          expect(result2.success).toBe(true)

          // Property: Rate limiting should be per-email, so both should succeed
          expect(mockSupabase.auth.signUp).toHaveBeenCalledTimes(2)
        }
      ),
      { numRuns: 3 }
    )
  }, 30000)

  /**
   * Property 9: Password Reset Security
   * For any password reset operation, after successful completion, all existing sessions
   * for that user should be invalidated, requiring re-authentication with the new password.
   * 
   * **Validates: Requirements 7.5**
   */
  test('Feature: authentication-refactor, Property 9: Password Reset Security', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          token: fc.string({ minLength: 10, maxLength: 100 }),
          newPassword: fc.string({ minLength: 8, maxLength: 50 })
        }),
        async (testData) => {
          // Setup successful password update response
          mockSupabase.auth.updateUser.mockResolvedValue({ error: null })
          mockSessionManager.clearSession.mockResolvedValue()

          // Reset password
          await authService.resetPassword(testData.token, testData.newPassword)

          // Property: Session should be cleared after password reset
          expect(mockSessionManager.clearSession).toHaveBeenCalled()

          // Property: Supabase should be called to update the password
          expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
            password: testData.newPassword
          })

          // Property: Password reset should invalidate all existing sessions
          // This is verified by ensuring clearSession is called, which handles
          // both local session cleanup and server-side token revocation
        }
      ),
      { numRuns: 3 }
    )
  }, 30000)

  /**
   * Additional property test: Password reset should handle token validation
   */
  test('Feature: authentication-refactor, Property 9b: Password Reset Token Validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          token: fc.string({ minLength: 1, maxLength: 100 }),
          newPassword: fc.string({ minLength: 8, maxLength: 50 })
        }),
        async (testData) => {
          // Setup token validation error
          const tokenError = new Error('Invalid token')
          mockSupabase.auth.updateUser.mockResolvedValue({ error: tokenError })

          const mockAuthError = {
            code: AuthErrorCode.INVALID_RESET_TOKEN,
            message: 'Invalid token',
            userMessage: 'Invalid or expired password reset link. Please request a new one.',
            retryable: false
          }

          mockErrorHandler.parseAuthError.mockReturnValue(mockAuthError)

          // Property: Invalid tokens should be rejected
          await expect(authService.resetPassword(testData.token, testData.newPassword))
            .rejects.toEqual(mockAuthError)

          // Property: Session should NOT be cleared for failed password resets
          expect(mockSessionManager.clearSession).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 3 }
    )
  }, 30000)
})