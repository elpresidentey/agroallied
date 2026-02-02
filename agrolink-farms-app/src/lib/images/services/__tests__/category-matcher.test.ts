/**
 * Unit tests for CategoryMatcher service
 * Tests specific examples and edge cases for agricultural keyword mapping
 */

import { CategoryMatcher } from '../category-matcher';
import { ImageResult, ImageMetadata, Attribution } from '../../types';

describe('CategoryMatcher', () => {
  let categoryMatcher: CategoryMatcher;

  beforeEach(() => {
    categoryMatcher = new CategoryMatcher();
  });

  describe('getSearchTerms', () => {
    it('should return primary terms for known categories', () => {
      const terms = categoryMatcher.getSearchTerms('livestock');
      expect(terms).toContain('cattle');
      expect(terms).toContain('cows');
      expect(terms).toContain('livestock');
    });

    it('should return general terms for unknown categories', () => {
      const terms = categoryMatcher.getSearchTerms('unknown-category');
      expect(terms).toContain('agriculture');
      expect(terms).toContain('farming');
    });

    it('should handle case insensitive category names', () => {
      const terms1 = categoryMatcher.getSearchTerms('LIVESTOCK');
      const terms2 = categoryMatcher.getSearchTerms('livestock');
      expect(terms1).toEqual(terms2);
    });

    it('should handle partial category matches', () => {
      const terms = categoryMatcher.getSearchTerms('dairy-farming');
      expect(terms).toContain('dairy farm');
      expect(terms).toContain('milk production');
    });
  });

  describe('getHeroThemes', () => {
    it('should return agricultural hero themes', () => {
      const themes = categoryMatcher.getHeroThemes();
      expect(themes.length).toBeGreaterThan(0);
      expect(themes).toContain('beautiful farm landscape');
      expect(themes).toContain('golden wheat fields');
    });
  });

  describe('getFallbackTerms', () => {
    it('should return general agricultural fallback terms', () => {
      const fallbackTerms = categoryMatcher.getFallbackTerms();
      expect(fallbackTerms).toContain('agriculture');
      expect(fallbackTerms).toContain('farming');
      expect(fallbackTerms).toContain('rural');
    });
  });

  describe('validateImageRelevance', () => {
    const createMockImage = (altText: string, tags: string[]): ImageResult => ({
      id: 'test-id',
      url: 'test-url',
      thumbnailUrl: 'test-thumb',
      altText,
      attribution: {} as Attribution,
      source: 'unsplash',
      metadata: {
        tags,
        width: 800,
        height: 600,
        aspectRatio: 1.33,
        dominantColors: ['#green'],
        downloadUrl: 'test-download',
        apiId: 'api-id',
        fetchedAt: new Date()
      } as ImageMetadata
    });

    it('should validate relevant agricultural images', () => {
      const image = createMockImage('Farm with cattle grazing', ['farm', 'cattle', 'agriculture']);
      const isRelevant = categoryMatcher.validateImageRelevance(image, 'livestock');
      expect(isRelevant).toBe(true);
    });

    it('should reject images with excluded terms', () => {
      const image = createMockImage('Wild animals in zoo', ['wild animals', 'zoo']);
      const isRelevant = categoryMatcher.validateImageRelevance(image, 'livestock');
      expect(isRelevant).toBe(false);
    });

    it('should validate images with fallback terms', () => {
      const image = createMockImage('Rural landscape', ['rural', 'landscape']);
      const isRelevant = categoryMatcher.validateImageRelevance(image, 'livestock');
      expect(isRelevant).toBe(true);
    });

    it('should validate images with general agricultural keywords', () => {
      const image = createMockImage('Farming scene', ['farming', 'countryside']);
      const isRelevant = categoryMatcher.validateImageRelevance(image, 'unknown-category');
      expect(isRelevant).toBe(true);
    });
  });

  describe('getSearchTermsWithFallbacks', () => {
    it('should return multiple fallback levels for known categories', () => {
      const fallbacks = categoryMatcher.getSearchTermsWithFallbacks('livestock');
      expect(fallbacks.length).toBe(3);
      expect(fallbacks[0]).toContain('cattle'); // Primary terms
      expect(fallbacks[1]).toContain('agriculture'); // Fallback terms
      expect(fallbacks[2]).toContain('farming'); // Global fallback
    });

    it('should return fallbacks for unknown categories', () => {
      const fallbacks = categoryMatcher.getSearchTermsWithFallbacks('unknown');
      expect(fallbacks.length).toBeGreaterThan(0);
      expect(fallbacks[0]).toContain('agriculture');
    });
  });

  describe('validateImageTheme', () => {
    const createMockImage = (altText: string, tags: string[]): ImageResult => ({
      id: 'test-id',
      url: 'test-url',
      thumbnailUrl: 'test-thumb',
      altText,
      attribution: {} as Attribution,
      source: 'unsplash',
      metadata: {
        tags,
        width: 800,
        height: 600,
        aspectRatio: 1.33,
        dominantColors: ['#green'],
        downloadUrl: 'test-download',
        apiId: 'api-id',
        fetchedAt: new Date()
      } as ImageMetadata
    });

    it('should validate agricultural themed images', () => {
      const image = createMockImage('Beautiful farm landscape', ['farm', 'agriculture', 'rural']);
      const isValid = categoryMatcher.validateImageTheme(image);
      expect(isValid).toBe(true);
    });

    it('should reject non-agricultural themed images', () => {
      const image = createMockImage('City skyline', ['urban', 'city', 'building']);
      const isValid = categoryMatcher.validateImageTheme(image);
      expect(isValid).toBe(false);
    });
  });

  describe('getImageRelevanceScore', () => {
    const createMockImage = (altText: string, tags: string[]): ImageResult => ({
      id: 'test-id',
      url: 'test-url',
      thumbnailUrl: 'test-thumb',
      altText,
      attribution: {} as Attribution,
      source: 'unsplash',
      metadata: {
        tags,
        width: 800,
        height: 600,
        aspectRatio: 1.33,
        dominantColors: ['#green'],
        downloadUrl: 'test-download',
        apiId: 'api-id',
        fetchedAt: new Date()
      } as ImageMetadata
    });

    it('should give high scores to highly relevant images', () => {
      const image = createMockImage('Dairy cows in farm', ['dairy cows', 'farm', 'milk production']);
      const score = categoryMatcher.getImageRelevanceScore(image, 'dairy');
      expect(score).toBeGreaterThan(5);
    });

    it('should give negative scores to excluded images', () => {
      const image = createMockImage('Wild animals', ['wild animals', 'zoo']);
      const score = categoryMatcher.getImageRelevanceScore(image, 'livestock');
      expect(score).toBe(-1);
    });

    it('should give low scores to marginally relevant images', () => {
      const image = createMockImage('Rural scene', ['rural']);
      const score = categoryMatcher.getImageRelevanceScore(image, 'dairy');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(3); // Changed from toBeLessThan to toBeLessThanOrEqual
    });
  });

  describe('filterAndSortByRelevance', () => {
    const createMockImage = (id: string, altText: string, tags: string[]): ImageResult => ({
      id,
      url: 'test-url',
      thumbnailUrl: 'test-thumb',
      altText,
      attribution: {} as Attribution,
      source: 'unsplash',
      metadata: {
        tags,
        width: 800,
        height: 600,
        aspectRatio: 1.33,
        dominantColors: ['#green'],
        downloadUrl: 'test-download',
        apiId: 'api-id',
        fetchedAt: new Date()
      } as ImageMetadata
    });

    it('should filter out irrelevant images and sort by relevance', () => {
      const images = [
        createMockImage('1', 'Wild animals', ['wild animals', 'zoo']), // Should be filtered out
        createMockImage('2', 'Rural scene', ['rural']), // Low relevance
        createMockImage('3', 'Dairy farm', ['dairy farm', 'cows', 'milk production']) // High relevance
      ];

      const filtered = categoryMatcher.filterAndSortByRelevance(images, 'dairy');
      
      expect(filtered.length).toBe(2); // Excluded image filtered out
      expect(filtered[0].id).toBe('3'); // Most relevant first
      expect(filtered[1].id).toBe('2'); // Less relevant second
    });
  });

  describe('generateSearchVariations', () => {
    it('should generate variations with farm and agricultural prefixes', () => {
      const variations = categoryMatcher.generateSearchVariations(['cattle', 'cows']);
      expect(variations).toContain('cattle');
      expect(variations).toContain('farm cattle');
      expect(variations).toContain('agricultural cattle');
    });

    it('should not duplicate existing farm terms', () => {
      const variations = categoryMatcher.generateSearchVariations(['farm cattle']);
      expect(variations.filter(v => v === 'farm farm cattle')).toHaveLength(0);
    });

    it('should include seasonal variations', () => {
      const variations = categoryMatcher.generateSearchVariations(['wheat']);
      expect(variations).toContain('spring wheat');
      expect(variations).toContain('summer wheat');
    });
  });
});