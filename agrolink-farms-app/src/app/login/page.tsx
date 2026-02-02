'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading, error: contextError } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await signIn(formData.email, formData.password);
      
      if (result.success && result.user) {
        // Successful login - redirect based on user role
        const redirectPath = getRedirectPath(result.user.role);
        router.push(redirectPath);
      } else if (result.error) {
        // Display user-friendly error message
        setError(result.error.userMessage || result.error.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      // Fallback error handling for unexpected errors
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'buyer':
        return '/buyer/dashboard';
      case 'seller':
        return '/seller/dashboard';
      case 'admin':
        return '/admin';
      default:
        return '/profile';
    }
  };

  // Show context error if available (from auth state changes)
  const displayError = error || (contextError?.userMessage);
  const isFormDisabled = loading || isSubmitting;

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
              Welcome Back
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
              Sign <span className="text-gradient">In</span>
            </h1>
            <p className="text-neutral-600 font-light">
              Continue to your AgroLink Farms account
            </p>
          </div>

          {displayError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm shadow-soft animate-fade-in-scale">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                {displayError}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-neutral-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-modern"
                required
                disabled={isFormDisabled}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-neutral-700">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-modern"
                required
                disabled={isFormDisabled}
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-secondary bg-white border-2 border-neutral-300 rounded focus:ring-secondary focus:ring-2 disabled:opacity-50 transition-all" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isFormDisabled}
                />
                <span className="text-neutral-600 group-hover:text-neutral-800 font-medium">Remember me</span>
              </label>
              <Link 
                href="/auth/reset-password" 
                className="text-secondary hover:text-secondary-dark font-semibold hover:underline transition-all"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isFormDisabled}
              className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing In...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🔐 Sign In
                </span>
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="text-center mt-8 pt-6 border-t border-neutral-200">
            <p className="text-neutral-600 mb-4">
              Don't have an account?
            </p>
            <Link href="/signup" className="btn-secondary w-full">
              <span className="flex items-center justify-center gap-2">
                🌱 Create Account
              </span>
            </Link>
          </div>

          {/* Demo Notice */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent rounded-full px-3 py-1 text-xs font-semibold">
                <span>🚀</span> Demo Credentials
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-green-700 text-sm">Buyer Account</p>
                    <p className="text-green-600 text-xs">buyer@test.com</p>
                  </div>
                  <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded border">
                    password123
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-amber-700 text-sm">Seller Account</p>
                    <p className="text-amber-600 text-xs">seller@test.com</p>
                  </div>
                  <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded border">
                    password123
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
