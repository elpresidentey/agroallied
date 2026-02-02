'use client';

/**
 * HeroImage - React component for hero section images
 * Provides dynamic loading, fallback support, theme rotation, and responsive sizing
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HeroImageProps, ImageResult, ImageError, ImageErrorType } from '../types';
import { ImageService } from '../services/image-service';
import { CategoryMatcher } from '../services/category-matcher';

interface ThemeRotationConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  themes: string[];
}

export const HeroImage: React.FC<HeroImageProps> = ({
  theme,
  fallbackImage = '/images/hero-fallback.svg',
  onImageLoad,
  onImageError,
  className = ''
}) => {
  console.log('🚀 HeroImage component initialized with theme:', theme);
  
  const [image, setImage] = useState<ImageResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ImageError | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string | undefined>(theme);
  const [dominantColor, setDominantColor] = useState<string>('#000000');
  const [isClient, setIsClient] = useState(false);
  
  // Use refs to avoid recreating services and prevent race conditions
  const isLoadingRef = useRef(false);
  const imageServiceRef = useRef<ImageService | null>(null);
  const categoryMatcherRef = useRef<CategoryMatcher | null>(null);
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize services once
  if (!imageServiceRef.current) {
    console.log('🔧 Creating ImageService instance...');
    imageServiceRef.current = new ImageService();
  }
  
  if (!categoryMatcherRef.current) {
    categoryMatcherRef.current = new CategoryMatcher();
  }

  // Handle client-side hydration
  useEffect(() => {
    console.log('🌐 HeroImage: Setting isClient to true');
    setIsClient(true);
  }, []);

  // Theme rotation configuration
  const themeRotation: ThemeRotationConfig = {
    enabled: !theme, // Only rotate if no specific theme is provided
    interval: 10000, // 10 seconds
    themes: categoryMatcherRef.current?.getHeroThemes() || []
  };

  const loadImage = useCallback(async (abortSignal?: AbortSignal) => {
    if (!isClient) {
      console.log('🚫 HeroImage: Skipping load - not client-side yet');
      return; // Don't load images during SSR
    }
    
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('🚫 HeroImage: Skipping load - already loading');
      return;
    }
    
    // Check if operation was cancelled before starting
    if (abortSignal?.aborted) {
      console.log('🚫 HeroImage: Skipping load - operation aborted');
      return;
    }
    
    console.log('🖼️ HeroImage: Starting image load...', { currentTheme, isClient });
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    setImageLoaded(false);

    try {
      console.log('📡 HeroImage: Calling imageService.getHeroImage with theme:', currentTheme);
      const result = await imageServiceRef.current!.getHeroImage(currentTheme);
      
      // Check if operation was cancelled after async operation
      if (abortSignal?.aborted) {
        console.log('🚫 HeroImage: Operation cancelled after API call');
        return;
      }
      
      console.log('✅ HeroImage: Got image result:', {
        id: result.id,
        source: result.source,
        url: result.url.substring(0, 50) + '...'
      });
      
      setImage(result);
      
      // Extract dominant color for contrast calculation
      if (result.metadata.dominantColors && result.metadata.dominantColors.length > 0) {
        setDominantColor(result.metadata.dominantColors[0]);
      }
      
      onImageLoad?.(result);
    } catch (err) {
      // Don't set error if operation was cancelled
      if (abortSignal?.aborted) {
        console.log('🚫 HeroImage: Error handling skipped - operation cancelled');
        return;
      }
      
      // Don't show abort errors to users
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🚫 HeroImage: Abort error ignored');
        return;
      }
      
      console.error('❌ HeroImage: Image load failed:', err);
      
      const imageError: ImageError = {
        code: ImageErrorType.API_UNAVAILABLE,
        message: err instanceof Error ? err.message : 'Failed to load hero image',
        retryable: true,
        fallbackStrategy: 'placeholder'
      };
      setError(imageError);
      onImageError?.(imageError);
    } finally {
      // Only update loading state if not cancelled
      if (!abortSignal?.aborted) {
        setIsLoading(false);
        console.log('🏁 HeroImage: Load operation completed');
      }
      isLoadingRef.current = false;
    }
  }, [currentTheme, onImageLoad, onImageError, isClient]);

  // Theme rotation logic
  const startThemeRotation = useCallback(() => {
    if (!themeRotation.enabled || themeRotation.themes.length <= 1) {
      return;
    }

    rotationIntervalRef.current = setInterval(() => {
      setCurrentTheme(prevTheme => {
        const currentIndex = themeRotation.themes.findIndex(t => t === prevTheme);
        const nextIndex = (currentIndex + 1) % themeRotation.themes.length;
        return themeRotation.themes[nextIndex];
      });
    }, themeRotation.interval);
  }, [themeRotation]);

  const stopThemeRotation = useCallback(() => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const abortController = new AbortController();
    loadImage(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [loadImage, isClient]);

  useEffect(() => {
    if (themeRotation.enabled) {
      startThemeRotation();
    }

    return () => {
      stopThemeRotation();
    };
  }, [startThemeRotation, stopThemeRotation, themeRotation.enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopThemeRotation();
    };
  }, [stopThemeRotation]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(false);
  };

  const getImageUrl = (): string => {
    if (image && !error) {
      return image.url;
    }
    return fallbackImage;
  };

  const getAltText = (): string => {
    if (image && !error) {
      return image.altText || 'Agricultural landscape';
    }
    return 'Agricultural landscape - AgroLink farms';
  };

  const getAttribution = (): string => {
    if (image && image.attribution.required && !error) {
      return `Photo by ${image.attribution.photographer}`;
    }
    return '';
  };

  const getAttributionLink = (): string => {
    if (image && image.attribution.required && !error) {
      return image.attribution.photographerUrl || image.attribution.sourceUrl || '';
    }
    return '';
  };

  // Calculate luminance for contrast checking
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  // Calculate contrast ratio and determine overlay
  const getOverlayClass = (): string => {
    const luminance = getLuminance(dominantColor);
    
    // If the image is light (high luminance), use dark overlay
    // If the image is dark (low luminance), use light overlay
    if (luminance > 0.5) {
      return 'bg-black/50'; // Dark overlay for light images
    } else {
      return 'bg-black/30'; // Lighter overlay for dark images
    }
  };

  // Get text color class based on background
  const getTextColorClass = (): string => {
    const luminance = getLuminance(dominantColor);
    return luminance > 0.5 ? 'text-gray-900' : 'text-white';
  };

  // Responsive image sizing
  const getResponsiveClasses = (): string => {
    return `
      w-full h-full object-cover transition-all duration-500
      ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
    `;
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={getImageUrl()}
          alt={getAltText()}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={getResponsiveClasses()}
          loading="eager" // Hero images should load immediately
        />
        
        {/* Loading placeholder with theme indicator */}
        {(isLoading || !imageLoaded) && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200 animate-pulse">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-green-600 text-lg font-medium mb-2">
                Loading agricultural imagery...
              </div>
              {currentTheme && (
                <div className="text-green-500 text-sm capitalize">
                  Theme: {currentTheme.replace(/[-_]/g, ' ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic overlay for text contrast */}
        <div className={`absolute inset-0 ${getOverlayClass()}`} />
      </div>

      {/* Theme rotation indicator */}
      {themeRotation.enabled && !isLoading && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-white font-medium capitalize">
                {currentTheme?.replace(/[-_]/g, ' ') || 'Auto'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Attribution */}
      {getAttribution() && (
        <div className="absolute bottom-2 right-2 z-10">
          {getAttributionLink() ? (
            <a
              href={getAttributionLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/90 hover:text-white bg-black/30 hover:bg-black/40 px-2 py-1 rounded backdrop-blur-sm transition-all duration-200"
            >
              {getAttribution()}
            </a>
          ) : (
            <span className="text-xs text-white/90 bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
              {getAttribution()}
            </span>
          )}
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-red-500/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            Using fallback image
          </div>
        </div>
      )}

      {/* Retry button for failed loads */}
      {error && error.retryable && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => loadImage()}
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded backdrop-blur-sm transition-colors duration-200 hover:scale-105"
          >
            Retry
          </button>
        </div>
      )}

      {/* Accessibility: Screen reader info */}
      <div className="sr-only">
        {currentTheme && `Current theme: ${currentTheme}`}
        {themeRotation.enabled && 'Theme rotation enabled'}
      </div>
    </div>
  );
};