import { SupabaseClient, User as AuthUser } from '@supabase/supabase-js'
import { createBrowserClient } from '../supabase/client'
import { User, UserRole } from '../../types'
import { AuthError, AuthErrorCode } from './types'

/**
 * Interface for user metadata during profile creation
 */
export interface UserMetadata {
  name: string
  role: UserRole
}

/**
 * Options for profile creation retry logic
 */
export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
}

/**
 * Service for managing user profile synchronization between Supabase Auth and database
 */
export class ProfileSyncService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createBrowserClient()
  }

  /**
   * Create user profile after signup
   * @param authUser - Supabase auth user object
   * @param metadata - User metadata (name, role)
   * @returns Promise resolving to created user profile
   */
  async createProfile(authUser: AuthUser, metadata: UserMetadata): Promise<User> {
    try {
      // Idempotency check - if profile already exists, return it
      const existingProfile = await this.getProfile(authUser.id)
      if (existingProfile) {
        return existingProfile
      }

      // Create new profile with race condition handling
      const profileData = {
        id: authUser.id,
        email: authUser.email!,
        name: metadata.name,
        role: metadata.role,
        verification_status: metadata.role === 'seller' ? 'pending' : 'unverified' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('users')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        // Handle race condition - if profile was created by another process
        if (error.code === '23505') { // Unique constraint violation
          // Try to fetch the existing profile
          const existingProfile = await this.getProfile(authUser.id)
          if (existingProfile) {
            return existingProfile
          }
        }

        throw this.createAuthError({
          code: AuthErrorCode.PROFILE_CREATION_FAILED,
          message: `Failed to create user profile: ${error.message}`,
          userMessage: 'Failed to create your profile. Please try again.',
          retryable: true,
          metadata: { userId: authUser.id, error: error.message, errorCode: error.code }
        });
      }

      return data as User
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error as AuthError;
      }

      throw this.createAuthError({
        code: AuthErrorCode.PROFILE_CREATION_FAILED,
        message: `Unexpected error during profile creation: ${error}`,
        userMessage: 'An unexpected error occurred. Please try again.',
        retryable: true,
        metadata: { userId: authUser.id }
      });
    }
  }

  /**
   * Sync profile with auth metadata
   * @param userId - User ID to sync
   * @returns Promise resolving to updated user profile
   */
  async syncProfile(userId: string): Promise<User> {
    try {
      // Get current auth user
      const { data: { user: authUser }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !authUser || authUser.id !== userId) {
        throw this.createAuthError({
          code: AuthErrorCode.SESSION_EXPIRED,
          message: 'Invalid or expired session',
          userMessage: 'Your session has expired. Please log in again.',
          retryable: false
        });
      }

      // Get current profile
      const profile = await this.getProfile(userId)
      if (!profile) {
        throw this.createAuthError({
          code: AuthErrorCode.PROFILE_CREATION_FAILED,
          message: 'User profile not found',
          userMessage: 'Your profile could not be found. Please contact support.',
          retryable: false
        });
      }

      // Update profile with auth metadata if needed
      const updates: Partial<User> = {}
      
      if (authUser.email && authUser.email !== profile.email) {
        updates.email = authUser.email
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()
        return await this.updateProfile(userId, updates)
      }

      return profile
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error as AuthError;
      }

      throw this.createAuthError({
        code: AuthErrorCode.PROFILE_UPDATE_FAILED,
        message: `Failed to sync profile: ${error}`,
        userMessage: 'Failed to sync your profile. Please try again.',
        retryable: true,
        metadata: { userId }
      });
    }
  }

  /**
   * Get profile by user ID
   * @param userId - User ID to fetch
   * @returns Promise resolving to user profile or null if not found
   */
  async getProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If no rows found, return null (not an error)
        if (error.code === 'PGRST116') {
          return null
        }

        throw this.createAuthError({
          code: AuthErrorCode.DATABASE_ERROR,
          message: `Failed to fetch user profile: ${error.message}`,
          userMessage: 'Failed to load your profile. Please try again.',
          retryable: true,
          metadata: { userId, error: error.message }
        });
      }

      return data as User
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error as AuthError;
      }

      throw this.createAuthError({
        code: AuthErrorCode.DATABASE_ERROR,
        message: `Unexpected error fetching profile: ${error}`,
        userMessage: 'An unexpected error occurred. Please try again.',
        retryable: true,
        metadata: { userId }
      });
    }
  }

  /**
   * Update user profile
   * @param userId - User ID to update
   * @param updates - Partial user data to update
   * @returns Promise resolving to updated user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      // Ensure updated_at is set
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw this.createAuthError({
          code: AuthErrorCode.PROFILE_UPDATE_FAILED,
          message: `Failed to update user profile: ${error.message}`,
          userMessage: 'Failed to update your profile. Please try again.',
          retryable: true,
          metadata: { userId, updates, error: error.message }
        });
      }

      return data as User
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error as AuthError;
      }

      throw this.createAuthError({
        code: AuthErrorCode.PROFILE_UPDATE_FAILED,
        message: `Unexpected error updating profile: ${error}`,
        userMessage: 'An unexpected error occurred. Please try again.',
        retryable: true,
        metadata: { userId, updates }
      });
    }
  }

  /**
   * Handle profile creation retry logic with exponential backoff
   * @param authUser - Supabase auth user object
   * @param metadata - User metadata (name, role)
   * @param options - Retry options
   * @returns Promise resolving to created user profile
   */
  async retryProfileCreation(
    authUser: AuthUser,
    metadata: UserMetadata,
    options: RetryOptions = {}
  ): Promise<User> {
    const {
      maxRetries = 3,
      baseDelay = 1000, // 1 second
      maxDelay = 10000   // 10 seconds
    } = options

    let lastError: AuthError | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.createProfile(authUser, metadata)
      } catch (error) {
        lastError = (error && typeof error === 'object' && 'code' in error) 
          ? error as AuthError 
          : this.createAuthError({
              code: AuthErrorCode.PROFILE_CREATION_FAILED,
              message: `Profile creation attempt ${attempt + 1} failed: ${error}`,
              userMessage: 'Failed to create your profile. Retrying...',
              retryable: true
            });

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break
        }

        // Don't retry non-retryable errors
        if (!lastError.retryable) {
          break
        }

        // Calculate exponential backoff delay
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay
        const totalDelay = delay + jitter

        await new Promise(resolve => setTimeout(resolve, totalDelay))
      }
    }

    // If we get here, all retries failed
    throw this.createAuthError({
      code: AuthErrorCode.PROFILE_CREATION_FAILED,
      message: lastError?.message || 'All profile creation attempts failed',
      userMessage: 'Failed to create your profile after multiple attempts. Please contact support.',
      retryable: false
    });
  }

  /**
   * Create profile with advanced race condition handling
   * This method uses database-level constraints to prevent duplicate profiles
   * @param authUser - Supabase auth user object
   * @param metadata - User metadata (name, role)
   * @returns Promise resolving to created user profile
   */
  async createProfileSafe(authUser: AuthUser, metadata: UserMetadata): Promise<User> {
    // First, try a quick check for existing profile
    const existingProfile = await this.getProfile(authUser.id)
    if (existingProfile) {
      return existingProfile
    }

    try {
      // Use upsert to handle race conditions at database level
      const profileData = {
        id: authUser.id,
        email: authUser.email!,
        name: metadata.name,
        role: metadata.role,
        verification_status: metadata.role === 'seller' ? 'pending' : 'unverified' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('users')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) {
        throw this.createAuthError({
          code: AuthErrorCode.PROFILE_CREATION_FAILED,
          message: `Failed to create user profile: ${error.message}`,
          userMessage: 'Failed to create your profile. Please try again.',
          retryable: true,
          metadata: { userId: authUser.id, error: error.message, errorCode: error.code }
        });
      }

      return data as User
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error as AuthError;
      }

      throw this.createAuthError({
        code: AuthErrorCode.PROFILE_CREATION_FAILED,
        message: `Unexpected error during safe profile creation: ${error}`,
        userMessage: 'An unexpected error occurred. Please try again.',
        retryable: true,
        metadata: { userId: authUser.id }
      });
    }
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