'use client';

import { useState } from 'react';

export default function ImageTestPage() {
  const [imageStatus, setImageStatus] = useState<string>('Not loaded');
  const [heroImageStatus, setHeroImageStatus] = useState<string>('Not loaded');

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Image System Test</h1>
      
      {/* Test 1: Direct SVG fallback */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test 1: Direct SVG Fallback</h2>
        <p className="mb-2">Status: {imageStatus}</p>
        <div className="w-64 h-48 border border-gray-300 bg-white">
          <img 
            src="/images/hero-fallback.svg" 
            alt="Direct SVG test"
            className="w-full h-full object-cover"
            onLoad={() => {
              console.log('Direct SVG loaded successfully');
              setImageStatus('Loaded successfully');
            }}
            onError={(e) => {
              console.error('Direct SVG failed to load:', e);
              setImageStatus('Failed to load');
            }}
          />
        </div>
      </div>

      {/* Test 2: Try different image */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test 2: Category Fallback SVG</h2>
        <p className="mb-2">Status: {heroImageStatus}</p>
        <div className="w-64 h-48 border border-gray-300 bg-white">
          <img 
            src="/images/category-farms-fallback.svg" 
            alt="Category SVG test"
            className="w-full h-full object-cover"
            onLoad={() => {
              console.log('Category SVG loaded successfully');
              setHeroImageStatus('Loaded successfully');
            }}
            onError={(e) => {
              console.error('Category SVG failed to load:', e);
              setHeroImageStatus('Failed to load');
            }}
          />
        </div>
      </div>

      {/* Test 3: Check if files exist */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test 3: File Existence Check</h2>
        <div className="space-y-2">
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/images/hero-fallback.svg');
                console.log('hero-fallback.svg status:', response.status, response.statusText);
                if (response.ok) {
                  const text = await response.text();
                  console.log('hero-fallback.svg content length:', text.length);
                  console.log('hero-fallback.svg first 100 chars:', text.substring(0, 100));
                }
              } catch (err) {
                console.error('hero-fallback.svg error:', err);
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Check hero-fallback.svg
          </button>
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/images/category-farms-fallback.svg');
                console.log('category-farms-fallback.svg status:', response.status, response.statusText);
                if (response.ok) {
                  const text = await response.text();
                  console.log('category-farms-fallback.svg content length:', text.length);
                }
              } catch (err) {
                console.error('category-farms-fallback.svg error:', err);
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Check category-farms-fallback.svg
          </button>
        </div>
      </div>

      {/* Console output area */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <p className="text-gray-600 mb-4">
          Open browser console (F12) to see debug output. Check if images load and what errors occur.
        </p>
        <p className="text-gray-600">
          Visit: <a href="http://localhost:3000/image-test" className="text-blue-500 underline">http://localhost:3000/image-test</a>
        </p>
      </div>
    </div>
  );
}