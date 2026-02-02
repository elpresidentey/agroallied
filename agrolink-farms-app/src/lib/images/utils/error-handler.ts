/**
 * Error handling utilities for the Image Integration System
 * Implements error classification and fallback strategies with retry mechanisms
 * Requirements: 1.3, 1.4, 7.1
 */

import { ImageError, ImageErrorType } from '../types';

export class ImageErrorHandler {
  /**
   * Create a standardized ImageError
   * Requirements: 7.1
   */
  static createError(
    code: ImageErrorType,
    message: string,
    source?: 'unsplash' | 'pexels' | 'cache',
    originalError?: Error
  ): ImageError {
    const retryable = this.determineRetryability(code);
    const fallbackStrategy = this.determineFallbackStrategy(code, source);

    return {
      code,
      message,
      source,
      retryable,
      fallbackStrategy,
      originalError
    };
  }

  /**
   * Check if an error is retryable
   * Requirements: 1.4, 7.1
   */
  static isRetryable(error: ImageError): boolean {
    return error.retryable;
  }

  /**
   * Get the appropriate fallback strategy for an error
   * Requirements: 1.3, 7.1
   */
  static getFallbackStrategy(error: ImageError): 'cache' | 'alternative_api' | 'placeholder' {
    return error.fallbackStrategy;
  }

  /**
   * Determine if an error type is retryable
   * Private helper method
   */
  private static determineRetryability(code: ImageErrorType): boolean {
    switch (code) {
      case ImageErrorType.API_RATE_LIMIT:
      case ImageErrorType.NETWORK_ERROR:
      case ImageErrorType.API_UNAVAILABLE:
        return true;
      case ImageErrorType.API_AUTHENTICATION:
      case ImageErrorType.VALIDATION_ERROR:
      case ImageErrorType.CONFIGURATION_ERROR:
        return false;
      case ImageErrorType.CACHE_ERROR:
        return true; // Cache errors can be retried
      default:
        return false;
    }
  }

  /**
   * Determine the appropriate fallback strategy
   * Private helper method
   */
  private static determineFallbackStrategy(
    code: ImageErrorType, 
    source?: 'unsplash' | 'pexels' | 'cache'
  ): 'cache' | 'alternative_api' | 'placeholder' {
    switch (code) {
      case ImageErrorType.API_AUTHENTICATION:
        // If one API fails auth, try the other
        return source ? 'alternative_api' : 'placeholder';
      
      case ImageErrorType.API_RATE_LIMIT:
        // If rate limited, try alternative API first, then cache
        return source ? 'alternative_api' : 'cache';
      
      case ImageErrorType.API_UNAVAILABLE:
        // If API is down, try alternative API first, then cache
        return source ? 'alternative_api' : 'cache';
      
      case ImageErrorType.NETWORK_ERROR:
        // Network issues - try cache first
        return 'cache';
      
      case ImageErrorType.CACHE_ERROR:
        // Cache issues - try alternative API
        return 'alternative_api';
      
      case ImageErrorType.VALIDATION_ERROR:
      case ImageErrorType.CONFIGURATION_ERROR:
        // Configuration/validation errors - use placeholder
        return 'placeholder';
      
      default:
        return 'placeholder';
    }
  }
}

/**
 * Retry mechanism with exponential backoff
 * Requirements: 1.4
 */
export class RetryHandler {
  private static readonly DEFAULT_MAX_ATTEMPTS = 3;
  private static readonly DEFAULT_BASE_DELAY = 1000; // 1 second
  private static readonly DEFAULT_MAX_DELAY = 16000; // 16 seconds

  /**
   * Execute a function with retry logic and exponential backoff
   * Requirements: 1.4
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
      maxDelay?: number;
      shouldRetry?: (error: any) => boolean;
      onRetry?: (attempt: number, error: any) => void;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = this.DEFAULT_MAX_ATTEMPTS,
      baseDelay = this.DEFAULT_BASE_DELAY,
      maxDelay = this.DEFAULT_MAX_DELAY,
      shouldRetry = () => true,
      onRetry
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on the last attempt
        if (attempt === maxAttempts) {
          break;
        }

        // Check if we should retry this error
        if (!shouldRetry(error)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
          maxDelay
        );

        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt, error);
        }

        // Wait before retrying
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Execute a function with retry logic specifically for API rate limits
   * Requirements: 1.4
   */
  static async withRateLimitRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      onRateLimit?: (attempt: number, resetTime?: Date) => void;
    } = {}
  ): Promise<T> {
    const { maxAttempts = 5, onRateLimit } = options;

    return this.withRetry(operation, {
      maxAttempts,
      shouldRetry: (error) => {
        // Retry if it's a rate limit error or network error
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          return message.includes('rate limit') || 
                 message.includes('too many requests') ||
                 message.includes('network') ||
                 message.includes('timeout');
        }
        return false;
      },
      onRetry: (attempt, error) => {
        if (onRateLimit) {
          // Try to extract reset time from error if available
          let resetTime: Date | undefined;
          if (error.resetTime) {
            resetTime = new Date(error.resetTime);
          }
          onRateLimit(attempt, resetTime);
        }
      }
    });
  }

  /**
   * Delay execution for specified milliseconds
   * Private helper method
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Fallback chain executor
 * Requirements: 1.3, 7.1
 */
export class FallbackChain {
  /**
   * Execute a series of fallback operations until one succeeds
   * Requirements: 1.3, 7.1
   */
  static async execute<T>(
    operations: Array<{
      name: string;
      operation: () => Promise<T>;
      shouldTry?: (previousError?: any) => boolean;
    }>,
    options: {
      onFallback?: (operationName: string, error: any) => void;
    } = {}
  ): Promise<T> {
    const { onFallback } = options;
    let lastError: any;

    for (const { name, operation, shouldTry } of operations) {
      try {
        // Check if we should try this operation
        if (shouldTry && !shouldTry(lastError)) {
          continue;
        }

        return await operation();
      } catch (error) {
        lastError = error;
        
        if (onFallback) {
          onFallback(name, error);
        }
      }
    }

    // If all operations failed, throw the last error
    throw lastError || new Error('All fallback operations failed');
  }
}

/**
 * Error classification utilities
 * Requirements: 7.1
 */
export class ErrorClassifier {
  /**
   * Classify an error and return appropriate ImageError
   * Requirements: 7.1
   */
  static classifyError(
    error: any, 
    context: {
      operation: string;
      source?: 'unsplash' | 'pexels' | 'cache';
    }
  ): ImageError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // Network-related errors
      if (message.includes('network') || 
          message.includes('timeout') || 
          message.includes('connection')) {
        return ImageErrorHandler.createError(
          ImageErrorType.NETWORK_ERROR,
          `Network error during ${context.operation}: ${error.message}`,
          context.source,
          error
        );
      }

      // Authentication errors
      if (message.includes('unauthorized') || 
          message.includes('authentication') || 
          message.includes('invalid key') ||
          message.includes('forbidden')) {
        return ImageErrorHandler.createError(
          ImageErrorType.API_AUTHENTICATION,
          `Authentication error during ${context.operation}: ${error.message}`,
          context.source,
          error
        );
      }

      // Rate limit errors
      if (message.includes('rate limit') || 
          message.includes('too many requests') ||
          message.includes('quota exceeded')) {
        return ImageErrorHandler.createError(
          ImageErrorType.API_RATE_LIMIT,
          `Rate limit exceeded during ${context.operation}: ${error.message}`,
          context.source,
          error
        );
      }

      // API unavailable errors
      if (message.includes('service unavailable') || 
          message.includes('server error') ||
          message.includes('bad gateway')) {
        return ImageErrorHandler.createError(
          ImageErrorType.API_UNAVAILABLE,
          `API unavailable during ${context.operation}: ${error.message}`,
          context.source,
          error
        );
      }

      // Cache-related errors
      if (context.source === 'cache' || message.includes('cache')) {
        return ImageErrorHandler.createError(
          ImageErrorType.CACHE_ERROR,
          `Cache error during ${context.operation}: ${error.message}`,
          context.source,
          error
        );
      }

      // Validation errors
      if (message.includes('validation') || 
          message.includes('invalid') ||
          message.includes('malformed')) {
        return ImageErrorHandler.createError(
          ImageErrorType.VALIDATION_ERROR,
          `Validation error during ${context.operation}: ${error.message}`,
          context.source,
          error
        );
      }

      // Configuration errors
      if (message.includes('configuration') || 
          message.includes('missing key') ||
          message.includes('not configured')) {
        return ImageErrorHandler.createError(
          ImageErrorType.CONFIGURATION_ERROR,
          `Configuration error during ${context.operation}: ${error.message}`,
          context.source,
          error
        );
      }
    }

    // Default to API unavailable for unknown errors
    return ImageErrorHandler.createError(
      ImageErrorType.API_UNAVAILABLE,
      `Unknown error during ${context.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      context.source,
      error instanceof Error ? error : undefined
    );
  }
}