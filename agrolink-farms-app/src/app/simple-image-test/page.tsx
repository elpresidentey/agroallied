'use client';

import { useState, useEffect } from 'react';
import { ImageService } from '@/lib/images/services/image-service';

export default function SimpleImageTest() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testImageService = async () => {
    setLoading(true);
    setError('');
    setImageUrl('');

    try {
      console.log('🧪 Testing ImageService directly...');
      const imageService = new ImageService();
      const result = await imageService.getHeroImage('agriculture');
      
      console.log('✅ Got image result:', result);
      setImageUrl(result.url);
    } catch (err) {
      console.error('❌ ImageService test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatically test when component mounts
    console.log('🚀 Component mounted, testing ImageService...');
    testImageService();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Image Service Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Direct ImageService Call</h2>
            <button
              onClick={testImageService}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Again'}
            </button>
          </div>
          
          {loading && (
            <div className="text-blue-600 mb-4">Loading image from Unsplash...</div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <div className="text-red-800 font-semibold">Error:</div>
              <div className="text-red-700">{error}</div>
            </div>
          )}
          
          {imageUrl && (
            <div className="space-y-4">
              <div className="text-green-600 font-semibold">✅ Success! Got real image from Unsplash:</div>
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="Test image from Unsplash"
                  className="w-full h-64 object-cover"
                  onLoad={() => console.log('🖼️ Image loaded successfully in browser')}
                  onError={() => console.error('❌ Image failed to load in browser')}
                />
              </div>
              <div className="text-sm text-gray-600 break-all">
                <strong>URL:</strong> {imageUrl}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold mb-2">What this test does:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Directly calls ImageService.getHeroImage() from the browser</li>
            <li>• Bypasses all React component complexity</li>
            <li>• Shows the actual image URL returned by the service</li>
            <li>• Displays the image if the URL is valid</li>
          </ul>
        </div>
      </div>
    </div>
  );
}