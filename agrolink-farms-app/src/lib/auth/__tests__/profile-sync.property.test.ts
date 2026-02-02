import * as fc from 'fast-check'
import { ProfileSyncService, UserMetadata } from '../profile-sync'
import { AuthErrorCode } from '../types'
import { createMockUser, createMockSupabaseClient } from '@/test/utils/auth-helpers'
import { User } from '@/types'

// Mock the Supabase client
jest.mock('../../supabase/client', () => ({
  createBrowserClient: jest.fn()
}))

describe('ProfileSyncService Property Tests', () => {
  let profileSyncService: ProfileSyncService
  let mockSupabaseClient: any

  beforeEach(() => {
    // Create a fresh mock client for each test
    mockSupabaseClient = createMockSupabaseClient()
    
    // Mock the createBrowserClient to return our mock
    const { createBrowserClient } = require('../../supabase/client')
    createBrowserClient.mockReturnValue(mockSupabaseClient)
    
    // Create a new profile sync service instance for each test
    profileSyncService = new ProfileSyncService()
  })

  /**
   * Property 3: Profile Creation Idempotency
   * For any user signup operation, regardless of how many times profile creation is attempted,
   * exactly one user profile should exist in the database with the correct user ID and metadata.
   * **Validates: Requirements 5.1, 5.4**
   */
  test('Feature: authentication-refactor, Property 3: Profile Creation Idempotency', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user data
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          role: fc.constantFrom('buyer', 'seller')
        }),
        async (userData) => {
          // Create auth user object
          const authUser = {
            id: userData.id,
            email: userData.email,
            email_confirmed_at: new Date().toISOString(),
            user_metadata: {},
            app_metadata: {}
          }

          const metadata: UserMetadata = {
            name: userData.name,
            role: userData.role
          }

          const expectedUser = createMockUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            verification_status: userData.role === 'seller' ? 'pending' : 'unverified'
          })

          // Track how many times profile creation is attempted
          let profileCreationAttempts = 0
          let profileFetchAttempts = 0

          // Mock the database operations
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockImplementation(() => {
              profileFetchAttempts++
              
              // First call is always getProfile check
              if (profileFetchAttempts === 1) {
                return Promise.resolve({
                  data: null,
                  error: { code: 'PGRST116' } // No profile exists initially
                })
              }
              
              // Subsequent calls could be insert attempts or getProfile after race condition
              if (mockQuery.insert.mock.calls.length > profileCreationAttempts) {
                profileCreationAttempts++
                
                // Simulate race condition on first insert attempt
                if (profileCreationAttempts === 1) {
                  return Promise.resolve({
                    data: null,
                    error: { code: '23505', message: 'duplicate key value violates unique constraint' }
                  })
                }
              }
              
              // Return existing profile for subsequent getProfile calls
              return Promise.resolve({
                data: expectedUser,
                error: null
              })
            })
          }

          mockSupabaseClient.from.mockReturnValue(mockQuery)

          // Attempt profile creation multiple times concurrently
          const createProfilePromises = [
            profileSyncService.createProfile(authUser, metadata),
            profileSyncService.createProfile(authUser, metadata),
            profileSyncService.createProfile(authUser, metadata)
          ]

          const results = await Promise.all(createProfilePromises)

          // All results should be the same user profile
          results.forEach(result => {
            expect(result).toEqual(expectedUser)
            expect(result.id).toBe(userData.id)
            expect(result.email).toBe(userData.email)
            expect(result.name).toBe(userData.name)
            expect(result.role).toBe(userData.role)
          })

          // Verify that profile creation was attempted but handled race conditions properly
          expect(profileCreationAttempts).toBeGreaterThan(0)
          expect(profileFetchAttempts).toBeGreaterThan(profileCreationAttempts)
        }
      ),
      { numRuns: 3 }
    )
  }, 30000) // 30 second timeout for property test

  /**
   * Additional property test for createProfileSafe method
   */
  test('Feature: authentication-refactor, Property 3a: Safe Profile Creation Idempotency', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user data
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          role: fc.constantFrom('buyer', 'seller')
        }),
        async (userData) => {
          // Create auth user object
          const authUser = {
            id: userData.id,
            email: userData.email,
            email_confirmed_at: new Date().toISOString(),
            user_metadata: {},
            app_metadata: {}
          }

          const metadata: UserMetadata = {
            name: userData.name,
            role: userData.role
          }

          const expectedUser = createMockUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            verification_status: userData.role === 'seller' ? 'pending' : 'unverified'
          })

          // Track database operations
          let getProfileCalls = 0
          let upsertCalls = 0

          // Mock the database operations
          const mockQuery = {
            select: jest.fn().mockReturnThis(),
            upsert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockImplementation(() => {
              // Check if this is a getProfile call (before upsert) or upsert result
              if (mockQuery.upsert.mock.calls.length > upsertCalls) {
                upsertCalls++
                // Return upsert result
                return Promise.resolve({
                  data: expectedUser,
                  error: null
                })
              } else {
                getProfileCalls++
                // Return no existing profile for getProfile calls
                return Promise.resolve({
                  data: null,
                  error: { code: 'PGRST116' }
                })
              }
            })
          }

          mockSupabaseClient.from.mockReturnValue(mockQuery)

          // Attempt safe profile creation multiple times concurrently
          const createProfilePromises = [
            profileSyncService.createProfileSafe(authUser, metadata),
            profileSyncService.createProfileSafe(authUser, metadata),
            profileSyncService.createProfileSafe(authUser, metadata)
          ]

          const results = await Promise.all(createProfilePromises)

          // All results should be the same user profile
          results.forEach(result => {
            expect(result).toEqual(expectedUser)
            expect(result.id).toBe(userData.id)
            expect(result.email).toBe(userData.email)
            expect(result.name).toBe(userData.name)
            expect(result.role).toBe(userData.role)
          })

          // Verify that upsert was called (database-level idempotency)
          expect(upsertCalls).toBeGreaterThan(0)
        }
      ),
      { numRuns: 3 }
    )
  }, 30000) // 30 second timeout for property test

  /**
   * Property test for retry mechanism idempotency
   */
  test('Feature: authentication-refactor, Property 3b: Retry Profile Creation Idempotency', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random user data and retry options
        fc.record({
          userData: fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('buyer', 'seller')
          }),
          maxRetries: fc.integer({ min: 1, max: 5 }),
          baseDelay: fc.integer({ min: 1, max: 50 }) // Small delays for testing
        }),
        async ({ userData, maxRetries, baseDelay }) => {
          // Create auth user object
          const authUser = {
            id: userData.id,
            email: userData.email,
            email_confirmed_at: new Date().toISOString(),
            user_metadata: {},
            app_metadata: {}
          }

          const metadata: UserMetadata = {
            name: userData.name,
            role: userData.role
          }

          const expectedUser = createMockUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            verification_status: userData.role === 'seller' ? 'pending' : 'unverified'
          })

          // Mock createProfile to succeed after some failures
          let attemptCount = 0
          jest.spyOn(profileSyncService, 'createProfile').mockImplementation(async () => {
            attemptCount++
            
            // Fail first few attempts, then succeed
            if (attemptCount <= Math.min(2, maxRetries)) {
              throw new Error(`Attempt ${attemptCount} failed`)
            }
            
            return expectedUser
          })

          // Test retry mechanism
          const result = await profileSyncService.retryProfileCreation(authUser, metadata, {
            maxRetries,
            baseDelay
          })

          // Should eventually succeed and return the expected user
          expect(result).toEqual(expectedUser)
          expect(result.id).toBe(userData.id)
          expect(result.email).toBe(userData.email)
          expect(result.name).toBe(userData.name)
          expect(result.role).toBe(userData.role)

          // Should have made multiple attempts
          expect(attemptCount).toBeGreaterThan(1)
          expect(attemptCount).toBeLessThanOrEqual(maxRetries + 1)
        }
      ),
      { numRuns: 3 } // Fewer runs since this involves timing
    )
  }, 30000) // 30 second timeout for property test
})