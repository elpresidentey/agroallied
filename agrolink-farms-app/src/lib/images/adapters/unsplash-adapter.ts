/**
 * UnsplashAdapter - Unsplash API integration
 * Provides authentication and search functionality for Unsplash API
 * Validates: Requirements 1.1, 2.1
 */

import { ImageAPIAdapter } from './image-api-adapter';
import { SearchOptions, APIImageResult, RateLimitInfo, UnsplashImageResponse, UnsplashSearchResponse } from '../types';

export class UnsplashAdapter extends ImageAPIAdapter {
  constructor(accessKey: string, baseUrl: string = 'https://api.unsplash.com', rateLimit: number = 50) {
    super(accessKey, baseUrl, rateLimit);
  }

  /**
   * Search for images using Unsplash API
   * Validates: Requirements 1.1, 2.1
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
          'Authorization': `Client-ID ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      const data: UnsplashSearchResponse = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format from Unsplash API');
      }

      return data.results.map(image => this.transformUnsplashImage(image));
    }, `Unsplash search for "${sanitizedQuery}"`);
  }

  /**
   * Get a specific image by ID from Unsplash
   * Validates: Requirements 1.1
   */
  async getImage(id: string): Promise<APIImageResult> {
    if (!id || typeof id !== 'string') {
      throw new Error('Image ID is required and must be a string');
    }

    return this.executeWithRetry(async () => {
      const url = `${this.baseUrl}/photos/${encodeURIComponent(id)}`;
      const response = await this.makeRequest(url, {
        headers: {
          'Authorization': `Client-ID ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      const data: UnsplashImageResponse = await response.json();
      return this.transformUnsplashImage(data);
    }, `Unsplash image fetch for ID "${id}"`);
  }

  /**
   * Get current rate limit information
   * Validates: Requirements 1.4
   */
  async getRateLimit(): Promise<RateLimitInfo> {
    // For Unsplash, we can get rate limit info from any API call
    // But we'll also maintain our local tracking
    const localRateLimit = this.getCurrentRateLimit();

    try {
      // Make a lightweight request to get current rate limit headers
      const response = await this.makeRequest(`${this.baseUrl}/photos?per_page=1`, {
        headers: {
          'Authorization': `Client-ID ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      // Extract rate limit info from headers
      const remaining = parseInt(response.headers.get('X-Ratelimit-Remaining') || '0', 10);
      const total = parseInt(response.headers.get('X-Ratelimit-Limit') || '50', 10);
      
      // Parse reset time from header (Unix timestamp)
      const resetTimestamp = parseInt(response.headers.get('X-Ratelimit-Reset') || '0', 10);
      const resetTime = resetTimestamp > 0 ? new Date(resetTimestamp * 1000) : localRateLimit.resetTime;

      return {
        remaining: Math.min(remaining, localRateLimit.remaining),
        total,
        resetTime
      };
    } catch (error) {
      // If we can't get server rate limit info, return local tracking
      return localRateLimit;
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
      per_page: Math.min(options.count, 30).toString(), // Unsplash max is 30 per page
      order_by: 'relevant'
    });

    // Add orientation filter if specified
    if (options.orientation) {
      params.append('orientation', options.orientation);
    }

    // Add category filter if specified
    if (options.category) {
      // Enhance query with category-specific terms
      const enhancedQuery = this.enhanceQueryWithCategory(query, options.category);
      params.set('query', enhancedQuery);
    }

    return `${this.baseUrl}/search/photos?${params.toString()}`;
  }

  /**
   * Enhance search query with agricultural category terms
   * Validates: Requirements 2.1
   */
  private enhanceQueryWithCategory(query: string, category: string): string {
    const agriculturalTerms = {
      livestock: ['farm animals', 'cattle', 'dairy', 'pasture'],
      crops: ['agriculture', 'harvest', 'grain', 'field'],
      equipment: ['farm equipment', 'agricultural machinery', 'rural'],
      farms: ['farmhouse', 'barn', 'agricultural land', 'countryside'],
      hero: ['rural landscape', 'farming', 'countryside'],
      general: ['agriculture', 'farming', 'rural']
    };

    const categoryTerms = agriculturalTerms[category as keyof typeof agriculturalTerms] || agriculturalTerms.general;
    const randomTerm = categoryTerms[Math.floor(Math.random() * categoryTerms.length)];
    
    return `${query} ${randomTerm}`;
  }

  /**
   * Transform Unsplash API response to our standard format
   */
  private transformUnsplashImage(image: UnsplashImageResponse): APIImageResult {
    // Extract tags from the image
    const tags = image.tags ? image.tags.map(tag => tag.title) : [];
    
    // Generate alt text from description or tags
    const altText = image.alt_description || 
                   image.description || 
                   (tags.length > 0 ? `Image featuring ${tags.slice(0, 3).join(', ')}` : 'Agricultural image');

    return {
      id: image.id,
      urls: {
        raw: image.urls.raw,
        full: image.urls.full,
        regular: image.urls.regular,
        small: image.urls.small,
        thumb: image.urls.thumb
      },
      photographer: {
        name: image.user.name,
        url: image.user.links.html
      },
      description: image.description || altText,
      tags
    };
  }

  /**
   * Validate that we have proper authentication
   */
  private validateAuthentication(): void {
    if (!this.apiKey) {
      throw new Error('Unsplash access key is required for authentication');
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
      livestock: 'cattle cows farm animals dairy livestock',
      crops: 'crops wheat corn harvest agriculture grain',
      equipment: 'tractor farm equipment agricultural machinery',
      farms: 'farm farmhouse barn rural property',
      hero: 'agriculture farming rural landscape countryside',
      general: 'agriculture farming rural countryside'
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
      'agriculture landscape farming countryside',
      'rural farm field sunset golden hour',
      'farming equipment tractor field',
      'harvest season agriculture crops',
      'pastoral landscape farm animals'
    ];

    const randomQuery = heroQueries[Math.floor(Math.random() * heroQueries.length)];
    
    return this.search(randomQuery, {
      count,
      orientation: 'landscape',
      category: 'hero'
    });
  }

  /**
   * Validate image relevance to agricultural theme
   * Validates: Requirements 2.1
   */
  validateAgriculturalRelevance(image: APIImageResult): boolean {
    const agriculturalKeywords = [
      'farm', 'agriculture', 'farming', 'rural', 'countryside', 'pastoral',
      'cattle', 'cow', 'livestock', 'dairy', 'beef', 'pasture',
      'crop', 'wheat', 'corn', 'grain', 'harvest', 'field', 'plantation',
      'tractor', 'machinery', 'equipment', 'barn', 'farmhouse',
      'organic', 'sustainable', 'cultivation', 'irrigation'
    ];

    const searchText = [
      image.description || '',
      ...image.tags
    ].join(' ').toLowerCase();

    return agriculturalKeywords.some(keyword => searchText.includes(keyword));
  }
}