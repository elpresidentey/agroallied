import { ErrorHandler } from '../error-handler';
import { AuthError, AuthErrorCode } from '../types';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('parseAuthError', () => {
    it('should return AuthError as-is if already an AuthError', () => {
      const authError: AuthError = {
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid credentials',
        userMessage: 'Invalid email or password',
        retryable: false
      };

      const result = errorHandler.parseAuthError(authError);
      expect(result).toBe(authError);
    });

    it('should parse Supabase invalid credentials error', () => {
      const supabaseError = {
        message: 'Invalid login credentials'
      };

      const result = errorHandler.parseAuthError(supabaseError);
      expect(result.code).toBe(AuthErrorCode.INVALID_CREDENTIALS);
      expect(result.message).toBe('Invalid login credentials');
      expect(result.retryable).toBe(false);
    });

    it('should parse Supabase email not confirmed error', () => {
      const supabaseError = {
        message: 'Email not confirmed'
      };

      const result = errorHandler.parseAuthError(supabaseError);
      expect(result.code).toBe(AuthErrorCode.EMAIL_NOT_VERIFIED);
      expect(result.retryable).toBe(false);
    });

    it('should parse Supabase rate limit error', () => {
      const supabaseError = {
        message: 'Too many requests',
        status: 429
      };

      const result = errorHandler.parseAuthError(supabaseError);
      expect(result.code).toBe(AuthErrorCode.RATE_LIMIT_EXCEEDED);
      expect(result.retryable).toBe(true);
      expect(result.retryAfter).toBe(60000);
    });

    it('should parse Supabase invalid email error', () => {
      const supabaseError = {
        message: 'Invalid email format'
      };

      const result = errorHandler.parseAuthError(supabaseError);
      expect(result.code).toBe(AuthErrorCode.INVALID_EMAIL);
      expect(result.retryable).toBe(false);
    });

    it('should parse Supabase weak password error', () => {
      const supabaseError = {
        message: 'Password should be at least 8 characters'
      };

      const result = errorHandler.parseAuthError(supabaseError);
      expect(result.code).toBe(AuthErrorCode.WEAK_PASSWORD);
      expect(result.retryable).toBe(false);
    });

    it('should parse Supabase session expired error', () => {
      const supabaseError = {
        message: 'JWT expired'
      };

      const result = errorHandler.parseAuthError(supabaseError);
      expect(result.code).toBe(AuthErrorCode.SESSION_EXPIRED);
      expect(result.retryable).toBe(false);
    });

    it('should parse Supabase invalid token error', () => {
      const supabaseError = {
        message: 'Invalid token format'
      };

      const result = errorHandler.parseAuthError(supabaseError);
      expect(result.code).toBe(AuthErrorCode.INVALID_TOKEN);
      expect(result.retryable).toBe(false);
    });

    it('should parse Supabase server error', () => {
      const supabaseError = {
        message: 'Internal server error',
        status: 500
      };

      const result = errorHandler.parseAuthError(supabaseError);
      expect(result.code).toBe(AuthErrorCode.SERVICE_UNAVAILABLE);
      expect(result.retryable).toBe(true);
      expect(result.retryAfter).toBe(5000);
    });

    it('should parse network errors', () => {
      const networkError = new Error('fetch failed');

      const result = errorHandler.parseAuthError(networkError);
      expect(result.code).toBe(AuthErrorCode.NETWORK_ERROR);
      expect(result.retryable).toBe(true);
      expect(result.retryAfter).toBe(3000);
    });

    it('should parse generic JavaScript errors', () => {
      const genericError = new Error('Something went wrong');

      const result = errorHandler.parseAuthError(genericError);
      expect(result.code).toBe(AuthErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe('Something went wrong');
      expect(result.retryable).toBe(false);
    });

    it('should handle unknown error types', () => {
      const unknownError = 'string error';

      const result = errorHandler.parseAuthError(unknownError);
      expect(result.code).toBe(AuthErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.retryable).toBe(false);
    });
  });

  describe('getUserMessage', () => {
    it('should return user-friendly message for invalid credentials', () => {
      const error: AuthError = {
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid login credentials',
        userMessage: '',
        retryable: false
      };

      const result = errorHandler.getUserMessage(error);
      expect(result).toBe('Invalid email or password. Please check your credentials and try again.');
    });

    it('should return user-friendly message for email not verified', () => {
      const error: AuthError = {
        code: AuthErrorCode.EMAIL_NOT_VERIFIED,
        message: 'Email not confirmed',
        userMessage: '',
        retryable: false
      };

      const result = errorHandler.getUserMessage(error);
      expect(result).toBe('Please verify your email address before signing in. Check your inbox for a verification link.');
    });

    it('should return user-friendly message for network error', () => {
      const error: AuthError = {
        code: AuthErrorCode.NETWORK_ERROR,
        message: 'fetch failed',
        userMessage: '',
        retryable: true
      };

      const result = errorHandler.getUserMessage(error);
      expect(result).toBe('Connection problem. Please check your internet connection and try again.');
    });

    it('should return custom userMessage if provided', () => {
      const error: AuthError = {
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid login credentials',
        userMessage: 'Custom user message',
        retryable: false
      };

      const result = errorHandler.getUserMessage(error);
      expect(result).toBe('Custom user message');
    });

    it('should return default message for unknown error codes', () => {
      const error: AuthError = {
        code: 'unknown_code' as AuthErrorCode,
        message: 'Unknown error',
        userMessage: '',
        retryable: false
      };

      const result = errorHandler.getUserMessage(error);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('isRetryable', () => {
    it('should return true for retryable errors', () => {
      const retryableErrors = [
        AuthErrorCode.NETWORK_ERROR,
        AuthErrorCode.SERVICE_UNAVAILABLE,
        AuthErrorCode.TOKEN_REFRESH_FAILED,
        AuthErrorCode.DATABASE_ERROR,
        AuthErrorCode.PROFILE_CREATION_FAILED,
        AuthErrorCode.PROFILE_UPDATE_FAILED,
        AuthErrorCode.INTERNAL_ERROR
      ];

      retryableErrors.forEach(code => {
        const error: AuthError = {
          code,
          message: 'Test error',
          userMessage: 'Test message',
          retryable: false // Should be overridden by isRetryable logic
        };

        expect(errorHandler.isRetryable(error)).toBe(true);
      });
    });

    it('should return false for non-retryable errors', () => {
      const nonRetryableErrors = [
        AuthErrorCode.INVALID_CREDENTIALS,
        AuthErrorCode.EMAIL_NOT_VERIFIED,
        AuthErrorCode.INVALID_EMAIL,
        AuthErrorCode.WEAK_PASSWORD,
        AuthErrorCode.SESSION_EXPIRED
      ];

      nonRetryableErrors.forEach(code => {
        const error: AuthError = {
          code,
          message: 'Test error',
          userMessage: 'Test message',
          retryable: false
        };

        expect(errorHandler.isRetryable(error)).toBe(false);
      });
    });

    it('should respect explicit retryable flag', () => {
      const error: AuthError = {
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message: 'Test error',
        userMessage: 'Test message',
        retryable: true // Explicitly set to true
      };

      expect(errorHandler.isRetryable(error)).toBe(true);
    });
  });

  describe('logError', () => {
    it('should log error in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error: AuthError = {
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message: 'Test error',
        userMessage: 'Test message',
        retryable: false
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      errorHandler.logError(error, 'test-context');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AuthError]',
        expect.objectContaining({
          context: 'test-context',
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: 'Test error',
          userMessage: 'Test message',
          retryable: false,
          timestamp: expect.any(String)
        })
      );

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });

    it('should not log to console in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error: AuthError = {
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message: 'Test error',
        userMessage: 'Test message',
        retryable: false
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      errorHandler.logError(error, 'test-context');

      expect(consoleSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });
});