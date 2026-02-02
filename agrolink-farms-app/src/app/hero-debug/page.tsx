'use client';

import { HeroImage } from '@/lib/images/components/hero-image';
import { useState } from 'react';

export default function HeroDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleImageLoad = (result: any) => {
    addLog(`✅ Image loaded: ${result.source} - ${result.url.substring(0, 50)}...`);
  };

  const handleImageError = (error: any) => {
    addLog(`❌ Image error: ${error.message}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Hero Image Debug Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hero Image Display */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Hero Image Component</h2>
            <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <HeroImage
                theme="golden wheat fields"
                onImageLoad={handleImageLoad}
                onImageError={handleImageError}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Debug Logs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Debug Logs</h2>
              <button
                onClick={clearLogs}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
              >
                Clear
              </button>
            </div>
            
            <div className="bg-gray-50 rounded p-4 h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-sm">No logs yet...</div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono text-gray-700">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold mb-2">What to expect:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Component should initialize and show "Starting image load..."</li>
            <li>• Should call ImageService.getHeroImage() with theme</li>
            <li>• Should display a real Unsplash photo (not SVG fallback)</li>
            <li>• Should show attribution for the photographer</li>
            <li>• Check browser console for detailed logs</li>
          </ul>
        </div>

        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-green-800 font-semibold mb-2">Browser Console Instructions:</h3>
          <p className="text-green-700 text-sm">
            Open browser DevTools (F12) and check the Console tab for detailed logs starting with 🚀, 🖼️, 📡, ✅, etc.
          </p>
        </div>
      </div>
    </div>
  );
}