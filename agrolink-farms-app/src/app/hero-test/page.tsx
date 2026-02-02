'use client';

import { HeroImage } from '@/lib/images/components/hero-image';

export default function HeroTest() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Hero Image Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Direct HeroImage Component Test</h2>
          <p className="text-gray-600 mb-4">
            This should load a real image from Unsplash API. Check the browser console for debug logs.
          </p>
          
          <div className="w-full h-96 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            <HeroImage 
              className="w-full h-full"
              fallbackImage="/images/hero-fallback.svg"
              onImageLoad={(result) => {
                console.log('🎉 HeroImage loaded successfully:', result);
              }}
              onImageError={(error) => {
                console.error('💥 HeroImage failed to load:', error);
              }}
            />
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold mb-2">Debug Instructions:</h3>
          <ol className="text-yellow-700 text-sm space-y-1">
            <li>1. Open browser developer tools (F12)</li>
            <li>2. Go to the Console tab</li>
            <li>3. Look for debug messages starting with 🖼️, 📡, ✅, or ❌</li>
            <li>4. If you see "Using fallback hero image", the API isn't working</li>
            <li>5. If you see "Hero image fetched from Unsplash", the API is working!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}