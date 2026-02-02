/**
 * Integration test for Task 1 - Project structure and core types
 * Verifies that all main exports are available and properly typed
 */

// Test that all main exports are available
import {
  // Types
  ImageResult,
  ImageMetadata,
  Attribution,
  ImageService as IImageService,
  CategoryMatcher as ICategoryMatcher,
  ImageCache as IImageCache,
  AttributionManager as IAttributionManager,
  ImageAPIAdapter as IImageAPIAdapter,
  SearchOptions,
  APIImageResult,
  RateLimitInfo,
  CachedImage,
  CacheStats,
  CategoryMapping,
  AttributionReport,
  ImageErrorType,
  ImageError,
  HeroImageProps,
  CategoryImageProps,
  SectionBackgroundProps,
  
  // Configuration
  getImageConfig,
  isImageFeatureEnabled,
  getImageCategoryMappings,
  getImageAPIConfig,
  
  // Services (implementations)
  ImageServiceImpl as ImageService,
  CategoryMatcherImpl as CategoryMatcher,
  ImageCacheImpl as ImageCache,
  AttributionManagerImpl as AttributionManager,
  
  // Adapters (implementations)
  ImageAPIAdapterImpl as ImageAPIAdapter,
  UnsplashAdapter,
  PexelsAdapter,
  
  // Components (placeholder implementations)
  HeroImage,
  CategoryImage,
  SectionBackground,
  
} from '../index';

// Test utilities
import {
  createMockImageResult,
  createMockAPIImageResult,
  createMockCachedImage
} from '../test-utils/test-utils';

// Mock environment variables for testing
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    UNSPLASH_ACCESS_KEY: 'test-unsplash-key',
    PEXELS_API_KEY: 'test-pexels-key'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Image Integration System - Task 1 Integration', () => {
  describe('Type exports', () => {
    it('should export all core types', () => {
      // Test that types are available (TypeScript compilation test)
      expect(ImageErrorType.API_AUTHENTICATION).toBe('API_AUTHENTICATION');
      expect(ImageErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ImageErrorType.CACHE_ERROR).toBe('CACHE_ERROR');
    });
  });

  describe('Configuration exports', () => {
    it('should export configuration functions', () => {
      expect(typeof getImageConfig).toBe('function');
      expect(typeof isImageFeatureEnabled).toBe('function');
      expect(typeof getImageCategoryMappings).toBe('function');
      expect(typeof getImageAPIConfig).toBe('function');
    });

    it('should provide working configuration', () => {
      const config = getImageConfig();
      expect(config).toBeDefined();
      expect(config.apis.unsplash.accessKey).toBe('test-unsplash-key');
      expect(config.apis.pexels.apiKey).toBe('test-pexels-key');
    });
  });

  describe('Service class exports', () => {
    it('should export service classes', () => {
      expect(ImageService).toBeDefined();
      expect(CategoryMatcher).toBeDefined();
      expect(ImageCache).toBeDefined();
      expect(AttributionManager).toBeDefined();
    });

    it('should be able to instantiate service classes', () => {
      const imageService = new ImageService();
      const categoryMatcher = new CategoryMatcher();
      const imageCache = new ImageCache();
      const attributionManager = new AttributionManager();

      expect(imageService).toBeInstanceOf(ImageService);
      expect(categoryMatcher).toBeInstanceOf(CategoryMatcher);
      expect(imageCache).toBeInstanceOf(ImageCache);
      expect(attributionManager).toBeInstanceOf(AttributionManager);
    });
  });

  describe('Adapter class exports', () => {
    it('should export adapter classes', () => {
      expect(ImageAPIAdapter).toBeDefined();
      expect(UnsplashAdapter).toBeDefined();
      expect(PexelsAdapter).toBeDefined();
    });

    it('should be able to instantiate adapter classes', () => {
      const unsplashAdapter = new UnsplashAdapter();
      const pexelsAdapter = new PexelsAdapter();

      expect(unsplashAdapter).toBeInstanceOf(UnsplashAdapter);
      expect(unsplashAdapter).toBeInstanceOf(ImageAPIAdapter);
      expect(pexelsAdapter).toBeInstanceOf(PexelsAdapter);
      expect(pexelsAdapter).toBeInstanceOf(ImageAPIAdapter);
    });
  });

  describe('Component exports', () => {
    it('should export React components', () => {
      expect(HeroImage).toBeDefined();
      expect(CategoryImage).toBeDefined();
      expect(SectionBackground).toBeDefined();
    });
  });

  describe('Test utility exports', () => {
    it('should export test utilities', () => {
      expect(typeof createMockImageResult).toBe('function');
      expect(typeof createMockAPIImageResult).toBe('function');
      expect(typeof createMockCachedImage).toBe('function');
    });

    it('should create valid mock objects', () => {
      const mockImageResult = createMockImageResult();
      const mockAPIImageResult = createMockAPIImageResult();
      const mockCachedImage = createMockCachedImage();

      expect(mockImageResult.id).toBeDefined();
      expect(mockImageResult.url).toBeDefined();
      expect(mockImageResult.attribution).toBeDefined();
      expect(mockImageResult.metadata).toBeDefined();

      expect(mockAPIImageResult.id).toBeDefined();
      expect(mockAPIImageResult.urls).toBeDefined();
      expect(mockAPIImageResult.photographer).toBeDefined();

      expect(mockCachedImage.imageResult).toBeDefined();
      expect(mockCachedImage.cachedAt).toBeInstanceOf(Date);
      expect(mockCachedImage.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('Directory structure validation', () => {
    it('should have proper module organization', () => {
      // This test validates that our module structure is working
      // by ensuring we can import from different subdirectories
      
      // Services should be available
      expect(ImageService).toBeDefined();
      
      // Adapters should be available
      expect(UnsplashAdapter).toBeDefined();
      
      // Components should be available
      expect(HeroImage).toBeDefined();
      
      // Configuration should be available
      const config = getImageConfig();
      expect(config.categories).toHaveLength(6);
    });
  });
});