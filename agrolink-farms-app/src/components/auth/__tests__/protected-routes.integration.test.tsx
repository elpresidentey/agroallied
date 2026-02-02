import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createMockUser } from '@/test/utils/auth-helpers';
import type { User } from '@/types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Auth Context
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock components to avoid complex dependencies
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>;
  };
});

jest.mock('@/components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

// Mock API functions
jest.mock('@/lib/api', () => ({
  getBuyerOrders: jest.fn().mockResolvedValue([]),
  getSellerOrders: jest.fn().mockResolvedValue([]),
  getFarmListings: jest.fn().mockResolvedValue([]),
}));

// Mock order updates hook
jest.mock('@/lib/useOrderUpdates', () => ({
  useOrderUpdates: jest.fn().mockReturnValue({ notification: null }),
}));

// Import the actual page components
import BuyerDashboard from '@/app/buyer/dashboard/page';
import SellerDashboard from '@/app/seller/dashboard/page';
import AdminPage from '@/app/admin/page';
import ProfilePage from '@/app/profile/page';
import OrdersPage from '@/app/orders/page';

const mockPush = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Protected Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Route Access with Different User Roles', () => {
    it('allows buyer to access buyer dashboard', async () => {
      const buyerUser = createMockUser({ role: 'buyer' });
      
      mockUseAuth.mockReturnValue({
        user: buyerUser,
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

      render(<BuyerDashboard />);

      // Should render buyer dashboard content
      await waitFor(() => {
        expect(screen.getByText(/Welcome.*Test User/)).toBeInTheDocument();
        expect(screen.getByText('Track your livestock purchases and manage orders')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('allows seller to access seller dashboard', async () => {
      const sellerUser = createMockUser({ role: 'seller' });
      
      mockUseAuth.mockReturnValue({
        user: sellerUser,
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

      render(<SellerDashboard />);

      // Should render seller dashboard content
      await waitFor(() => {
        expect(screen.getByText('Seller Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Manage your farm and livestock listings')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('allows admin to access admin dashboard', async () => {
      const adminUser = createMockUser({ role: 'admin' });
      
      mockUseAuth.mockReturnValue({
        user: adminUser,
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

      render(<AdminPage />);

      // Should render admin dashboard content
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Manage platform content and verify sellers')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('allows any authenticated user to access profile page', async () => {
      const buyerUser = createMockUser({ role: 'buyer', name: 'John Doe' });
      
      mockUseAuth.mockReturnValue({
        user: buyerUser,
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

      render(<ProfilePage />);

      // Should render profile content
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Account Information')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('allows any authenticated user to access orders page', async () => {
      const buyerUser = createMockUser({ role: 'buyer' });
      
      mockUseAuth.mockReturnValue({
        user: buyerUser,
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

      render(<OrdersPage />);

      // Should render orders content
      await waitFor(() => {
        expect(screen.getByText('My Orders')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Redirect Behavior for Unauthenticated Users', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        initializing: false,
        isAuthenticated: false,
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
    });

    it('redirects unauthenticated user from buyer dashboard to login', async () => {
      render(<BuyerDashboard />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Should show loading state while redirecting
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('redirects unauthenticated user from seller dashboard to login', async () => {
      render(<SellerDashboard />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Should show loading state while redirecting
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('redirects unauthenticated user from admin page to login', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Should show loading state while redirecting
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('redirects unauthenticated user from profile page to login', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Should show loading state while redirecting
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('redirects unauthenticated user from orders page to login', async () => {
      render(<OrdersPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Should show loading state while redirecting
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Access Denied for Insufficient Permissions', () => {
    it('shows custom loading fallback when buyer tries to access seller dashboard', async () => {
      const buyerUser = createMockUser({ role: 'buyer' });
      
      mockUseAuth.mockReturnValue({
        user: buyerUser,
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

      render(<SellerDashboard />);

      // Should show custom loading fallback (seller dashboard has custom fallback)
      await waitFor(() => {
        expect(screen.getByText('Loading seller dashboard...')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows access denied when seller tries to access buyer dashboard', async () => {
      const sellerUser = createMockUser({ role: 'seller' });
      
      mockUseAuth.mockReturnValue({
        user: sellerUser,
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

      render(<BuyerDashboard />);

      // Should show access denied message
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
        expect(screen.getByText('Required role: buyer, Your role: seller')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows access denied when non-admin tries to access admin dashboard', async () => {
      const buyerUser = createMockUser({ role: 'buyer' });
      
      mockUseAuth.mockReturnValue({
        user: buyerUser,
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

      render(<AdminPage />);

      // Should show custom access denied fallback
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText(/You don't have permission to access the admin dashboard/)).toBeInTheDocument();
        expect(screen.getByText(/This area is restricted to administrators only/)).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows access denied when admin tries to access buyer dashboard', async () => {
      const adminUser = createMockUser({ role: 'admin' });
      
      mockUseAuth.mockReturnValue({
        user: adminUser,
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

      // Test admin accessing buyer dashboard
      render(<BuyerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
        expect(screen.getByText('Required role: buyer, Your role: admin')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('shows loading state while initializing auth', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        initializing: true,
        isAuthenticated: false,
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

      render(<BuyerDashboard />);

      // Should show loading spinner
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      // Should not redirect while initializing
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows loading state while auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        initializing: false,
        isAuthenticated: false,
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

      render(<SellerDashboard />);

      // Should show loading spinner
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      // Should not redirect while loading
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows custom loading fallback for seller dashboard', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        initializing: false,
        isAuthenticated: false,
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

      render(<SellerDashboard />);

      // Should show loading spinner (not custom message)
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles null user gracefully in profile page', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        initializing: false,
        isAuthenticated: false,
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

      render(<ProfilePage />);

      // Should redirect to login instead of crashing
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('handles user with unverified status', async () => {
      const unverifiedUser = createMockUser({ 
        role: 'seller',
        verification_status: 'pending'
      });
      
      mockUseAuth.mockReturnValue({
        user: unverifiedUser,
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

      render(<SellerDashboard />);

      // Should still allow access (verification status doesn't affect route access)
      await waitFor(() => {
        expect(screen.getByText('Seller Dashboard')).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});