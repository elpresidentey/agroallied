'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSellerOrders, getFarmListings } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SellerDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeListings: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'seller')) {
      router.push('/');
    }
  }, [isAuthenticated, loading, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      setLoadingData(true);
      try {
        // Fetch orders
        const orders = await getSellerOrders(user.id);
        setRecentOrders(orders || []);

        // Calculate stats
        const pendingCount = orders?.filter((o: any) => o.status === 'inquiry' || o.status === 'pending').length || 0;
        const completedCount = orders?.filter((o: any) => o.status === 'completed').length || 0;

        // Fetch listings
        const listings = await getFarmListings(user.id);
        
        setStats({
          activeListings: listings?.length || 0,
          pendingOrders: pendingCount,
          completedOrders: completedCount,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user?.id]);

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

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your farm and livestock listings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-3xl mb-2">🐄</div>
            <p className="text-gray-600 text-sm">Active Listings</p>
            <p className="text-3xl font-bold text-secondary mt-1">{stats.activeListings}</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-2">📦</div>
            <p className="text-gray-600 text-sm">Pending Orders</p>
            <p className="text-3xl font-bold text-secondary mt-1">{stats.pendingOrders}</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-gray-600 text-sm">Completed Orders</p>
            <p className="text-3xl font-bold text-secondary mt-1">{stats.completedOrders}</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-secondary mt-1">₹0</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-2">📝 New Listing</h3>
            <p className="text-gray-600 text-sm mb-4">Add a new animal to your farm</p>
            <a href="/seller/listings/new" className="w-full block text-center bg-secondary text-white py-2 rounded-lg font-bold hover:bg-secondary-dark transition-colors">
              Create Listing
            </a>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-2">📋 My Listings</h3>
            <p className="text-gray-600 text-sm mb-4">View and manage your animals</p>
            <a href="/seller/listings" className="w-full block text-center bg-secondary-lighter text-secondary py-2 rounded-lg font-bold hover:bg-secondary hover:text-white transition-colors">
              View Listings
            </a>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-2">📦 Manage Orders</h3>
            <p className="text-gray-600 text-sm mb-4">Respond to buyer inquiries</p>
            <a href="/orders" className="w-full block text-center bg-secondary-lighter text-secondary py-2 rounded-lg font-bold hover:bg-secondary hover:text-white transition-colors">
              View Inquiries
            </a>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📦 Recent Inquiries</h2>
          
          {loadingData ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary"></div>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No inquiries yet. Keep promoting your farm! 🚀</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Buyer</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Animal</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Qty</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Price</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 5).map((order: any) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{order.users?.full_name || 'Unknown'}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{order.animals?.breed || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{order.quantity}</td>
                      <td className="px-4 py-2 text-sm font-semibold text-secondary">₹{order.total_price.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          order.status === 'inquiry' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentOrders.length > 5 && (
                <div className="mt-4 text-center">
                  <a href="/orders" className="text-secondary font-bold hover:underline">
                    View all {recentOrders.length} inquiries →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
