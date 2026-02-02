import { ProfileSyncService, UserMetadata } from '../profile-sync'
import { AuthErrorCode } from '../types'
import { createMockUser, createMockSupabaseClient } from '@/test/utils/auth-helpers'
import { User } from '@/types'

// Mock the Supabase client
jest.mock('../../supabase/client', () => ({
  createBrowserClient: jest.fn()
}))

describe('ProfileSyncService Unit Tests', () => {
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

  describe('createProfile', () => {
    const mockAuthUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      user_metadata: {},
      app_metadata: {}
    }

    const mockMetadata: UserMetadata = {
      name: 'Test User',
      role: 'buyer'
    }

    it('should create profile successfully for buyer', async () => {
      const expectedUser = createMockUser({
        id: mockAuthUser.id,
        email: mockAuthUser.email,
        name: mockMetadata.name,
        role: mockMetadata.role,
        verification_status: 'unverified'
      })

      // Mock getProfile to return null (no existing profile), then insert result
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' } // No rows found
          })
          .mockResolvedValueOnce({
            data: expectedUser,
            error: null
          })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await profileSyncService.createProfile(mockAuthUser, mockMetadata)

      expect(result).toEqual(expectedUser)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
    })

    it('should create profile successfully for seller with pending status', async () => {
      const sellerMetadata: UserMetadata = {
        name: 'Test Seller',
        role: 'seller'
      }

      const expectedUser = createMockUser({
        id: mockAuthUser.id,
        email: mockAuthUser.email,
        name: sellerMetadata.name,
        role: sellerMetadata.role,
        verification_status: 'pending'
      })

      // Mock getProfile to return null (no existing profile), then insert result
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' }
          })
          .mockResolvedValueOnce({
            data: expectedUser,
            error: null
          })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await profileSyncService.createProfile(mockAuthUser, sellerMetadata)

      expect(result).toEqual(expectedUser)
      expect(result.verification_status).toBe('pending')
    })

    it('should return existing profile if already exists (idempotency)', async () => {
      const existingUser = createMockUser({
        id: mockAuthUser.id,
        email: mockAuthUser.email
      })

      // Mock getProfile to return existing profile
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: existingUser,
          error: null
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await profileSyncService.createProfile(mockAuthUser, mockMetadata)

      expect(result).toEqual(existingUser)
    })

    it('should handle race condition with unique constraint violation', async () => {
      const existingUser = createMockUser({
        id: mockAuthUser.id,
        email: mockAuthUser.email
      })

      // Mock getProfile to return null initially, then existing profile
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' }
          })
          .mockResolvedValueOnce({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint' }
          })
          .mockResolvedValueOnce({
            data: existingUser,
            error: null
          })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await profileSyncService.createProfile(mockAuthUser, mockMetadata)

      expect(result).toEqual(existingUser)
    })

    it('should throw AuthError when profile creation fails', async () => {
      // Mock getProfile to return null (no existing profile), then insert error
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' }
          })
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST301', message: 'Database connection failed' }
          })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(profileSyncService.createProfile(mockAuthUser, mockMetadata))
        .rejects.toMatchObject({
          code: AuthErrorCode.PROFILE_CREATION_FAILED,
          retryable: true
        })
    })
  })

  describe('getProfile', () => {
    it('should return user profile when found', async () => {
      const expectedUser = createMockUser()

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: expectedUser,
          error: null
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await profileSyncService.getProfile('test-user-id')

      expect(result).toEqual(expectedUser)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
    })

    it('should return null when profile not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' } // No rows found
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await profileSyncService.getProfile('nonexistent-user-id')

      expect(result).toBeNull()
    })

    it('should throw AuthError when database error occurs', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST301', message: 'Database connection failed' }
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(profileSyncService.getProfile('test-user-id'))
        .rejects.toMatchObject({
          code: AuthErrorCode.DATABASE_ERROR,
          retryable: true
        })
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updates = { name: 'Updated Name' }
      const updatedUser = createMockUser({ ...updates })

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedUser,
          error: null
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await profileSyncService.updateProfile('test-user-id', updates)

      expect(result).toEqual(updatedUser)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
    })

    it('should throw AuthError when update fails', async () => {
      const updates = { name: 'Updated Name' }

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST301', message: 'Update failed' }
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(profileSyncService.updateProfile('test-user-id', updates))
        .rejects.toMatchObject({
          code: AuthErrorCode.PROFILE_UPDATE_FAILED,
          retryable: true
        })
    })
  })

  describe('syncProfile', () => {
    const mockAuthUser = {
      id: 'test-user-id',
      email: 'updated@example.com',
      email_confirmed_at: new Date().toISOString(),
      user_metadata: {},
      app_metadata: {}
    }

    it('should sync profile when email has changed', async () => {
      const existingUser = createMockUser({
        id: mockAuthUser.id,
        email: 'old@example.com'
      })

      const updatedUser = createMockUser({
        id: mockAuthUser.id,
        email: mockAuthUser.email
      })

      // Mock getUser to return current auth user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      })

      // Mock getProfile and updateProfile
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({
            data: existingUser,
            error: null
          })
          .mockResolvedValueOnce({
            data: updatedUser,
            error: null
          })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await profileSyncService.syncProfile(mockAuthUser.id)

      expect(result).toEqual(updatedUser)
    })

    it('should return existing profile when no changes needed', async () => {
      const existingUser = createMockUser({
        id: mockAuthUser.id,
        email: mockAuthUser.email
      })

      // Mock getUser to return current auth user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      })

      // Mock getProfile to return existing profile
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: existingUser,
          error: null
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await profileSyncService.syncProfile(mockAuthUser.id)

      expect(result).toEqual(existingUser)
    })

    it('should throw AuthError when session is invalid', async () => {
      // Mock getUser to return error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid session' }
      })

      await expect(profileSyncService.syncProfile('test-user-id'))
        .rejects.toMatchObject({
          code: AuthErrorCode.SESSION_EXPIRED,
          retryable: false
        })
    })

    it('should throw AuthError when profile not found', async () => {
      // Mock getUser to return current auth user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      })

      // Mock getProfile to return null
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(profileSyncService.syncProfile(mockAuthUser.id))
        .rejects.toMatchObject({
          code: AuthErrorCode.PROFILE_CREATION_FAILED,
          retryable: false
        })
    })
  })

  describe('retryProfileCreation', () => {
    const mockAuthUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      user_metadata: {},
      app_metadata: {}
    }

    const mockMetadata: UserMetadata = {
      name: 'Test User',
      role: 'buyer'
    }

    it('should succeed on first attempt', async () => {
      const expectedUser = createMockUser()

      // Mock successful profile creation
      jest.spyOn(profileSyncService, 'createProfile').mockResolvedValue(expectedUser)

      const result = await profileSyncService.retryProfileCreation(mockAuthUser, mockMetadata)

      expect(result).toEqual(expectedUser)
      expect(profileSyncService.createProfile).toHaveBeenCalledTimes(1)
    })

    it('should retry on retryable errors', async () => {
      const expectedUser = createMockUser()

      // Mock first two attempts to fail, third to succeed
      jest.spyOn(profileSyncService, 'createProfile')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(expectedUser)

      const result = await profileSyncService.retryProfileCreation(mockAuthUser, mockMetadata, {
        maxRetries: 3,
        baseDelay: 10 // Use small delay for testing
      })

      expect(result).toEqual(expectedUser)
      expect(profileSyncService.createProfile).toHaveBeenCalledTimes(3)
    })

    it('should throw error after max retries exceeded', async () => {
      // Mock all attempts to fail
      jest.spyOn(profileSyncService, 'createProfile')
        .mockRejectedValue(new Error('Persistent error'))

      await expect(profileSyncService.retryProfileCreation(mockAuthUser, mockMetadata, {
        maxRetries: 2,
        baseDelay: 10
      })).rejects.toMatchObject({
        code: AuthErrorCode.PROFILE_CREATION_FAILED,
        retryable: false
      })

      expect(profileSyncService.createProfile).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })

  describe('createProfileSafe', () => {
    const mockAuthUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      user_metadata: {},
      app_metadata: {}
    }

    const mockMetadata: UserMetadata = {
      name: 'Test User',
      role: 'buyer'
    }

    it('should create profile using upsert', async () => {
      const expectedUser = createMockUser()

      // Mock getProfile to return null, then upsert result
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({
            data: null,
            error: { code: 'PGRST116' }
          })
          .mockResolvedValueOnce({
            data: expectedUser,
            error: null
          })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await profileSyncService.createProfileSafe(mockAuthUser, mockMetadata)

      expect(result).toEqual(expectedUser)
    })

    it('should return existing profile if found initially', async () => {
      const existingUser = createMockUser()

      // Mock getProfile to return existing profile
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: existingUser,
          error: null
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await profileSyncService.createProfileSafe(mockAuthUser, mockMetadata)

      expect(result).toEqual(existingUser)
    })
  })
})