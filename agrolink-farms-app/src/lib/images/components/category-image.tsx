'use client';

/**
 * CategoryImage - React component for category-specific images
 * Provides lazy loading, responsive sizing, and category-matched imagery
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CategoryImageProps, ImageResult, ImageError, ImageErrorType } from '../types';
import { ImageService } from '../services/image-service';
import { AttributionManager } from '../services/attribution-manager';

export const CategoryImage: React.FC<CategoryImageProps> = ({
  category,
  size = 'medium',
  lazy = true,
  fallbackImage,
  showAttribution = false,
  className = ''
}) => {
  const [image, setImage] = useState<ImageResult | null>(null);
  const [isLoading, setIsLoading] = useState(!lazy);
  const [error, setError] = useState<ImageError | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [isClient, setIsClient] = useState(false);

  const imageRef = useRef<HTMLDivElement>(null);
  const imageService = new ImageService();
  const attributionManager = new AttributionManager();

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView || !isClient) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setIsLoading(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy, isInView, isClient]);

  const loadImage = useCallback(async () => {
    if (!isInView || !isClient) return; // Don't load images during SSR

    setError(null);

    try {
      const results = await imageService.getCategoryImages(category, 1);
      if (results.length > 0) {
        setImage(results[0]);
        // Track usage for attribution
        await attributionManager.trackUsage(results[0]);
      } else {
        throw new Error('No images found for category');
      }
    } catch (err) {
      const imageError: ImageError = {
        code: ImageErrorType.API_UNAVAILABLE,
        message: err instanceof Error ? err.message : 'Failed to load category image',
        retryable: true,
        fallbackStrategy: 'placeholder'
      };
      setError(imageError);
    } finally {
      setIsLoading(false);
    }
  }, [category, isInView, isClient]);

  useEffect(() => {
    if (isInView && isClient) {
      loadImage();
    }
  }, [loadImage, isInView, isClient]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(false);
  };

  const getImageUrl = (): string => {
    if (image && !error) {
      // Use appropriate size based on component size prop
      switch (size) {
        case 'small':
          return image.thumbnailUrl;
        case 'large':
          return image.url;
        case 'medium':
        default:
          return image.url; // Could add medium size URL if available
      }
    }
    return fallbackImage || `/images/category-${category}-fallback.svg`;
  };

  const getAltText = (): string => {
    if (image && !error) {
      return image.altText || `${category} farming`;
    }
    return `${category} farming - AgroLink`;
  };

  const getSizeClasses = (): string => {
    switch (size) {
      case 'small':
        return 'w-16 h-16 sm:w-20 sm:h-20';
      case 'large':
        return 'w-full h-48 sm:h-56 md:h-64';
      case 'medium':
      default:
        return 'w-full h-32 sm:h-40';
    }
  };

  const getLoadingClasses = (): string => {
    return `
      ${getSizeClasses()}
      ${imageLoaded ? 'opacity-100' : 'opacity-0'}
      transition-opacity duration-300 object-cover rounded-lg
    `;
  };

  return (
    <div 
      ref={imageRef}
      className={`relative overflow-hidden rounded-lg ${getSizeClasses()} ${className}`}
    >
      {/* Main Image */}
      {isInView && (
        <img
          src={getImageUrl()}
          alt={getAltText()}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={getLoadingClasses()}
          loading={lazy ? 'lazy' : 'eager'}
        />
      )}

      {/* Loading Placeholder */}
      {(isLoading || !imageLoaded) && (
        <div className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-lg ${getSizeClasses()}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-400 text-xs font-medium capitalize">
              {isLoading ? 'Loading...' : category}
            </div>
          </div>
        </div>
      )}

      {/* Category Label Overlay */}
      {size !== 'small' && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-lg">
          <h3 className="text-white font-semibold text-sm capitalize">
            {category.replace(/[-_]/g, ' ')}
          </h3>
        </div>
      )}

      {/* Attribution */}
      {showAttribution && image && image.attribution.required && (
        <div className="absolute top-1 right-1">
          <div className="bg-black/50 text-white text-xs px-1 py-0.5 rounded backdrop-blur-sm">
            <a
              href={attributionManager.getAttributionLink(image)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300"
            >
              📷
            </a>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center">
          <div className="text-center p-2">
            <div className="text-red-400 text-xs mb-1">Image unavailable</div>
            {error.retryable && (
              <button
                onClick={loadImage}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lazy Loading Indicator */}
      {lazy && !isInView && (
        <div className={`bg-gray-100 rounded-lg ${getSizeClasses()} flex items-center justify-center`}>
          <div className="text-gray-400 text-xs">
            Scroll to load
          </div>
        </div>
      )}
    </div>
  );
};