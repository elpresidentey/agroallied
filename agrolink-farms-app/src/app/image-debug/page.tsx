'use client';

import { HeroImage } from '@/lib/images/components';

export default function ImageDebugPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Image Debug - Final Test</h1>
      
      {/* Test the HeroImage component */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">HeroImage Component Test</h2>
        <div className="w-full h-64 border border-gray-300 bg-white rounded-lg overflow-hidden">
          <HeroImage 
            className="w-full h-full"
            fallbackImage="/images/hero-fallback.svg"
          />
        </div>
      </div>

      {/* Test direct SVG loading */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Direct SVG Test</h2>
        <div className="w-full h-64 border border-gray-300 bg-white rounded-lg overflow-hidden">
          <img 
            src="/images/hero-fallback.svg" 
            alt="Direct SVG test"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Image Integration System Status</h3>
        <ul className="text-green-700 space-y-1">
          <li>• External APIs disabled (using fallback SVGs)</li>
          <li>• HeroImage component integrated</li>
          <li>• Fallback images configured</li>
          <li>• Error boundaries in place</li>
          <li>• Caching system ready</li>
        </ul>
      </div>
    </div>
  );
}