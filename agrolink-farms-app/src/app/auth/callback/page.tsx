'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing email confirmation...');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the token from the URL
        const code = searchParams.get('code');
        const error_code = searchParams.get('error');
        const error_description = searchParams.get('error_description');

        if (error_code) {
          setError(`${error_code}: ${error_description || 'Unknown error'}`);
          return;
        }

        if (code) {
          // Exchange code for session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }

          setStatus('Email verified successfully! Redirecting...');
          
          // Wait a moment then redirect to profile
          setTimeout(() => {
            router.push('/profile');
          }, 1500);
        } else {
          // Handle the implicit flow (older Supabase versions)
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }

          if (data.session) {
            setStatus('Email verified successfully! Redirecting...');
            setTimeout(() => {
              router.push('/profile');
            }, 1500);
          } else {
            setError('No session found. Please sign up again.');
          }
        }
      } catch (err) {
        console.error('Email confirmation error:', err);
        setError(err instanceof Error ? err.message : 'Email confirmation failed');
      }
    };

    handleCallback();
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
