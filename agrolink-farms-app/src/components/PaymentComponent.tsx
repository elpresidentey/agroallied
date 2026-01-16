'use client';

import { useState } from 'react';
import Script from 'next/script';

interface PaymentComponentProps {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  onSuccess: (reference: string) => void;
  onError: (error: string) => void;
}

export default function PaymentComponent({
  orderId,
  amount,
  customerEmail,
  customerName,
  customerPhone,
  onSuccess,
  onError,
}: PaymentComponentProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaystackPayment = async () => {
    setIsProcessing(true);

    try {
      // Create transaction on backend
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          email: customerEmail,
          metadata: {
            orderId,
            customerName,
            customerPhone,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // Use Paystack popup
      if ((window as any).PaystackPop) {
        (window as any).PaystackPop.resumeTransaction(data.access_code, {
          onClose: () => {
            setIsProcessing(false);
            onError('Payment window closed');
          },
          onSuccess: async (response: any) => {
            try {
              // Verify payment
              const verifyResponse = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  reference: data.reference,
                }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                onSuccess(data.reference);
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (error) {
              onError(error instanceof Error ? error.message : 'Verification failed');
            } finally {
              setIsProcessing(false);
            }
          },
        });
      }
    } catch (error) {
      setIsProcessing(false);
      onError(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h2>

      {/* Amount Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-6">
        <p className="text-gray-600 text-sm mb-2">Amount to Pay</p>
        <p className="text-4xl font-bold text-green-700">₦{(amount / 100).toLocaleString()}</p>
        <p className="text-sm text-gray-600 mt-2">Nigerian Naira (NGN)</p>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
        <p className="text-sm text-blue-900">
          💡 Your payment is secured and processed by Paystack. We do not store your card details.
        </p>
      </div>

      {/* Supported Methods */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="font-semibold text-gray-900 mb-3">Accepted Payment Methods:</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center text-sm text-gray-700">
            <span className="mr-2">💳</span> Debit Cards
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="mr-2">🏦</span> Bank Transfers
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="mr-2">📱</span> Mobile Money
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="mr-2">🪙</span> USSD
          </div>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={handlePaystackPayment}
        disabled={isProcessing}
        className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
          isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-700 hover:bg-green-800'
        }`}
      >
        {isProcessing ? 'Processing...' : `Pay ₦${(amount / 100).toLocaleString()}`}
      </button>

      {/* Paystack Script */}
      <Script
        src="https://cdn.jsdelivr.net/npm/paystack@1.3.0/dist/inline.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('Paystack script loaded');
        }}
      />
    </div>
  );
}
