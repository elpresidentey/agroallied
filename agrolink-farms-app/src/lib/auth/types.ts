/**
 * Authentication error types and interfaces
 * 
 * This module defines all error codes and interfaces used throughout
 * the authentication system for consistent error handling.
 */

/**
 * Enum defining all possible authentication error codes
 * 
 * These codes are used for programmatic error handling and mapping
 * to user-friendly messages. Each code represents a specific error
 * condition that can occur during authentication operations.
 */
export enum AuthErrorCode {
  // Authentication errors
  /** Wrong email/password combination */
  INVALID_CREDENTIALS = 'invalid_credentials',
  /** Email address has not been verified */
  EMAIL_NOT_VERIFIED = 'email_not_verified',
  /** Account has been temporarily locked */
  ACCOUNT_LOCKED = 'account_locked',
  
  // Network and service errors
  /** Network connection problem */
  NETWORK_ERROR = 'network_error',
  /** Authentication service is temporarily unavailable */
  SERVICE_UNAVAILABLE = 'service_unavailable',
  
  // Rate limiting errors
  /** Too many requests in a short time period */
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  /** Signup cooldown period is active */
  SIGNUP_COOLDOWN = 'signup_cooldown',
  
  // Validation errors
  /** Email address format is invalid */
  INVALID_EMAIL = 'invalid_email',
  /** Password does not meet strength requirements */
  WEAK_PASSWORD = 'weak_password',
  /** Required form fields are missing */
  MISSING_FIELDS = 'missing_fields',
  
  // Session and token errors
  /** User session has expired */
  SESSION_EXPIRED = 'session_expired',
  /** Failed to refresh authentication token */
  TOKEN_REFRESH_FAILED = 'token_refresh_failed',
  /** Authentication token is invalid */
  INVALID_TOKEN = 'invalid_token',
  
  // Profile and database errors
  /** Failed to create user profile in database */
  PROFILE_CREATION_FAILED = 'profile_creation_failed',
  /** Failed to update user profile */
  PROFILE_UPDATE_FAILED = 'profile_update_failed',
  /** Database operation failed */
  DATABASE_ERROR = 'database_error',
  
  // Password reset errors
  /** Password reset token is invalid or expired */
  INVALID_RESET_TOKEN = 'invalid_reset_token',
  /** Password reset token has expired */
  RESET_TOKEN_EXPIRED = 'reset_token_expired',
  
  // Email verification errors
  /** Email verification token is invalid */
  INVALID_VERIFICATION_TOKEN = 'invalid_verification_token',
  /** Email verification token has expired */
  VERIFICATION_TOKEN_EXPIRED = 'verification_token_expired',
  
  // Generic errors
  /** An unexpected error occurred */
  UNKNOWN_ERROR = 'unknown_error',
  /** Internal server error */
  INTERNAL_ERROR = 'internal_error'
}

/**
 * Interface for structured authentication errors
 * 
 * Provides a consistent error format across the authentication system
 * with both technical details for debugging and user-friendly messages
 * for display in the UI.
 */
export interface AuthError {
  /** Error name (inherited from Error class) */
  name?: string;
  
  /** Error code for programmatic handling */
  code: AuthErrorCode;
  
  /** Technical error message for debugging and logging */
  message: string;
  
  /** User-friendly error message safe for display in UI */
  userMessage: string;
  
  /** Whether this error condition can be retried */
  retryable: boolean;
  
  /** Time in milliseconds to wait before retry (if retryable) */
  retryAfter?: number;
  
  /** Additional context or metadata about the error */
  metadata?: Record<string, any>;
}

/**
 * Type guard to check if an object is an AuthError
 * 
 * This function safely determines if an unknown value is a valid AuthError
 * object by checking for required properties and valid error codes.
 * 
 * @param error - Unknown value to check
 * @returns True if the value is a valid AuthError
 * 
 * @example
 * try {
 *   await someAuthOperation()
 * } catch (error) {
 *   if (isAuthError(error)) {
 *     console.log('Auth error:', error.userMessage)
 *   } else {
 *     console.log('Unknown error:', error)
 *   }
 * }
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'userMessage' in error &&
    'retryable' in error &&
    Object.values(AuthErrorCode).includes((error as AuthError).code)
  );
}

/**
 * Options for creating AuthError instances
 * 
 * Provides a structured way to create AuthError objects with
 * optional fields and sensible defaults.
 */
export interface AuthErrorOptions {
  /** Error code identifying the type of error */
  code: AuthErrorCode;
  /** Technical error message for debugging */
  message: string;
  /** User-friendly message (optional - will be generated if not provided) */
  userMessage?: string;
  /** Whether the error can be retried (defaults to false) */
  retryable?: boolean;
  /** Milliseconds to wait before retry */
  retryAfter?: number;
  /** Additional error context */
  metadata?: Record<string, any>;
}