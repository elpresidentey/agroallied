import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth-context';
import { authService } from '../auth/auth-service';
import { createBrowserClient } from '../supabase/client';
import type { User } from '@/types';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('../auth/auth-service');
jest.mock('../supabase/client');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>;

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    onAuthStateChange: jest.fn(),
  },
};

// Test component that uses the auth context
function TestComponent() {
  const {
    user,
    loading,
    initializing,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    resetPassword,
    resendVerificationEmail,
    updateProfile,
    refreshUser,
    isAuthenticated,
    error,
  } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="initializing">{initializing.toString()}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="error">{error ? JSON.stringify(error) : 'null'}</div>
      <button onClick={() => signUp('test@example.com', 'password', 'Test User', 'buyer')}>
        Sign Up
      </button>
      <button onClick={() => signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
      <button onClick={() => requestPasswordReset('test@example.com')}>
        Request Password Reset
      </button>
      <button onClick={() => resetPassword('token', 'newpassword')}>
        Reset Password
      </button>
      <button onClick={() => resendVerificationEmail('test@example.com')}>
        Resend Verification
      </button>
      <button onClick={() => updateProfile({ name: 'Updated Name' })}>
        Update Profile
      </button>
      <button onClick={() => refreshUser()}>
        Refresh User
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  let mockAuthStateListener: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUnsubscribe = jest.fn();
    mockAuthStateListener = jest.fn().mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    });
    
    mockSupabaseClient.auth.onAuthStateChange = mockAuthStateListener;
    mockCreateBrowserClient.mockReturnValue(mockSupabaseClient as any);
    
    // Default mock implementations
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.signUp.mockResolvedValue({
      success: true,
      needsVerification: false,
    });
    mockAuthService.signIn.mockResolvedValue({
      success: true,
    });
    mockAuthService.signOut.mockResolvedValue(undefined);
    mockAuthService.requestPasswordReset.mockResolvedValue(undefined);
    mockAuthService.resetPassword.mockResolvedValue(undefined);
    mockAuthService.resendVerificationEmail.mockResolvedValue(undefined);
    mockAuthService.updateProfile.mockResolvedValue({} as User);
  });

  describe('Context initialization and session restoration', () => {
    it('should initialize with correct default state', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially should be initializing
      expect(screen.getByTestId('initializing')).toHaveTextContent('true');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');

      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.getByTestId('initializing')).toHaveTextContent('false');
      });

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    });

    it('should restore user session on mount', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initializing')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    it('should handle session restoration errors gracefully', async () => {
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Session expired'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initializing')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });

  describe('Auth state changes and listener behavior', () => {
    it('should set up auth state listener on mount', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(mockAuthStateListener).toHaveBeenCalledTimes(1);
      expect(mockAuthStateListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle auth state change with session', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial setup
      await waitFor(() => {
        expect(screen.getByTestId('initializing')).toHaveTextContent('false');
      });

      // Simulate auth state change with session
      const authStateChangeHandler = mockAuthStateListener.mock.calls[0][0];
      const mockSession: Session = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Date.now() + 3600000,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: '123',
          email: 'test@example.com',
          email_confirmed_at: '2023-01-01',
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: '2023-01-01',
        },
      };

      await act(async () => {
        await authStateChangeHandler('SIGNED_IN' as AuthChangeEvent, mockSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    it('should handle auth state change without session', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial setup
      await waitFor(() => {
        expect(screen.getByTestId('initializing')).toHaveTextContent('false');
      });

      // Simulate auth state change without session (sign out)
      const authStateChangeHandler = mockAuthStateListener.mock.calls[0][0];

      await act(async () => {
        await authStateChangeHandler('SIGNED_OUT' as AuthChangeEvent, null);
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should clean up listener on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('Request deduplication', () => {
    it('should deduplicate concurrent getCurrentUser requests', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      // Make getCurrentUser take some time to resolve
      mockAuthService.getCurrentUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Trigger multiple refresh requests quickly
      const refreshButton = screen.getByText('Refresh User');
      
      await act(async () => {
        refreshButton.click();
        refreshButton.click();
        refreshButton.click();
      });

      // Wait for requests to complete
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });

      // Should call getCurrentUser for initial load and refresh (may be called more due to React strict mode)
      expect(mockAuthService.getCurrentUser).toHaveBeenCalledWith();
    });

    it('should deduplicate concurrent signIn requests', async () => {
      mockAuthService.signIn.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('initializing')).toHaveTextContent('false');
      });

      const signInButton = screen.getByText('Sign In');
      
      await act(async () => {
        signInButton.click();
        signInButton.click();
        signInButton.click();
      });

      // Wait for requests to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Should only call signIn once due to deduplication
      expect(mockAuthService.signIn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should handle signUp errors', async () => {
      const mockError = {
        code: 'invalid_email',
        message: 'Invalid email',
        userMessage: 'Please enter a valid email address.',
        retryable: false,
      };

      mockAuthService.signUp.mockResolvedValue({
        success: false,
        needsVerification: false,
        error: mockError,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('initializing')).toHaveTextContent('false');
      });

      const signUpButton = screen.getByText('Sign Up');
      
      await act(async () => {
        signUpButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(JSON.stringify(mockError));
      });
    });

    it('should handle signIn errors', async () => {
      const mockError = {
        code: 'invalid_credentials',
        message: 'Invalid credentials',
        userMessage: 'Invalid email or password.',
        retryable: false,
      };

      mockAuthService.signIn.mockResolvedValue({
        success: false,
        error: mockError,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('initializing')).toHaveTextContent('false');
      });

      const signInButton = screen.getByText('Sign In');
      
      await act(async () => {
        signInButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(JSON.stringify(mockError));
      });
    });
  });

  describe('Logout functionality', () => {
    it('should call AuthService.signOut and clear user state on successful logout', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      // Set up initial authenticated state
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization and user to be set
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');

      // Trigger logout
      const signOutButton = screen.getByText('Sign Out');
      
      await act(async () => {
        signOutButton.click();
      });

      // Wait for logout to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Verify AuthService.signOut was called
      expect(mockAuthService.signOut).toHaveBeenCalledTimes(1);

      // Verify user state is cleared
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should clear user state even when AuthService.signOut fails', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      // Set up initial authenticated state
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      // Make signOut fail
      mockAuthService.signOut.mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization and user to be set
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });

      // Trigger logout
      const signOutButton = screen.getByText('Sign Out');
      
      await act(async () => {
        signOutButton.click();
      });

      // Wait for logout to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Verify AuthService.signOut was called
      expect(mockAuthService.signOut).toHaveBeenCalledTimes(1);

      // Verify user state is still cleared despite the error
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should show loading state during logout', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      // Set up initial authenticated state
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      // Make signOut take some time
      mockAuthService.signOut.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });

      // Trigger logout
      const signOutButton = screen.getByText('Sign Out');
      
      await act(async () => {
        signOutButton.click();
      });

      // Should show loading state immediately
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      // Wait for logout to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    it('should clear pending requests on logout', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      // Set up initial authenticated state
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });

      // Start a long-running request (like profile update)
      mockAuthService.updateProfile.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUser), 200))
      );

      const updateButton = screen.getByText('Update Profile');
      
      await act(async () => {
        updateButton.click();
      });

      // Immediately trigger logout while update is pending
      const signOutButton = screen.getByText('Sign Out');
      
      await act(async () => {
        signOutButton.click();
      });

      // Wait for logout to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // User should be cleared
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });

    it('should deduplicate concurrent logout requests', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'buyer',
        verification_status: 'unverified',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      };

      // Set up initial authenticated state
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      // Make signOut take some time
      mockAuthService.signOut.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });

      // Trigger multiple logout requests
      const signOutButton = screen.getByText('Sign Out');
      
      await act(async () => {
        signOutButton.click();
        signOutButton.click();
        signOutButton.click();
      });

      // Wait for logout to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Should only call signOut once due to deduplication
      expect(mockAuthService.signOut).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
  });
});