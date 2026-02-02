import { NextResponse } from 'next/server';
import { ImageService } from '@/lib/images/services/image-service';

export async function POST() {
  try {
    console.log('🧹 Clearing image cache...');
    
    const imageService = new ImageService();
    await imageService.clearCache();
    
    console.log('✅ Image cache cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Image cache cleared successfully'
    });
    
  } catch (error) {
    console.error('❌ Failed to clear image cache:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}