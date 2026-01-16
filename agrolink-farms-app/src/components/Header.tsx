'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function Header() {
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 shadow-soft sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-bold text-xl text-secondary hidden sm:inline">AgroLink</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/animals" className="text-gray-600 hover:text-secondary transition-colors">
            Browse Animals
          </Link>
          <Link href="/farms" className="text-gray-600 hover:text-secondary transition-colors">
            Browse Farms
          </Link>
          {isAuthenticated && user?.role === 'seller' && (
            <Link href="/seller/dashboard" className="text-gray-600 hover:text-secondary transition-colors">
              Dashboard
            </Link>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <Link href="/admin" className="text-gray-600 hover:text-secondary transition-colors">
              Admin
            </Link>
          )}
        </div>

        {/* Auth Buttons / User Menu */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
          ) : isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-lighter text-secondary rounded-lg hover:bg-secondary hover:text-white transition-colors font-medium"
              >
                <span>{user.name}</span>
                <span>▼</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                    onClick={() => setShowMenu(false)}
                  >
                    My Profile
                  </Link>
                  {user.role === 'seller' && (
                    <>
                      <Link
                        href="/seller/dashboard"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowMenu(false)}
                      >
                        Farm Dashboard
                      </Link>
                      <Link
                        href="/seller/listings"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowMenu(false)}
                      >
                        My Listings
                      </Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    href="/orders"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowMenu(false)}
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg border-t border-gray-200"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-secondary hover:text-secondary-light transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary-light transition-colors font-medium"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
