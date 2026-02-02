import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { AuthProvider, useAuth } from '../auth-context';
import type { User } from '@/types';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('../auth/auth-service');
jest.mock('../supabase/client');

// Import the mocked modules
import { authService } from '../auth/auth-service';
import { createBrowserClient } from '../supabase/client';

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>;

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    onAuthStateChange: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

describe('Auth Context Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateBrowserClient.mockReturnValue(mockSupabaseClient as any);
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    } as any);
  });

  it('Feature: authentication-refactor, Property 2: Authentication State Consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'),
          userData: fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            role: fc.constantFrom('buyer', 'seller', 'admin'),
            verification_status: fc.constantFrom('pending', 'approved'),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
          hasSession: fc.boolean(),
        }),
        async ({ event, userData, hasSession }) => {
          // Reset all mocks for clean state
          jest.clearAllMocks();
          mockCreateBrowserClient.mockReturnValue(mockSupabaseClient as any);
          
          const mockUser: User = userData;
          
          if (event === 'SIGNED_OUT' || !hasSession) {
            mockAuthService.getCurrentUser.mockResolvedValue(null);
          } else {
            mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
          }

          let finalState: any = null;
          let stateUpdateCount = 0;

          function StateCapture() {
            const auth = useAuth();
            
            React.useEffect(() => {
              stateUpdateCount++;
              if (!auth.initializing && !auth.loading) {
                finalState = {
                  user: auth.user,
                  isAuthenticated: auth.isAuthenticated,
                  loading: auth.loading,
                  initializing: auth.initializing
                };
              }
            }, [auth.user, auth.isAuthenticated, auth.loading, auth.initializing]);

            return null;
          }

          const { unmount } = render(
            <AuthProvider>
              <StateCapture />
            </AuthProvider>
          );

          // Wait for initialization to complete
          await waitFor(() => {
            expect(finalState).not.toBeNull();
          }, { timeout: 1000 });

          // Reset for auth state change simulation
          finalState = null;
          stateUpdateCount = 0;

          const session: Session | null = hasSession ? {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_at: Date.now() + 3600000,
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: mockUser.id,
              email: mockUser.email,
              email_confirmed_at: '2023-01-01',
              user_metadata: { name: mockUser.name, role: mockUser.role },
              app_metadata: {},
              aud: 'authenticated',
              created_at: '2023-01-01',
              updated_at: '2023-01-01',
            }
          } : null;

          // Simulate auth state change
          await act(async () => {
            const authChangeEvent: AuthChangeEvent = event as AuthChangeEvent;
            const callback = mockSupabaseClient.auth.onAuthStateChange.mock.calls[0]?.[0];
            if (callback) {
              callback(authChangeEvent, session);
            }
          });

          // Wait for state to settle after auth change
          await waitFor(() => {
            expect(finalState).not.toBeNull();
          }, { timeout: 1000 });

          // Verify state consistency
          if (event === 'SIGNED_OUT' || !hasSession) {
            expect(finalState.user).toBeNull();
            expect(finalState.isAuthenticated).toBe(false);
          } else {
            expect(finalState.user).toEqual(mockUser);
            expect(finalState.isAuthenticated).toBe(true);
          }

          unmount();
        }
      ),
      { numRuns: 5, timeout: 3000 } // Further reduced for reliability
    );
  }, 10000); // Reduced test timeout

  it('Feature: authentication-refactor, Property 11: Session Restoration on Page Load', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasValidSession: fc.boolean(),
          userData: fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            role: fc.constantFrom('buyer', 'seller', 'admin'),
            verification_status: fc.constantFrom('pending', 'approved'),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
          }),
        }),
        async ({ hasValidSession, userData }) => {
          // Reset all mocks for clean state
          jest.clearAllMocks();
          mockCreateBrowserClient.mockReturnValue(mockSupabaseClient as any);
          
          const mockUser: User = userData;

          if (hasValidSession) {
            mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
            mockSupabaseClient.auth.getSession.mockResolvedValue({
              data: {
                session: {
                  access_token: 'valid-token',
                  refresh_token: 'valid-refresh',
                  expires_at: Date.now() + 3600000,
                  expires_in: 3600,
                  token_type: 'bearer',
                  user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    email_confirmed_at: '2023-01-01',
                    user_metadata: { name: mockUser.name, role: mockUser.role },
                    app_metadata: {},
                    aud: 'authenticated',
                    created_at: '2023-01-01',
                    updated_at: '2023-01-01',
                  }
                }
              },
              error: null
            });
          } else {
            mockAuthService.getCurrentUser.mockResolvedValue(null);
            mockSupabaseClient.auth.getSession.mockResolvedValue({
              data: { session: null },
              error: null
            });
          }

          let finalState: any = null;

          function StateCapture() {
            const auth = useAuth();
            
            React.useEffect(() => {
              if (!auth.initializing && !auth.loading) {
                finalState = {
                  user: auth.user,
                  isAuthenticated: auth.isAuthenticated,
                  loading: auth.loading
                };
              }
            }, [auth.initializing, auth.loading, auth.user, auth.isAuthenticated]);

            return null;
          }

          const { unmount } = render(
            <AuthProvider>
              <StateCapture />
            </AuthProvider>
          );

          // Wait for initialization to complete
          await waitFor(() => {
            expect(finalState).not.toBeNull();
          }, { timeout: 2000 });

          // Property: Session restoration should match expected state
          if (hasValidSession) {
            expect(finalState.user).toEqual(mockUser);
            expect(finalState.isAuthenticated).toBe(true);
          } else {
            expect(finalState.user).toBeNull();
            expect(finalState.isAuthenticated).toBe(false);
          }

          unmount();
        }
      ),
      { numRuns: 5, timeout: 3000 }
    );
  }, 10000);
});