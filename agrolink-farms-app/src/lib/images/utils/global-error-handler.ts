/**
 * Global Error Handler for Image Integration System
 * Provides centralized error handling and reporting for image-related failures
 */

import { ImageError } from '../types';

export interface ErrorReport {
  timestamp: Date;
  component: string;
  error: ImageError | Error;
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
}

class GlobalImageErrorHandler {
  private errorReports: ErrorReport[] = [];
  private maxReports = 100; // Keep last 100 error reports
  private errorCallbacks: ((report: ErrorReport) => void)[] = [];

  /**
   * Report an image-related error
   */
  reportError(
    component: string,
    error: ImageError | Error,
    context?: Record<string, any>
  ): void {
    const report: ErrorReport = {
      timestamp: new Date(),
      component,
      error,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    // Add to reports array
    this.errorReports.push(report);

    // Keep only the most recent reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ImageError] ${component}:`, error, context);
    }

    // Call registered callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(report);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(report);
    }
  }

  /**
   * Register a callback to be called when errors occur
   */
  onError(callback: (report: ErrorReport) => void): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get recent error reports
   */
  getRecentErrors(limit = 10): ErrorReport[] {
    return this.errorReports.slice(-limit);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByComponent: Record<string, number>;
    errorsByType: Record<string, number>;
    recentErrorRate: number; // errors per minute in last 10 minutes
  } {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    
    const recentErrors = this.errorReports.filter(
      report => report.timestamp >= tenMinutesAgo
    );

    const errorsByComponent: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};

    this.errorReports.forEach(report => {
      // Count by component
      errorsByComponent[report.component] = (errorsByComponent[report.component] || 0) + 1;
      
      // Count by error type
      const errorType = this.getErrorType(report.error);
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    return {
      totalErrors: this.errorReports.length,
      errorsByComponent,
      errorsByType,
      recentErrorRate: recentErrors.length / 10 // per minute
    };
  }

  /**
   * Clear all error reports
   */
  clearErrors(): void {
    this.errorReports = [];
  }

  /**
   * Check if the system is experiencing high error rates
   */
  isHighErrorRate(): boolean {
    const stats = this.getErrorStats();
    return stats.recentErrorRate > 5; // More than 5 errors per minute
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    errorRate: number;
  } {
    const stats = this.getErrorStats();
    const errorRate = stats.recentErrorRate;

    if (errorRate === 0) {
      return {
        status: 'healthy',
        message: 'Image system operating normally',
        errorRate
      };
    } else if (errorRate < 2) {
      return {
        status: 'healthy',
        message: 'Image system operating with minor issues',
        errorRate
      };
    } else if (errorRate < 5) {
      return {
        status: 'degraded',
        message: 'Image system experiencing some issues',
        errorRate
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'Image system experiencing significant issues',
        errorRate
      };
    }
  }

  private getErrorType(error: ImageError | Error): string {
    if ('code' in error) {
      return error.code;
    }
    return error.constructor.name;
  }

  private async sendToMonitoring(report: ErrorReport): Promise<void> {
    try {
      // In a real application, you would send this to your monitoring service
      // For now, we'll just log it
      console.warn('[Monitoring] Image error reported:', {
        component: report.component,
        error: report.error.message,
        timestamp: report.timestamp.toISOString()
      });

      // Example: Send to external monitoring service
      // await fetch('/api/monitoring/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report)
      // });
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring:', monitoringError);
    }
  }
}

// Global singleton instance
export const globalImageErrorHandler = new GlobalImageErrorHandler();

// Convenience functions for common error scenarios
export const reportImageLoadError = (
  component: string,
  imageUrl: string,
  error: Error
): void => {
  globalImageErrorHandler.reportError(component, error, {
    imageUrl,
    action: 'load'
  });
};

export const reportAPIError = (
  component: string,
  apiSource: string,
  error: ImageError
): void => {
  globalImageErrorHandler.reportError(component, error, {
    apiSource,
    action: 'api_request'
  });
};

export const reportCacheError = (
  component: string,
  cacheKey: string,
  error: Error
): void => {
  globalImageErrorHandler.reportError(component, error, {
    cacheKey,
    action: 'cache_operation'
  });
};

// React hook for using error handler in components
export const useImageErrorHandler = () => {
  return {
    reportError: globalImageErrorHandler.reportError.bind(globalImageErrorHandler),
    getHealthStatus: globalImageErrorHandler.getHealthStatus.bind(globalImageErrorHandler),
    getErrorStats: globalImageErrorHandler.getErrorStats.bind(globalImageErrorHandler),
    onError: globalImageErrorHandler.onError.bind(globalImageErrorHandler)
  };
};