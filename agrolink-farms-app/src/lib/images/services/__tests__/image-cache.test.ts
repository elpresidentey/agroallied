/**
 * Unit tests for ImageCache service
 * Tests LRU eviction policy, TTL expiration, and cache statistics
 */

import { ImageCache } from '../image-cache';
import { CachedImage, ImageResult, ImageMetadata, Attribution } from '../../types';

describe('ImageCache', () => {
  let imageCache: ImageCache;

  const createMockCachedImage = (id: string, altText: string = 'Test image'): CachedImage => ({
    imageResult: {
      id,
      url: `https://example.com/image-${id}.jpg`,
      thumbnailUrl: `https://example.com/thumb-${id}.jpg`,
      altText,
      attribution: {
        photographer: 'Test Photographer',
        photographerUrl: 'https://example.com/photographer',
        source: 'test',
        sourceUrl: 'https://example.com/source',
        required: true
      } as Attribution,
      source: 'unsplash',
      metadata: {
        width: 800,
        height: 600,
        aspectRatio: 1.33,
        dominantColors: ['#green'],
        tags: ['test', 'agriculture'],
        downloadUrl: `https://example.com/download-${id}.jpg`,
        apiId: `api-${id}`,
        fetchedAt: new Date()
      } as ImageMetadata
    } as ImageResult,
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    accessCount: 0,
    lastAccessed: new Date()
  });

  beforeEach(() => {
    imageCache = new ImageCache(3, 1000); // Small cache for testing, 1 second TTL
  });

  describe('Basic Operations', () => {
    it('should store and retrieve images', async () => {
      const image = createMockCachedImage('test1');
      await imageCache.set('key1', image);
      
      const retrieved = await imageCache.get('key1');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.imageResult.id).toBe('test1');
      expect(retrieved!.accessCount).toBe(2); // 1 from set, 1 from get
    });

    it('should return null for non-existent keys', async () => {
      const result = await imageCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      const image = createMockCachedImage('test1');
      await imageCache.set('key1', image);
      
      expect(await imageCache.has('key1')).toBe(true);
      expect(await imageCache.has('non-existent')).toBe(false);
    });

    it('should update existing keys', async () => {
      const image1 = createMockCachedImage('test1', 'First image');
      const image2 = createMockCachedImage('test2', 'Second image');
      
      await imageCache.set('key1', image1);
      await imageCache.set('key1', image2); // Update same key
      
      const retrieved = await imageCache.get('key1');
      expect(retrieved!.imageResult.id).toBe('test2');
      expect(retrieved!.imageResult.altText).toBe('Second image');
    });
  });

  describe('LRU Eviction Policy', () => {
    it('should evict least recently used items when cache is full', async () => {
      const image1 = createMockCachedImage('test1');
      const image2 = createMockCachedImage('test2');
      const image3 = createMockCachedImage('test3');
      const image4 = createMockCachedImage('test4');

      // Fill cache to capacity
      await imageCache.set('key1', image1);
      await imageCache.set('key2', image2);
      await imageCache.set('key3', image3);

      // Access key1 to make it recently used
      await imageCache.get('key1');

      // Add fourth item, should evict key2 (least recently used)
      await imageCache.set('key4', image4);

      expect(await imageCache.has('key1')).toBe(true); // Recently accessed
      expect(await imageCache.has('key2')).toBe(false); // Should be evicted
      expect(await imageCache.has('key3')).toBe(true);
      expect(await imageCache.has('key4')).toBe(true);
    });

    it('should maintain correct order after multiple accesses', async () => {
      const image1 = createMockCachedImage('test1');
      const image2 = createMockCachedImage('test2');
      const image3 = createMockCachedImage('test3');

      await imageCache.set('key1', image1);
      await imageCache.set('key2', image2);
      await imageCache.set('key3', image3);

      // Access in specific order to change LRU order
      await imageCache.get('key1'); // key1 becomes most recent
      await imageCache.get('key2'); // key2 becomes most recent

      // Add new item, should evict key3 (least recently used)
      const image4 = createMockCachedImage('test4');
      await imageCache.set('key4', image4);

      expect(await imageCache.has('key1')).toBe(true);
      expect(await imageCache.has('key2')).toBe(true);
      expect(await imageCache.has('key3')).toBe(false); // Should be evicted
      expect(await imageCache.has('key4')).toBe(true);
    });
  });

  describe('TTL Expiration', () => {
    it('should return null for expired items', async () => {
      const expiredImage = createMockCachedImage('expired');
      expiredImage.expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago

      await imageCache.set('expired-key', expiredImage);
      
      const result = await imageCache.get('expired-key');
      expect(result).toBeNull();
    });

    it('should remove expired items from has() check', async () => {
      const expiredImage = createMockCachedImage('expired');
      expiredImage.expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago

      await imageCache.set('expired-key', expiredImage);
      
      expect(await imageCache.has('expired-key')).toBe(false);
    });

    it('should clean up expired items manually', async () => {
      const validImage = createMockCachedImage('valid');
      const expiredImage1 = createMockCachedImage('expired1');
      const expiredImage2 = createMockCachedImage('expired2');
      
      expiredImage1.expiresAt = new Date(Date.now() - 1000);
      expiredImage2.expiresAt = new Date(Date.now() - 1000);

      await imageCache.set('valid-key', validImage);
      await imageCache.set('expired-key1', expiredImage1);
      await imageCache.set('expired-key2', expiredImage2);

      const cleanedCount = await imageCache.cleanupExpired();
      
      expect(cleanedCount).toBe(2);
      expect(await imageCache.has('valid-key')).toBe(true);
      expect(await imageCache.has('expired-key1')).toBe(false);
      expect(await imageCache.has('expired-key2')).toBe(false);
    });
  });

  describe('Cache Statistics', () => {
    it('should track hit and miss rates', async () => {
      const image = createMockCachedImage('test1');
      await imageCache.set('key1', image);

      // Generate some hits and misses
      await imageCache.get('key1'); // hit
      await imageCache.get('key1'); // hit
      await imageCache.get('non-existent'); // miss
      await imageCache.get('non-existent'); // miss

      const stats = await imageCache.getStats();
      expect(stats.hitRate).toBe(0.5); // 2 hits out of 4 requests
      expect(stats.missRate).toBe(0.5); // 2 misses out of 4 requests
    });

    it('should track total items and eviction count', async () => {
      const image1 = createMockCachedImage('test1');
      const image2 = createMockCachedImage('test2');
      const image3 = createMockCachedImage('test3');
      const image4 = createMockCachedImage('test4');

      await imageCache.set('key1', image1);
      await imageCache.set('key2', image2);
      await imageCache.set('key3', image3);
      
      let stats = await imageCache.getStats();
      expect(stats.size).toBe(3);
      expect(stats.evictionCount).toBe(0);

      // Add fourth item to trigger eviction
      await imageCache.set('key4', image4);
      
      stats = await imageCache.getStats();
      expect(stats.size).toBe(3); // Still at capacity
      expect(stats.evictionCount).toBe(1); // One eviction occurred
    });

    it('should track oldest and newest items', async () => {
      const image1 = createMockCachedImage('test1');
      const image2 = createMockCachedImage('test2');
      
      const time1 = new Date();
      image1.cachedAt = time1;
      await imageCache.set('key1', image1);

      // Wait a bit and add second image
      await new Promise(resolve => setTimeout(resolve, 10));
      const time2 = new Date();
      image2.cachedAt = time2;
      await imageCache.set('key2', image2);

      const stats = await imageCache.getStats();
      expect(stats.oldestEntry).toEqual(time1);
      expect(stats.newestEntry).toEqual(time2);
    });
  });

  describe('Cache Management', () => {
    it('should evict specific keys', async () => {
      const image = createMockCachedImage('test1');
      await imageCache.set('key1', image);
      
      expect(await imageCache.has('key1')).toBe(true);
      
      await imageCache.evict('key1');
      
      expect(await imageCache.has('key1')).toBe(false);
    });

    it('should clear entire cache', async () => {
      const image1 = createMockCachedImage('test1');
      const image2 = createMockCachedImage('test2');
      
      await imageCache.set('key1', image1);
      await imageCache.set('key2', image2);
      
      expect(await imageCache.has('key1')).toBe(true);
      expect(await imageCache.has('key2')).toBe(true);
      
      await imageCache.clear();
      
      expect(await imageCache.has('key1')).toBe(false);
      expect(await imageCache.has('key2')).toBe(false);
    });

    it('should provide capacity information', async () => {
      const image1 = createMockCachedImage('test1');
      const image2 = createMockCachedImage('test2');
      
      let capacity = imageCache.getCapacityInfo();
      expect(capacity.current).toBe(0);
      expect(capacity.max).toBe(3);
      expect(capacity.utilizationPercent).toBe(0);
      
      await imageCache.set('key1', image1);
      await imageCache.set('key2', image2);
      
      capacity = imageCache.getCapacityInfo();
      expect(capacity.current).toBe(2);
      expect(capacity.max).toBe(3);
      expect(capacity.utilizationPercent).toBeCloseTo(66.67, 1);
    });

    it('should list all cached keys', async () => {
      const image1 = createMockCachedImage('test1');
      const image2 = createMockCachedImage('test2');
      
      await imageCache.set('key1', image1);
      await imageCache.set('key2', image2);
      
      const keys = imageCache.getKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys.length).toBe(2);
    });
  });

  describe('Configuration Updates', () => {
    it('should update max size and evict excess items', async () => {
      const image1 = createMockCachedImage('test1');
      const image2 = createMockCachedImage('test2');
      const image3 = createMockCachedImage('test3');
      
      await imageCache.set('key1', image1);
      await imageCache.set('key2', image2);
      await imageCache.set('key3', image3);
      
      expect(imageCache.getCapacityInfo().current).toBe(3);
      
      // Reduce max size to 2
      imageCache.updateConfig(2);
      
      expect(imageCache.getCapacityInfo().max).toBe(2);
      expect(imageCache.getCapacityInfo().current).toBe(2);
    });

    it('should update default TTL', async () => {
      const newTTL = 5000; // 5 seconds
      imageCache.updateConfig(undefined, newTTL);
      
      const image = createMockCachedImage('test1');
      // Remove the existing expiresAt so it uses the new TTL
      delete (image as any).expiresAt;
      
      await imageCache.set('key1', image); // Should use new TTL
      
      const retrieved = await imageCache.get('key1');
      const expectedExpiry = new Date(Date.now() + newTTL);
      const actualExpiry = retrieved!.expiresAt;
      
      // Allow for small timing differences
      expect(Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())).toBeLessThan(100);
    });
  });

  describe('Eviction Callback', () => {
    it('should call eviction callback when items are evicted', async () => {
      const evictionCallback = jest.fn();
      const cacheWithCallback = new ImageCache(2, 1000, evictionCallback);
      
      const image1 = createMockCachedImage('test1');
      const image2 = createMockCachedImage('test2');
      const image3 = createMockCachedImage('test3');
      
      await cacheWithCallback.set('key1', image1);
      await cacheWithCallback.set('key2', image2);
      await cacheWithCallback.set('key3', image3); // Should trigger eviction
      
      expect(evictionCallback).toHaveBeenCalledWith('key1', expect.any(Object));
    });

    it('should call eviction callback when clearing cache', async () => {
      const evictionCallback = jest.fn();
      const cacheWithCallback = new ImageCache(3, 1000, evictionCallback);
      
      const image1 = createMockCachedImage('test1');
      const image2 = createMockCachedImage('test2');
      
      await cacheWithCallback.set('key1', image1);
      await cacheWithCallback.set('key2', image2);
      
      await cacheWithCallback.clear();
      
      expect(evictionCallback).toHaveBeenCalledTimes(2);
    });
  });
});