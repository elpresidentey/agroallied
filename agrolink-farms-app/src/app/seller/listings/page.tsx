'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SellerListings() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'seller')) {
      router.push('/');
    }
  }, [isAuthenticated, loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-600 mt-2">Manage your animal inventory</p>
          </div>
          <Link href="/seller/listings/new">
            <button className="bg-green-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors">
              + New Listing
            </button>
          </Link>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No listings yet</h2>
          <p className="text-gray-600 mb-6">Start by adding your first animal to the marketplace</p>
          <Link href="/seller/listings/new">
            <button className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors">
              Create Your First Listing
            </button>
          </Link>
        </div>

        {/* Listings Table (when data exists) */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-bold text-gray-900">Animal</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Breed</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Price</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Available</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Listings will go here */}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
}
