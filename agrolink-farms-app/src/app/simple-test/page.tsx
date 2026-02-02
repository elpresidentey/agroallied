'use client';

import { useEffect, useState } from 'react';
import { getMockAnimalsByCategory } from '@/lib/mock-data';

export default function SimpleTestPage() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('SimpleTestPage: Loading animals...');
    try {
      const mockData = getMockAnimalsByCategory();
      console.log('SimpleTestPage: Mock data loaded:', mockData.length);
      setAnimals(mockData);
    } catch (error) {
      console.error('SimpleTestPage: Error loading mock data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  console.log('SimpleTestPage: Rendering. Loading:', loading, 'Animals:', animals.length);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
      <p className="mb-4">Animals loaded: {animals.length}</p>
      
      <div className="space-y-2">
        {animals.slice(0, 5).map((animal, index) => (
          <div key={animal.id || index} className="p-2 border rounded">
            <strong>{animal.name}</strong> - {animal.type} - ₹{animal.price?.toLocaleString()}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Test Links:</h2>
        <div className="space-x-4">
          <a href="/animals" className="text-blue-500 underline">Animals Page</a>
          <a href="/debug" className="text-blue-500 underline">Debug Page</a>
          <a href="/" className="text-blue-500 underline">Home</a>
        </div>
      </div>
    </div>
  );
}