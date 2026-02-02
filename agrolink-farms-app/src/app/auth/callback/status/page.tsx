'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if there's an error parameter from the route handler
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    if (errorParam) {
      setError(errorParam);
      return;
    }
    
    // Handle different message types
    if (messageParam) {
      switch (messageParam) {
        case 'profile_setup_needed':
          setStatus('Setting up your profile...');
          break;
        case 'verification_pending':
          setStatus('Email verified! Waiting for admin approval...');
          break;
        case 'role_setup_needed':
          setStatus('Please complete your profile setup...');
          break;
        case 'redirect_error':
          setStatus('Authentication completed, but there was an issue with redirection...');
          break;
        default:
          setStatus('Authentication completed! Redirecting...');
      }
    } else {
      // If no error or message, the route handler should have already processed the callback
      // and redirected the user. If we reach here, something went wrong.
      setStatus('Authentication completed! Redirecting...');
    }
    
    // Fallback redirect after a short delay
    const timer = setTimeout(() => {
      router.push('/profile');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {error ? (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Confirmation Failed</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/signup')}
                className="w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-secondary-light transition-colors"
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4 animate-spin">⚙️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifying Email</h1>
              <p className="text-gray-600">{status}</p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
