'use client';

/**
 * SectionBackground - React component for section background images
 * Provides background images with overlay support and consistent sizing
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SectionBackgroundProps, ImageResult, ImageError, ImageErrorType } from '../types';
import { ImageService } from '../services/image-service';
import { AttributionManager } from '../services/attribution-manager';

export const SectionBackground: React.FC<SectionBackgroundProps> = ({
  section,
  overlay = true,
  overlayOpacity = 0.4,
  children,
  className = ''
}) => {
  const [image, setImage] = useState<ImageResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ImageError | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const imageService = new ImageService();
  const attributionManager = new AttributionManager();

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadImage = useCallback(async () => {
    if (!isClient) return; // Don't load images during SSR
    
    setIsLoading(true);
    setError(null);
    setImageLoaded(false);

    try {
      const result = await imageService.getSectionImage(section);
      setImage(result);
      // Track usage for attribution
      await attributionManager.trackUsage(result);
    } catch (err) {
      const imageError: ImageError = {
        code: ImageErrorType.API_UNAVAILABLE,
        message: err instanceof Error ? err.message : 'Failed to load section image',
        retryable: true,
        fallbackStrategy: 'placeholder'
      };
      setError(imageError);
    } finally {
      setIsLoading(false);
    }
  }, [section, isClient]);

  useEffect(() => {
    if (isClient) {
      loadImage();
    }
  }, [loadImage, isClient]);

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
    return `/images/section-${section}-fallback.svg`;
  };

  const getAltText = (): string => {
    if (image && !error) {
      return image.altText || `${section} section background`;
    }
    return `${section} section - Agricultural background`;
  };

  const getOverlayClass = (): string => {
    if (!overlay) return '';
    
    const opacity = Math.max(0, Math.min(1, overlayOpacity));
    const opacityClass = Math.round(opacity * 100);
    
    return `bg-black/${opacityClass}`;
  };

  const getBackgroundStyles = (): React.CSSProperties => {
    if (!image || error || !imageLoaded) {
      return {
        backgroundImage: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }

    return {
      backgroundImage: `url(${getImageUrl()})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed' // Parallax effect
    };
  };

  return (
    <div 
      className={`relative min-h-[400px] ${className}`}
      style={getBackgroundStyles()}
    >
      {/* Hidden img for proper loading and accessibility */}
      <img
        src={getImageUrl()}
        alt={getAltText()}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className="sr-only"
        loading="lazy"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500 text-lg font-medium capitalize">
              Loading {section} section...
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {overlay && imageLoaded && !error && (
        <div className={`absolute inset-0 ${getOverlayClass()}`} />
      )}

      {/* Content Container */}
      <div className="relative z-10 min-h-[400px] flex flex-col justify-center">
        {children}
      </div>

      {/* Attribution */}
      {image && image.attribution.required && !error && (
        <div className="absolute bottom-2 right-2 z-20">
          <div className="bg-black/30 backdrop-blur-sm rounded px-2 py-1">
            {attributionManager.getAttributionLink(image) ? (
              <a
                href={attributionManager.getAttributionLink(image)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/90 hover:text-white transition-colors"
              >
                {attributionManager.formatAttribution(image)}
              </a>
            ) : (
              <span className="text-xs text-white/90">
                {attributionManager.formatAttribution(image)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute top-2 left-2 z-20">
          <div className="bg-yellow-500/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            Using fallback background
          </div>
        </div>
      )}

      {/* Retry Button */}
      {error && error.retryable && (
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={loadImage}
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded backdrop-blur-sm transition-colors"
          >
            Retry Image
          </button>
        </div>
      )}

      {/* Section Identifier (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 z-20">
          <div className="bg-blue-500/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            Section: {section}
          </div>
        </div>
      )}
    </div>
  );
};