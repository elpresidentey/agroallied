'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { UserRole } from '@/types';

/**
 * Props for the ProtectedRoute component
 */
interface ProtectedRouteProps {
  /** Content to render when access is granted */
  children: ReactNode;
  /** Required user role for access (optional - if not specified, only authentication is required) */
  requiredRole?: UserRole;
  /** Custom content to show while checking authentication or when access is denied */
  fallback?: ReactNode;
  /** Path to redirect unauthenticated users to (defaults to '/login') */
  redirectTo?: string;
}

/**
 * ProtectedRoute component provides role-based access control for React components.
 * 
 * This component wraps content that should only be accessible to authenticated users
 * and optionally users with specific roles. It handles:
 * - Authentication checking with loading states
 * - Role-based access control
 * - Automatic redirection for unauthenticated users
 * - Access denied display for insufficient permissions
 * 
 * @example
 * // Basic authentication required
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Role-based access control
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * @example
 * // Custom fallback and redirect
 * <ProtectedRoute
 *   requiredRole="seller"
 *   fallback={<AccessDenied />}
 *   redirectTo="/custom-login"
 * >
 *   <SellerDashboard />
 * </ProtectedRoute>
 * 
 * @param props - Component props
 * @returns Protected content or loading/access denied UI
 */
export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, loading, initializing, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still initializing or loading
    if (initializing || loading) {
      return;
    }

    // Redirect unauthenticated users to login
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check role-based access if required role is specified
    if (requiredRole && user && user.role !== requiredRole) {
      // User is authenticated but doesn't have the required role
      // Don't redirect, just show access denied (handled by fallback)
      return;
    }
  }, [user, loading, initializing, isAuthenticated, requiredRole, router, redirectTo]);

  // Show loading state while initializing or loading
  if (initializing || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" role="status" aria-label="Loading"></div>
      </div>
    );
  }

  // Redirect unauthenticated users (handled by useEffect, but show loading while redirecting)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" role="status" aria-label="Loading"></div>
      </div>
    );
  }

  // Show access denied for authenticated users with insufficient permissions
  if (requiredRole && user && user.role !== requiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required role: {requiredRole}, Your role: {user.role}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated and has the required role (or no role required)
  return <>{children}</>;
}