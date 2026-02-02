'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AuthErrorCode } from '@/lib/auth/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

function ResetPasswordConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, loading } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false
  });

  // Extract token from URL parameters
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const tokenType = searchParams.get('token_type');
    const type = searchParams.get('type');
    
    // Check if this is a password reset callback
    if (type === 'recovery' && accessToken) {
      setToken(accessToken);
    } else {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [searchParams]);

  // Password strength validation
  const validatePasswordStrength = useCallback((password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include uppercase letters');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include numbers');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include special characters');
    }

    const isValid = score >= 3 && password.length >= 8;

    return {
      score,
      feedback,
      isValid
    };
  }, []);

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      setPasswordStrength(validatePasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, feedback: [], isValid: false });
    }
  }, [password, validatePasswordStrength]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validation
    if (!password || !confirmPassword) {
      setError('Both password fields are required');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (!passwordStrength.isValid) {
      setError('Password does not meet strength requirements');
      setIsSubmitting(false);
      return;
    }

    if (!token) {
      setError('Invalid reset token. Please request a new password reset link.');
      setIsSubmitting(false);
      return;
    }

    try {
      await resetPassword(token, password);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Handle specific error types
      if (err?.code === AuthErrorCode.INVALID_RESET_TOKEN || err?.code === AuthErrorCode.RESET_TOKEN_EXPIRED) {
        setError('This reset link has expired or is invalid. Please request a new password reset link.');
      } else {
        const errorMsg = err?.userMessage || err?.message || 'Failed to reset password. Please try again.';
        setError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="card text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Reset Complete</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-secondary-light transition-colors"
            >
              Sign In Now
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Invalid token screen
  if (!token && error.includes('Invalid or missing reset token')) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="card text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            
            <div className="space-y-3">
              <Link
                href="/auth/reset-password"
                className="block w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-secondary-light transition-colors text-center"
              >
                Request New Reset Link
              </Link>
              
              <Link
                href="/login"
                className="block w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h1>
          <p className="text-gray-600 mb-6">
            Enter your new password below. Make sure it's strong and secure.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password with strength validation */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={loading || isSubmitting}
              />
              
              {/* Password strength indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score <= 1
                            ? 'bg-red-500 w-1/5'
                            : passwordStrength.score <= 2
                            ? 'bg-orange-500 w-2/5'
                            : passwordStrength.score <= 3
                            ? 'bg-yellow-500 w-3/5'
                            : passwordStrength.score <= 4
                            ? 'bg-blue-500 w-4/5'
                            : 'bg-green-500 w-full'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.isValid ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {passwordStrength.score <= 1
                        ? 'Weak'
                        : passwordStrength.score <= 2
                        ? 'Fair'
                        : passwordStrength.score <= 3
                        ? 'Good'
                        : passwordStrength.score <= 4
                        ? 'Strong'
                        : 'Very Strong'
                      }
                    </span>
                  </div>
                  
                  {/* Password requirements */}
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <p className="mb-1">Password should include:</p>
                      <ul className="space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index} className="flex items-center space-x-1">
                            <span className="text-red-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {passwordStrength.isValid && (
                    <div className="text-xs text-green-600 flex items-center space-x-1">
                      <span>✓</span>
                      <span>Password meets requirements</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={loading || isSubmitting}
              />
              
              {/* Password match indicator */}
              {confirmPassword && (
                <div className="mt-1">
                  {password === confirmPassword ? (
                    <div className="text-xs text-green-600 flex items-center space-x-1">
                      <span>✓</span>
                      <span>Passwords match</span>
                    </div>
                  ) : (
                    <div className="text-xs text-red-600 flex items-center space-x-1">
                      <span>✗</span>
                      <span>Passwords do not match</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || isSubmitting || !passwordStrength.isValid || password !== confirmPassword}
              className="w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-secondary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating Password...
                </span>
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="text-center mt-6">
            <Link 
              href="/login" 
              className="text-secondary hover:text-secondary-light transition-colors font-medium"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <ResetPasswordConfirmContent />
    </Suspense>
  );
}