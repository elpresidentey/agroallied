/**
 * Global error suppression for expected errors
 * Prevents console spam from AbortErrors and other expected errors
 */

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

/**
 * List of error patterns to suppress from console output
 */
const SUPPRESSED_ERROR_PATTERNS = [
  /signal is aborted without reason/i,
  /AbortError/i,
  /Failed to get session.*AbortError/i,
  /locks\.ts.*AbortError/i,
  /The operation was aborted/i,
  /Request aborted/i
];

/**
 * Check if an error message should be suppressed
 */
function shouldSuppressError(message: string): boolean {
  return SUPPRESSED_ERROR_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Enhanced console.error that filters out expected errors
 */
function filteredConsoleError(...args: any[]) {
  const message = args.join(' ');
  
  // Don't suppress errors in development mode for debugging
  if (process.env.NODE_ENV === 'development') {
    // Still suppress AbortErrors as they're very noisy
    if (shouldSuppressError(message)) {
      return;
    }
  } else {
    // In production, suppress all matched patterns
    if (shouldSuppressError(message)) {
      return;
    }
  }
  
  // Call original console.error for non-suppressed errors
  originalConsoleError.apply(console, args);
}

/**
 * Enhanced console.warn that filters out expected warnings
 */
function filteredConsoleWarn(...args: any[]) {
  const message = args.join(' ');
  
  if (shouldSuppressError(message)) {
    return;
  }
  
  // Call original console.warn for non-suppressed warnings
  originalConsoleWarn.apply(console, args);
}

/**
 * Initialize error suppression
 * Call this once at app startup
 */
export function initializeErrorSuppression() {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    return;
  }
  
  // Replace console methods with filtered versions
  console.error = filteredConsoleError;
  console.warn = filteredConsoleWarn;
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Suppress AbortErrors from unhandled rejections
    if (error instanceof Error && (
      error.name === 'AbortError' || 
      error.message.includes('signal is aborted') ||
      error.message.includes('The operation was aborted')
    )) {
      event.preventDefault(); // Prevent default browser error handling
      return;
    }
    
    // Log other unhandled rejections normally
    console.error('Unhandled promise rejection:', error);
  });
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = event.error;
    
    // Suppress AbortErrors from global error handler
    if (error instanceof Error && (
      error.name === 'AbortError' || 
      error.message.includes('signal is aborted') ||
      error.message.includes('The operation was aborted')
    )) {
      event.preventDefault(); // Prevent default browser error handling
      return;
    }
  });
  
  console.debug('Error suppression initialized');
}

/**
 * Restore original console methods
 * Useful for testing or debugging
 */
export function restoreOriginalConsole() {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}