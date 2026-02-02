// Mock Supabase environment variables first
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock the auth context module completely
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import * as fc from 'fast-check';
import { ProtectedRoute } from '../protected-route';
import { useAuth } from '@/lib/auth-context';
import type { User, UserRole } from '@/types';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Arbitraries for property-based testing
const userRoleArbitrary = fc.constantFrom('buyer', 'seller', 'admin');

const userArbitrary = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  role: userRoleArbitrary,
  verification_status: fc.constantFrom('pending', 'approved', 'rejected', 'unverified'),
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
});

const authStateArbitrary = fc.record({
  user: fc.option(userArbitrary, { nil: null }),
  loading: fc.boolean(),
  initializing: fc.boolean(),
  isAuthenticated: fc.boolean(),
});

describe('Protected Route Property Tests', () => {
  let mockPush: jest.Mock;
  let mockBack: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked router functions from the global mock
    const router = useRouter();
    mockPush = router.push as jest.Mock;
    mockBack = router.back as jest.Mock;
    
    // Clear any existing DOM content
    document.body.innerHTML = '';
  });

  /**
   * Property 4: Protected Route Access Control
   * For any protected route with a required role, if a user attempts to access the route,
   * then access should be granted if and only if the user is authenticated AND
   * (no role is required OR the user's role matches the required role).
   * Validates: Requirements 3.2, 8.5
   */
  test('Feature: authentication-refactor, Property 4: Protected Route Access Control', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          authState: authStateArbitrary,
          requiredRole: fc.option(userRoleArbitrary, { nil: undefined }),
          hasLoadingStates: fc.boolean(),
        }),
        ({ authState, requiredRole, hasLoadingStates }) => {
          // Skip loading states for this property test
          if (hasLoadingStates && (authState.loading || authState.initializing)) {
            return true; // Skip this case
          }

          // Ensure consistent auth state
          const isAuthenticated = authState.user !== null;
          const finalAuthState = {
            ...authState,
            isAuthenticated,
            loading: false,
            initializing: false,
            signUp: jest.fn(),
            signIn: jest.fn(),
            signOut: jest.fn(),
            requestPasswordReset: jest.fn(),
            resetPassword: jest.fn(),
            resendVerificationEmail: jest.fn(),
            updateProfile: jest.fn(),
            refreshUser: jest.fn(),
            error: null,
          };

          mockUseAuth.mockReturnValue(finalAuthState);

          const { unmount } = render(
            <ProtectedRoute requiredRole={requiredRole}>
              <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>
          );

          // Determine expected access
          const shouldHaveAccess = isAuthenticated && (
            !requiredRole || // No role required
            (authState.user && authState.user.role === requiredRole) // User has required role
          );

          if (!isAuthenticated) {
            // Unauthenticated users should see loading state (component shows loading before redirect)
            // The redirect happens in useEffect, so we check for loading state instead
            const loadingElement = screen.queryByRole('status', { name: /loading/i });
            expect(loadingElement).toBeInTheDocument();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
          } else if (shouldHaveAccess) {
            // Authenticated users with correct role should see content
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
            expect(mockPush).not.toHaveBeenCalled();
          } else {
            // Authenticated users with incorrect role should see access denied
            expect(screen.getByText('Access Denied')).toBeInTheDocument();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
            expect(mockPush).not.toHaveBeenCalled();
          }

          // Clean up after each test iteration
          unmount();
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Additional property test for role hierarchy
   * Validates that role-based access control works correctly across different role combinations
   */
  test('Feature: authentication-refactor, Property 4b: Role-Based Access Consistency', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          userRole: userRoleArbitrary,
          requiredRole: userRoleArbitrary,
        }),
        ({ userRole, requiredRole }) => {
          const mockUser: User = {
            id: 'test-id',
            email: 'test@example.com',
            name: 'Test User',
            role: userRole,
            verification_status: 'approved',
            created_at: '2023-01-01T00:00:00.000Z',
            updated_at: '2023-01-01T00:00:00.000Z',
          };

          mockUseAuth.mockReturnValue({
            user: mockUser,
            loading: false,
            initializing: false,
            isAuthenticated: true,
            signUp: jest.fn(),
            signIn: jest.fn(),
            signOut: jest.fn(),
            requestPasswordReset: jest.fn(),
            resetPassword: jest.fn(),
            resendVerificationEmail: jest.fn(),
            updateProfile: jest.fn(),
            refreshUser: jest.fn(),
            error: null,
          });

          const { unmount } = render(
            <ProtectedRoute requiredRole={requiredRole}>
              <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>
          );

          const hasAccess = userRole === requiredRole;

          if (hasAccess) {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
            expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
          } else {
            expect(screen.getByText('Access Denied')).toBeInTheDocument();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
          }

          // Clean up after each test iteration
          unmount();
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });
});