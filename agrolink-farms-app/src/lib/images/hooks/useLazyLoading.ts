/**
 * Custom hook for lazy loading with Intersection Observer
 * Provides reusable lazy loading functionality for image components
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadingOptions {
  enabled?: boolean;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

interface UseLazyLoadingReturn {
  ref: React.RefObject<HTMLElement | null>;
  isInView: boolean;
  hasBeenInView: boolean;
}

export const useLazyLoading = (options: UseLazyLoadingOptions = {}): UseLazyLoadingReturn => {
  const {
    enabled = true,
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true
  } = options;

  const [isInView, setIsInView] = useState(!enabled);
  const [hasBeenInView, setHasBeenInView] = useState(!enabled);
  const ref = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !ref.current) {
      return;
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const inView = entry.isIntersecting;
          setIsInView(inView);
          
          if (inView && !hasBeenInView) {
            setHasBeenInView(true);
            
            // If triggerOnce is true, stop observing after first intersection
            if (triggerOnce && observerRef.current) {
              observerRef.current.unobserve(entry.target);
            }
          }
        });
      },
      {
        rootMargin,
        threshold
      }
    );

    // Start observing
    observerRef.current.observe(ref.current);

    // Cleanup on unmount
    return cleanup;
  }, [enabled, rootMargin, threshold, triggerOnce, hasBeenInView, cleanup]);

  // Cleanup on options change
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ref,
    isInView,
    hasBeenInView
  };
};

/**
 * Hook for progressive image loading with placeholder states
 */
interface UseProgressiveImageOptions {
  src: string;
  placeholderSrc?: string;
  lazy?: boolean;
  lazyOptions?: UseLazyLoadingOptions;
}

interface UseProgressiveImageReturn {
  ref: React.RefObject<HTMLElement>;
  currentSrc: string;
  isLoading: boolean;
  hasLoaded: boolean;
  hasError: boolean;
  shouldLoad: boolean;
}

export const useProgressiveImage = (options: UseProgressiveImageOptions): UseProgressiveImageReturn => {
  const { src, placeholderSrc, lazy = true, lazyOptions = {} } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || '');
  
  const { ref, isInView, hasBeenInView } = useLazyLoading({
    enabled: lazy,
    ...lazyOptions
  });

  const shouldLoad = !lazy || hasBeenInView;

  // Load image when it should be loaded
  useEffect(() => {
    if (!shouldLoad || !src || hasLoaded) {
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setHasLoaded(true);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      // Keep placeholder or fallback to empty string
      if (!placeholderSrc) {
        setCurrentSrc('');
      }
    };
    
    img.src = src;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [shouldLoad, src, hasLoaded, placeholderSrc]);

  return {
    ref,
    currentSrc,
    isLoading,
    hasLoaded,
    hasError,
    shouldLoad
  };
};

/**
 * Hook for preloading critical images
 */
interface UseImagePreloadOptions {
  images: string[];
  priority?: 'high' | 'low';
}

interface UseImagePreloadReturn {
  preloadedImages: Set<string>;
  isPreloading: boolean;
  preloadProgress: number;
}

export const useImagePreload = (options: UseImagePreloadOptions): UseImagePreloadReturn => {
  const { images, priority = 'low' } = options;
  
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);

  useEffect(() => {
    if (images.length === 0) {
      return;
    }

    setIsPreloading(true);
    setPreloadProgress(0);
    
    let loadedCount = 0;
    const totalImages = images.length;
    const newPreloadedImages = new Set<string>();

    const updateProgress = () => {
      loadedCount++;
      const progress = (loadedCount / totalImages) * 100;
      setPreloadProgress(progress);
      
      if (loadedCount === totalImages) {
        setIsPreloading(false);
        setPreloadedImages(newPreloadedImages);
      }
    };

    // Preload images
    images.forEach((src) => {
      const img = new Image();
      
      // Set priority hint if supported
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = priority;
      }
      
      img.onload = () => {
        newPreloadedImages.add(src);
        updateProgress();
      };
      
      img.onerror = () => {
        // Still count as "loaded" for progress tracking
        updateProgress();
      };
      
      img.src = src;
    });

  }, [images, priority]);

  return {
    preloadedImages,
    isPreloading,
    preloadProgress
  };
};

/**
 * Hook for responsive image loading based on viewport size
 */
interface UseResponsiveImageOptions {
  srcSet: {
    small: string;
    medium: string;
    large: string;
  };
  breakpoints?: {
    small: number;
    medium: number;
  };
}

interface UseResponsiveImageReturn {
  currentSrc: string;
  currentSize: 'small' | 'medium' | 'large';
}

export const useResponsiveImage = (options: UseResponsiveImageOptions): UseResponsiveImageReturn => {
  const { 
    srcSet, 
    breakpoints = { small: 640, medium: 1024 } 
  } = options;
  
  const [currentSize, setCurrentSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [currentSrc, setCurrentSrc] = useState(srcSet.medium);

  useEffect(() => {
    const updateImageSize = () => {
      const width = window.innerWidth;
      
      if (width < breakpoints.small) {
        setCurrentSize('small');
        setCurrentSrc(srcSet.small);
      } else if (width < breakpoints.medium) {
        setCurrentSize('medium');
        setCurrentSrc(srcSet.medium);
      } else {
        setCurrentSize('large');
        setCurrentSrc(srcSet.large);
      }
    };

    // Set initial size
    updateImageSize();

    // Listen for resize events
    window.addEventListener('resize', updateImageSize);
    
    return () => {
      window.removeEventListener('resize', updateImageSize);
    };
  }, [srcSet, breakpoints]);

  return {
    currentSrc,
    currentSize
  };
};