'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ResetPasswordPage() {
  const { requestPasswordReset, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email.trim()) {
      setError('Email address is required');
      setIsSubmitting(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      await requestPasswordReset(email.trim());
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Password reset request error:', err);
      const errorMsg = err?.userMessage || err?.message || 'Failed to send reset email. Please try again.';
      setError(errorMsg);
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
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <span className="font-bold text-gray-900">{email}</span>.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Next steps:</strong>
              </p>
              <ol className="text-sm text-blue-700 text-left space-y-1">
                <li>1. Check your email inbox (and spam folder)</li>
                <li>2. Click the reset link in the email</li>
                <li>3. Enter your new password</li>
                <li>4. Sign in with your new password</li>
              </ol>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Send another reset email
              </button>
              
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600 mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={loading || isSubmitting}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-secondary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending Reset Link...
                </span>
              ) : (
                'Send Reset Link'
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

          {/* Help text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Didn't receive the email? Check your spam folder or try again with a different email address.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}