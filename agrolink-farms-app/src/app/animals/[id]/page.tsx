'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAnimalById } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OrderForm from '@/components/OrderForm';
import { Animal, Farm } from '@/types';

interface AnimalWithFarm extends Animal {
  farms: Farm;
}

export default function AnimalDetailPage() {
  const params = useParams();
  const animalId = params.id as string;

  const [animal, setAnimal] = useState<AnimalWithFarm | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    async function fetchAnimal() {
      try {
        const data = await getAnimalById(animalId);
        setAnimal(data);
        setTotalPrice(data.price * quantity);
      } catch (error) {
        console.error('Failed to load animal:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnimal();
  }, [animalId, quantity]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
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

  const categoryIcons: Record<string, string> = {
    cattle: '🐄',
    goat: '🐐',
    sheep: '🐑',
    poultry: '🐔',
    pig: '🐷',
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <a href="/animals" className="text-green-700 hover:text-green-800 font-medium">
              ← Back to Listings
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Animal Image & Gallery */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Main Image */}
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  <img
                    src={animal.image_url}
                    alt={animal.breed}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-green-700 text-white px-4 py-2 rounded-full font-semibold">
                    {animal.available_count > 0 ? '✓ In Stock' : 'Out of Stock'}
                  </div>
                </div>

                {/* Animal Details */}
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{categoryIcons[animal.type] || '🐾'}</span>
                    <div>
                      <p className="text-sm text-gray-600 uppercase tracking-wide">
                        {animal.type}
                      </p>
                      <h1 className="text-3xl font-bold text-gray-900">{animal.breed}</h1>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-gray-600 text-sm">Age</p>
                      <p className="text-xl font-bold text-gray-900">{animal.age_months} months</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Weight</p>
                      <p className="text-xl font-bold text-gray-900">{animal.weight_kg} kg</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Gender</p>
                      <p className="text-xl font-bold text-gray-900 capitalize">{animal.gender}</p>
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
                        animal.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {animal.status === 'active' ? '✓ Active' : '⚠ Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Order Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-4">
                {/* Price */}
                <div className="mb-8">
                  <p className="text-gray-600 text-sm mb-2">Price per unit</p>
                  <p className="text-4xl font-bold text-green-700">
                    ₹{animal.price.toLocaleString()}
                  </p>
                </div>

                {/* Quantity Selector */}
                <div className="mb-8">
                  <p className="text-gray-900 font-semibold mb-3">Quantity</p>
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-green-700 flex items-center justify-center text-lg font-bold transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={animal.available_count}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(animal.available_count, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="flex-1 text-center text-lg font-bold border-2 border-gray-300 rounded-lg p-2"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(animal.available_count, quantity + 1))}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-green-700 flex items-center justify-center text-lg font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Available: {animal.available_count} {animal.available_count === 1 ? 'unit' : 'units'}
                  </p>
                </div>

                {/* Total */}
                <div className="mb-8 p-4 bg-green-50 rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Total Price</p>
                  <p className="text-3xl font-bold text-green-700">
                    ₹{totalPrice.toLocaleString()}
                  </p>
                </div>

                {/* Order Button */}
                <OrderForm
                  animalId={animal.id}
                  animalBed={animal.breed}
                  animalPrice={animal.price}
                  farmId={animal.farms?.id || ''}
                  farmName={animal.farms?.name || 'Farm'}
                  quantity={quantity}
                />

                {/* Seller Info */}
                <div className="mt-8 pt-8 border-t-2 border-gray-200">
                  <p className="text-gray-600 text-sm mb-3">Seller Information</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-xl">
                      🏡
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {animal.farms?.name || 'Farm Name'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {animal.farms?.location || 'Location'}
                      </p>
                    </div>
                  </div>
                  <button className="w-full mt-4 py-2 rounded-lg border-2 border-gray-300 hover:border-green-700 text-gray-900 font-semibold transition-colors">
                    View Farm Profile
                  </button>
                </div>

                {/* Verification Badge */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                  <span className="text-xl">✓</span>
                  <p className="text-sm text-blue-900">Verified seller with 98% positive reviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* Related Animals */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Animals</h2>
            <p className="text-gray-600">Similar animals from other farms - coming soon</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
