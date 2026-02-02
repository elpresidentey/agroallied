/**
 * Basic tests for ImageService implementation
 * Tests the core functionality implemented in task 2.1
 */

import { ImageService } from '../services/image-service';
import { ImageErrorHandler } from '../utils/error-handler';
import { ImageErrorType } from '../types';

// Mock the configuration to avoid API key validation
jest.mock('../config', () => ({
  ImageConfigManager: {
    getInstance: () => ({
      isFeatureEnabled: (feature: string) => {
        // Disable API features for testing, enable caching
        if (feature === 'enableUnsplash' || feature === 'enablePexels') {
          return false;
        }
        return true;
      },
      getCacheConfig: () => ({
        defaultTTL: 24 * 60 * 60 * 1000,
        maxSize: 100,
        evictionPolicy: 'lru'
      }),
      getFallbackImages: () => ({
        hero: '/images/hero-fallback.svg',
        category: '/images/category-farms-fallback.svg',
        section: '/images/section-featured-farms-fallback.svg'
      }),
      getAdminConfig: () => ({
        enableConfigUI: false,
        enableMetrics: false,
        enableLogging: false,
        logLevel: 'error'
      })
    })
  }
}));

// Mock the cache and category matcher since they're not implemented yet
jest.mock('../services/image-cache', () => ({
  ImageCache: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('../services/category-matcher', () => ({
  CategoryMatcher: jest.fn().mockImplementation(() => ({}))
}));

describe('ImageService Basic Tests', () => {
  let imageService: ImageService;

  beforeEach(() => {
    imageService = new ImageService();
  });

  describe('getHeroImage', () => {
    it('should return a fallback image when called', async () => {
      const result = await imageService.getHeroImage();
      
      expect(result).toBeDefined();
      expect(result.id).toContain('fallback-hero');
      expect(result.source).toBe('fallback');
      expect(result.altText).toContain('Agricultural hero image');
      expect(result.metadata).toBeDefined();
      expect(result.attribution).toBeDefined();
    });

    it('should return a themed fallback image when theme is provided', async () => {
      const result = await imageService.getHeroImage('livestock');
      
      expect(result).toBeDefined();
      expect(result.id).toContain('fallback-hero');
      expect(result.id).toContain('livestock');
      expect(result.altText).toContain('livestock');
    });
  });

  describe('getCategoryImages', () => {
    it('should return the requested number of fallback images', async () => {
      const count = 3;
      const results = await imageService.getCategoryImages('crops', count);
      
      expect(results).toHaveLength(count);
      results.forEach((result, index) => {
        expect(result.id).toContain('fallback-category');
        expect(result.id).toContain('crops');
        expect(result.id).toContain(index.toString());
        expect(result.source).toBe('fallback');
      });
    });

    it('should handle invalid count gracefully', async () => {
      const results = await imageService.getCategoryImages('livestock', 0);
      expect(results).toHaveLength(0);
    });
  });

  describe('getSectionImage', () => {
    it('should return a fallback image for section', async () => {
      const result = await imageService.getSectionImage('features');
      
      expect(result).toBeDefined();
      expect(result.id).toContain('fallback-section');
      expect(result.id).toContain('features');
      expect(result.source).toBe('fallback');
    });
  });

  describe('preloadImages', () => {
    it('should complete without errors for valid queries', async () => {
      const queries = ['agriculture', 'farming', 'livestock'];
      
      await expect(imageService.preloadImages(queries)).resolves.not.toThrow();
    });

    it('should handle empty queries array', async () => {
      await expect(imageService.preloadImages([])).resolves.not.toThrow();
    });
  });

  describe('clearCache', () => {
    it('should complete without errors', async () => {
      await expect(imageService.clearCache()).resolves.not.toThrow();
    });
  });
});

describe('ImageErrorHandler Basic Tests', () => {
  describe('createError', () => {
    it('should create a proper ImageError', () => {
      const error = ImageErrorHandler.createError(
        ImageErrorType.API_UNAVAILABLE,
        'Test error message',
        'unsplash'
      );

      expect(error.code).toBe(ImageErrorType.API_UNAVAILABLE);
      expect(error.message).toBe('Test error message');
      expect(error.source).toBe('unsplash');
      expect(error.retryable).toBe(true);
      expect(error.fallbackStrategy).toBe('alternative_api');
    });
  });

  describe('isRetryable', () => {
    it('should correctly identify retryable errors', () => {
      const retryableError = ImageErrorHandler.createError(
        ImageErrorType.NETWORK_ERROR,
        'Network error'
      );
      expect(ImageErrorHandler.isRetryable(retryableError)).toBe(true);

      const nonRetryableError = ImageErrorHandler.createError(
        ImageErrorType.VALIDATION_ERROR,
        'Validation error'
      );
      expect(ImageErrorHandler.isRetryable(nonRetryableError)).toBe(false);
    });
  });

  describe('getFallbackStrategy', () => {
    it('should return correct fallback strategies', () => {
      const apiError = ImageErrorHandler.createError(
        ImageErrorType.API_UNAVAILABLE,
        'API down',
        'unsplash'
      );
      expect(ImageErrorHandler.getFallbackStrategy(apiError)).toBe('alternative_api');

      const cacheError = ImageErrorHandler.createError(
        ImageErrorType.CACHE_ERROR,
        'Cache error'
      );
      expect(ImageErrorHandler.getFallbackStrategy(cacheError)).toBe('alternative_api');
    });
  });
});