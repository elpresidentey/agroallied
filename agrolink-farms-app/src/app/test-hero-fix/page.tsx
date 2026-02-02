'use client';

import { useState, useEffect } from 'react';
import { HeroImage } from '@/lib/images/components/hero-image';

export default function TestHeroFix() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    // Add initial test message
    addResult('🚀 Test page loaded, HeroImage component should initialize...');
    
    // Set loading to false after a short delay to see if component loads
    const timer = setTimeout(() => {
      setIsLoading(false);
      addResult('⏰ Initial loading period complete');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleImageLoad = (result: any) => {
    addResult(`✅ SUCCESS: Image loaded from ${result.source}`);
    addResult(`📸 Image URL: ${result.url.substring(0, 60)}...`);
    addResult(`👤 Photographer: ${result.attribution.photographer}`);
  };

  const handleImageError = (error: any) => {
    addResult(`❌ ERROR: ${error.message}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Hero Image Fix Test</h1>
        
        {/* Test Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Status</h2>
          <div className="bg-gray-50 rounded p-4 max-h-60 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono mb-1 text-gray-700">
                {result}
              </div>
            ))}
          </div>
        </div>

        {/* Hero Image Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Hero Image Component</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden" style={{ height: '300px' }}>
            <HeroImage
              theme="golden wheat fields"
              onImageLoad={handleImageLoad}
              onImageError={handleImageError}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Expected Results */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-800 font-semibold mb-3">Expected Results:</h3>
          <div className="space-y-2 text-blue-700 text-sm">
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>Component initializes and shows loading state</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>Real Unsplash photo loads (not SVG fallback)</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>Success message appears in test status</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>Photographer attribution is visible</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">ℹ️</span>
              <span>Check browser console for detailed logs (F12)</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold mb-2">Instructions:</h3>
          <p className="text-yellow-700 text-sm">
            1. Watch the test status above for success/error messages<br/>
            2. Look for a real photo (not green SVG) in the image area<br/>
            3. Open browser DevTools (F12) to see detailed console logs<br/>
            4. If you see a real photo and success messages, the fix worked! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}