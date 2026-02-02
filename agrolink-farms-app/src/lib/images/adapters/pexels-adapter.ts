/**
 * PexelsAdapter - Pexels API integration
 * Provides authentication and search functionality for Pexels API
 * Validates: Requirements 1.2, 2.1
 */

import { ImageAPIAdapter } from './image-api-adapter';
import { SearchOptions, APIImageResult, RateLimitInfo, PexelsImageResponse, PexelsSearchResponse } from '../types';

export class PexelsAdapter extends ImageAPIAdapter {
  constructor(apiKey: string, baseUrl: string = 'https://api.pexels.com/v1', rateLimit: number = 200) {
    super(apiKey, baseUrl, rateLimit);
  }

  /**
   * Search for images using Pexels API
   * Validates: Requirements 1.2, 2.1
   */
  async search(query: string, options: SearchOptions): Promise<APIImageResult[]> {
    this.validateSearchOptions(options);
    const sanitizedQuery = this.sanitizeQuery(query);

    if (!sanitizedQuery) {
      throw new Error('Search query cannot be empty');
    }

    return this.executeWithRetry(async () => {
      const url = this.buildSearchUrl(sanitizedQuery, options);
      const response = await this.makeRequest(url, {
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json'
        }
      });

      const data: PexelsSearchResponse = await response.json();
      
      if (!data.photos || !Array.isArray(data.photos)) {
        throw new Error('Invalid response format from Pexels API');
      }

      return data.photos.map(image => this.transformPexelsImage(image));
    }, `Pexels search for "${sanitizedQuery}"`);
  }

  /**
   * Get a specific image by ID from Pexels
   * Validates: Requirements 1.2
   */
  async getImage(id: string): Promise<APIImageResult> {
    if (!id || typeof id !== 'string') {
      throw new Error('Image ID is required and must be a string');
    }

    return this.executeWithRetry(async () => {
      const url = `${this.baseUrl}/photos/${encodeURIComponent(id)}`;
      const response = await this.makeRequest(url, {
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json'
        }
      });

      const data: PexelsImageResponse = await response.json();
      return this.transformPexelsImage(data);
    }, `Pexels image fetch for ID "${id}"`);
  }

  /**
   * Get current rate limit information
   * Validates: Requirements 1.4
   */
  async getRateLimit(): Promise<RateLimitInfo> {
    // Pexels doesn't provide rate limit headers in the same way as Unsplash
    // We'll rely on our local tracking and make a lightweight request to check status
    const localRateLimit = this.getCurrentRateLimit();

    try {
      // Make a minimal request to check API status
      const response = await this.makeRequest(`${this.baseUrl}/search?query=test&per_page=1`, {
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json'
        }
      });

      // Pexels doesn't provide detailed rate limit headers, so we use local tracking
      // But we can verify the API is accessible
      if (response.ok) {
        return localRateLimit;
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      // If we can't reach the API, return local tracking with conservative estimates
      return {
        ...localRateLimit,
        remaining: Math.max(0, localRateLimit.remaining - 1) // Be conservative
      };
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Build search URL with parameters
   */
  private buildSearchUrl(query: string, options: SearchOptions): string {
    const params = new URLSearchParams({
      query,
      per_page: Math.min(options.count, 80).toString() // Pexels max is 80 per page
    });

    // Add orientation filter if specified
    if (options.orientation) {
      params.append('orientation', options.orientation);
    }

    // Add size filter if specified (Pexels uses different size terminology)
    if (options.size) {
      const sizeMap = {
        small: 'small',
        medium: 'medium', 
        large: 'large'
      };
      params.append('size', sizeMap[options.size]);
    }

    // Add category filter if specified
    if (options.category) {
      // Enhance query with category-specific terms
      const enhancedQuery = this.enhanceQueryWithCategory(query, options.category);
      params.set('query', enhancedQuery);
    }

    return `${this.baseUrl}/search?${params.toString()}`;
  }

  /**
   * Enhance search query with agricultural category terms
   * Validates: Requirements 2.1
   */
  private enhanceQueryWithCategory(query: string, category: string): string {
    const agriculturalTerms = {
      livestock: ['farm animals', 'cattle', 'dairy', 'pasture', 'ranch'],
      crops: ['agriculture', 'harvest', 'grain', 'field', 'cultivation'],
      equipment: ['farm equipment', 'agricultural machinery', 'rural', 'farming tools'],
      farms: ['farmhouse', 'barn', 'agricultural land', 'countryside', 'rural property'],
      hero: ['rural landscape', 'farming', 'countryside', 'agricultural vista'],
      general: ['agriculture', 'farming', 'rural', 'organic']
    };

    const categoryTerms = agriculturalTerms[category as keyof typeof agriculturalTerms] || agriculturalTerms.general;
    const randomTerm = categoryTerms[Math.floor(Math.random() * categoryTerms.length)];
    
    return `${query} ${randomTerm}`;
  }

  /**
   * Transform Pexels API response to our standard format
   */
  private transformPexelsImage(image: PexelsImageResponse): APIImageResult {
    // Generate tags from alt text and photographer info
    const tags = this.extractTagsFromAltText(image.alt);
    
    // Use alt text or generate descriptive text
    const description = image.alt || `Agricultural image by ${image.photographer}`;

    return {
      id: image.id.toString(),
      urls: {
        raw: image.src.original,
        full: image.src.large2x,
        regular: image.src.large,
        small: image.src.medium,
        thumb: image.src.small
      },
      photographer: {
        name: image.photographer,
        url: image.photographer_url
      },
      description,
      tags
    };
  }

  /**
   * Extract meaningful tags from alt text
   */
  private extractTagsFromAltText(altText: string): string[] {
    if (!altText) return [];

    // Common agricultural keywords to look for
    const agriculturalKeywords = [
      'farm', 'agriculture', 'farming', 'rural', 'countryside', 'pastoral',
      'cattle', 'cow', 'livestock', 'dairy', 'beef', 'pasture', 'ranch',
      'crop', 'wheat', 'corn', 'grain', 'harvest', 'field', 'plantation',
      'tractor', 'machinery', 'equipment', 'barn', 'farmhouse', 'silo',
      'organic', 'sustainable', 'cultivation', 'irrigation', 'greenhouse'
    ];

    const words = altText.toLowerCase().split(/\s+/);
    const tags = words.filter(word => 
      agriculturalKeywords.includes(word) || 
      word.length > 4 // Include longer descriptive words
    );

    // Remove duplicates and limit to 10 tags
    const uniqueTags = Array.from(new Set(tags));
    return uniqueTags.slice(0, 10);
  }

  /**
   * Validate that we have proper authentication
   */
  private validateAuthentication(): void {
    if (!this.apiKey) {
      throw new Error('Pexels API key is required for authentication');
    }
  }

  /**
   * Override makeRequest to add authentication validation
   */
  protected async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    this.validateAuthentication();
    return super.makeRequest(url, options);
  }

  // ============================================================================
  // Agricultural Focus Methods
  // ============================================================================

  /**
   * Search specifically for agricultural images
   * Validates: Requirements 2.1
   */
  async searchAgricultural(category: string, options: Omit<SearchOptions, 'category'>): Promise<APIImageResult[]> {
    const agriculturalQueries = {
      livestock: 'cattle cows farm animals dairy livestock ranch',
      crops: 'crops wheat corn harvest agriculture grain farming',
      equipment: 'tractor farm equipment agricultural machinery farming tools',
      farms: 'farm farmhouse barn rural property countryside',
      hero: 'agriculture farming rural landscape countryside vista',
      general: 'agriculture farming rural countryside organic'
    };

    const query = agriculturalQueries[category as keyof typeof agriculturalQueries] || agriculturalQueries.general;
    
    return this.search(query, { ...options, category });
  }

  /**
   * Get hero images with agricultural themes
   * Validates: Requirements 2.1
   */
  async getHeroImages(count: number = 5): Promise<APIImageResult[]> {
    const heroQueries = [
      'agriculture landscape farming countryside vista',
      'rural farm field sunset golden hour pastoral',
      'farming equipment tractor field machinery',
      'harvest season agriculture crops grain',
      'pastoral landscape farm animals cattle'
    ];

    const randomQuery = heroQueries[Math.floor(Math.random() * heroQueries.length)];
    
    return this.search(randomQuery, {
      count,
      orientation: 'landscape',
      category: 'hero'
    });
  }

  /**
   * Get curated agricultural collections
   * Validates: Requirements 2.1
   */
  async getCuratedAgricultural(count: number = 10): Promise<APIImageResult[]> {
    // Pexels has curated collections, but we'll use targeted searches for agricultural content
    const curatedQueries = [
      'sustainable agriculture organic farming',
      'modern farming technology precision agriculture',
      'traditional farming rural heritage',
      'livestock management cattle dairy',
      'crop cultivation harvest season'
    ];

    const results: APIImageResult[] = [];
    const imagesPerQuery = Math.ceil(count / curatedQueries.length);

    for (const query of curatedQueries) {
      try {
        const images = await this.search(query, {
          count: imagesPerQuery,
          orientation: 'landscape'
        });
        results.push(...images);
        
        if (results.length >= count) break;
      } catch (error) {
        // Continue with other queries if one fails
        console.warn(`Failed to fetch curated images for query "${query}":`, error);
      }
    }

    return results.slice(0, count);
  }

  /**
   * Validate image relevance to agricultural theme
   * Validates: Requirements 2.1
   */
  validateAgriculturalRelevance(image: APIImageResult): boolean {
    const agriculturalKeywords = [
      'farm', 'agriculture', 'farming', 'rural', 'countryside', 'pastoral',
      'cattle', 'cow', 'livestock', 'dairy', 'beef', 'pasture', 'ranch',
      'crop', 'wheat', 'corn', 'grain', 'harvest', 'field', 'plantation',
      'tractor', 'machinery', 'equipment', 'barn', 'farmhouse', 'silo',
      'organic', 'sustainable', 'cultivation', 'irrigation', 'greenhouse'
    ];

    const searchText = [
      image.description || '',
      ...image.tags
    ].join(' ').toLowerCase();

    return agriculturalKeywords.some(keyword => searchText.includes(keyword));
  }

  /**
   * Search with fallback queries for better agricultural relevance
   * Validates: Requirements 2.1
   */
  async searchWithFallback(primaryQuery: string, options: SearchOptions): Promise<APIImageResult[]> {
    try {
      // Try primary query first
      const results = await this.search(primaryQuery, options);
      
      // Filter for agricultural relevance
      const relevantResults = results.filter(image => this.validateAgriculturalRelevance(image));
      
      if (relevantResults.length >= options.count * 0.7) { // If we have 70% relevant results
        return relevantResults.slice(0, options.count);
      }
    } catch (error) {
      console.warn(`Primary query "${primaryQuery}" failed, trying fallback`);
    }

    // Fallback to broader agricultural terms
    const fallbackQueries = [
      `agriculture ${primaryQuery}`,
      `farming ${primaryQuery}`,
      `rural ${primaryQuery}`,
      'agriculture farming countryside'
    ];

    for (const fallbackQuery of fallbackQueries) {
      try {
        const results = await this.search(fallbackQuery, options);
        const relevantResults = results.filter(image => this.validateAgriculturalRelevance(image));
        
        if (relevantResults.length > 0) {
          return relevantResults.slice(0, options.count);
        }
      } catch (error) {
        console.warn(`Fallback query "${fallbackQuery}" failed`);
      }
    }

    // Final fallback - return any agricultural images
    return this.searchAgricultural('general', options);
  }
}