'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PaymentComponent from '@/components/PaymentComponent';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const orderId = searchParams.get('orderId');
  const animalName = searchParams.get('animalName') || 'Livestock';
  const amount = parseInt(searchParams.get('amount') || '50000');
  const quantity = parseInt(searchParams.get('quantity') || '1');

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">Please login to proceed</p>
            <Link href="/login">
              <button className="mt-4 px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
                Go to Login
              </button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!orderId) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">Invalid checkout link</p>
            <Link href="/orders">
              <button className="mt-4 px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
                View Orders
              </button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (paymentSuccess) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">✓</div>
              <h1 className="text-3xl font-bold text-green-700 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 text-lg mb-6">
                Your order has been confirmed and payment received.
              </p>

              <div className="bg-green-50 p-6 rounded-lg mb-8">
                <p className="text-sm text-gray-600">Order ID:</p>
                <p className="text-2xl font-bold text-gray-900">{orderId}</p>
              </div>

              <p className="text-gray-700 mb-6">
                You will receive a confirmation email shortly. Track your order in your account.
              </p>

              <Link href="/orders">
                <button className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold transition-colors">
                  View Your Orders
                </button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/orders" className="text-green-700 hover:text-green-800 font-medium mb-4 inline-block">
            ← Back to Orders
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left: Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

                <div className="border-b border-gray-200 pb-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-gray-900">{animalName}</p>
                      <p className="text-sm text-gray-600">Quantity: {quantity}</p>
                    </div>
                    <p className="text-right font-bold text-gray-900">
                      ₹{(amount / quantity).toLocaleString()}/unit
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-bold">₹{amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-bold">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST (5%):</span>
                    <span className="font-bold">₹{Math.floor(amount * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between text-lg">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-green-700">
                      ₹{(amount + Math.floor(amount * 0.05)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-3">Shipping Address</h3>
                  <p className="text-gray-700">{user.name}</p>
                  <p className="text-gray-600 text-sm">Will be coordinated with seller</p>
                </div>
              </div>
            </div>

            {/* Right: Payment */}
            <div>
              <PaymentComponent
                orderId={orderId}
                amount={amount + Math.floor(amount * 0.05)}
                customerEmail={user.email || ''}
                customerName={user.name || ''}
                customerPhone={''}
                onSuccess={() => setPaymentSuccess(true)}
                onError={setPaymentError}
              />

              {paymentError && (
                <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-900">{paymentError}</p>
                </div>
              )}

              {/* Info */}
              <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-900">
                  ℹ️ <strong>Tip:</strong> You can save a copy of this order for your records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
