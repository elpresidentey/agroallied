'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'seller':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getVerificationStatus = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-green-600">✓ Verified</span>;
      case 'pending':
        return <span className="text-yellow-600">⏳ Pending Verification</span>;
      case 'rejected':
        return <span className="text-red-600">✗ Rejected</span>;
      default:
        return <span className="text-gray-600">Not Verified</span>;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="card">
          {/* Profile Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRoleBadgeColor(user.role)}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-4 border-t border-b border-gray-200 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <p className="font-bold text-gray-900 mt-1">{getVerificationStatus(user.verification_status)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-bold text-gray-900 mt-1">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.role === 'seller' && (
              <>
                <a
                  href="/seller/listings"
                  className="card text-center hover:shadow-medium transition-all p-4"
                >
                  <div className="text-3xl mb-2">🐄</div>
                  <h3 className="font-bold text-gray-900">My Listings</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage your animal listings</p>
                </a>
                <a
                  href="/seller/dashboard"
                  className="card text-center hover:shadow-medium transition-all p-4"
                >
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-bold text-gray-900">Dashboard</h3>
                  <p className="text-sm text-gray-600 mt-1">View your farm analytics</p>
                </a>
              </>
            )}

            <a href="/orders" className="card text-center hover:shadow-medium transition-all p-4">
              <div className="text-3xl mb-2">📦</div>
              <h3 className="font-bold text-gray-900">My Orders</h3>
              <p className="text-sm text-gray-600 mt-1">Track your purchases</p>
            </a>

            {user.role === 'admin' && (
              <a href="/admin" className="card text-center hover:shadow-medium transition-all p-4">
                <div className="text-3xl mb-2">⚙️</div>
                <h3 className="font-bold text-gray-900">Admin Panel</h3>
                <p className="text-sm text-gray-600 mt-1">Manage the platform</p>
              </a>
            )}
          </div>

          {/* Account Info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium text-gray-900 capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Verification:</span>
                <span className="font-medium text-gray-900 capitalize">{user.verification_status}</span>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button className="w-full mt-6 bg-secondary text-white py-2 rounded-lg font-bold hover:bg-secondary-light transition-colors">
            Edit Profile (Coming Soon)
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
