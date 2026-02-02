/**
 * ImageService - Core orchestration service for image operations
 * Implements main orchestration methods with error handling and logging
 * Requirements: 1.1, 1.2, 7.2
 */

import { 
  ImageService as IImageService, 
  ImageResult, 
  ImageError, 
  ImageErrorType,
  ImageMetadata,
  Attribution,
  APIImageResult
} from '../types';
import { ImageConfigManager } from '../config';
import { ImageErrorHandler } from '../utils/error-handler';
import { CategoryMatcher } from './category-matcher';
import { ImageCache } from './image-cache';
import { ImageLogger, createLogContext, trackPerformance } from '../utils/logger';
import { UnsplashAdapter } from '../adapters/unsplash-adapter';
import { PexelsAdapter } from '../adapters/pexels-adapter';

export class ImageService implements IImageService {
  private config: ImageConfigManager;
  private categoryMatcher: CategoryMatcher;
  private imageCache: ImageCache;
  private logger: ImageLogger;
  private unsplashAdapter: UnsplashAdapter | null = null;
  private pexelsAdapter: PexelsAdapter | null = null;

  constructor() {
    this.config = ImageConfigManager.getInstance();
    this.categoryMatcher = new CategoryMatcher();
    this.imageCache = new ImageCache();
    this.logger = ImageLogger.getInstance();
    
    // Initialize API adapters if enabled and configured
    this.initializeAdapters();
  }

  /**
   * Initialize API adapters based on configuration
   */
  private initializeAdapters(): void {
    const config = this.config.getConfig();
    
    console.log('🔧 Initializing API adapters...');
    console.log('- Unsplash enabled:', config.features.enableUnsplash);
    console.log('- Unsplash API enabled:', config.apis.unsplash.enabled);
    console.log('- Unsplash access key:', config.apis.unsplash.accessKey ? 'Present' : 'Missing');
    
    // Initialize Unsplash adapter
    if (config.features.enableUnsplash && config.apis.unsplash.enabled && config.apis.unsplash.accessKey) {
      try {
        this.unsplashAdapter = new UnsplashAdapter(
          config.apis.unsplash.accessKey,
          config.apis.unsplash.baseUrl,
          config.apis.unsplash.rateLimit
        );
        console.log('✅ Unsplash adapter initialized successfully');
        this.logger.info('Unsplash adapter initialized successfully', { operation: 'initializeAdapters', component: 'ImageService' });
      } catch (error) {
        console.error('❌ Failed to initialize Unsplash adapter:', error);
        this.logger.error('Failed to initialize Unsplash adapter', { operation: 'initializeAdapters', component: 'ImageService' }, error instanceof Error ? error : undefined);
      }
    } else {
      console.log('⚠️ Unsplash adapter not initialized - requirements not met');
    }
    
    // Initialize Pexels adapter
    if (config.features.enablePexels && config.apis.pexels.enabled && config.apis.pexels.apiKey) {
      try {
        this.pexelsAdapter = new PexelsAdapter(
          config.apis.pexels.apiKey,
          config.apis.pexels.baseUrl,
          config.apis.pexels.rateLimit
        );
        console.log('✅ Pexels adapter initialized successfully');
        this.logger.info('Pexels adapter initialized successfully', { operation: 'initializeAdapters', component: 'ImageService' });
      } catch (error) {
        console.error('❌ Failed to initialize Pexels adapter:', error);
        this.logger.error('Failed to initialize Pexels adapter', { operation: 'initializeAdapters', component: 'ImageService' }, error instanceof Error ? error : undefined);
      }
    } else {
      console.log('⚠️ Pexels adapter not initialized - requirements not met');
    }
    
    console.log('🔧 API adapter initialization complete');
  }

  /**
   * Get a hero image for the landing page
   * Requirements: 1.1, 1.2, 7.2
   */
  async getHeroImage(theme?: string): Promise<ImageResult> {
    const context = createLogContext('getHeroImage', 'ImageService', { 
      imageId: `hero-${theme || 'default'}` 
    });
    
    this.logger.info(`Getting hero image with theme: ${theme}`, context);

    try {
      // Generate cache key
      const cacheKey = `hero:${theme || 'default'}`;
      
      // Try to get from cache first
      if (this.config.isFeatureEnabled('enableCaching')) {
        try {
          const cached = await this.imageCache.get(cacheKey);
          if (cached) {
            this.logger.info('Hero image served from cache', context, { cacheKey });
            return cached.imageResult;
          }
        } catch (cacheError) {
          this.logger.warn('Cache lookup failed for hero image', context, cacheError instanceof Error ? cacheError : undefined);
          // Continue with API fetch
        }
      }

      // Try to get image from API adapters
      let apiResult: APIImageResult | null = null;
      
      console.log('🖼️ Attempting to fetch hero image from APIs...');
      console.log('- Unsplash adapter available:', !!this.unsplashAdapter);
      console.log('- Pexels adapter available:', !!this.pexelsAdapter);
      
      // Try Unsplash first if available
      if (this.unsplashAdapter) {
        try {
          console.log('📡 Fetching from Unsplash...');
          this.logger.info('Attempting to fetch hero image from Unsplash', context);
          const heroImages = await this.unsplashAdapter.getHeroImages(1);
          if (heroImages.length > 0) {
            apiResult = heroImages[0];
            console.log('✅ Hero image fetched from Unsplash:', apiResult.urls.small);
            this.logger.info('Hero image fetched from Unsplash successfully', context);
          }
        } catch (error) {
          console.error('❌ Unsplash hero image fetch failed:', error);
          this.logger.warn('Unsplash hero image fetch failed, trying fallback', context, error instanceof Error ? error : undefined);
        }
      }
      
      // Try Pexels if Unsplash failed and Pexels is available
      if (!apiResult && this.pexelsAdapter) {
        try {
          console.log('📡 Fetching from Pexels...');
          this.logger.info('Attempting to fetch hero image from Pexels', context);
          const heroImages = await this.pexelsAdapter.searchAgricultural('hero', { count: 1 });
          if (heroImages.length > 0) {
            apiResult = heroImages[0];
            console.log('✅ Hero image fetched from Pexels:', apiResult.urls.small);
            this.logger.info('Hero image fetched from Pexels successfully', context);
          }
        } catch (error) {
          console.error('❌ Pexels hero image fetch failed:', error);
          this.logger.warn('Pexels hero image fetch failed, using fallback', context, error instanceof Error ? error : undefined);
        }
      }

      let finalResult: ImageResult;
      
      if (apiResult) {
        // Transform API result to ImageResult
        console.log('🎯 Using API result for hero image');
        finalResult = this.transformAPIResult(apiResult, 'unsplash');
      } else {
        // Use fallback image
        console.log('🎨 Using fallback hero image');
        this.logger.info('Using fallback hero image', context);
        finalResult = this.createFallbackImage('hero', theme);
      }
      
      // Cache the result if caching is enabled
      if (this.config.isFeatureEnabled('enableCaching')) {
        try {
          await this.imageCache.set(cacheKey, {
            imageResult: finalResult,
            cachedAt: new Date(),
            expiresAt: new Date(Date.now() + this.config.getCacheConfig().defaultTTL),
            accessCount: 1,
            lastAccessed: new Date()
          }, this.config.getCacheConfig().defaultTTL);
          
          this.logger.debug('Hero image cached successfully', context, { cacheKey });
        } catch (cacheError) {
          this.logger.warn('Failed to cache hero image', context, cacheError instanceof Error ? cacheError : undefined);
          // Continue without caching
        }
      }

      this.logger.info('Hero image served successfully', context, { 
        source: finalResult.source,
        imageId: finalResult.id 
      });
      return finalResult;

    } catch (error) {
      this.logger.error('Hero image fetch failed', context, error instanceof Error ? error : undefined);
      
      // Return fallback image as last resort
      return this.createFallbackImage('hero', theme);
    }
  }

  /**
   * Get multiple images for a specific category
   * Requirements: 1.1, 1.2, 7.2
   */
  async getCategoryImages(category: string, count: number): Promise<ImageResult[]> {
    const context = createLogContext('getCategoryImages', 'ImageService', { 
      category
    });
    
    this.logger.info(`Getting ${count} images for category: ${category}`, context);

    try {
      // Validate input
      if (count <= 0) {
        throw new Error('Count must be greater than 0');
      }

      const results: ImageResult[] = [];
      
      // Generate cache keys for each requested image
      for (let i = 0; i < count; i++) {
        const cacheKey = `category:${category}:${i}`;
        
        // Try cache first
        if (this.config.isFeatureEnabled('enableCaching')) {
          try {
            const cached = await this.imageCache.get(cacheKey);
            if (cached) {
              results.push(cached.imageResult);
              this.logger.debug(`Category image ${i} served from cache`, context, { cacheKey });
              continue;
            }
          } catch (cacheError) {
            this.logger.warn(`Cache lookup failed for category image ${i}`, context, cacheError instanceof Error ? cacheError : undefined);
          }
        }

        // For now, create fallback images since API adapters aren't implemented
        const fallbackImage = this.createFallbackImage('category', category, i);
        results.push(fallbackImage);

        // Cache the result
        if (this.config.isFeatureEnabled('enableCaching')) {
          try {
            await this.imageCache.set(cacheKey, {
              imageResult: fallbackImage,
              cachedAt: new Date(),
              expiresAt: new Date(Date.now() + this.config.getCacheConfig().defaultTTL),
              accessCount: 1,
              lastAccessed: new Date()
            }, this.config.getCacheConfig().defaultTTL);
            
            this.logger.debug(`Category image ${i} cached successfully`, context, { cacheKey });
          } catch (cacheError) {
            this.logger.warn(`Failed to cache category image ${i}`, context, cacheError instanceof Error ? cacheError : undefined);
          }
        }
      }

      this.logger.info(`Category images served successfully`, context, { 
        requestedCount: count,
        actualCount: results.length,
        category 
      });
      return results;

    } catch (error) {
      const imageError = ImageErrorHandler.createError(
        ImageErrorType.API_UNAVAILABLE,
        `Failed to get category images: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error instanceof Error ? error : undefined
      );
      
      this.logger.error('Category images fetch failed', context, error instanceof Error ? error : undefined);
      
      // Return fallback images
      const fallbackImages: ImageResult[] = [];
      for (let i = 0; i < count; i++) {
        fallbackImages.push(this.createFallbackImage('category', category, i));
      }
      return fallbackImages;
    }
  }

  /**
   * Get a single image for a page section
   * Requirements: 1.1, 1.2, 7.2
   */
  async getSectionImage(section: string): Promise<ImageResult> {
    const context = createLogContext('getSectionImage', 'ImageService', { 
      section,
      imageId: `section-${section}` 
    });
    
    this.logger.info(`Getting section image for: ${section}`, context);

    try {
      const cacheKey = `section:${section}`;
      
      // Try cache first
      if (this.config.isFeatureEnabled('enableCaching')) {
        try {
          const cached = await this.imageCache.get(cacheKey);
          if (cached) {
            this.logger.info('Section image served from cache', context, { cacheKey });
            return cached.imageResult;
          }
        } catch (cacheError) {
          this.logger.warn('Cache lookup failed for section image', context, cacheError instanceof Error ? cacheError : undefined);
        }
      }

      // For now, return fallback image since API adapters aren't implemented
      const fallbackImage = this.createFallbackImage('section', section);
      
      // Cache the result
      if (this.config.isFeatureEnabled('enableCaching')) {
        try {
          await this.imageCache.set(cacheKey, {
            imageResult: fallbackImage,
            cachedAt: new Date(),
            expiresAt: new Date(Date.now() + this.config.getCacheConfig().defaultTTL),
            accessCount: 1,
            lastAccessed: new Date()
          }, this.config.getCacheConfig().defaultTTL);
          
          this.logger.debug('Section image cached successfully', context, { cacheKey });
        } catch (cacheError) {
          this.logger.warn('Failed to cache section image', context, cacheError instanceof Error ? cacheError : undefined);
        }
      }

      this.logger.info('Section image served successfully', context, { 
        source: fallbackImage.source,
        imageId: fallbackImage.id 
      });
      return fallbackImage;

    } catch (error) {
      const imageError = ImageErrorHandler.createError(
        ImageErrorType.API_UNAVAILABLE,
        `Failed to get section image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error instanceof Error ? error : undefined
      );
      
      this.logger.error('Section image fetch failed', context, error instanceof Error ? error : undefined);
      
      // Return fallback image
      return this.createFallbackImage('section', section);
    }
  }

  /**
   * Preload images for better performance
   * Requirements: 1.1, 1.2, 7.2
   */
  async preloadImages(queries: string[]): Promise<void> {
    const context = createLogContext('preloadImages', 'ImageService');
    
    this.logger.info(`Preloading ${queries.length} images`, context, { queries });

    try {
      // Validate input
      if (!Array.isArray(queries) || queries.length === 0) {
        this.logger.warn('No queries provided for preloading', context);
        return;
      }

      const preloadPromises = queries.map(async (query, index) => {
        try {
          const cacheKey = `preload:${query}`;
          
          // Check if already cached
          if (this.config.isFeatureEnabled('enableCaching')) {
            const cached = await this.imageCache.get(cacheKey);
            if (cached) {
              this.logger.debug(`Query "${query}" already cached`, context, { query, index });
              return;
            }
          }

          // For now, create and cache fallback images
          const fallbackImage = this.createFallbackImage('preload', query, index);
          
          if (this.config.isFeatureEnabled('enableCaching')) {
            await this.imageCache.set(cacheKey, {
              imageResult: fallbackImage,
              cachedAt: new Date(),
              expiresAt: new Date(Date.now() + this.config.getCacheConfig().defaultTTL),
              accessCount: 0,
              lastAccessed: new Date()
            }, this.config.getCacheConfig().defaultTTL);
          }

          this.logger.debug(`Preloaded image for query: ${query}`, context, { query, index });
        } catch (error) {
          this.logger.warn(`Failed to preload image for query "${query}"`, context, { 
            query, 
            index, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          // Continue with other queries
        }
      });

      await Promise.allSettled(preloadPromises);
      this.logger.info('Preloading completed successfully', context, { totalQueries: queries.length });

    } catch (error) {
      this.logger.error('Preloading failed', context, error instanceof Error ? error : undefined);
      // Don't throw error for preloading failures
    }
  }

  /**
   * Clear the image cache
   * Requirements: 1.1, 1.2, 7.2
   */
  async clearCache(): Promise<void> {
    const context = createLogContext('clearCache', 'ImageService');
    
    this.logger.info('Clearing image cache', context);

    try {
      if (this.config.isFeatureEnabled('enableCaching')) {
        await this.imageCache.clear();
        this.logger.info('Cache cleared successfully', context);
      } else {
        this.logger.info('Caching is disabled, no cache to clear', context);
      }
    } catch (error) {
      const imageError = ImageErrorHandler.createError(
        ImageErrorType.CACHE_ERROR,
        `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'cache',
        error instanceof Error ? error : undefined
      );
      
      this.logger.error('Cache clear failed', context, error instanceof Error ? error : undefined);
      throw imageError;
    }
  }

  /**
   * Transform API result to ImageResult format
   * Private helper method for converting API responses to our standard format
   */
  private transformAPIResult(apiResult: APIImageResult, source: 'unsplash' | 'pexels'): ImageResult {
    const timestamp = Date.now();
    const uniqueId = `api-${source}-${apiResult.id}-${timestamp}`;
    
    // Use the regular size URL for main image, small for thumbnail
    const imageUrl = apiResult.urls.regular || apiResult.urls.full || apiResult.urls.raw;
    const thumbnailUrl = apiResult.urls.small || apiResult.urls.thumb || imageUrl;
    
    const metadata: ImageMetadata = {
      width: 1200, // Default dimensions, could be extracted from API if available
      height: 800,
      aspectRatio: 1.5,
      dominantColors: ['#4a5568', '#68d391'], // Default colors, could be extracted from API
      tags: apiResult.tags || [],
      downloadUrl: apiResult.urls.raw || apiResult.urls.full,
      apiId: apiResult.id,
      fetchedAt: new Date()
    };

    const attribution: Attribution = {
      photographer: apiResult.photographer.name,
      photographerUrl: apiResult.photographer.url,
      source: source,
      sourceUrl: apiResult.photographer.url,
      required: true // API images require attribution
    };

    return {
      id: uniqueId,
      url: imageUrl,
      thumbnailUrl: thumbnailUrl,
      altText: apiResult.description || `Agricultural image by ${apiResult.photographer.name}`,
      attribution,
      source: source,
      metadata
    };
  }

  /**
   * Create a fallback image result
   * Private helper method for generating fallback images
   */
  private createFallbackImage(type: string, context?: string, index?: number): ImageResult {
    const fallbackImages = this.config.getFallbackImages();
    const timestamp = Date.now();
    const uniqueId = `fallback-${type}-${context || 'default'}-${index || 0}-${timestamp}`;
    
    let fallbackUrl: string;
    switch (type) {
      case 'hero':
        fallbackUrl = fallbackImages.hero;
        break;
      case 'category':
        fallbackUrl = fallbackImages.category;
        break;
      case 'section':
        fallbackUrl = fallbackImages.section;
        break;
      default:
        fallbackUrl = fallbackImages.section;
    }

    const metadata: ImageMetadata = {
      width: 1200,
      height: 800,
      aspectRatio: 1.5,
      dominantColors: ['#4a5568', '#68d391'],
      tags: ['agriculture', 'farming', 'fallback'],
      downloadUrl: fallbackUrl,
      apiId: uniqueId,
      fetchedAt: new Date()
    };

    const attribution: Attribution = {
      photographer: 'AgroLink',
      photographerUrl: '',
      source: 'fallback',
      sourceUrl: '',
      required: false
    };

    return {
      id: uniqueId,
      url: fallbackUrl,
      thumbnailUrl: fallbackUrl,
      altText: `Agricultural ${type} image${context ? ` for ${context}` : ''}`,
      attribution,
      source: 'fallback',
      metadata
    };
  }
}