'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnimalCard from '@/components/AnimalCard';
import { Animal } from '@/types';
import { mockAnimals } from '@/lib/mock-data';

export default function AnimalsPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    // Simulate loading and set mock data directly
    console.log('Loading animals...');
    setTimeout(() => {
      console.log('Setting mock animals:', mockAnimals.length);
      setAnimals(mockAnimals);
      setLoading(false);
    }, 100);
  }, []);

  const categories = [
    { id: 'all', label: 'All Animals' },
    { id: 'cows', label: 'Cows' },
    { id: 'goats', label: 'Goats' },
    { id: 'poultry', label: 'Poultry' },
    { id: 'fish', label: 'Fish' },
    { id: 'dogs', label: 'Dogs' },
    { id: 'others', label: 'Others' },
  ];

  const handleCategoryClick = (categoryId: string) => {
    setCategory(categoryId);
    if (categoryId === 'all') {
      setAnimals(mockAnimals);
    } else {
      const filtered = mockAnimals.filter(animal => animal.type === categoryId);
      setAnimals(filtered);
    }
  };

  console.log('Rendering animals page. Loading:', loading, 'Animals count:', animals.length);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="bg-green-600 text-white py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl font-bold mb-2">Browse Livestock</h1>
              <p className="text-green-100">Loading animals...</p>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <p className="text-lg">Loading...</p>
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
      <main className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-green-600 text-white py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-2">Browse Livestock</h1>
            <p className="text-green-100">Discover verified animals from trusted farms</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Debug Info */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Debug: Category = "{category}", Animals found = {animals.length}, Loading = {loading.toString()}
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Category</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                    category === cat.id
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-green-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Animals Grid */}
          {animals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl font-bold text-gray-800">No animals found</p>
              <p className="text-gray-600 mt-2">Category: {category}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {animals.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
