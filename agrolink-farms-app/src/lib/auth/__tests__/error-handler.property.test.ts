import * as fc from 'fast-check';
import { ErrorHandler } from '../error-handler';
import { AuthErrorCode } from '../types';

describe('ErrorHandler Property Tests', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property 5: Error Message User-Friendliness
   * Validates: Requirements 2.1, 2.5
   */
  test('Feature: authentication-refactor, Property 5: Error Message User-Friendliness', async () => {
    await fc.assert(
      fc.property(
        // Generate arbitrary errors with different structures
        fc.oneof(
          // Supabase-like errors
          fc.record({
            message: fc.oneof(
              fc.constant('Invalid login credentials'),
              fc.constant('Email not confirmed'),
              fc.constant('Too many requests'),
              fc.constant('Invalid email format'),
              fc.constant('Password should be at least 8 characters'),
              fc.constant('JWT expired'),
              fc.constant('Invalid token format'),
              fc.constant('Internal server error')
            ),
            status: fc.option(fc.oneof(fc.constant(400), fc.constant(429), fc.constant(500)), { nil: undefined })
          }),
          // Network errors
          fc.record({
            name: fc.constant('Error'),
            message: fc.oneof(
              fc.constant('fetch failed'),
              fc.constant('network error'),
              fc.constant('connection timeout'),
              fc.constant('ECONNREFUSED')
            )
          }).map(obj => Object.assign(new Error(obj.message), obj)),
          // Generic errors
          fc.record({
            name: fc.constant('Error'),
            message: fc.string({ minLength: 1, maxLength: 100 })
          }).map(obj => Object.assign(new Error(obj.message), obj)),
          // Unknown error types
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.integer(),
            fc.constant(null),
            fc.constant(undefined)
          )
        ),
        (error) => {
          // Parse the error using our error handler
          const authError = errorHandler.parseAuthError(error);
          const userMessage = errorHandler.getUserMessage(authError);

          // Property: User messages should be user-friendly
          // 1. Should not contain technical details
          const technicalTerms = [
            'stack trace',
            'stacktrace',
            'error.stack',
            'TypeError',
            'ReferenceError',
            'SyntaxError',
            'undefined is not',
            'Cannot read property',
            'Cannot read properties',
            'null is not',
            'JWT',
            'SQL',
            'database connection',
            'internal server error',
            'status code',
            'HTTP',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND'
          ];

          const containsTechnicalTerms = technicalTerms.some(term =>
            userMessage.toLowerCase().includes(term.toLowerCase())
          );

          // 2. Should be a reasonable length (not too short, not too long)
          const isReasonableLength = userMessage.length >= 10 && userMessage.length <= 200;

          // 3. Should be a complete sentence (ends with punctuation)
          const isCompleteSentence = /[.!?]$/.test(userMessage.trim());

          // 4. Should not be empty or just whitespace
          const isNotEmpty = userMessage.trim().length > 0;

          // 5. Should not contain raw error codes or internal identifiers
          const internalCodes = [
            'ERR_',
            'SUPABASE_',
            'POSTGRES_',
            'AUTH_ERROR_',
            'INTERNAL_',
            'DEBUG_'
          ];

          const containsInternalCodes = internalCodes.some(code =>
            userMessage.toUpperCase().includes(code)
          );

          // Assert all user-friendliness criteria
          expect(containsTechnicalTerms).toBe(false);
          expect(isReasonableLength).toBe(true);
          expect(isCompleteSentence).toBe(true);
          expect(isNotEmpty).toBe(true);
          expect(containsInternalCodes).toBe(false);

          // Additional check: message should provide actionable guidance when possible
          // For certain error types, we expect specific guidance
          if (authError.code === AuthErrorCode.INVALID_CREDENTIALS) {
            expect(userMessage.toLowerCase()).toMatch(/check.*credential|try.*again|password|email/);
          }

          if (authError.code === AuthErrorCode.EMAIL_NOT_VERIFIED) {
            expect(userMessage.toLowerCase()).toMatch(/verify.*email|check.*inbox|verification/);
          }

          if (authError.code === AuthErrorCode.NETWORK_ERROR) {
            expect(userMessage.toLowerCase()).toMatch(/connection|internet|try.*again/);
          }

          if (authError.code === AuthErrorCode.RATE_LIMIT_EXCEEDED) {
            expect(userMessage.toLowerCase()).toMatch(/wait|try.*later|too many/);
          }
        }
      ),
      { numRuns: 3 }
    );
  });
});