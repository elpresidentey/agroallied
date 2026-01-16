'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnimalCard from '@/components/AnimalCard';
import { getFarmById, getFarmListings } from '@/lib/api';
import { Farm, Animal } from '@/types';

export default function FarmProfilePage() {
  const params = useParams();
  const farmId = params.id as string;

  const [farm, setFarm] = useState<Farm | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'animals' | 'about' | 'reviews'>('animals');

  useEffect(() => {
    async function fetchFarmData() {
      try {
        const [farmData, animalsData] = await Promise.all([
          getFarmById(farmId),
          getFarmListings(farmId),
        ]);
        setFarm(farmData);
        setAnimals(animalsData || []);
      } catch (error) {
        console.error('Failed to load farm:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFarmData();
  }, [farmId]);

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

  if (!farm) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">Farm not found</p>
            <p className="text-gray-600 mt-2">The farm you're looking for doesn't exist.</p>
            <Link href="/farms">
              <button className="mt-4 px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
                Back to Farms
              </button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/farms" className="text-green-100 hover:text-white font-medium mb-4 inline-block">
              ← Back to Farms
            </Link>
            <div className="flex items-start gap-6 mt-4">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-5xl">
                🏡
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{farm.name}</h1>
                <p className="text-green-100 text-lg">📍 {farm.location}</p>
                {farm.verified && (
                  <div className="mt-3 inline-block bg-green-500 text-white px-4 py-2 rounded-full font-semibold">
                    ✓ Verified Seller
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-3xl font-bold text-green-700 mb-2">{animals.length}</p>
              <p className="text-gray-600">Active Listings</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-3xl font-bold text-blue-600 mb-2">{farm.rating || 'N/A'}</p>
              <p className="text-gray-600">Average Rating</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-3xl font-bold text-yellow-600 mb-2">98%</p>
              <p className="text-gray-600">Positive Feedback</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-3xl font-bold text-purple-600 mb-2">2.5K+</p>
              <p className="text-gray-600">Successful Deals</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 border-b-2 border-gray-200 mb-8">
            {(['animals', 'about', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold transition-colors border-b-4 -mb-2 ${
                  activeTab === tab
                    ? 'text-green-700 border-green-700'
                    : 'text-gray-600 border-transparent hover:text-green-700'
                }`}
              >
                {tab === 'animals' && '🐄 Active Listings'}
                {tab === 'about' && '📋 About'}
                {tab === 'reviews' && '⭐ Reviews'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'animals' && (
            <div className="mb-12">
              {animals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {animals.map((animal) => (
                    <AnimalCard key={animal.id} animal={animal} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-2xl font-bold text-gray-800">No listings yet</p>
                  <p className="text-gray-600 mt-2">Check back soon for new animals</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Farm</h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {farm.description || 'No description available'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">📍 Location</h3>
                  <p className="text-gray-600">{farm.location}</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">✓ Status</h3>
                  <p className="text-gray-600">
                    {farm.verified ? 'Verified Seller' : 'Unverified'}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact This Farm</h3>
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg font-semibold transition-colors">
                    📞 Call Seller
                  </button>
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                    💬 Send Message
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

              {/* Sample Review */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900">Amit Kumar</p>
                    <p className="text-sm text-gray-600">2 weeks ago</p>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                    <span className="text-gray-600">5.0</span>
                  </div>
                  <p className="text-gray-700">
                    Excellent quality cattle, very healthy. Highly recommend Meadow Ridge Farm! The seller was very responsive and professional.
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900">Priya Singh</p>
                    <p className="text-sm text-gray-600">1 month ago</p>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-400">⭐⭐⭐⭐</span>
                    <span className="text-gray-600">4.0</span>
                  </div>
                  <p className="text-gray-700">
                    Good quality animals, timely delivery. Minor issue with one animal but seller resolved it quickly.
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-green-50 rounded-lg">
                <p className="text-green-900 font-semibold">
                  ⭐ Overall Rating: 4.5/5 based on 28 reviews
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
