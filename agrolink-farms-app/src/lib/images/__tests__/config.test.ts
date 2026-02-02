/**
 * Basic configuration loading test for Task 1
 * Tests that the configuration system can be instantiated and basic functionality works
 */

import { ImageConfigManager, getImageConfig, isImageFeatureEnabled } from '../config';

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

describe('ImageConfigManager', () => {
  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = ImageConfigManager.getInstance();
      const instance2 = ImageConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getConfig', () => {
    it('should return a valid configuration object', () => {
      const config = getImageConfig();
      
      expect(config).toBeDefined();
      expect(config.apis).toBeDefined();
      expect(config.apis.unsplash).toBeDefined();
      expect(config.apis.pexels).toBeDefined();
      expect(config.cache).toBeDefined();
      expect(config.categories).toBeDefined();
      expect(config.fallbackImages).toBeDefined();
      expect(config.features).toBeDefined();
      expect(config.performance).toBeDefined();
    });

    it('should have default category mappings', () => {
      const config = getImageConfig();
      
      expect(config.categories).toHaveLength(6);
      expect(config.categories.some(c => c.category === 'livestock')).toBe(true);
      expect(config.categories.some(c => c.category === 'crops')).toBe(true);
      expect(config.categories.some(c => c.category === 'equipment')).toBe(true);
      expect(config.categories.some(c => c.category === 'farms')).toBe(true);
      expect(config.categories.some(c => c.category === 'hero')).toBe(true);
      expect(config.categories.some(c => c.category === 'general')).toBe(true);
    });
  });

  describe('isImageFeatureEnabled', () => {
    it('should return boolean values for feature flags', () => {
      expect(typeof isImageFeatureEnabled('enableUnsplash')).toBe('boolean');
      expect(typeof isImageFeatureEnabled('enablePexels')).toBe('boolean');
      expect(typeof isImageFeatureEnabled('enableCaching')).toBe('boolean');
      expect(typeof isImageFeatureEnabled('enableLazyLoading')).toBe('boolean');
      expect(typeof isImageFeatureEnabled('enableAttribution')).toBe('boolean');
    });
  });

  describe('category mappings', () => {
    it('should have proper structure for each category', () => {
      const config = getImageConfig();
      
      config.categories.forEach(category => {
        expect(category.category).toBeDefined();
        expect(Array.isArray(category.primaryTerms)).toBe(true);
        expect(Array.isArray(category.fallbackTerms)).toBe(true);
        expect(Array.isArray(category.excludeTerms)).toBe(true);
        expect(category.primaryTerms.length).toBeGreaterThan(0);
        expect(category.fallbackTerms.length).toBeGreaterThan(0);
      });
    });
  });
});