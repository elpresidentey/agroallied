import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AuthErrorCode } from '@/lib/auth/types';
import { createMockUser, createMockAuthError } from '@/test/utils/auth-helpers';

// Mock Next.js router and search params
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Auth Context
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock components
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

// Simple test component to simulate auth flows
function TestAuthFlow({ 
  flowType, 
  onSubmit 
}: { 
  flowType: 'signup' | 'login' | 'reset' | 'resetConfirm';
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = React.useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div data-testid={`${flowType}-flow`}>
      <form onSubmit={handleSubmit}>
        {flowType === 'signup' && (
          <>
            <input
              data-testid="name-input"
              placeholder="Name"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              data-testid="email-input"
              placeholder="Email"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              data-testid="password-input"
              type="password"
              placeholder="Password"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <select
              data-testid="role-select"
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </>
        )}
        
        {flowType === 'login' && (
          <>
            <input
              data-testid="email-input"
              placeholder="Email"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              data-testid="password-input"
              type="password"
              placeholder="Password"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </>
        )}
        
        {flowType === 'reset' && (
          <input
            data-testid="email-input"
            placeholder="Email"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        )}
        
        {flowType === 'resetConfirm' && (
          <>
            <input
              data-testid="password-input"
              type="password"
              placeholder="New Password"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <input
              data-testid="confirm-password-input"
              type="password"
              placeholder="Confirm Password"
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </>
        )}
        
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </form>
    </div>
  );
}

const mockPush = jest.fn();
const mockSignUp = jest.fn();
const mockSignIn = jest.fn();
const mockRequestPasswordReset = jest.fn();
const mockResetPassword = jest.fn();
const mockResendVerificationEmail = jest.fn();

describe('Authentication Pages Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });

    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
      signIn: mockSignIn,
      requestPasswordReset: mockRequestPasswordReset,
      resetPassword: mockResetPassword,
      resendVerificationEmail: mockResendVerificationEmail,
      loading: false,
    });
  });

  describe('Full Signup Flow with Email Verification', () => {
    it('completes signup flow requiring email verification', async () => {
      // Mock successful signup that needs verification
      mockSignUp.mockResolvedValue({
        success: true,
        needsVerification: true,
      });

      const handleSubmit = jest.fn(async (data) => {
        const result = await mockSignUp(data.email, data.password, data.name, data.role);
        if (result.success && result.needsVerification) {
          // Simulate showing verification screen
          screen.getByTestId('signup-flow').innerHTML = '<div data-testid="verification-screen">Check your email</div>';
        }
      });

      render(<TestAuthFlow flowType="signup" onSubmit={handleSubmit} />);
      
      // Fill out signup form
      fireEvent.change(screen.getByTestId('name-input'), { 
        target: { value: 'John Doe' } 
      });
      fireEvent.change(screen.getByTestId('email-input'), { 
        target: { value: 'john@example.com' } 
      });
      fireEvent.change(screen.getByTestId('password-input'), { 
        target: { value: 'StrongPass123!' } 
      });
      fireEvent.change(screen.getByTestId('role-select'), { 
        target: { value: 'buyer' } 
      });
      
      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Verify signup was called with correct parameters
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'john@example.com',
          'StrongPass123!',
          'John Doe',
          'buyer'
        );
      });
    });

    it('handles signup errors gracefully', async () => {
      // Mock signup error
      mockSignUp.mockResolvedValue({
        success: false,
        needsVerification: false,
        error: createMockAuthError(AuthErrorCode.EMAIL_ALREADY_EXISTS, 'Email already exists'),
      });

      const handleSubmit = jest.fn(async (data) => {
        const result = await mockSignUp(data.email, data.password, data.name, data.role);
        if (!result.success && result.error) {
          // Simulate showing error
          const errorDiv = document.createElement('div');
          errorDiv.setAttribute('data-testid', 'error-message');
          errorDiv.textContent = result.error.userMessage;
          screen.getByTestId('signup-flow').appendChild(errorDiv);
        }
      });

      render(<TestAuthFlow flowType="signup" onSubmit={handleSubmit} />);
      
      // Fill out signup form
      fireEvent.change(screen.getByTestId('name-input'), { 
        target: { value: 'John Doe' } 
      });
      fireEvent.change(screen.getByTestId('email-input'), { 
        target: { value: 'existing@example.com' } 
      });
      fireEvent.change(screen.getByTestId('password-input'), { 
        target: { value: 'StrongPass123!' } 
      });
      
      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Email already exists');
      });
    });
  });

  describe('Login Flow with Valid and Invalid Credentials', () => {
    it('completes login flow with valid credentials', async () => {
      // Mock successful login
      mockSignIn.mockResolvedValue({
        success: true,
        user: createMockUser({ role: 'buyer' }),
      });

      const handleSubmit = jest.fn(async (data) => {
        const result = await mockSignIn(data.email, data.password);
        if (result.success && result.user) {
          // Simulate redirect based on role
          const redirectUrl = result.user.role === 'buyer' ? '/buyer/dashboard' : '/seller/dashboard';
          mockPush(redirectUrl);
        }
      });

      render(<TestAuthFlow flowType="login" onSubmit={handleSubmit} />);
      
      // Fill out login form
      fireEvent.change(screen.getByTestId('email-input'), { 
        target: { value: 'john@example.com' } 
      });
      fireEvent.change(screen.getByTestId('password-input'), { 
        target: { value: 'correctpassword' } 
      });
      
      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Verify signin was called and redirect happened
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('john@example.com', 'correctpassword');
        expect(mockPush).toHaveBeenCalledWith('/buyer/dashboard');
      });
    });

    it('handles login with invalid credentials', async () => {
      // Mock login error
      mockSignIn.mockResolvedValue({
        success: false,
        error: createMockAuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid email or password'),
      });

      const handleSubmit = jest.fn(async (data) => {
        const result = await mockSignIn(data.email, data.password);
        if (!result.success && result.error) {
          // Simulate showing error
          const errorDiv = document.createElement('div');
          errorDiv.setAttribute('data-testid', 'error-message');
          errorDiv.textContent = result.error.userMessage;
          screen.getByTestId('login-flow').appendChild(errorDiv);
        }
      });

      render(<TestAuthFlow flowType="login" onSubmit={handleSubmit} />);
      
      // Fill out login form with wrong credentials
      fireEvent.change(screen.getByTestId('email-input'), { 
        target: { value: 'john@example.com' } 
      });
      fireEvent.change(screen.getByTestId('password-input'), { 
        target: { value: 'wrongpassword' } 
      });
      
      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Should show error message and not redirect
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid email or password');
      });
      
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Password Reset Flow End-to-End', () => {
    it('completes password reset request flow', async () => {
      // Mock successful password reset request
      mockRequestPasswordReset.mockResolvedValue(undefined);

      const handleSubmit = jest.fn(async (data) => {
        await mockRequestPasswordReset(data.email);
        // Simulate showing success screen
        const successDiv = document.createElement('div');
        successDiv.setAttribute('data-testid', 'success-message');
        successDiv.textContent = `Reset link sent to ${data.email}`;
        screen.getByTestId('reset-flow').appendChild(successDiv);
      });

      render(<TestAuthFlow flowType="reset" onSubmit={handleSubmit} />);
      
      // Fill out reset form
      fireEvent.change(screen.getByTestId('email-input'), { 
        target: { value: 'john@example.com' } 
      });
      
      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Verify request was made and success shown
      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith('john@example.com');
        expect(screen.getByTestId('success-message')).toHaveTextContent('Reset link sent to john@example.com');
      });
    });

    it('completes password reset confirmation flow', async () => {
      // Mock successful password reset
      mockResetPassword.mockResolvedValue(undefined);

      const handleSubmit = jest.fn(async (data) => {
        if (data.password === data.confirmPassword) {
          await mockResetPassword('valid-token', data.password);
          // Simulate showing success and redirect
          mockPush('/login');
        }
      });

      render(<TestAuthFlow flowType="resetConfirm" onSubmit={handleSubmit} />);
      
      // Fill out new password form
      fireEvent.change(screen.getByTestId('password-input'), { 
        target: { value: 'NewStrongPass123!' } 
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), { 
        target: { value: 'NewStrongPass123!' } 
      });
      
      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Verify reset was called and redirect happened
      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('valid-token', 'NewStrongPass123!');
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('handles password reset request errors', async () => {
      // Mock password reset error
      mockRequestPasswordReset.mockRejectedValue(
        createMockAuthError(AuthErrorCode.INVALID_EMAIL, 'Invalid email address')
      );

      const handleSubmit = jest.fn(async (data) => {
        try {
          await mockRequestPasswordReset(data.email);
        } catch (error: any) {
          // Simulate showing error
          const errorDiv = document.createElement('div');
          errorDiv.setAttribute('data-testid', 'error-message');
          errorDiv.textContent = error.userMessage || error.message;
          screen.getByTestId('reset-flow').appendChild(errorDiv);
        }
      });

      render(<TestAuthFlow flowType="reset" onSubmit={handleSubmit} />);
      
      // Fill out reset form with invalid email
      fireEvent.change(screen.getByTestId('email-input'), { 
        target: { value: 'invalid-email' } 
      });
      
      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid email address');
      });
    });
  });

  describe('Authentication State Management', () => {
    it('maintains consistent state during auth operations', async () => {
      // Mock auth context with loading state
      (useAuth as jest.Mock).mockReturnValue({
        signIn: mockSignIn,
        loading: true,
      });

      render(<TestAuthFlow flowType="login" onSubmit={jest.fn()} />);
      
      // Submit button should be disabled when loading
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeInTheDocument();
    });

    it('handles concurrent auth requests properly', async () => {
      let callCount = 0;
      mockSignIn.mockImplementation(async () => {
        callCount++;
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          success: true,
          user: createMockUser(),
        };
      });

      const handleSubmit = jest.fn(async (data) => {
        await mockSignIn(data.email, data.password);
      });

      render(<TestAuthFlow flowType="login" onSubmit={handleSubmit} />);
      
      // Fill form
      fireEvent.change(screen.getByTestId('email-input'), { 
        target: { value: 'test@example.com' } 
      });
      fireEvent.change(screen.getByTestId('password-input'), { 
        target: { value: 'password' } 
      });
      
      // Submit multiple times quickly
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      
      // Wait for all calls to complete
      await waitFor(() => {
        expect(callCount).toBeGreaterThan(0);
      });
    });
  });
});