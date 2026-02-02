import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SignupPage from '../page';
import { useAuth } from '@/lib/auth-context';
import { AuthErrorCode } from '@/lib/auth/types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
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

const mockPush = jest.fn();
const mockSignUp = jest.fn();
const mockResendVerificationEmail = jest.fn();

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
      resendVerificationEmail: mockResendVerificationEmail,
      loading: false,
    });
  });

  it('renders signup form correctly', () => {
    render(<SignupPage />);
    
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Type')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('shows password strength validation', async () => {
    render(<SignupPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    
    // Type a weak password
    fireEvent.change(passwordInput, { target: { value: '123' } });
    
    await waitFor(() => {
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });
    
    // Type a stronger password
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    
    await waitFor(() => {
      expect(screen.getByText('Password meets requirements')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<SignupPage />);
    
    // Fill only some fields to trigger our custom validation
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    // Leave email, password, and confirmPassword empty
    
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('All fields are required')).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    render(<SignupPage />);
    
    // Fill form with mismatched passwords
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'DifferentPass123!' } });
    
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('handles successful signup with verification needed', async () => {
    mockSignUp.mockResolvedValue({
      success: true,
      needsVerification: true,
    });

    render(<SignupPage />);
    
    // Fill form correctly
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'StrongPass123!' } });
    
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
      expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
    });
  });

  it('handles successful signup without verification', async () => {
    mockSignUp.mockResolvedValue({
      success: true,
      needsVerification: false,
    });

    render(<SignupPage />);
    
    // Fill form correctly
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'StrongPass123!' } });
    
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/buyer/dashboard');
    });
  });

  it('handles rate limiting error with countdown', async () => {
    mockSignUp.mockResolvedValue({
      success: false,
      error: {
        code: AuthErrorCode.SIGNUP_COOLDOWN,
        userMessage: 'Please wait 5 seconds before trying again.',
        retryAfter: 5000,
        retryable: true,
        message: 'Rate limited'
      },
    });

    render(<SignupPage />);
    
    // Fill form correctly
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'StrongPass123!' } });
    
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please wait 5 seconds before trying again.')).toBeInTheDocument();
      expect(screen.getByText(/You can try again in \d+ second/)).toBeInTheDocument();
    });
  });

  it('validates password strength requirements', async () => {
    render(<SignupPage />);
    
    // Fill form with weak password
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: '123' } });
    
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Password does not meet strength requirements')).toBeInTheDocument();
    });
  });

  it('disables submit button during rate limiting', async () => {
    mockSignUp.mockResolvedValue({
      success: false,
      error: {
        code: AuthErrorCode.SIGNUP_COOLDOWN,
        userMessage: 'Please wait 5 seconds before trying again.',
        retryAfter: 5000,
        retryable: true,
        message: 'Rate limited'
      },
    });

    render(<SignupPage />);
    
    // Fill form correctly
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'StrongPass123!' } });
    
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please wait 5 seconds before trying again.')).toBeInTheDocument();
    });

    // Button should be disabled during countdown
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('allows resending verification email', async () => {
    mockSignUp.mockResolvedValue({
      success: true,
      needsVerification: true,
    });

    render(<SignupPage />);
    
    // Fill form and submit to get to verification screen
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'StrongPass123!' } });
    
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
    
    // Click resend button
    const resendButton = screen.getByRole('button', { name: 'Resend verification email' });
    fireEvent.click(resendButton);
    
    await waitFor(() => {
      expect(mockResendVerificationEmail).toHaveBeenCalledWith('john@example.com');
    });
  });
});