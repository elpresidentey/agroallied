/**
 * Basic tests for API adapters
 * Tests basic instantiation and configuration
 */

import { UnsplashAdapter } from '../unsplash-adapter';
import { PexelsAdapter } from '../pexels-adapter';
import { ImageAPIAdapter } from '../image-api-adapter';

describe('API Adapters Basic Tests', () => {
  describe('UnsplashAdapter', () => {
    it('should instantiate with required parameters', () => {
      const adapter = new UnsplashAdapter('test-key');
      expect(adapter).toBeInstanceOf(UnsplashAdapter);
      expect(adapter).toBeInstanceOf(ImageAPIAdapter);
    });

    it('should accept custom baseUrl and rateLimit', () => {
      const adapter = new UnsplashAdapter('test-key', 'https://custom.api.com', 100);
      expect(adapter).toBeInstanceOf(UnsplashAdapter);
    });

    it('should have required methods', () => {
      const adapter = new UnsplashAdapter('test-key');
      expect(typeof adapter.search).toBe('function');
      expect(typeof adapter.getImage).toBe('function');
      expect(typeof adapter.getRateLimit).toBe('function');
    });

    it('should validate search options', () => {
      const adapter = new UnsplashAdapter('test-key');
      
      // Should throw for invalid count
      expect(() => {
        (adapter as any).validateSearchOptions({ count: 0 });
      }).toThrow('Search count must be between 1 and 50');

      expect(() => {
        (adapter as any).validateSearchOptions({ count: 51 });
      }).toThrow('Search count must be between 1 and 50');

      // Should throw for invalid orientation
      expect(() => {
        (adapter as any).validateSearchOptions({ count: 10, orientation: 'invalid' });
      }).toThrow('Invalid orientation');

      // Should throw for invalid size
      expect(() => {
        (adapter as any).validateSearchOptions({ count: 10, size: 'invalid' });
      }).toThrow('Invalid size');
    });

    it('should sanitize queries', () => {
      const adapter = new UnsplashAdapter('test-key');
      
      expect((adapter as any).sanitizeQuery('  test query  ')).toBe('test query');
      expect((adapter as any).sanitizeQuery('test@#$%query')).toBe('testquery');
      expect((adapter as any).sanitizeQuery('Test  Multiple   Spaces')).toBe('test multiple spaces');
    });
  });

  describe('PexelsAdapter', () => {
    it('should instantiate with required parameters', () => {
      const adapter = new PexelsAdapter('test-key');
      expect(adapter).toBeInstanceOf(PexelsAdapter);
      expect(adapter).toBeInstanceOf(ImageAPIAdapter);
    });

    it('should accept custom baseUrl and rateLimit', () => {
      const adapter = new PexelsAdapter('test-key', 'https://custom.api.com', 300);
      expect(adapter).toBeInstanceOf(PexelsAdapter);
    });

    it('should have required methods', () => {
      const adapter = new PexelsAdapter('test-key');
      expect(typeof adapter.search).toBe('function');
      expect(typeof adapter.getImage).toBe('function');
      expect(typeof adapter.getRateLimit).toBe('function');
    });

    it('should extract tags from alt text', () => {
      const adapter = new PexelsAdapter('test-key');
      
      const tags = (adapter as any).extractTagsFromAltText('farm cattle grazing in green pasture');
      expect(tags).toContain('farm');
      expect(tags).toContain('cattle');
      expect(tags).toContain('grazing');
      expect(tags).toContain('green');
      expect(tags).toContain('pasture');
    });

    it('should validate agricultural relevance', () => {
      const adapter = new PexelsAdapter('test-key');
      
      const agriculturalImage = {
        id: '1',
        urls: { raw: '', full: '', regular: '', small: '', thumb: '' },
        photographer: { name: 'Test', url: '' },
        description: 'Beautiful farm with cattle grazing',
        tags: ['farm', 'cattle', 'agriculture']
      };

      const nonAgriculturalImage = {
        id: '2',
        urls: { raw: '', full: '', regular: '', small: '', thumb: '' },
        photographer: { name: 'Test', url: '' },
        description: 'City skyline at night',
        tags: ['city', 'urban', 'skyline']
      };

      expect(adapter.validateAgriculturalRelevance(agriculturalImage)).toBe(true);
      expect(adapter.validateAgriculturalRelevance(nonAgriculturalImage)).toBe(false);
    });
  });

  describe('ImageAPIAdapter Base Class', () => {
    class TestAdapter extends ImageAPIAdapter {
      async search() { return []; }
      async getImage() { return {} as any; }
      async getRateLimit() { return { remaining: 0, total: 0, resetTime: new Date() }; }
    }

    it('should track rate limits', () => {
      const adapter = new TestAdapter('test-key', 'https://test.com', 10);
      
      // Initially should allow requests
      expect((adapter as any).canMakeRequest()).toBe(true);
      
      // Record some requests
      (adapter as any).recordRequest(5);
      expect((adapter as any).canMakeRequest()).toBe(true);
      
      // Exceed rate limit
      (adapter as any).recordRequest(6);
      expect((adapter as any).canMakeRequest()).toBe(false);
    });

    it('should classify errors correctly', () => {
      const adapter = new TestAdapter('test-key', 'https://test.com', 10);
      
      const rateLimitError = new Error('Rate limit exceeded');
      const authError = new Error('Unauthorized access');
      const networkError = new Error('Network timeout');
      
      const rateLimitResult = (adapter as any).classifyError(rateLimitError, 'test');
      expect(rateLimitResult.code).toBe('API_RATE_LIMIT');
      expect(rateLimitResult.retryable).toBe(true);
      
      const authResult = (adapter as any).classifyError(authError, 'test');
      expect(authResult.code).toBe('API_AUTHENTICATION');
      expect(authResult.retryable).toBe(false);
      
      const networkResult = (adapter as any).classifyError(networkError, 'test');
      expect(networkResult.code).toBe('NETWORK_ERROR');
      expect(networkResult.retryable).toBe(true);
    });

    it('should provide current rate limit status', () => {
      const adapter = new TestAdapter('test-key', 'https://test.com', 10);
      
      const status = (adapter as any).getCurrentRateLimit();
      expect(status.remaining).toBe(10);
      expect(status.total).toBe(10);
      expect(status.resetTime).toBeInstanceOf(Date);
      
      // Record some usage
      (adapter as any).recordRequest(3);
      const updatedStatus = (adapter as any).getCurrentRateLimit();
      expect(updatedStatus.remaining).toBe(7);
    });
  });
});