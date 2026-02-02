'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { getBuyerOrders, getSellerOrders, updateOrderStatus } from '@/lib/api';
import { useOrderUpdates } from '@/lib/useOrderUpdates';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { ProtectedRoute } from '@/components/auth/protected-route';
import type { User } from '@/types';

interface OrderData {
  id: string;
  buyer_id: string;
  animal_id: string;
  quantity: number;
  total_price: number;
  status: 'inquiry' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  animals?: any;
  farms?: any;
}

const statusColors = {
  inquiry: 'bg-blue-100 text-blue-800 border-blue-300',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-gray-100 text-gray-800 border-gray-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

const statusIcons = {
  inquiry: '🔍',
  pending: '⏳',
  confirmed: '✓',
  completed: '✅',
  cancelled: '❌',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Real-time updates
  const { notification } = useOrderUpdates(user?.id || '', (user?.role as 'buyer' | 'seller') || 'buyer');

  useEffect(() => {
    if (notification) {
      setToastMessage(notification);
      setToastType('info');
    }
  }, [notification]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      setLoadingOrders(true);
      try {
        let data;
        if (user.role === 'buyer') {
          data = await getBuyerOrders(user.id);
        } else if (user.role === 'seller') {
          data = await getSellerOrders(user.id);
        }
        setOrders(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? {...o, status: newStatus as any} : o));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  return (
    <ProtectedRoute redirectTo="/login">
      <OrdersPageContent 
        user={user!}
        orders={orders}
        loadingOrders={loadingOrders}
        error={error}
        toastMessage={toastMessage}
        toastType={toastType}
        setToastMessage={setToastMessage}
        handleStatusChange={handleStatusChange}
      />
    </ProtectedRoute>
  );
}

function OrdersPageContent({
  user,
  orders,
  loadingOrders,
  error,
  toastMessage,
  toastType,
  setToastMessage,
  handleStatusChange
}: {
  user: User;
  orders: OrderData[];
  loadingOrders: boolean;
  error: string;
  toastMessage: string;
  toastType: 'success' | 'error' | 'info';
  setToastMessage: (message: string) => void;
  handleStatusChange: (orderId: string, newStatus: string) => Promise<void>;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {user.role === 'seller' ? 'Received Inquiries' : 'My Orders'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user.role === 'seller' 
              ? 'Manage buyer inquiries and track sales'
              : 'Track and manage your purchases'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
            {error}
          </div>
        )}

        {loadingOrders ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">
              {user.role === 'seller'
                ? "You haven't received any inquiries yet. Promote your farm to attract buyers!"
                : 'Browse animals and place your first order'}
            </p>
            {user.role === 'buyer' && (
              <a href="/animals" className="inline-block bg-secondary text-white px-6 py-2 rounded-lg font-bold hover:bg-secondary-light transition-colors">
                Browse Animals
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  {/* Status */}
                  <div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${statusColors[order.status]}`}>
                      <span>{statusIcons[order.status]}</span>
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="md:col-span-2">
                    <div className="font-semibold text-gray-900">
                      {order.animals?.breed || 'Animal'} x{order.quantity}
                    </div>
                    <div className="text-sm text-gray-600">
                      From: {order.farms?.name || 'Unknown Farm'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Order ID: {order.id.slice(0, 8)}...
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex flex-col items-end justify-between">
                    <div className="font-bold text-lg text-secondary">
                      ₹{order.total_price.toLocaleString()}
                    </div>
                    
                    {/* Status Update Buttons for Seller */}
                    {user.role === 'seller' && order.status === 'inquiry' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleStatusChange(order.id, 'pending')}
                          className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {/* Payment Button for Buyer */}
                    {user.role === 'buyer' && order.status === 'confirmed' && (
                      <a
                        href={`/checkout?orderId=${order.id}&animalName=${order.animals?.breed}&amount=${order.total_price}&quantity=${order.quantity}`}
                        className="text-xs bg-secondary hover:bg-secondary-dark text-white px-3 py-1 rounded transition-colors mt-2"
                      >
                        Pay Now
                      </a>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Notes:</span> {order.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Order Status Key */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Status Reference</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <span className="text-2xl mr-2">🔍</span>
              <div>
                <div className="text-sm font-medium text-gray-900">Inquiry</div>
                <div className="text-xs text-gray-600">Initial request sent</div>
              </div>
            </div>
            <div className="card">
              <span className="text-2xl mr-2">⏳</span>
              <div>
                <div className="text-sm font-medium text-gray-900">Pending</div>
                <div className="text-xs text-gray-600">Accepted, awaiting payment</div>
              </div>
            </div>
            <div className="card">
              <span className="text-2xl mr-2">✓</span>
              <div>
                <div className="text-sm font-medium text-gray-900">Confirmed</div>
                <div className="text-xs text-gray-600">Payment received</div>
              </div>
            </div>
            <div className="card">
              <span className="text-2xl mr-2">✅</span>
              <div>
                <div className="text-sm font-medium text-gray-900">Completed</div>
                <div className="text-xs text-gray-600">Delivery finished</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
