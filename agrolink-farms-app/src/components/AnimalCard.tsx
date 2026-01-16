'use client';

import Link from 'next/link';
import { Animal } from '@/types';

interface AnimalCardProps {
  animal: Animal;
}

export default function AnimalCard({ animal }: AnimalCardProps) {
  const categoryIcons: Record<string, string> = {
    cattle: '🐄',
    goat: '🐐',
    sheep: '🐑',
    poultry: '🐔',
    pig: '🐷',
  };

  return (
    <Link href={`/animals/${animal.id}`}>
      <div className="bg-white rounded-lg shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden hover:-translate-y-1 cursor-pointer group h-full flex flex-col">
        {/* Image Container */}
        <div className="relative w-full aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
          {animal.image_url ? (
            <img
              src={animal.image_url}
              alt={animal.breed}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
          {!animal.image_url && (
            <div className="text-4xl">{categoryIcons[animal.type] || '🐾'}</div>
          )}
          {animal.available_count === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white font-bold text-lg">Out of Stock</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Breed and Category */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{categoryIcons[animal.type] || '🐾'}</span>
            <div className="flex-grow">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{animal.type}</p>
              <h3 className="font-bold text-lg text-gray-900">{animal.breed}</h3>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <span>📅 {animal.age_months}m old</span>
            <span>⚖️ {animal.weight_kg}kg</span>
            <span>👥 {animal.gender}</span>
            <span>📦 {animal.available_count} avail.</span>
          </div>

          {/* Price */}
          <div className="flex-grow"></div>
          <p className="text-2xl font-bold text-green-700 mb-3">₹{animal.price.toLocaleString()}</p>

          {/* Button */}
          <button 
            onClick={(e) => {
              e.preventDefault();
            }}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            View Details →
          </button>
        </div>
      </div>
    </Link>
  );
}
