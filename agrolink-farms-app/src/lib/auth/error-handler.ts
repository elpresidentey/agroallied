import { AuthError, AuthErrorCode, AuthErrorOptions, isAuthError } from './types';

/**
 * Error handler service for authentication operations
 * Provides consistent error parsing, user-friendly messages, and retry logic
 */
export class ErrorHandler {
  /**
   * Parse various error types into structured AuthError format
   */
  parseAuthError(error: unknown): AuthError {
    // If already an AuthError, return as-is
    if (isAuthError(error)) {
      return error;
    }

    // Handle network errors first (before Supabase errors)
    if (this.isNetworkError(error)) {
      return this.createAuthError({
        code: AuthErrorCode.NETWORK_ERROR,
        message: error instanceof Error ? error.message : 'Network error occurred',
        retryable: true,
        retryAfter: 3000
      });
    }

    // Handle Supabase auth errors
    if (this.isSupabaseError(error)) {
      return this.parseSupabaseError(error);
    }

    // Handle generic JavaScript errors
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return this.createAuthError({
        code: AuthErrorCode.UNKNOWN_ERROR,
        message: (error as Error).message,
        retryable: false
      });
    }

    // Handle unknown error types
    return this.createAuthError({
      code: AuthErrorCode.UNKNOWN_ERROR,
      message: 'An unexpected error occurred',
      retryable: false
    });
  }

  /**
   * Generate user-friendly error messages
   */
  getUserMessage(error: AuthError): string {
    const messages: Record<AuthErrorCode, string> = {
      [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password. Please check your credentials and try again.',
      [AuthErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email address before signing in. Check your inbox for a verification link.',
      [AuthErrorCode.ACCOUNT_LOCKED]: 'Your account has been temporarily locked. Please try again later or contact support.',
      
      [AuthErrorCode.NETWORK_ERROR]: 'Connection problem. Please check your internet connection and try again.',
      [AuthErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again in a few minutes.',
      
      [AuthErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many attempts. Please wait before trying again.',
      [AuthErrorCode.SIGNUP_COOLDOWN]: 'Please wait a moment before creating another account.',
      
      [AuthErrorCode.INVALID_EMAIL]: 'Please enter a valid email address.',
      [AuthErrorCode.WEAK_PASSWORD]: 'Password must be at least 8 characters long and include letters and numbers.',
      [AuthErrorCode.MISSING_FIELDS]: 'Please fill in all required fields.',
      
      [AuthErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
      [AuthErrorCode.TOKEN_REFRESH_FAILED]: 'Session refresh failed. Please sign in again.',
      [AuthErrorCode.INVALID_TOKEN]: 'Invalid authentication token. Please sign in again.',
      
      [AuthErrorCode.PROFILE_CREATION_FAILED]: 'Account created but profile setup failed. Please try signing in.',
      [AuthErrorCode.PROFILE_UPDATE_FAILED]: 'Failed to update profile. Please try again.',
      [AuthErrorCode.DATABASE_ERROR]: 'Database error occurred. Please try again later.',
      
      [AuthErrorCode.INVALID_RESET_TOKEN]: 'Invalid or expired password reset link. Please request a new one.',
      [AuthErrorCode.RESET_TOKEN_EXPIRED]: 'Password reset link has expired. Please request a new one.',
      
      [AuthErrorCode.INVALID_VERIFICATION_TOKEN]: 'Invalid verification link. Please check your email for the correct link.',
      [AuthErrorCode.VERIFICATION_TOKEN_EXPIRED]: 'Verification link has expired. Please request a new one.',
      
      [AuthErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
      [AuthErrorCode.INTERNAL_ERROR]: 'Internal server error. Please try again later.'
    };

    return error.userMessage || messages[error.code] || messages[AuthErrorCode.UNKNOWN_ERROR];
  }

  /**
   * Determine if an error is retryable
   */
  isRetryable(error: AuthError): boolean {
    const retryableErrors = [
      AuthErrorCode.NETWORK_ERROR,
      AuthErrorCode.SERVICE_UNAVAILABLE,
      AuthErrorCode.TOKEN_REFRESH_FAILED,
      AuthErrorCode.DATABASE_ERROR,
      AuthErrorCode.PROFILE_CREATION_FAILED,
      AuthErrorCode.PROFILE_UPDATE_FAILED,
      AuthErrorCode.INTERNAL_ERROR
    ];

    return error.retryable || retryableErrors.includes(error.code);
  }

  /**
   * Log error for debugging purposes
   */
  logError(error: AuthError, context: string): void {
    const logData = {
      context,
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      retryable: error.retryable,
      retryAfter: error.retryAfter,
      metadata: error.metadata,
      timestamp: new Date().toISOString()
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('[AuthError]', logData);
    }

    // In production, you might want to send to a logging service
    // Example: sendToLoggingService(logData);
  }

  /**
   * Create a new AuthError with default user message
   */
  private createAuthError(options: AuthErrorOptions): AuthError {
    return {
      code: options.code,
      message: options.message,
      userMessage: options.userMessage || this.getUserMessage({ 
        code: options.code, 
        message: options.message, 
        userMessage: '', 
        retryable: false 
      }),
      retryable: options.retryable ?? false,
      retryAfter: options.retryAfter,
      metadata: options.metadata
    };
  }

  /**
   * Check if error is from Supabase
   */
  private isSupabaseError(error: unknown): error is any {
    return (
      typeof error === 'object' &&
      error !== null &&
      ('message' in error || 'error_description' in error || 'status' in error)
    );
  }

  /**
   * Parse Supabase-specific errors
   */
  private parseSupabaseError(error: any): AuthError {
    const message = error.message || error.error_description || 'Supabase error';
    const status = error.status;

    // Map common Supabase error messages to our error codes
    if (message.includes('Invalid login credentials')) {
      return this.createAuthError({
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message,
        retryable: false
      });
    }

    if (message.includes('Email not confirmed')) {
      return this.createAuthError({
        code: AuthErrorCode.EMAIL_NOT_VERIFIED,
        message,
        retryable: false
      });
    }

    if (message.includes('Too many requests') || status === 429) {
      return this.createAuthError({
        code: AuthErrorCode.RATE_LIMIT_EXCEEDED,
        message,
        retryable: true,
        retryAfter: 60000 // 1 minute
      });
    }

    if (message.includes('Invalid email')) {
      return this.createAuthError({
        code: AuthErrorCode.INVALID_EMAIL,
        message,
        retryable: false
      });
    }

    if (message.includes('Password should be at least')) {
      return this.createAuthError({
        code: AuthErrorCode.WEAK_PASSWORD,
        message,
        retryable: false
      });
    }

    if (message.includes('JWT expired') || message.includes('refresh_token_not_found')) {
      return this.createAuthError({
        code: AuthErrorCode.SESSION_EXPIRED,
        message,
        retryable: false
      });
    }

    if (message.includes('Invalid token')) {
      return this.createAuthError({
        code: AuthErrorCode.INVALID_TOKEN,
        message,
        retryable: false
      });
    }

    if (status >= 500) {
      return this.createAuthError({
        code: AuthErrorCode.SERVICE_UNAVAILABLE,
        message,
        retryable: true,
        retryAfter: 5000 // 5 seconds
      });
    }

    // Default Supabase error
    return this.createAuthError({
      code: AuthErrorCode.UNKNOWN_ERROR,
      message,
      retryable: false,
      metadata: { supabaseError: error }
    });
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: unknown): error is Error {
    if (!(error instanceof Error)) return false;
    
    const networkErrorMessages = [
      'fetch failed',
      'network error',
      'connection',
      'timeout',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];

    return networkErrorMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();