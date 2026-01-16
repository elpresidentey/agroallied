import Image from 'next/image';
import Link from 'next/link';
import { Farm } from '@/types';

interface FarmCardProps {
  farm: Farm;
  animalCount?: number;
}

export default function FarmCard({ farm, animalCount = 0 }: FarmCardProps) {
  return (
    <Link href={`/farms/${farm.id}`}>
      <div className="card hover:shadow-medium transition-all duration-300 cursor-pointer group">
        {/* Header with verification badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-secondary transition-colors">
              {farm.name}
            </h3>
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              📍 {farm.location}
            </p>
          </div>
          {farm.verified && (
            <div
              className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2"
              title="Farm verified"
            >
              ✓ Verified
            </div>
          )}
        </div>

        {/* Description */}
        {farm.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{farm.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-t border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Active Listings</p>
            <p className="font-bold text-lg text-secondary">{animalCount}</p>
          </div>
          {farm.rating && (
            <div>
              <p className="text-xs text-gray-500">Rating</p>
              <div className="flex items-center gap-1">
                <span className="font-bold text-lg">⭐</span>
                <span className="font-bold text-lg text-secondary">{farm.rating.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Certification */}
        {/* Certification field removed from schema */}

        {/* CTA Button */}
        <button className="w-full bg-secondary-lighter text-secondary font-medium py-2 rounded-lg hover:bg-secondary hover:text-white transition-colors text-sm">
          View Farm
        </button>
      </div>
    </Link>
  );
}
