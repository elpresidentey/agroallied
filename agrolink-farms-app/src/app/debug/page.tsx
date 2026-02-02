'use client';

import { mockAnimals, getMockAnimalsByCategory } from '@/lib/mock-data';

export default function DebugPage() {
  const allAnimals = getMockAnimalsByCategory();
  const cows = getMockAnimalsByCategory('cows');
  const goats = getMockAnimalsByCategory('goats');
  const poultry = getMockAnimalsByCategory('poultry');

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mock Data Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <ul className="space-y-2">
            <li>Total animals: <strong>{allAnimals.length}</strong></li>
            <li>Cows: <strong>{cows.length}</strong></li>
            <li>Goats: <strong>{goats.length}</strong></li>
            <li>Poultry: <strong>{poultry.length}</strong></li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Animal Types</h2>
          <ul className="space-y-1">
            {mockAnimals.map(animal => (
              <li key={animal.id} className="text-sm">
                {animal.type}: {animal.breed}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Sample Animals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAnimals.slice(0, 6).map(animal => (
            <div key={animal.id} className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold">{animal.name}</h3>
              <p className="text-sm text-gray-600">{animal.type} - {animal.breed}</p>
              <p className="text-lg font-bold text-green-600">₹{animal.price.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">{animal.description.substring(0, 100)}...</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Test Links</h2>
        <div className="space-x-4">
          <a href="/animals" className="bg-blue-500 text-white px-4 py-2 rounded">All Animals</a>
          <a href="/animals?category=cows" className="bg-green-500 text-white px-4 py-2 rounded">Cows</a>
          <a href="/animals?category=goats" className="bg-yellow-500 text-white px-4 py-2 rounded">Goats</a>
          <a href="/animals?category=poultry" className="bg-red-500 text-white px-4 py-2 rounded">Poultry</a>
        </div>
      </div>
    </div>
  );
}