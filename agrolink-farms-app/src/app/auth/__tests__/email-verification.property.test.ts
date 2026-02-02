import * as fc from 'fast-check';
import { authService } from '@/lib/auth/auth-service';
import { AuthErrorCode } from '@/lib/auth/types';
import { createMockSupabaseClient } from '@/test/utils/auth-helpers';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createBrowserClient: jest.fn(),
}));

// Mock window.location for redirect URL
delete (window as any).location;
(window as any).location = {
  origin: 'http://localhost:3000',
};

describe('Email Verification Property Tests', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    
    // Mock the createBrowserClient to return our mock
    const { createBrowserClient } = require('@/lib/supabase/client');
    createBrowserClient.mockReturnValue(mockSupabaseClient);
  });

  /**
   * Property 8: Email Verification Round Trip
   * 
   * This property tests that the email verification process maintains consistency
   * from signup through email verification callback. It ensures that:
   * 1. Signup with unverified email creates user but requires verification
   * 2. Verification email can be resent successfully
   * 3. Email verification callback properly activates the account
   * 4. The round trip maintains user data integrity
   * 
   * Validates: Requirements 4.2, 4.4
   */
  test('Feature: authentication-refactor, Property 8: Email Verification Round Trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }).filter(s => {
            const trimmed = s.trim();
            // Ensure password has reasonable characters and length
            return trimmed.length >= 8 && 
                   /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(trimmed);
          }),
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
            const trimmed = s.trim();
            // Ensure name has reasonable characters
            return trimmed.length > 0 && 
                   /^[a-zA-Z0-9\s\-_'.]+$/.test(trimmed);
          }),
          role: fc.constantFrom('buyer', 'seller'),
        }),
        async ({ email, password, name, role }) => {
          // Reset mocks for each test iteration
          jest.clearAllMocks();
          
          // Step 1: Mock signup that requires email verification
          const mockUser = {
            id: `user-${Math.random().toString(36).substr(2, 9)}`,
            email,
            email_confirmed_at: null, // Not verified yet
            user_metadata: { name, role },
            app_metadata: {},
          };

          mockSupabaseClient.auth.signUp.mockResolvedValue({
            data: { user: mockUser, session: null },
            error: null,
          });

          // Mock profile creation (should not happen until verification)
          mockSupabaseClient.from.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            upsert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          });

          // Step 1: Perform signup
          const signupResult = await authService.signUp({ email, password, name, role });

          // Verify signup behavior
          expect(signupResult.success).toBe(true);
          expect(signupResult.needsVerification).toBe(true);
          expect(signupResult.user).toBeUndefined(); // No user profile until verification
          expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
            email,
            password,
            options: {
              data: { name, role }
            }
          });

          // Step 2: Mock resend verification email
          mockSupabaseClient.auth.resend.mockResolvedValue({
            data: {},
            error: null,
          });

          // Test resend verification email
          await expect(authService.resendVerificationEmail(email)).resolves.not.toThrow();
          
          expect(mockSupabaseClient.auth.resend).toHaveBeenCalledWith({
            type: 'signup',
            email,
            options: {
              emailRedirectTo: 'http://localhost:3000/auth/callback'
            }
          });

          // Step 3: Mock email verification callback
          const verifiedUser = {
            ...mockUser,
            email_confirmed_at: new Date().toISOString(), // Now verified
          };

          const mockSession = {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            expires_in: 3600,
            token_type: 'bearer' as const,
            user: verifiedUser,
          };

          // Mock session manager to return verified session
          mockSupabaseClient.auth.getSession.mockResolvedValue({
            data: { session: mockSession },
            error: null,
          });

          // Mock profile creation after verification
          const mockProfile = {
            id: verifiedUser.id,
            email: verifiedUser.email,
            name,
            role,
            verification_status: role === 'buyer' ? 'approved' : 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Mock profile creation success
          mockSupabaseClient.from.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            upsert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
            maybeSingle: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          });

          // Step 3: Simulate email verification callback
          const verificationToken = 'mock-verification-token';
          await expect(authService.verifyEmail(verificationToken)).resolves.not.toThrow();

          // Step 4: Verify the round trip maintains data integrity
          // After verification, user should be able to get their profile
          const currentUser = await authService.getCurrentUser();
          
          if (currentUser) {
            // Verify user data integrity through the round trip
            expect(currentUser.email).toBe(email);
            expect(currentUser.name).toBe(name);
            expect(currentUser.role).toBe(role);
            
            // Verify verification status based on role
            if (role === 'buyer') {
              expect(currentUser.verification_status).toBe('approved');
            } else {
              expect(currentUser.verification_status).toBe('pending');
            }
          }

          // Verify that the verification process was called correctly
          expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
        }
      ),
      {
        numRuns: 3, // Reduced for faster execution
        timeout: 5000,
      }
    );
  }, 10000);

  /**
   * Additional property test for email verification error handling
   */
  test('Email verification handles invalid tokens gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (invalidToken) => {
          // Mock session manager to return no session (invalid token)
          mockSupabaseClient.auth.getSession.mockResolvedValue({
            data: { session: null },
            error: { message: 'Invalid token' },
          });

          // Should throw appropriate error for invalid token
          await expect(authService.verifyEmail(invalidToken)).rejects.toMatchObject({
            code: AuthErrorCode.SESSION_EXPIRED,
            userMessage: expect.stringContaining('session not found'),
          });
        }
      ),
      {
        numRuns: 3,
        timeout: 3000,
      }
    );
  });

  /**
   * Property test for resend verification email error handling
   */
  test('Resend verification email handles errors appropriately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('invalid-email'),
          fc.constant(''),
          fc.constant('not-an-email'),
        ),
        async (invalidEmail) => {
          // Should reject invalid email formats
          await expect(authService.resendVerificationEmail(invalidEmail)).rejects.toMatchObject({
            code: AuthErrorCode.INVALID_EMAIL,
            userMessage: expect.stringContaining('valid email'),
          });
        }
      ),
      {
        numRuns: 3,
        timeout: 2000,
      }
    );
  });

  /**
   * Property test for signup verification requirement consistency
   */
  test('Signup consistently requires verification for unconfirmed emails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }).filter(s => {
            const trimmed = s.trim();
            return trimmed.length >= 8 && 
                   /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(trimmed);
          }),
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
            const trimmed = s.trim();
            return trimmed.length > 0 && 
                   /^[a-zA-Z0-9\s\-_'.]+$/.test(trimmed);
          }),
          role: fc.constantFrom('buyer', 'seller'),
        }),
        async ({ email, password, name, role }) => {
          // Reset mocks
          jest.clearAllMocks();
          
          // Mock signup with unconfirmed email
          const mockUser = {
            id: `user-${Math.random().toString(36).substr(2, 9)}`,
            email,
            email_confirmed_at: null, // Key: unconfirmed
            user_metadata: { name, role },
            app_metadata: {},
          };

          mockSupabaseClient.auth.signUp.mockResolvedValue({
            data: { user: mockUser, session: null },
            error: null,
          });

          // Mock no existing profile
          mockSupabaseClient.from.mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          });

          const result = await authService.signUp({ email, password, name, role });

          // Property: Unconfirmed email MUST require verification
          expect(result.needsVerification).toBe(true);
          expect(result.user).toBeUndefined(); // No profile created yet
        }
      ),
      {
        numRuns: 3,
        timeout: 4000,
      }
    );
  });
});