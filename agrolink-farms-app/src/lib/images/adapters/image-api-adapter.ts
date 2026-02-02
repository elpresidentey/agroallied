/**
 * ImageAPIAdapter - Base class for external image API interactions
 * Provides common functionality including rate limiting and request throttling
 * Validates: Requirements 1.4
 */

import { ImageAPIAdapter as IImageAPIAdapter, SearchOptions, APIImageResult, RateLimitInfo, ImageError, ImageErrorType } from '../types';

// ============================================================================
// Rate Limiting and Request Management
// ============================================================================

interface RequestRecord {
  timestamp: number;
  count: number;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export abstract class ImageAPIAdapter implements IImageAPIAdapter {
  protected apiKey: string;
  protected baseUrl: string;
  protected rateLimit: number;
  protected requestHistory: RequestRecord[] = [];
  protected retryConfig: RetryConfig;

  constructor(apiKey: string, baseUrl: string, rateLimit: number) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.rateLimit = rateLimit;
    this.retryConfig = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 16000,
      backoffMultiplier: 2
    };
  }

  // ============================================================================
  // Abstract Methods (to be implemented by concrete adapters)
  // ============================================================================

  abstract search(query: string, options: SearchOptions): Promise<APIImageResult[]>;
  abstract getImage(id: string): Promise<APIImageResult>;
  abstract getRateLimit(): Promise<RateLimitInfo>;

  // ============================================================================
  // Rate Limiting Implementation
  // ============================================================================

  /**
   * Check if we can make a request without exceeding rate limits
   */
  protected canMakeRequest(): boolean {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds

    // Clean up old request records
    this.requestHistory = this.requestHistory.filter(record => record.timestamp > oneHourAgo);

    // Count total requests in the last hour
    const totalRequests = this.requestHistory.reduce((sum, record) => sum + record.count, 0);

    return totalRequests < this.rateLimit;
  }

  /**
   * Record a request for rate limiting purposes
   */
  protected recordRequest(count: number = 1): void {
    const now = Date.now();
    this.requestHistory.push({
      timestamp: now,
      count
    });
  }

  /**
   * Wait for rate limit reset if necessary
   */
  protected async waitForRateLimit(): Promise<void> {
    if (this.canMakeRequest()) {
      return;
    }

    // Calculate wait time until oldest request expires
    const oldestRequest = this.requestHistory[0];
    if (oldestRequest) {
      const waitTime = (oldestRequest.timestamp + (60 * 60 * 1000)) - Date.now();
      if (waitTime > 0) {
        await this.delay(Math.min(waitTime, 60000)); // Wait max 1 minute
      }
    }
  }

  // ============================================================================
  // Request Throttling and Retry Logic
  // ============================================================================

  /**
   * Execute a request with rate limiting and retry logic
   */
  protected async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        // Check rate limit before making request
        await this.waitForRateLimit();

        // Execute the request
        const result = await requestFn();
        
        // Record successful request
        this.recordRequest();
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Determine if error is retryable
        const imageError = this.classifyError(error as Error, context);
        
        if (!imageError.retryable || attempt === this.retryConfig.maxAttempts) {
          throw imageError;
        }

        // Calculate delay for exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelayMs
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + (Math.random() * 1000);
        
        await this.delay(jitteredDelay);
      }
    }

    // This should never be reached due to the throw in the loop, but TypeScript requires it
    throw this.classifyError(lastError!, context);
  }

  /**
   * Classify errors for appropriate handling
   */
  protected classifyError(error: Error, context: string): ImageError {
    const message = error.message.toLowerCase();

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('429')) {
      return {
        code: ImageErrorType.API_RATE_LIMIT,
        message: `Rate limit exceeded for ${context}`,
        retryable: true,
        fallbackStrategy: 'alternative_api',
        originalError: error
      };
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('401') || message.includes('403')) {
      return {
        code: ImageErrorType.API_AUTHENTICATION,
        message: `Authentication failed for ${context}`,
        retryable: false,
        fallbackStrategy: 'alternative_api',
        originalError: error
      };
    }

    // Network errors
    if (message.includes('network') || message.includes('timeout') || message.includes('enotfound')) {
      return {
        code: ImageErrorType.NETWORK_ERROR,
        message: `Network error for ${context}`,
        retryable: true,
        fallbackStrategy: 'cache',
        originalError: error
      };
    }

    // Server errors (5xx)
    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return {
        code: ImageErrorType.API_UNAVAILABLE,
        message: `API server error for ${context}`,
        retryable: true,
        fallbackStrategy: 'alternative_api',
        originalError: error
      };
    }

    // Default to non-retryable error
    return {
      code: ImageErrorType.API_UNAVAILABLE,
      message: `Unknown error for ${context}: ${error.message}`,
      retryable: false,
      fallbackStrategy: 'cache',
      originalError: error
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Delay execution for specified milliseconds
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  protected async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'AgroLink-Image-Integration/1.0',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Validate search options
   */
  protected validateSearchOptions(options: SearchOptions): void {
    if (options.count <= 0 || options.count > 50) {
      throw new Error('Search count must be between 1 and 50');
    }

    if (options.orientation && !['landscape', 'portrait', 'square'].includes(options.orientation)) {
      throw new Error('Invalid orientation. Must be landscape, portrait, or square');
    }

    if (options.size && !['small', 'medium', 'large'].includes(options.size)) {
      throw new Error('Invalid size. Must be small, medium, or large');
    }
  }

  /**
   * Sanitize search query
   */
  protected sanitizeQuery(query: string): string {
    return query
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase();
  }

  /**
   * Get current rate limit status
   */
  protected getCurrentRateLimit(): RateLimitInfo {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Clean up old records
    this.requestHistory = this.requestHistory.filter(record => record.timestamp > oneHourAgo);

    // Count current usage
    const used = this.requestHistory.reduce((sum, record) => sum + record.count, 0);
    const remaining = Math.max(0, this.rateLimit - used);

    // Calculate reset time (when oldest request expires)
    const oldestRequest = this.requestHistory[0];
    const resetTime = oldestRequest 
      ? new Date(oldestRequest.timestamp + (60 * 60 * 1000))
      : new Date(now + (60 * 60 * 1000));

    return {
      remaining,
      total: this.rateLimit,
      resetTime
    };
  }

  // ============================================================================
  // Configuration Methods
  // ============================================================================

  /**
   * Update retry configuration
   */
  public updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = {
      ...this.retryConfig,
      ...config
    };
  }

  /**
   * Get current retry configuration
   */
  public getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Clear request history (useful for testing)
   */
  public clearRequestHistory(): void {
    this.requestHistory = [];
  }
}