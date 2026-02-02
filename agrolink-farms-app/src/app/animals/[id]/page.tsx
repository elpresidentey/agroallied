'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Animal } from '@/types';
import { createBrowserClient } from '@/lib/supabase/client';
import { getMockAnimalById } from '@/lib/mock-data';

export default function AnimalDetailPage() {
  const params = useParams();
  const animalId = params.id as string;

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function fetchAnimal() {
      try {
        // Try to fetch from Supabase first
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from('animals')
          .select('*')
          .eq('id', animalId)
          .eq('status', 'available')
          .single();

        if (error || !data) {
          console.log('Database error or no data, using mock data:', error);
          // Fallback to mock data
          const mockAnimal = getMockAnimalById(animalId);
          setAnimal(mockAnimal);
        } else {
          setAnimal(data);
        }
      } catch (error) {
        console.error('Failed to load animal, using mock data:', error);
        // Fallback to mock data
        const mockAnimal = getMockAnimalById(animalId);
        setAnimal(mockAnimal);
      } finally {
        setLoading(false);
      }
    }

    fetchAnimal();
  }, [animalId]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!animal) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">Animal not found</p>
            <p className="text-gray-600 mt-2">The animal you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const totalPrice = animal.price * quantity;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <a href="/animals" className="text-green-600 hover:text-green-700 font-medium">
              ← Back to Listings
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Animal Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Main Image */}
                <div className="h-64 bg-gray-200 relative overflow-hidden flex items-center justify-center">
                  <span className="text-gray-400">No Image Available</span>
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full font-semibold">
                    {animal.status === 'available' ? 'Available' : 'Not Available'}
                  </div>
                </div>

                {/* Animal Details */}
                <div className="p-8">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 uppercase tracking-wide">
                      {animal.type}
                    </p>
                    <h1 className="text-3xl font-bold text-gray-900">{animal.breed}</h1>
                    {animal.name && (
                      <p className="text-lg text-gray-700 mt-1">{animal.name}</p>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-gray-600 text-sm">Age</p>
                      <p className="text-xl font-bold text-gray-900">{animal.age} months</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Status</p>
                      <p className="text-xl font-bold text-gray-900 capitalize">{animal.status}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
                    <p className="text-gray-700 leading-relaxed">{animal.description}</p>
                  </div>

                  {/* Status Badge */}
                  <div className="inline-block">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        animal.status === 'available'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {animal.status === 'available' ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Order Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-8 sticky top-4">
                {/* Price */}
                <div className="mb-8">
                  <p className="text-gray-600 text-sm mb-2">Price</p>
                  <p className="text-4xl font-bold text-green-600">
                    ₹{animal.price.toLocaleString()}
                  </p>
                </div>

                {/* Quantity Selector */}
                <div className="mb-8">
                  <p className="text-gray-900 font-semibold mb-3">Quantity</p>
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-green-600 flex items-center justify-center text-lg font-bold transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center text-lg font-bold border-2 border-gray-300 rounded-lg p-2"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-green-600 flex items-center justify-center text-lg font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="mb-8 p-4 bg-green-50 rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Total Price</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{totalPrice.toLocaleString()}
                  </p>
                </div>

                {/* Order Button */}
                <button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors mb-4"
                  disabled={animal.status !== 'available'}
                >
                  {animal.status === 'available' ? 'Contact Seller' : 'Not Available'}
                </button>

                {/* Verification Badge */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                  <span className="text-xl">✓</span>
                  <p className="text-sm text-blue-900">Verified seller with quality guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
