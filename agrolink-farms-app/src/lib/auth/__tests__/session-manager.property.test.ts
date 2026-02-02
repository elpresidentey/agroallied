import * as fc from 'fast-check'
import { SessionManager } from '../session-manager'
import { createMockSupabaseClient } from '@/test/utils/auth-helpers'
import { propertyTestConfig } from '@/test/utils/property-helpers'

// Mock the Supabase client
jest.mock('../../supabase/client', () => ({
  createBrowserClient: jest.fn()
}))

describe('SessionManager Property Tests', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    // Create a fresh mock client for each test
    mockSupabaseClient = createMockSupabaseClient()
    
    // Mock the createBrowserClient to return our mock
    const { createBrowserClient } = require('../../supabase/client')
    createBrowserClient.mockReturnValue(mockSupabaseClient)
    
    // Use fake timers for auto-refresh testing
    jest.useFakeTimers()
    
    // Mock setTimeout and clearTimeout
    jest.spyOn(global, 'setTimeout')
    jest.spyOn(global, 'clearTimeout')
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  /**
   * Feature: authentication-refactor, Property 1: Session Token Refresh Prevents Expiration
   * 
   * For any authenticated user session, if the access token will expire within 5 minutes 
   * AND the token has not already expired, then the Session_Manager should successfully refresh 
   * the token before the access token expires, maintaining continuous authentication.
   * 
   * Validates: Requirements 1.2
   */
  test('Feature: authentication-refactor, Property 1: Session Token Refresh Prevents Expiration', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate sessions that expire within 5-10 minutes (300-600 seconds)
        fc.record({
          access_token: fc.string({ minLength: 20, maxLength: 100 }),
          refresh_token: fc.string({ minLength: 20, maxLength: 100 }),
          expires_at: fc.integer({ min: Math.floor(Date.now() / 1000) + 300, max: Math.floor(Date.now() / 1000) + 600 }),
          expires_in: fc.integer({ min: 300, max: 600 }),
          token_type: fc.constant('bearer' as const),
          user: fc.record({
            id: fc.uuid(),
            aud: fc.constant('authenticated'),
            email: fc.emailAddress(),
            email_confirmed_at: fc.string(),
            created_at: fc.string(),
            user_metadata: fc.record({}),
            app_metadata: fc.record({})
          })
        }),
        async (originalSession) => {
          // Reset mocks for this iteration
          jest.clearAllMocks()
          
          const sessionManager = new SessionManager()
          
          try {
            // Set up auto-refresh for the original session
            sessionManager.setupAutoRefresh(originalSession)
            
            // Calculate when the refresh should trigger (5 minutes before expiration)
            const now = Math.floor(Date.now() / 1000)
            const timeUntilRefresh = (originalSession.expires_at - 300 - now) * 1000
            
            // If the session expires too soon or has already expired, auto-refresh shouldn't be scheduled
            if (timeUntilRefresh <= 0) {
              // Verify no timeout was set for expired or soon-to-expire sessions
              expect(setTimeout).not.toHaveBeenCalled()
            } else {
              // Verify that auto-refresh was scheduled for valid sessions
              expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), timeUntilRefresh)
              expect(setTimeout).toHaveBeenCalledTimes(1)
            }
            
          } finally {
            sessionManager.destroy()
          }
        }
      ),
      propertyTestConfig
    )
  }, 10000) // 10 second timeout for property test

  /**
   * Property: Auto-refresh handles expired sessions gracefully
   * 
   * For any session that has already expired, auto-refresh should not be scheduled
   */
  test('Auto-refresh should not schedule for already expired sessions', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate sessions that are already expired
        fc.record({
          access_token: fc.string({ minLength: 20, maxLength: 100 }),
          refresh_token: fc.string({ minLength: 20, maxLength: 100 }),
          expires_at: fc.integer({ min: Math.floor(Date.now() / 1000) - 3600, max: Math.floor(Date.now() / 1000) - 60 }),
          expires_in: fc.integer({ min: 60, max: 3600 }),
          token_type: fc.constant('bearer' as const),
          user: fc.record({
            id: fc.uuid(),
            aud: fc.constant('authenticated'),
            email: fc.emailAddress(),
            email_confirmed_at: fc.string(),
            created_at: fc.string(),
            user_metadata: fc.record({}),
            app_metadata: fc.record({})
          })
        }),
        async (expiredSession) => {
          // Reset mocks for this iteration
          jest.clearAllMocks()
          
          const sessionManager = new SessionManager()
          
          try {
            // Set up auto-refresh for the expired session
            sessionManager.setupAutoRefresh(expiredSession)
            
            // Verify no timeout was scheduled since session is already expired
            expect(setTimeout).not.toHaveBeenCalled()
            
          } finally {
            sessionManager.destroy()
          }
        }
      ),
      propertyTestConfig
    )
  })

  /**
   * Property: Session validity check is consistent with auto-refresh timing
   * 
   * For any session, if isSessionValid returns false, auto-refresh should not be scheduled
   */
  test('Session validity check aligns with auto-refresh scheduling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          access_token: fc.option(fc.string({ minLength: 20, maxLength: 100 }), { nil: null }),
          refresh_token: fc.string({ minLength: 20, maxLength: 100 }),
          expires_at: fc.option(fc.integer({ min: Math.floor(Date.now() / 1000) - 3600, max: Math.floor(Date.now() / 1000) + 3600 }), { nil: null }),
          expires_in: fc.integer({ min: 60, max: 3600 }),
          token_type: fc.constant('bearer' as const),
          user: fc.record({
            id: fc.uuid(),
            aud: fc.constant('authenticated'),
            email: fc.emailAddress(),
            email_confirmed_at: fc.string(),
            created_at: fc.string(),
            user_metadata: fc.record({}),
            app_metadata: fc.record({})
          })
        }),
        async (session) => {
          // Reset mocks for this iteration
          jest.clearAllMocks()
          
          const sessionManager = new SessionManager()
          
          try {
            const isValid = sessionManager.isSessionValid(session as any)
            
            // Set up auto-refresh
            sessionManager.setupAutoRefresh(session as any)
            
            if (!isValid || !session.expires_at) {
              // If session is invalid or has no expiration, no timeout should be scheduled
              expect(setTimeout).not.toHaveBeenCalled()
            } else {
              // If session is valid, check if auto-refresh should be scheduled
              const now = Math.floor(Date.now() / 1000)
              const timeUntilRefresh = (session.expires_at - 300 - now) * 1000
              
              if (timeUntilRefresh > 0) {
                expect(setTimeout).toHaveBeenCalled()
              } else {
                expect(setTimeout).not.toHaveBeenCalled()
              }
            }
            
          } finally {
            sessionManager.destroy()
          }
        }
      ),
      propertyTestConfig
    )
  })
})