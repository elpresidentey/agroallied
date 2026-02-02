'use client';

import { useState, useEffect } from 'react';
import { ImageService } from '@/lib/images/services/image-service';
import { ImageConfigManager } from '@/lib/images/config';

export default function ImageDebugAPI() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [imageResult, setImageResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get configuration info
    const config = ImageConfigManager.getInstance().getConfig();
    setDebugInfo({
      unsplashEnabled: config.features.enableUnsplash,
      unsplashConfigured: !!config.apis.unsplash.accessKey,
      unsplashAccessKey: config.apis.unsplash.accessKey ? 
        config.apis.unsplash.accessKey.substring(0, 10) + '...' : 'Not set',
      pexelsEnabled: config.features.enablePexels,
      pexelsConfigured: !!config.apis.pexels.apiKey,
      cachingEnabled: config.features.enableCaching,
      config: config
    });
  }, []);

  const testImageService = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const imageService = new ImageService();
      console.log('Testing image service...');
      
      const result = await imageService.getHeroImage('agriculture');
      console.log('Image result:', result);
      
      setImageResult(result);
    } catch (err) {
      console.error('Image service error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Image API Debug</h1>
        
        {/* Configuration Debug */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Unsplash Enabled:</strong> {debugInfo.unsplashEnabled ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Unsplash Configured:</strong> {debugInfo.unsplashConfigured ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Unsplash Key:</strong> {debugInfo.unsplashAccessKey}
            </div>
            <div>
              <strong>Pexels Enabled:</strong> {debugInfo.pexelsEnabled ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Pexels Configured:</strong> {debugInfo.pexelsConfigured ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Caching Enabled:</strong> {debugInfo.cachingEnabled ? '✅ Yes' : '❌ No'}
            </div>
          </div>
        </div>

        {/* Test Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Image Service</h2>
          <button
            onClick={testImageService}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Hero Image'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Image Result */}
        {imageResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Image Result</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Image Preview</h3>
                <img 
                  src={imageResult.url} 
                  alt={imageResult.altText}
                  className="w-full h-48 object-cover rounded border"
                  onError={(e) => {
                    console.error('Image failed to load:', imageResult.url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <p className="text-sm text-gray-600 mt-2">{imageResult.altText}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Details</h3>
                <div className="text-sm space-y-1">
                  <div><strong>ID:</strong> {imageResult.id}</div>
                  <div><strong>Source:</strong> {imageResult.source}</div>
                  <div><strong>URL:</strong> <a href={imageResult.url} target="_blank" className="text-blue-500 hover:underline break-all">{imageResult.url}</a></div>
                  {imageResult.attribution && (
                    <div><strong>Attribution:</strong> {imageResult.attribution.photographer}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Raw Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Raw Configuration</h2>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(debugInfo.config, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}