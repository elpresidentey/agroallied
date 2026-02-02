'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';

const AccessDeniedFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex flex-col">
    <Header />
    <main className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access the admin verification area. 
          This section is restricted to administrators only.
        </p>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact support.
          </p>
          <a 
            href="/"
            className="inline-block px-6 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default function AdminVerificationPage() {

  const [activeTab, setActiveTab] = useState<'sellers' | 'listings' | 'users'>('sellers');
  const [pendingSellers, setPendingSellers] = useState([
    {
      id: 'farm-002',
      name: 'Green Valley Livestock',
      location: 'Haryana, India',
      owner: 'Rajesh Kumar',
      email: 'seller1@farm.com',
      phone: '9876543211',
      requestedAt: '2 hours ago',
      status: 'pending',
      documents: ['certification.pdf', 'license.pdf'],
    },
    {
      id: 'farm-003',
      name: 'Golden Harvest Ranch',
      location: 'Uttar Pradesh, India',
      owner: 'Priya Singh',
      email: 'seller2@farm.com',
      phone: '9876543212',
      requestedAt: '5 hours ago',
      status: 'pending',
      documents: ['certification.pdf'],
    },
  ]);

  const [pendingListings, setPendingListings] = useState([
    {
      id: 'animal-005',
      breed: 'Boer Goat',
      type: 'goat',
      price: 8000,
      farm: 'Green Valley Livestock',
      submittedAt: '1 hour ago',
      reason: 'Price verification needed',
    },
  ]);

  const handleApproveSeller = (farmId: string) => {
    setPendingSellers(pendingSellers.filter((s) => s.id !== farmId));
  };

  const handleRejectSeller = (farmId: string) => {
    setPendingSellers(pendingSellers.filter((s) => s.id !== farmId));
  };

  const handleApproveListing = (animalId: string) => {
    setPendingListings(pendingListings.filter((l) => l.id !== animalId));
  };

  return (
    <ProtectedRoute requiredRole="admin" fallback={<AccessDeniedFallback />}>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 flex flex-col">
        <Header />

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Admin Verification</h1>
            <p className="text-gray-600 mt-2">Manage seller verification, listing moderation, and user management</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b-2 border-gray-200 mb-8">
            {(['sellers', 'listings', 'users'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold transition-colors border-b-4 -mb-2 capitalize ${
                  activeTab === tab
                    ? 'text-green-700 border-green-700'
                    : 'text-gray-600 border-transparent hover:text-green-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Sellers Verification */}
          {activeTab === 'sellers' && (
            <div className="space-y-4">
              {pendingSellers.length > 0 ? (
                pendingSellers.map((seller) => (
                  <div key={seller.id} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{seller.name}</h3>
                        <p className="text-gray-600">Owner: {seller.owner}</p>
                        <p className="text-sm text-gray-500 mt-2">📍 {seller.location}</p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold">
                        ⏳ Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                      <div>
                        <p className="font-semibold">Email</p>
                        <p>{seller.email}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Phone</p>
                        <p>{seller.phone}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="font-semibold text-gray-900 mb-2">Documents Submitted</p>
                      <div className="flex gap-2">
                        {seller.documents.map((doc, i) => (
                          <button
                            key={i}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100"
                          >
                            📄 {doc}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">Requested: {seller.requestedAt}</p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveSeller(seller.id)}
                        className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg font-semibold transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleRejectSeller(seller.id)}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        ✕ Reject
                      </button>
                      <button className="px-6 py-2 border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-50">
                        📧 Send Message
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">✓ All sellers verified!</p>
                  <p className="text-gray-600 mt-2">No pending verification requests</p>
                </div>
              )}
            </div>
          )}

          {/* Listings Moderation */}
          {activeTab === 'listings' && (
            <div className="space-y-4">
              {pendingListings.length > 0 ? (
                pendingListings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{listing.breed}</h3>
                        <p className="text-gray-600">Type: {listing.type.toUpperCase()}</p>
                        <p className="text-sm text-gray-500">Farm: {listing.farm}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-700">₹{listing.price.toLocaleString()}</p>
                        <span className="bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-semibold">
                          Review Needed
                        </span>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4 rounded">
                      <p className="text-yellow-900 text-sm">
                        <strong>Reason for review:</strong> {listing.reason}
                      </p>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">Submitted: {listing.submittedAt}</p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveListing(listing.id)}
                        className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg font-semibold transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors">
                        ⚠️ Request Changes
                      </button>
                      <button className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors">
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">✓ All listings approved!</p>
                  <p className="text-gray-600 mt-2">No pending moderation</p>
                </div>
              )}
            </div>
          )}

          {/* User Management */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 font-bold text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Rajesh Kumar', role: 'seller', email: 'seller1@farm.com', status: 'Verified' },
                    { name: 'Priya Singh', role: 'seller', email: 'seller2@farm.com', status: 'Pending' },
                    { name: 'Amit Kumar', role: 'buyer', email: 'buyer1@mail.com', status: 'Active' },
                  ].map((user, i) => (
                    <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{user.name}</td>
                      <td className="py-3 px-4 capitalize text-gray-600">{user.role}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            user.status === 'Verified'
                              ? 'bg-green-100 text-green-800'
                              : user.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-red-600 hover:text-red-800 font-semibold">
                          🚫 Suspend
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
