import { NextResponse } from 'next/server';
import { ImageService } from '@/lib/images/services/image-service';
import { ImageConfigManager } from '@/lib/images/config';

export async function GET() {
  try {
    console.log('🧪 Testing image service API endpoint...');
    
    // Get configuration
    const config = ImageConfigManager.getInstance().getConfig();
    console.log('Configuration:', {
      unsplashEnabled: config.features.enableUnsplash,
      unsplashConfigured: !!config.apis.unsplash.accessKey,
      unsplashAccessKey: config.apis.unsplash.accessKey ? 
        config.apis.unsplash.accessKey.substring(0, 10) + '...' : 'Not set'
    });
    
    // Test image service
    const imageService = new ImageService();
    console.log('🖼️ Calling getHeroImage...');
    
    const result = await imageService.getHeroImage('agriculture');
    console.log('✅ Image service result:', {
      id: result.id,
      source: result.source,
      url: result.url.substring(0, 50) + '...',
      altText: result.altText
    });
    
    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        source: result.source,
        url: result.url,
        altText: result.altText,
        attribution: result.attribution
      },
      config: {
        unsplashEnabled: config.features.enableUnsplash,
        unsplashConfigured: !!config.apis.unsplash.accessKey
      }
    });
    
  } catch (error) {
    console.error('❌ Image service test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}