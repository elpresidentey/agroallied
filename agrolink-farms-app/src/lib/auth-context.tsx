'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: 'buyer' | 'seller') => Promise<{ success: boolean; needsVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rate limiting for signup - prevent rapid requests
let lastSignupTime = 0;
const SIGNUP_COOLDOWN_MS = 5000; // 5 second cooldown between attempts

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          // Fetch user profile from database
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (profile) {
            setUser(profile as User);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser(profile as User);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, role: 'buyer' | 'seller') => {
    // Check rate limiting
    const now = Date.now();
    if (now - lastSignupTime < SIGNUP_COOLDOWN_MS) {
      const waitTime = Math.ceil((SIGNUP_COOLDOWN_MS - (now - lastSignupTime)) / 1000);
      throw new Error(`Please wait ${waitTime} seconds before trying again`);
    }

    setLoading(true);
    try {
      lastSignupTime = Date.now();

      // Sign up with Supabase Auth including metadata for the trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback`,
        },
      });

      if (authError) {
        // Handle rate limit error specifically
        if (authError.status === 429) {
          throw new Error('Too many signup attempts. Please wait a few minutes before trying again.');
        }
        console.error('Auth error - full object:', authError);
        console.error('Auth error details:', { 
          status: authError.status, 
          message: authError.message,
          code: (authError as any).code,
          name: authError.name
        });
        throw new Error(authError.message || JSON.stringify(authError) || 'Signup failed');
      }
      if (!authData.user) throw new Error('Signup failed');

      // Check if profile already exists (might have been created by trigger)
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (existingProfile) {
        setUser(existingProfile as User);
        return { success: true, needsVerification: !authData.session };
      }

      // Create user profile in database manually if trigger didn't run (fallback)
      const { data: newUser, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          role,
          verification_status: role === 'seller' ? 'pending' : 'unverified',
        })
        .select()
        .single();

      if (dbError) {
        // If we get an RLS error here, it might be because email confirmation is on
        // and the user is not yet authorized to insert. This is fine if the trigger exists.
        console.warn('Manual profile creation failed or restricted by RLS:', dbError.message);

        // If we don't have a session (email confirmation required)
        if (!authData.session) {
          return { success: true, needsVerification: true };
        }
      } else {
        setUser(newUser as User);
      }

      return { success: true, needsVerification: !authData.session };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // User data will be fetched via auth state listener
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
