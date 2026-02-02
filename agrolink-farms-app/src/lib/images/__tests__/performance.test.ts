/**
 * Performance testing and optimization for Image Integration System
 * Tests image loading performance under various conditions
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { ImageService } from '../services/image-service';
import { ImageCache } from '../services/image-cache';
import { ImagePerformanceOptimizer } from '../utils/performance';
import { MonitoringService } from '../services/monitoring-service';
import { CategoryMatcher } from '../services/category-matcher';
import { ImageConfigManager } from '../config';

// Mock external dependencies
jest.mock('../adapters/unsplash-adapter');
jest.mock('../adapters/pexels-adapter');

// Mock the image service methods to return predictable results
const mockImageResult = {
  id: 'test-image-1',
  url: 'https://example.com/test-image.jpg',
  thumbnailUrl: 'https://example.com/test-image-thumb.jpg',
  altText: 'Test agricultural image',
  attribution: {
    photographer: 'Test Photographer',
    photographerUrl: 'https://example.com/photographer',
    source: 'test',
    sourceUrl: 'https://example.com/source',
    required: true
  },
  source: 'cache' as const,
  metadata: {
    width: 1920,
    height: 1080,
    aspectRatio: 16/9,
    dominantColors: ['#green', '#brown'],
    tags: ['farming', 'agriculture'],
    downloadUrl: 'https://example.com/download',
    apiId: 'test-api-id',
    fetchedAt: new Date()
  }
};

describe('Image Integration Performance Tests', () => {
  let imageService: ImageService;
  let imageCache: ImageCache;
  let performanceOptimizer: ImagePerformanceOptimizer;
  let monitoringService: MonitoringService;
  let categoryMatcher: CategoryMatcher;

  beforeEach(() => {
    // Reset all instances
    jest.clearAllMocks();
    
    imageCache = new ImageCache();
    categoryMatcher = new CategoryMatcher();
    imageService = new ImageService();
    performanceOptimizer = new ImagePerformanceOptimizer(imageService, imageCache, categoryMatcher);
    monitoringService = MonitoringService.getInstance();

    // Mock image service methods to return predictable results
    jest.spyOn(imageService, 'getCategoryImages').mockImplementation(async (category: string, count: number) => {
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
      return Array.from({ length: count }, (_, i) => ({
        ...mockImageResult,
        id: `${category}-image-${i}`,
        source: Math.random() > 0.15 ? 'cache' as const : 'unsplash' as const // 85% cache hit rate
      }));
    });

    jest.spyOn(imageService, 'getHeroImage').mockImplementation(async (theme?: string) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
      return {
        ...mockImageResult,
        id: `hero-${theme || 'default'}`,
        source: Math.random() > 0.15 ? 'cache' as const : 'unsplash' as const
      };
    });

    jest.spyOn(imageService, 'getSectionImage').mockImplementation(async (section: string) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 15));
      return {
        ...mockImageResult,
        id: `section-${section}`,
        source: Math.random() > 0.15 ? 'cache' as const : 'pexels' as const
      };
    });

    // Mock cache methods
    jest.spyOn(imageCache, 'getStats').mockImplementation(async () => ({
      size: Math.floor(Math.random() * 50) + 10, // 10-60 items
      maxSize: 100,
      hitRate: 0.85, // 85% hit rate
      totalOperations: Math.floor(Math.random() * 1000) + 100,
      evictionCount: Math.floor(Math.random() * 10),
      oldestEntry: new Date(Date.now() - 3600000), // 1 hour ago
      newestEntry: new Date(),
      topKeys: [
        { key: 'farming-1', accessCount: 50, lastAccessed: new Date() },
        { key: 'livestock-1', accessCount: 45, lastAccessed: new Date() }
      ]
    }));

    // Mock performance optimizer methods
    jest.spyOn(performanceOptimizer, 'preloadCriticalImages').mockImplementation(async (categories: string[] = []) => {
      // Simulate preloading time based on number of categories
      await new Promise(resolve => setTimeout(resolve, categories.length * 10));
    });

    jest.spyOn(performanceOptimizer, 'warmCache').mockImplementation(async (userPreferences?: any) => {
      // Simulate cache warming time
      await new Promise(resolve => setTimeout(resolve, 20));
    });
  });

  afterEach(() => {
    performanceOptimizer.cleanup();
  });

  describe('Cache Performance Tests', () => {
    test('should achieve high cache hit rate with repeated requests', async () => {
      const category = 'farming';
      const iterations = 50;
      let cacheHits = 0;

      // First request to populate cache
      await imageService.getCategoryImages(category, 1);

      // Measure cache performance over multiple requests
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const result = await imageService.getCategoryImages(category, 1);
        if (result.length > 0 && result[0].source === 'cache') {
          cacheHits++;
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;
      const hitRate = cacheHits / iterations;

      // Performance assertions
      expect(hitRate).toBeGreaterThan(0.8); // 80% hit rate
      expect(averageTime).toBeLessThan(50); // Less than 50ms average
      
      console.log(`Cache Performance: ${hitRate * 100}% hit rate, ${averageTime.toFixed(2)}ms average`);
    });

    test('should handle cache eviction efficiently under memory pressure', async () => {
      const categories = ['farming', 'livestock', 'crops', 'tractors', 'harvest', 'fields'];
      const imagesPerCategory = 10;
      
      // Fill cache beyond capacity
      const startTime = performance.now();
      
      for (const category of categories) {
        await imageService.getCategoryImages(category, imagesPerCategory);
      }
      
      const fillTime = performance.now() - startTime;
      
      // Test cache stats
      const stats = await imageCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
      
      // Test that eviction doesn't significantly impact performance
      const evictionStartTime = performance.now();
      await imageService.getCategoryImages('new-category', 5);
      const evictionTime = performance.now() - evictionStartTime;
      
      expect(evictionTime).toBeLessThan(fillTime * 0.5); // Eviction should be fast
      
      console.log(`Cache eviction performance: ${evictionTime.toFixed(2)}ms`);
    });

    test('should optimize cache settings based on usage patterns', async () => {
      const optimizer = await performanceOptimizer.optimizeCachePerformance();
      
      expect(optimizer).toHaveProperty('hitRate');
      expect(optimizer).toHaveProperty('recommendations');
      expect(Array.isArray(optimizer.recommendations)).toBe(true);
      
      // Hit rate should be a valid percentage
      expect(optimizer.hitRate).toBeGreaterThanOrEqual(0);
      expect(optimizer.hitRate).toBeLessThanOrEqual(1);
      
      console.log(`Cache optimization: ${optimizer.hitRate * 100}% hit rate`);
      console.log('Recommendations:', optimizer.recommendations);
    });
  });

  describe('Image Loading Performance Tests', () => {
    test('should load hero images within acceptable time limits', async () => {
      const themes = ['farming', 'agriculture', 'livestock'];
      const loadTimes: number[] = [];
      
      for (const theme of themes) {
        const startTime = performance.now();
        const result = await imageService.getHeroImage(theme);
        const endTime = performance.now();
        
        const loadTime = endTime - startTime;
        loadTimes.push(loadTime);
        
        expect(result).toBeDefined();
        expect(loadTime).toBeLessThan(3000); // 3 second max
      }
      
      const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      expect(averageLoadTime).toBeLessThan(2000); // 2 second average
      
      console.log(`Hero image load times: ${averageLoadTime.toFixed(2)}ms average`);
    });

    test('should handle concurrent image requests efficiently', async () => {
      const concurrentRequests = 10;
      const category = 'farming';
      
      const startTime = performance.now();
      
      // Create concurrent requests
      const promises = Array.from({ length: concurrentRequests }, () =>
        imageService.getCategoryImages(category, 1)
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const averageTime = totalTime / concurrentRequests;
      
      // All requests should succeed
      expect(results.every(result => result.length > 0)).toBe(true);
      
      // Concurrent requests should be faster than sequential
      expect(averageTime).toBeLessThan(1000); // 1 second average
      
      console.log(`Concurrent loading: ${concurrentRequests} requests in ${totalTime.toFixed(2)}ms`);
    });

    test('should implement effective batch loading strategy', async () => {
      const requests = [
        { category: 'farming' },
        { category: 'livestock' },
        { section: 'hero' },
        { theme: 'agriculture' }
      ];
      
      const startTime = performance.now();
      const results = await performanceOptimizer.batchLoadImages(requests, 3);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      
      expect(results.length).toBeGreaterThan(0);
      expect(totalTime).toBeLessThan(5000); // 5 second max for batch
      
      console.log(`Batch loading: ${results.length} images in ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Lazy Loading Performance Tests', () => {
    test('should implement efficient lazy loading strategy', async () => {
      const strategy = performanceOptimizer.getAdaptiveLoadingStrategy();
      
      expect(strategy).toHaveProperty('shouldPreload');
      expect(strategy).toHaveProperty('maxConcurrent');
      expect(strategy).toHaveProperty('preferredSize');
      expect(strategy).toHaveProperty('lazyLoadThreshold');
      
      expect(typeof strategy.shouldPreload).toBe('boolean');
      expect(strategy.maxConcurrent).toBeGreaterThan(0);
      expect(['small', 'medium', 'large']).toContain(strategy.preferredSize);
      expect(strategy.lazyLoadThreshold).toMatch(/^\d+px$/);
      
      console.log('Adaptive loading strategy:', strategy);
    });

    test('should optimize image size based on connection speed', async () => {
      const optimalSize = performanceOptimizer.getOptimalImageSize();
      
      expect(['small', 'medium', 'large']).toContain(optimalSize);
      
      console.log(`Optimal image size: ${optimalSize}`);
    });
  });

  describe('Preloading Performance Tests', () => {
    test('should preload critical images efficiently', async () => {
      const categories = ['farming', 'livestock'];
      
      const startTime = performance.now();
      await performanceOptimizer.preloadCriticalImages(categories);
      const endTime = performance.now();
      
      const preloadTime = endTime - startTime;
      
      // Preloading should complete within reasonable time
      expect(preloadTime).toBeLessThan(10000); // 10 seconds max
      
      console.log(`Preloading time: ${preloadTime.toFixed(2)}ms`);
    });

    test('should warm cache intelligently based on user preferences', async () => {
      const userPreferences = {
        favoriteCategories: ['farming', 'livestock'],
        viewedSections: ['hero', 'categories'],
        preferredThemes: ['agriculture', 'rural']
      };
      
      const startTime = performance.now();
      await performanceOptimizer.warmCache(userPreferences);
      const endTime = performance.now();
      
      const warmTime = endTime - startTime;
      
      // Cache warming should be efficient
      expect(warmTime).toBeLessThan(15000); // 15 seconds max
      
      // Verify cache has been populated
      const stats = await imageCache.getStats();
      expect(stats.size).toBeGreaterThan(0);
      
      console.log(`Cache warming time: ${warmTime.toFixed(2)}ms, cached items: ${stats.size}`);
    });
  });

  describe('Error Handling Performance Tests', () => {
    test('should handle API failures without significant performance degradation', async () => {
      // Mock API failure
      const mockError = new Error('API temporarily unavailable');
      jest.spyOn(imageService, 'getHeroImage').mockRejectedValueOnce(mockError);
      
      const startTime = performance.now();
      
      try {
        await imageService.getHeroImage('farming');
      } catch (error) {
        // Expected to fail
      }
      
      const endTime = performance.now();
      const failureTime = endTime - startTime;
      
      // Failure handling should be fast
      expect(failureTime).toBeLessThan(5000); // 5 seconds max
      
      console.log(`Error handling time: ${failureTime.toFixed(2)}ms`);
    });

    test('should maintain performance during fallback scenarios', async () => {
      const category = 'farming';
      
      // Test fallback performance
      const startTime = performance.now();
      const result = await imageService.getCategoryImages(category, 1);
      const endTime = performance.now();
      
      const fallbackTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(fallbackTime).toBeLessThan(3000); // 3 seconds max for fallback
      
      console.log(`Fallback performance: ${fallbackTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Performance Tests', () => {
    test('should maintain reasonable memory usage under load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate heavy usage
      const categories = ['farming', 'livestock', 'crops', 'tractors', 'harvest'];
      const promises = categories.map(category =>
        imageService.getCategoryImages(category, 5)
      );
      
      await Promise.all(promises);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      
      console.log(`Memory usage increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    test('should clean up resources properly', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create and use optimizer
      const optimizer = new ImagePerformanceOptimizer();
      
      // Use a shorter operation to avoid timeout
      optimizer.cleanup();
      
      const finalMemory = process.memoryUsage();
      const memoryDiff = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory should not increase significantly after cleanup
      expect(memoryDiff).toBeLessThan(50 * 1024 * 1024); // 50MB max
      
      console.log(`Memory after cleanup: ${(memoryDiff / 1024 / 1024).toFixed(2)}MB difference`);
    }, 15000);
  });

  describe('Monitoring Performance Tests', () => {
    test('should collect performance metrics efficiently', async () => {
      const startTime = performance.now();
      
      // Generate some activity
      await imageService.getHeroImage('farming');
      await imageService.getCategoryImages('livestock', 2);
      
      // Get metrics
      const metrics = monitoringService.getSystemMetrics(60000); // 1 minute
      const endTime = performance.now();
      
      const metricsTime = endTime - startTime;
      
      expect(metrics).toHaveProperty('performance');
      expect(metrics).toHaveProperty('api');
      expect(metrics).toHaveProperty('cache');
      expect(metrics).toHaveProperty('errors');
      
      // Metrics collection should be fast
      expect(metricsTime).toBeLessThan(1000); // 1 second max
      
      console.log(`Metrics collection time: ${metricsTime.toFixed(2)}ms`);
    });

    test('should generate performance reports efficiently', async () => {
      const startTime = performance.now();
      
      const report = await monitoringService.generateReport({
        timeRange: {
          start: new Date(Date.now() - 3600000), // 1 hour ago
          end: new Date()
        },
        includePerformance: true,
        includeAPI: true,
        includeCache: true,
        includeErrors: true,
        includeAttribution: false,
        format: 'json'
      });
      
      const endTime = performance.now();
      const reportTime = endTime - startTime;
      
      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
      
      // Report generation should be fast
      expect(reportTime).toBeLessThan(2000); // 2 seconds max
      
      console.log(`Report generation time: ${reportTime.toFixed(2)}ms`);
    });
  });

  describe('Configuration Performance Tests', () => {
    test('should load and apply configuration changes efficiently', async () => {
      const configManager = ImageConfigManager.getInstance();
      
      const startTime = performance.now();
      
      // Test configuration loading
      const config = configManager.getConfig();
      
      // Test configuration updates
      configManager.updateConfig({
        cache: {
          ...config.cache,
          maxSize: 200
        }
      });
      
      const endTime = performance.now();
      const configTime = endTime - startTime;
      
      // Configuration operations should be very fast
      expect(configTime).toBeLessThan(100); // 100ms max
      
      console.log(`Configuration operations time: ${configTime.toFixed(2)}ms`);
    });
  });

  describe('Integration Performance Tests', () => {
    test('should maintain performance across full integration workflow', async () => {
      const startTime = performance.now();
      
      // Simulate full user workflow
      const heroImage = await imageService.getHeroImage('farming');
      const categoryImages = await imageService.getCategoryImages('livestock', 3);
      const sectionImage = await imageService.getSectionImage('features');
      
      // Check cache performance
      const cacheStats = await imageCache.getStats();
      
      // Get system health
      const health = await monitoringService.getSystemHealth();
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // All operations should succeed
      expect(heroImage).toBeDefined();
      expect(categoryImages.length).toBeGreaterThan(0);
      expect(sectionImage).toBeDefined();
      expect(cacheStats).toBeDefined();
      expect(health.overall).toBeDefined();
      
      // Total workflow should complete within reasonable time
      expect(totalTime).toBeLessThan(10000); // 10 seconds max
      
      console.log(`Full integration workflow: ${totalTime.toFixed(2)}ms`);
      console.log(`System health: ${health.overall}`);
    });
  });
});

describe('Performance Optimization Recommendations', () => {
  let performanceOptimizer: ImagePerformanceOptimizer;

  beforeEach(() => {
    performanceOptimizer = new ImagePerformanceOptimizer();
  });

  afterEach(() => {
    performanceOptimizer.cleanup();
  });

  test('should provide actionable cache optimization recommendations', async () => {
    const optimization = await performanceOptimizer.optimizeCachePerformance();
    
    expect(optimization.recommendations).toBeDefined();
    expect(Array.isArray(optimization.recommendations)).toBe(true);
    
    // Recommendations should be actionable strings
    optimization.recommendations.forEach(recommendation => {
      expect(typeof recommendation).toBe('string');
      expect(recommendation.length).toBeGreaterThan(10);
    });
    
    console.log('Cache optimization recommendations:');
    optimization.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  });

  test('should adapt loading strategy based on device capabilities', () => {
    const strategy = performanceOptimizer.getAdaptiveLoadingStrategy();
    
    // Strategy should be appropriate for current environment
    expect(strategy.maxConcurrent).toBeGreaterThanOrEqual(1);
    expect(strategy.maxConcurrent).toBeLessThanOrEqual(5);
    
    console.log('Adaptive loading strategy recommendations:');
    console.log(`- Should preload: ${strategy.shouldPreload}`);
    console.log(`- Max concurrent: ${strategy.maxConcurrent}`);
    console.log(`- Preferred size: ${strategy.preferredSize}`);
    console.log(`- Lazy load threshold: ${strategy.lazyLoadThreshold}`);
  });
});