'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AdminPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
    }
  }, [isAuthenticated, loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage platform content and verify sellers</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-gray-600 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-secondary mt-1">0</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-2">🏡</div>
            <p className="text-gray-600 text-sm">Pending Farms</p>
            <p className="text-3xl font-bold text-secondary mt-1">0</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-2">🐄</div>
            <p className="text-gray-600 text-sm">Total Listings</p>
            <p className="text-3xl font-bold text-secondary mt-1">0</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-2">📦</div>
            <p className="text-gray-600 text-sm">Pending Orders</p>
            <p className="text-3xl font-bold text-secondary mt-1">0</p>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Verification */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🏡 Seller Verification</h2>
            <p className="text-gray-600 mb-4">Review and approve pending seller accounts</p>
            <button className="w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-secondary-light transition-colors">
              Review Sellers
            </button>
          </div>

          {/* Listings Moderation */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Listings Moderation</h2>
            <p className="text-gray-600 mb-4">Moderate and approve animal listings</p>
            <button className="w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-secondary-light transition-colors">
              Review Listings
            </button>
          </div>

          {/* Users Management */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">👥 Users</h2>
            <p className="text-gray-600 mb-4">View and manage user accounts</p>
            <button className="w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-secondary-light transition-colors">
              Manage Users
            </button>
          </div>

          {/* Reports & Analytics */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Analytics</h2>
            <p className="text-gray-600 mb-4">View platform statistics and reports</p>
            <button className="w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-secondary-light transition-colors">
              View Analytics
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <p>No activity yet</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
