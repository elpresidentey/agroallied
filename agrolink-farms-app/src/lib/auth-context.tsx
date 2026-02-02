'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { createBrowserClient } from './supabase/client';
import { authService, SignUpParams, SignUpResult, SignInResult } from './auth/auth-service';
import { AuthError as AuthErrorInterface, AuthErrorCode } from './auth/types';
import type { User } from '@/types';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

/**
 * Authentication context type definition
 * Provides authentication state and methods to React components
 */
interface AuthContextType {
  /** Current authenticated user or null if not authenticated */
  user: User | null;
  /** True during auth operations (sign in, sign up, etc.) */
  loading: boolean;
  /** True during initial session restoration on app startup */
  initializing: boolean;
  /** Register a new user account */
  signUp: (email: string, password: string, name: string, role: 'buyer' | 'seller') => Promise<SignUpResult>;
  /** Sign in an existing user */
  signIn: (email: string, password: string) => Promise<SignInResult>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Send password reset email to user */
  requestPasswordReset: (email: string) => Promise<void>;
  /** Reset password using token from email */
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  /** Resend email verification to user */
  resendVerificationEmail: (email: string) => Promise<void>;
  /** Update current user's profile */
  updateProfile: (updates: Partial<User>) => Promise<User>;
  /** Refresh current user data from server */
  refreshUser: () => Promise<void>;
  /** True if user is authenticated */
  isAuthenticated: boolean;
  /** Current error state or null */
  error: AuthErrorInterface | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component provides authentication context to the entire application.
 * 
 * This component manages authentication state, handles session restoration,
 * and provides authentication methods to child components through React context.
 * 
 * Features:
 * - Automatic session restoration on app startup
 * - Request deduplication to prevent concurrent auth operations
 * - Auth state change listening with Supabase
 * - Consistent error handling across all auth operations
 * - Loading states for better UX
 * 
 * @example
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourAppComponents />
 *     </AuthProvider>
 *   )
 * }
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap with auth context
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<AuthErrorInterface | null>(null);
  
  // Request deduplication and abort control
  const pendingRequests = useRef<Map<string, Promise<any>>>(new Map());
  const authStateListenerRef = useRef<{ subscription: { unsubscribe: () => void } } | null>(null);
  const supabaseClient = useRef(createBrowserClient());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Deduplicated request helper
  const deduplicateRequest = useCallback(<T,>(key: string, requestFn: () => Promise<T>): Promise<T> => {
    const existingRequest = pendingRequests.current.get(key);
    if (existingRequest) {
      return existingRequest;
    }

    const newRequest = requestFn().finally(() => {
      pendingRequests.current.delete(key);
    });

    pendingRequests.current.set(key, newRequest);
    return newRequest;
  }, []);

  // Session restoration on mount
  const restoreSession = useCallback(async () => {
    return deduplicateRequest('restoreSession', async () => {
      try {
        setInitializing(true);
        setError(null);
        
        // Create a new abort controller for this session restoration
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        
        // First try to restore from cookies, then get current user
        const currentUser = await authService.getCurrentUser();
        
        // Check if operation was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }
        
        setUser(currentUser);
      } catch (err) {
        // Ignore AbortError as it's expected when component unmounts
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        console.error('Session restoration error:', err);
        setUser(null);
        // Don't set error state for session restoration failures
        // as this is expected when user is not authenticated
      } finally {
        // Only update state if not aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setInitializing(false);
        }
      }
    });
  }, [deduplicateRequest]);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(async (event: AuthChangeEvent, session: Session | null) => {
    return deduplicateRequest(`authStateChange-${event}`, async () => {
      try {
        setError(null);
        
        // Check if we have an active abort controller and if it's aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }
        
        if (session?.user) {
          // User signed in or token refreshed
          const currentUser = await authService.getCurrentUser();
          
          // Check again after async operation
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }
          
          setUser(currentUser);
        } else {
          // User signed out or session expired
          setUser(null);
        }
      } catch (err) {
        // Ignore AbortError as it's expected when component unmounts
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        console.error('Auth state change error:', err);
        setUser(null);
        // Don't set error state for auth state change failures
        // as this can happen during normal sign out flows
      } finally {
        // Only update loading state if not aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
          if (initializing) {
            setInitializing(false);
          }
        }
      }
    });
  }, [deduplicateRequest, initializing]);

  // Set up auth state listener and session restoration
  useEffect(() => {
    // Restore session on mount
    restoreSession();

    // Set up auth state listener
    const { data: listener } = supabaseClient.current.auth.onAuthStateChange(handleAuthStateChange);
    authStateListenerRef.current = listener;

    return () => {
      // Abort any ongoing operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Clean up listener
      if (authStateListenerRef.current) {
        authStateListenerRef.current.subscription.unsubscribe();
        authStateListenerRef.current = null;
      }
      
      // Clear pending requests
      pendingRequests.current.clear();
    };
  }, [restoreSession, handleAuthStateChange]);

  // Auth methods using AuthService
  const signUp = useCallback(async (email: string, password: string, name: string, role: 'buyer' | 'seller'): Promise<SignUpResult> => {
    return deduplicateRequest(`signUp-${email}`, async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params: SignUpParams = { email, password, name, role };
        const result = await authService.signUp(params);
        
        if (result.error) {
          setError(result.error);
        }
        
        if (result.user) {
          setUser(result.user);
        }
        
        return result;
      } catch (err) {
        console.error('SignUp error:', err);
        const authError: AuthErrorInterface = {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: err instanceof Error ? err.message : 'Unknown error occurred',
          userMessage: 'An unexpected error occurred during signup. Please try again.',
          retryable: true
        };
        const errorResult: SignUpResult = {
          success: false,
          needsVerification: false,
          error: authError
        };
        setError(authError);
        return errorResult;
      } finally {
        setLoading(false);
      }
    });
  }, [deduplicateRequest]);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    return deduplicateRequest(`signIn-${email}`, async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await authService.signIn(email, password);
        
        if (result.error) {
          setError(result.error);
        }
        
        if (result.user) {
          setUser(result.user);
        }
        
        return result;
      } catch (err) {
        console.error('SignIn error:', err);
        const authError: AuthErrorInterface = {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: err instanceof Error ? err.message : 'Unknown error occurred',
          userMessage: 'An unexpected error occurred during signin. Please try again.',
          retryable: true
        };
        const errorResult: SignInResult = {
          success: false,
          error: authError
        };
        setError(authError);
        return errorResult;
      } finally {
        setLoading(false);
      }
    });
  }, [deduplicateRequest]);

  const signOut = useCallback(async (): Promise<void> => {
    return deduplicateRequest('signOut', async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Call AuthService.signOut() to revoke tokens and clear session data
        await authService.signOut();
      } catch (err) {
        console.error('SignOut error:', err);
        // Handle logout errors gracefully - log but don't prevent local cleanup
        // We want to ensure the user is logged out locally even if server signout fails
      } finally {
        // Always clear local auth state regardless of server response
        // This ensures the UI is reset to unauthenticated state
        setUser(null);
        setError(null);
        setLoading(false);
        
        // Clear any pending requests to prevent stale operations
        pendingRequests.current.clear();
      }
    });
  }, [deduplicateRequest]);

  const requestPasswordReset = useCallback(async (email: string): Promise<void> => {
    return deduplicateRequest(`passwordReset-${email}`, async () => {
      setLoading(true);
      setError(null);
      
      try {
        await authService.requestPasswordReset(email);
      } catch (err) {
        console.error('Password reset request error:', err);
        if (err && typeof err === 'object' && 'code' in err) {
          setError(err as AuthErrorInterface);
        } else {
          setError({
            code: AuthErrorCode.UNKNOWN_ERROR,
            message: err instanceof Error ? err.message : 'Unknown error occurred',
            userMessage: 'Failed to send password reset email. Please try again.',
            retryable: true
          });
        }
        throw err;
      } finally {
        setLoading(false);
      }
    });
  }, [deduplicateRequest]);

  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<void> => {
    return deduplicateRequest(`resetPassword-${token}`, async () => {
      setLoading(true);
      setError(null);
      
      try {
        await authService.resetPassword(token, newPassword);
        // After password reset, user needs to sign in again
        setUser(null);
      } catch (err) {
        console.error('Password reset error:', err);
        if (err && typeof err === 'object' && 'code' in err) {
          setError(err as AuthErrorInterface);
        } else {
          setError({
            code: AuthErrorCode.UNKNOWN_ERROR,
            message: err instanceof Error ? err.message : 'Unknown error occurred',
            userMessage: 'Failed to reset password. Please try again.',
            retryable: true
          });
        }
        throw err;
      } finally {
        setLoading(false);
      }
    });
  }, [deduplicateRequest]);

  const resendVerificationEmail = useCallback(async (email: string): Promise<void> => {
    return deduplicateRequest(`resendVerification-${email}`, async () => {
      setLoading(true);
      setError(null);
      
      try {
        await authService.resendVerificationEmail(email);
      } catch (err) {
        console.error('Resend verification error:', err);
        if (err && typeof err === 'object' && 'code' in err) {
          setError(err as AuthErrorInterface);
        } else {
          setError({
            code: AuthErrorCode.UNKNOWN_ERROR,
            message: err instanceof Error ? err.message : 'Unknown error occurred',
            userMessage: 'Failed to resend verification email. Please try again.',
            retryable: true
          });
        }
        throw err;
      } finally {
        setLoading(false);
      }
    });
  }, [deduplicateRequest]);

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<User> => {
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    return deduplicateRequest(`updateProfile-${user.id}`, async () => {
      setLoading(true);
      setError(null);
      
      try {
        const updatedUser = await authService.updateProfile(user.id, updates);
        setUser(updatedUser);
        return updatedUser;
      } catch (err) {
        console.error('Update profile error:', err);
        if (err && typeof err === 'object' && 'code' in err) {
          setError(err as AuthErrorInterface);
        } else {
          setError({
            code: AuthErrorCode.UNKNOWN_ERROR,
            message: err instanceof Error ? err.message : 'Unknown error occurred',
            userMessage: 'Failed to update profile. Please try again.',
            retryable: true
          });
        }
        throw err;
      } finally {
        setLoading(false);
      }
    });
  }, [user, deduplicateRequest]);

  const refreshUser = useCallback(async (): Promise<void> => {
    return deduplicateRequest('refreshUser', async () => {
      setError(null);
      
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Refresh user error:', err);
        // Don't set error state for refresh failures
        // as this might be called frequently
      }
    });
  }, [deduplicateRequest]);

  return (
    <AuthContext.Provider
      value={{
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
        isAuthenticated: !!user,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 * 
 * This hook provides access to authentication state and methods.
 * Must be used within an AuthProvider component.
 * 
 * @example
 * function MyComponent() {
 *   const { user, signIn, signOut, loading } = useAuth()
 *   
 *   if (loading) return <div>Loading...</div>
 *   
 *   return user ? (
 *     <div>Welcome {user.name}! <button onClick={signOut}>Sign Out</button></div>
 *   ) : (
 *     <button onClick={() => signIn(email, password)}>Sign In</button>
 *   )
 * }
 * 
 * @returns Authentication context object
 * @throws Error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}