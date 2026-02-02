'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

export default function SignupPage() {
  const router = useRouter();
  const { signUp, loading, resendVerificationEmail } = useAuth();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer' as 'buyer' | 'seller',
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false
  });
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

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

  // Rate limit countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (rateLimitCountdown > 0) {
      interval = setInterval(() => {
        setRateLimitCountdown((prev) => {
          if (prev <= 1) {
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rateLimitCountdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Update password strength when password changes
    if (name === 'password') {
      setPasswordStrength(validatePasswordStrength(value));
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) return;
    
    setIsResendingVerification(true);
    setError('');
    
    try {
      await resendVerificationEmail(formData.email);
      // Show success message briefly
      setError('');
    } catch (err: any) {
      if (err?.userMessage) {
        setError(err.userMessage);
      } else {
        setError('Failed to resend verification email. Please try again.');
      }
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation - check required fields first
    if (!formData.name.trim() || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordStrength.isValid) {
      setError('Password does not meet strength requirements');
      return;
    }

    try {
      const result = await signUp(formData.email, formData.password, formData.name.trim(), formData.role);

      if (result.success) {
        if (result.needsVerification) {
          setNeedsVerification(true);
          setIsSuccess(true);
        } else {
          // Redirect based on role
          const redirectPath = formData.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard';
          router.push(redirectPath);
        }
      } else if (result.error) {
        // Handle specific error types
        if (result.error.code === AuthErrorCode.SIGNUP_COOLDOWN && result.error.retryAfter) {
          setRateLimitCountdown(Math.ceil(result.error.retryAfter / 1000));
        }
        setError(result.error.userMessage);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMsg = err?.userMessage || err?.message || 'Signup failed. Please try again.';
      setError(errorMsg);
    }
  };

  // Enhanced verification email success screen
  if (isSuccess && needsVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white flex flex-col relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        </div>

        <Header />
        <main className="flex-1 max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full relative z-10">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center animate-fade-in-scale">
            <div className="w-20 h-20 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
              <span className="text-4xl">📧</span>
            </div>
            
            <div className="space-y-4 mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900">
                Check your <span className="text-gradient">email</span>
              </h1>
              <p className="text-neutral-600 font-light">
                We've sent a verification link to
              </p>
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <p className="font-semibold text-green-700 text-sm">{formData.email}</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-xs">1</span>
                  </div>
                  <p className="text-sm text-gray-700">Check your email inbox (and spam folder)</p>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-xs">2</span>
                  </div>
                  <p className="text-sm text-gray-700">Click the verification link in the email</p>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-xs">3</span>
                  </div>
                  <p className="text-sm text-gray-700">Complete your signup process</p>
                </div>
                {formData.role === 'seller' && (
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-6 h-6 bg-amber-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 font-bold text-xs">4</span>
                    </div>
                    <p className="text-sm text-gray-700">Wait for admin approval to start selling</p>
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm shadow-soft animate-fade-in-scale">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">⚠️</span>
                  {error}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isResendingVerification ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    📧 Resend verification email
                  </span>
                )}
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="w-full btn-ghost"
              >
                <span className="flex items-center justify-center gap-2">
                  🏠 Go to Homepage
                </span>
              </button>
              
              <div className="pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-600">
                  Already verified?{' '}
                  <Link href="/login" className="text-secondary font-semibold hover:text-secondary-dark hover:underline transition-all">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white flex flex-col relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/3 rounded-full blur-3xl"></div>
      </div>

      <Header />

      <main className="flex-1 max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full relative z-10">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 animate-fade-in-scale">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-secondary/20 rounded-full px-4 py-2 text-sm font-medium text-secondary shadow-soft mb-6">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse-soft"></div>
              Join AgroLink
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
              Create <span className="text-gradient">Account</span>
            </h1>
            <p className="text-neutral-600 font-light">
              Start trading livestock with verified farms
            </p>
          </div>

          {/* Error display with rate limiting countdown */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm shadow-soft animate-fade-in-scale">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <div>
                  {error}
                  {rateLimitCountdown > 0 && (
                    <div className="mt-2 text-xs">
                      You can try again in {rateLimitCountdown} second{rateLimitCountdown !== 1 ? 's' : ''}.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-neutral-700">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="input-modern"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-modern"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-semibold text-neutral-700">Account Type</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-modern"
              >
                <option value="buyer">🛒 Buyer (Purchase livestock)</option>
                <option value="seller">🏡 Seller (Sell livestock)</option>
              </select>
            </div>

            {/* Password with strength validation */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-700">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-modern"
              />
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-neutral-200 rounded-full h-2">
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
                    <span className={`text-xs font-semibold ${
                      passwordStrength.isValid ? 'text-green-600' : 'text-neutral-500'
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
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Password should include:</p>
                      <ul className="space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index} className="flex items-center space-x-2 text-xs text-gray-600">
                            <span className="text-red-400 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {passwordStrength.isValid && (
                    <div className="flex items-center space-x-2 text-xs text-green-600">
                      <span className="font-bold">✓</span>
                      <span className="font-medium">Password meets requirements</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-700">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-modern"
              />
            </div>

            {/* Submit button with rate limiting */}
            <button
              type="submit"
              disabled={loading || rateLimitCountdown > 0}
              className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </span>
              ) : rateLimitCountdown > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  ⏳ Wait {rateLimitCountdown}s
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🚀 Create Account
                </span>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-8 pt-6 border-t border-neutral-200">
            <p className="text-neutral-600 mb-4">
              Already have an account?
            </p>
            <Link href="/login" className="btn-secondary w-full">
              <span className="flex items-center justify-center gap-2">
                🔐 Sign In
              </span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
