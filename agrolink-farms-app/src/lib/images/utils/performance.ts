/**
 * Performance optimization utilities for image loading
 * Integrates with caching system and provides preloading strategies
 */

import { ImageService } from '../services/image-service';
import { ImageCache } from '../services/image-cache';
import { CategoryMatcher } from '../services/category-matcher';
import { ImageResult } from '../types';

export class ImagePerformanceOptimizer {
  private imageService: ImageService;
  private imageCache: ImageCache;
  private categoryMatcher: CategoryMatcher;
  private preloadQueue: Set<string> = new Set();
  private isPreloading: boolean = false;

  constructor(
    imageService?: ImageService,
    imageCache?: ImageCache,
    categoryMatcher?: CategoryMatcher
  ) {
    this.imageService = imageService || new ImageService();
    this.imageCache = imageCache || new ImageCache();
    this.categoryMatcher = categoryMatcher || new CategoryMatcher();
  }

  /**
   * Preload critical images for immediate display
   */
  async preloadCriticalImages(categories: string[] = []): Promise<void> {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    
    try {
      const preloadPromises: Promise<void>[] = [];
      
      // Preload hero image
      preloadPromises.push(this.preloadHeroImage());
      
      // Preload category images
      for (const category of categories) {
        preloadPromises.push(this.preloadCategoryImage(category));
      }
      
      await Promise.allSettled(preloadPromises);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Preload hero image
   */
  private async preloadHeroImage(): Promise<void> {
    try {
      const heroImage = await this.imageService.getHeroImage();
      await this.preloadImageUrl(heroImage.url);
    } catch (error) {
      console.warn('Failed to preload hero image:', error);
    }
  }

  /**
   * Preload category image
   */
  private async preloadCategoryImage(category: string): Promise<void> {
    try {
      const images = await this.imageService.getCategoryImages(category, 1);
      if (images.length > 0) {
        await this.preloadImageUrl(images[0].url);
      }
    } catch (error) {
      console.warn(`Failed to preload category image for ${category}:`, error);
    }
  }

  /**
   * Preload image URL
   */
  private async preloadImageUrl(url: string): Promise<void> {
    if (this.preloadQueue.has(url)) return;
    
    this.preloadQueue.add(url);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.preloadQueue.delete(url);
        resolve();
      };
      
      img.onerror = () => {
        this.preloadQueue.delete(url);
        reject(new Error(`Failed to preload image: ${url}`));
      };
      
      // Set high priority for critical images
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = 'high';
      }
      
      img.src = url;
    });
  }

  /**
   * Optimize image loading based on connection speed
   */
  getOptimalImageSize(): 'small' | 'medium' | 'large' {
    // Check for Network Information API support
    const connection = (navigator as any).connection;
    
    if (!connection) {
      return 'medium'; // Default fallback
    }
    
    const { effectiveType, downlink } = connection;
    
    // Slow connections (2G, slow 3G)
    if (effectiveType === '2g' || (effectiveType === '3g' && downlink < 1.5)) {
      return 'small';
    }
    
    // Fast connections (4G, fast 3G)
    if (effectiveType === '4g' || downlink > 5) {
      return 'large';
    }
    
    // Medium connections
    return 'medium';
  }

  /**
   * Batch load images with priority queue
   */
  async batchLoadImages(
    requests: Array<{ category?: string; section?: string; theme?: string }>,
    maxConcurrent: number = 3
  ): Promise<ImageResult[]> {
    const results: ImageResult[] = [];
    const queue = [...requests];
    const inProgress: Promise<ImageResult | null>[] = [];

    while (queue.length > 0 || inProgress.length > 0) {
      // Start new requests up to the concurrent limit
      while (inProgress.length < maxConcurrent && queue.length > 0) {
        const request = queue.shift()!;
        const promise = this.loadSingleImage(request);
        inProgress.push(promise);
      }

      // Wait for at least one request to complete
      const completed = await Promise.race(inProgress);
      const completedIndex = inProgress.findIndex(p => p === Promise.resolve(completed));
      inProgress.splice(completedIndex, 1);

      if (completed) {
        results.push(completed);
      }
    }

    return results;
  }

  /**
   * Load single image based on request type
   */
  private async loadSingleImage(
    request: { category?: string; section?: string; theme?: string }
  ): Promise<ImageResult | null> {
    try {
      if (request.category) {
        const images = await this.imageService.getCategoryImages(request.category, 1);
        return images[0] || null;
      }
      
      if (request.section) {
        return await this.imageService.getSectionImage(request.section);
      }
      
      if (request.theme !== undefined) {
        return await this.imageService.getHeroImage(request.theme);
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to load image:', error);
      return null;
    }
  }

  /**
   * Intelligent cache warming based on user behavior
   */
  async warmCache(userPreferences?: {
    favoriteCategories?: string[];
    viewedSections?: string[];
    preferredThemes?: string[];
  }): Promise<void> {
    const warmingPromises: Promise<void>[] = [];

    // Warm cache with favorite categories
    if (userPreferences?.favoriteCategories) {
      for (const category of userPreferences.favoriteCategories) {
        warmingPromises.push(this.warmCategoryCache(category));
      }
    }

    // Warm cache with common themes
    const commonThemes = this.categoryMatcher.getHeroThemes().slice(0, 3);
    for (const theme of commonThemes) {
      warmingPromises.push(this.warmThemeCache(theme));
    }

    await Promise.allSettled(warmingPromises);
  }

  /**
   * Warm cache for specific category
   */
  private async warmCategoryCache(category: string): Promise<void> {
    try {
      await this.imageService.getCategoryImages(category, 2);
    } catch (error) {
      console.warn(`Failed to warm cache for category ${category}:`, error);
    }
  }

  /**
   * Warm cache for specific theme
   */
  private async warmThemeCache(theme: string): Promise<void> {
    try {
      await this.imageService.getHeroImage(theme);
    } catch (error) {
      console.warn(`Failed to warm cache for theme ${theme}:`, error);
    }
  }

  /**
   * Monitor and optimize cache performance
   */
  async optimizeCachePerformance(): Promise<{
    hitRate: number;
    recommendations: string[];
  }> {
    const stats = await this.imageCache.getStats();
    const recommendations: string[] = [];

    // Analyze hit rate
    if (stats.hitRate < 0.6) {
      recommendations.push('Consider increasing cache size or TTL');
    }

    if (stats.hitRate > 0.9) {
      recommendations.push('Cache is performing well, consider reducing size if memory is constrained');
    }

    // Check eviction rate
    if (stats.evictionCount > stats.size * 0.5) {
      recommendations.push('High eviction rate detected, consider increasing cache size');
    }

    // Memory usage recommendations
    if (stats.totalSize && stats.totalSize > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Cache size is large, consider implementing size-based eviction');
    }

    return {
      hitRate: stats.hitRate,
      recommendations
    };
  }

  /**
   * Adaptive loading strategy based on viewport and device
   */
  getAdaptiveLoadingStrategy(): {
    shouldPreload: boolean;
    maxConcurrent: number;
    preferredSize: 'small' | 'medium' | 'large';
    lazyLoadThreshold: string;
  } {
    const isLowEndDevice = this.isLowEndDevice();
    const isSlowConnection = this.isSlowConnection();
    const isMobile = this.isMobileDevice();

    return {
      shouldPreload: !isLowEndDevice && !isSlowConnection,
      maxConcurrent: isLowEndDevice ? 1 : isMobile ? 2 : 3,
      preferredSize: this.getOptimalImageSize(),
      lazyLoadThreshold: isSlowConnection ? '100px' : '50px'
    };
  }

  /**
   * Detect low-end device
   */
  private isLowEndDevice(): boolean {
    // Check for device memory API
    const memory = (navigator as any).deviceMemory;
    if (memory && memory < 4) {
      return true;
    }

    // Check for hardware concurrency
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return true;
    }

    return false;
  }

  /**
   * Detect slow connection
   */
  private isSlowConnection(): boolean {
    const connection = (navigator as any).connection;
    if (!connection) return false;

    return connection.effectiveType === '2g' || 
           (connection.effectiveType === '3g' && connection.downlink < 1.5);
  }

  /**
   * Detect mobile device
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.preloadQueue.clear();
    this.isPreloading = false;
  }
}