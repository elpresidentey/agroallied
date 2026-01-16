'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getBuyerOrders } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BuyerDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeOrders: 0,
    pendingPayments: 0,
    completedOrders: 0,
    totalSpent: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'buyer')) {
      router.push('/');
    }
  }, [isAuthenticated, loading, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setLoadingData(true);
      try {
        const orders = await getBuyerOrders(user.id);
        setRecentOrders(orders || []);

        // Calculate stats
        const activeCount = orders?.filter((o: any) => 
          o.status === 'inquiry' || o.status === 'pending' || o.status === 'confirmed'
        ).length || 0;
        
        const pendingPaymentCount = orders?.filter((o: any) => 
          o.status === 'confirmed'
        ).length || 0;
        
        const completedCount = orders?.filter((o: any) => 
          o.status === 'completed'
        ).length || 0;
        
        const totalSpent = orders?.reduce((sum: number, o: any) => 
          o.status === 'completed' ? sum + o.total_price : sum, 0
        ) || 0;

        setStats({
          activeOrders: activeCount,
          pendingPayments: pendingPaymentCount,
          completedOrders: completedCount,
          totalSpent,
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

  if (!user || user.role !== 'buyer') return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Welcome, {user.name || 'Buyer'}</h1>
          <p className="text-gray-600 mt-2">Track your livestock purchases and manage orders</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-3xl mb-2">📦</div>
            <p className="text-gray-600 text-sm">Active Orders</p>
            <p className="text-3xl font-bold text-secondary mt-1">{stats.activeOrders}</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-2">💳</div>
            <p className="text-gray-600 text-sm">Pending Payments</p>
            <p className="text-3xl font-bold text-secondary mt-1">{stats.pendingPayments}</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-gray-600 text-sm">Completed Orders</p>
            <p className="text-3xl font-bold text-secondary mt-1">{stats.completedOrders}</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-gray-600 text-sm">Total Spent</p>
            <p className="text-3xl font-bold text-secondary mt-1">₹{stats.totalSpent.toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-2">🔍 Browse Animals</h3>
            <p className="text-gray-600 text-sm mb-4">Find quality livestock from verified farms</p>
            <a href="/animals" className="inline-block bg-secondary text-white px-6 py-2 rounded-lg font-bold hover:bg-secondary-dark transition-colors">
              Browse Now
            </a>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-2">📋 My Orders</h3>
            <p className="text-gray-600 text-sm mb-4">View and manage all your orders</p>
            <a href="/orders" className="inline-block bg-secondary-lighter text-secondary px-6 py-2 rounded-lg font-bold hover:bg-secondary hover:text-white transition-colors">
              View Orders
            </a>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📦 Recent Orders</h2>

          {loadingData ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary"></div>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">🛒</div>
              <p>No orders yet. Start exploring available livestock!</p>
              <a href="/animals" className="inline-block mt-4 text-secondary font-bold hover:underline">
                Browse Animals →
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Animal</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Farm</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Qty</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Price</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 5).map((order: any) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium">{order.animals?.breed || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{order.farms?.name || 'Unknown'}</td>
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
                      <td className="px-4 py-2 text-sm">
                        {order.status === 'confirmed' && (
                          <a
                            href={`/checkout?orderId=${order.id}&animalName=${order.animals?.breed}&amount=${order.total_price}&quantity=${order.quantity}`}
                            className="text-secondary font-bold hover:underline text-xs"
                          >
                            Pay
                          </a>
                        )}
                        {order.status === 'completed' && (
                          <span className="text-green-600 font-bold text-xs">✓ Done</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentOrders.length > 5 && (
                <div className="mt-4 text-center">
                  <a href="/orders" className="text-secondary font-bold hover:underline">
                    View all {recentOrders.length} orders →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 card bg-gradient-to-r from-green-50 to-gray-50 border border-green-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">💡 Tips for Better Purchases</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm text-gray-700"><strong>Check Ratings:</strong> Choose farms with high ratings for quality assurance</p>
            </div>
            <div>
              <div className="text-2xl mb-2">📸</div>
              <p className="text-sm text-gray-700"><strong>Review Photos:</strong> Look at animal photos and health certificates</p>
            </div>
            <div>
              <div className="text-2xl mb-2">💬</div>
              <p className="text-sm text-gray-700"><strong>Communicate:</strong> Contact sellers directly to discuss specifics</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
