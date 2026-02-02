'use client';

import Link from 'next/link';
import { Animal } from '@/types';
import { CategoryImage, CategoryImageErrorBoundary } from '@/lib/images/components';

interface AnimalCardProps {
  animal: Animal;
}

export default function AnimalCard({ animal }: AnimalCardProps) {
  return (
    <Link href={`/animals/${animal.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group h-full flex flex-col">
        {/* Image Container */}
        <div className="relative w-full h-48 overflow-hidden bg-gray-100">
          <CategoryImageErrorBoundary category={animal.type}>
            <CategoryImage
              category={animal.type}
              size="medium"
              lazy={true}
              showAttribution={false}
              className="w-full h-full"
            />
          </CategoryImageErrorBoundary>
          {animal.status === 'sold' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white font-bold text-lg">Sold Out</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Breed and Category */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{animal.type}</p>
            <h3 className="font-bold text-lg text-gray-900">{animal.breed}</h3>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <span>Age: {animal.age} months</span>
            <span>Status: {animal.status}</span>
          </div>

          {/* Description */}
          {animal.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{animal.description}</p>
          )}

          {/* Price */}
          <div className="flex-grow"></div>
          <p className="text-2xl font-bold text-green-600 mb-3">₹{animal.price.toLocaleString()}</p>

          {/* Button */}
          <button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
}
