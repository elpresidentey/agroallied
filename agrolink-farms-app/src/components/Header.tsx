'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function Header() {
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setShowMenu(false);
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="glass sticky top-0 z-50 border-b border-neutral-200/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 gradient-secondary rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-medium transform group-hover:scale-105">
            <span className="text-white font-bold text-xl">🌱</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-2xl text-neutral-800">AgroLink</span>
            <div className="text-xs text-neutral-500 font-medium -mt-1">Farms</div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            href="/animals" 
            className="text-neutral-600 hover:text-secondary font-medium relative group"
          >
            Browse Animals
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </Link>
          <Link 
            href="/farms" 
            className="text-neutral-600 hover:text-secondary font-medium relative group"
          >
            Browse Farms
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
          </Link>
          {isAuthenticated && user?.role === 'seller' && (
            <Link 
              href="/seller/dashboard" 
              className="text-neutral-600 hover:text-secondary font-medium relative group"
            >
              Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </Link>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <Link 
              href="/admin" 
              className="text-neutral-600 hover:text-secondary font-medium relative group"
            >
              Admin
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full"></span>
            </Link>
          )}
        </div>

        {/* Auth Buttons / User Menu */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-20 bg-neutral-200 rounded-xl animate-pulse"></div>
              <div className="h-10 w-10 bg-neutral-200 rounded-xl animate-pulse"></div>
            </div>
          ) : isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 px-4 py-2 bg-white border border-neutral-200 rounded-xl hover:border-secondary hover:shadow-soft font-medium text-neutral-700 hover:text-secondary transform hover:scale-105"
                disabled={isLoggingOut}
              >
                <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <span className="text-secondary font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:inline">{user.name}</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-200 z-10 animate-fade-in-scale">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-neutral-100 mb-2">
                      <p className="font-semibold text-neutral-800">{user.name}</p>
                      <p className="text-sm text-neutral-500">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full font-medium capitalize">
                        {user.role}
                      </span>
                    </div>
                    
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium"
                      onClick={() => setShowMenu(false)}
                    >
                      <span>👤</span> My Profile
                    </Link>
                    
                    {user.role === 'seller' && (
                      <>
                        <Link
                          href="/seller/dashboard"
                          className="flex items-center gap-3 px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium"
                          onClick={() => setShowMenu(false)}
                        >
                          <span>🏡</span> Farm Dashboard
                        </Link>
                        <Link
                          href="/seller/listings"
                          className="flex items-center gap-3 px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium"
                          onClick={() => setShowMenu(false)}
                        >
                          <span>📋</span> My Listings
                        </Link>
                      </>
                    )}
                    
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium"
                        onClick={() => setShowMenu(false)}
                      >
                        <span>⚙️</span> Admin Panel
                      </Link>
                    )}
                    
                    <Link
                      href="/orders"
                      className="flex items-center gap-3 px-3 py-2 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium"
                      onClick={() => setShowMenu(false)}
                    >
                      <span>📦</span> My Orders
                    </Link>
                    
                    <div className="border-t border-neutral-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center justify-between px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="flex items-center gap-3">
                          <span>🚪</span> Sign Out
                        </span>
                        {isLoggingOut && (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-neutral-600 hover:text-secondary font-medium px-4 py-2 rounded-xl hover:bg-neutral-50"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
