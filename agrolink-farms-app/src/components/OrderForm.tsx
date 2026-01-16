'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/lib/api';

interface OrderFormProps {
  animalId: string;
  animalBed: string;
  animalPrice: number;
  farmId: string;
  farmName: string;
  quantity: number;
}

export default function OrderForm({
  animalId,
  animalBed,
  animalPrice,
  farmId,
  farmName,
  quantity,
}: OrderFormProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const totalPrice = animalPrice * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user?.id) {
      router.push('/login');
      return;
    }

    if (user.role !== 'buyer') {
      setError('Only buyers can place orders');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const order = await createOrder(
        user.id,
        animalId,
        quantity,
        totalPrice,
        notes
      );

      setShowConfirmation(true);
      setTimeout(() => {
        router.push(`/orders`);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to place order. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
        <p className="text-blue-900">
          <a href="/login" className="font-bold underline">
            Sign in
          </a>
          {' '}to place an order
        </p>
      </div>
    );
  }

  if (user?.role !== 'buyer') {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">
        <p className="text-yellow-900">
          Only buyers can place orders. Sellers can add listings instead.
        </p>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded">
        <p className="text-green-900 font-bold text-lg mb-2">✓ Order Placed Successfully!</p>
        <p className="text-green-800">
          Your inquiry has been sent to {farmName}. Check your orders page to track the status.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-900">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., 'Need by next week', 'Payment via bank transfer', etc."
          rows={3}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-700"
        />
        <p className="text-xs text-gray-500 mt-1">
          Share any special requests or requirements
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Price per unit:</span>
          <span className="font-bold">₹{animalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Quantity:</span>
          <span className="font-bold">{quantity}</span>
        </div>
        <div className="border-t-2 border-gray-300 pt-2 flex justify-between">
          <span className="text-lg font-bold">Total:</span>
          <span className="text-2xl font-bold text-green-700">₹{totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
          isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-700 hover:bg-green-800'
        }`}
      >
        {isSubmitting ? 'Placing Order...' : 'Place Inquiry'}
      </button>

      <p className="text-xs text-gray-600 text-center">
        💡 The seller will review and respond to your inquiry within 24 hours
      </p>
    </form>
  );
}
