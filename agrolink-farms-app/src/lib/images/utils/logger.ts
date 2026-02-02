/**
 * Comprehensive logging system for the Image Integration System
 * Implements structured logging, performance monitoring, and metrics collection
 * Requirements: 8.3
 */

import { ImageConfigManager } from '../config';

// ============================================================================
// Logging Types and Interfaces
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context: LogContext;
  metadata?: Record<string, any>;
  duration?: number;
  error?: Error;
}

export interface LogContext {
  operation: string;
  component: string;
  source?: 'unsplash' | 'pexels' | 'cache' | 'fallback';
  imageId?: string;
  category?: string;
  section?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorType?: string;
  cacheHit?: boolean;
  apiCalls?: number;
  bytesTransferred?: number;
  imageCount?: number;
}

export interface APIUsageMetrics {
  service: 'unsplash' | 'pexels';
  endpoint: string;
  method: string;
  statusCode?: number;
  responseTime: number;
  success: boolean;
  errorType?: string;
  rateLimitRemaining?: number;
  timestamp: Date;
}

export interface CacheMetrics {
  operation: 'get' | 'set' | 'evict' | 'clear';
  key: string;
  hit: boolean;
  size?: number;
  evictionReason?: string;
  timestamp: Date;
}

export interface ErrorMetrics {
  errorType: string;
  operation: string;
  component: string;
  source?: string;
  message: string;
  stack?: string;
  context: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
}

// ============================================================================
// Logger Implementation
// ============================================================================

export class ImageLogger {
  private static instance: ImageLogger;
  private config: ImageConfigManager;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;
  private performanceMetrics: PerformanceMetrics[] = [];
  private apiMetrics: APIUsageMetrics[] = [];
  private cacheMetrics: CacheMetrics[] = [];
  private errorMetrics: ErrorMetrics[] = [];
  private activeOperations = new Map<string, PerformanceMetrics>();

  private constructor() {
    this.config = ImageConfigManager.getInstance();
    this.setupPeriodicFlush();
  }

  public static getInstance(): ImageLogger {
    if (!ImageLogger.instance) {
      ImageLogger.instance = new ImageLogger();
    }
    return ImageLogger.instance;
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log('debug', message, context, metadata);
  }

  /**
   * Log an info message
   */
  public info(message: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log('info', message, context, metadata);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log('warn', message, context, metadata);
  }

  /**
   * Log an error message
   */
  public error(message: string, context: LogContext, error?: Error, metadata?: Record<string, any>): void {
    this.log('error', message, context, metadata, undefined, error);
    
    // Track error metrics
    this.trackError({
      errorType: error?.name || 'UnknownError',
      operation: context.operation,
      component: context.component,
      source: context.source,
      message: error?.message || message,
      stack: error?.stack,
      context: { ...context, ...metadata },
      timestamp: new Date(),
      resolved: false
    });
  }

  /**
   * Start performance tracking for an operation
   */
  public startOperation(operationId: string, operationName: string, context: LogContext): void {
    const metrics: PerformanceMetrics = {
      operationName,
      startTime: Date.now(),
      success: false,
      apiCalls: 0,
      imageCount: 0
    };

    this.activeOperations.set(operationId, metrics);
    
    this.debug(`Started operation: ${operationName}`, context, {
      operationId,
      startTime: metrics.startTime
    });
  }

  /**
   * End performance tracking for an operation
   */
  public endOperation(
    operationId: string, 
    context: LogContext, 
    success: boolean = true,
    metadata?: Record<string, any>
  ): void {
    const metrics = this.activeOperations.get(operationId);
    if (!metrics) {
      this.warn('Attempted to end unknown operation', context, { operationId });
      return;
    }

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = success;

    // Add metadata to metrics
    if (metadata) {
      Object.assign(metrics, metadata);
    }

    this.performanceMetrics.push(metrics);
    this.activeOperations.delete(operationId);

    const level = success ? 'info' : 'warn';
    this.log(level, `Completed operation: ${metrics.operationName}`, context, {
      operationId,
      duration: metrics.duration,
      success,
      ...metadata
    }, metrics.duration);
  }

  /**
   * Track API usage metrics
   */
  public trackAPIUsage(metrics: Omit<APIUsageMetrics, 'timestamp'>): void {
    const fullMetrics: APIUsageMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.apiMetrics.push(fullMetrics);

    this.debug(`API call to ${metrics.service}`, {
      operation: 'api_call',
      component: 'api_adapter',
      source: metrics.service
    }, {
      endpoint: metrics.endpoint,
      method: metrics.method,
      statusCode: metrics.statusCode,
      responseTime: metrics.responseTime,
      success: metrics.success,
      rateLimitRemaining: metrics.rateLimitRemaining
    });
  }

  /**
   * Track cache operations
   */
  public trackCacheOperation(metrics: Omit<CacheMetrics, 'timestamp'>): void {
    const fullMetrics: CacheMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.cacheMetrics.push(fullMetrics);

    this.debug(`Cache ${metrics.operation}`, {
      operation: 'cache_operation',
      component: 'image_cache'
    }, {
      key: metrics.key,
      hit: metrics.hit,
      size: metrics.size,
      evictionReason: metrics.evictionReason
    });
  }

  /**
   * Track error metrics
   */
  private trackError(metrics: ErrorMetrics): void {
    this.errorMetrics.push(metrics);
  }

  /**
   * Mark an error as resolved
   */
  public resolveError(errorType: string, operation: string, component: string): void {
    const error = this.errorMetrics.find(e => 
      e.errorType === errorType && 
      e.operation === operation && 
      e.component === component &&
      !e.resolved
    );

    if (error) {
      error.resolved = true;
      this.info('Error resolved', {
        operation,
        component
      }, {
        errorType,
        resolvedAt: new Date()
      });
    }
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context: LogContext,
    metadata?: Record<string, any>,
    duration?: number,
    error?: Error
  ): void {
    const adminConfig = this.config.getAdminConfig();
    
    // Check if logging is enabled and level is appropriate
    if (!adminConfig.enableLogging || !this.shouldLog(level, adminConfig.logLevel)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      metadata,
      duration,
      error
    };

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Trim buffer if too large
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }

    // Output to console based on level
    this.outputToConsole(logEntry);
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel, configLevel: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    return levels[level] >= levels[configLevel];
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const contextStr = `[${entry.context.component}:${entry.context.operation}]`;
    const durationStr = entry.duration ? ` (${entry.duration}ms)` : '';
    const sourceStr = entry.context.source ? ` [${entry.context.source}]` : '';
    
    const logMessage = `${timestamp} ${entry.level.toUpperCase()} ${contextStr}${sourceStr} ${entry.message}${durationStr}`;

    switch (entry.level) {
      case 'debug':
        console.debug(logMessage, entry.metadata);
        break;
      case 'info':
        console.info(logMessage, entry.metadata);
        break;
      case 'warn':
        console.warn(logMessage, entry.metadata, entry.error);
        break;
      case 'error':
        console.error(logMessage, entry.metadata, entry.error);
        break;
    }
  }

  /**
   * Get recent log entries
   */
  public getRecentLogs(count: number = 100, level?: LogLevel): LogEntry[] {
    let logs = this.logBuffer.slice(-count);
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    return logs.reverse(); // Most recent first
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(operationName?: string): PerformanceMetrics[] {
    if (operationName) {
      return this.performanceMetrics.filter(m => m.operationName === operationName);
    }
    return [...this.performanceMetrics];
  }

  /**
   * Get API usage metrics
   */
  public getAPIMetrics(service?: 'unsplash' | 'pexels'): APIUsageMetrics[] {
    if (service) {
      return this.apiMetrics.filter(m => m.service === service);
    }
    return [...this.apiMetrics];
  }

  /**
   * Get cache metrics
   */
  public getCacheMetrics(): CacheMetrics[] {
    return [...this.cacheMetrics];
  }

  /**
   * Get error metrics
   */
  public getErrorMetrics(resolved?: boolean): ErrorMetrics[] {
    if (resolved !== undefined) {
      return this.errorMetrics.filter(e => e.resolved === resolved);
    }
    return [...this.errorMetrics];
  }

  /**
   * Get aggregated performance statistics
   */
  public getPerformanceStats(timeRangeMs: number = 3600000): {
    totalOperations: number;
    successRate: number;
    averageResponseTime: number;
    operationBreakdown: Record<string, {
      count: number;
      successRate: number;
      averageTime: number;
      totalApiCalls: number;
    }>;
  } {
    const cutoffTime = Date.now() - timeRangeMs;
    const recentMetrics = this.performanceMetrics.filter(m => 
      m.startTime >= cutoffTime && m.duration !== undefined
    );

    const totalOperations = recentMetrics.length;
    const successfulOperations = recentMetrics.filter(m => m.success).length;
    const successRate = totalOperations > 0 ? successfulOperations / totalOperations : 0;
    
    const totalTime = recentMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageResponseTime = totalOperations > 0 ? totalTime / totalOperations : 0;

    const operationBreakdown: Record<string, any> = {};
    
    recentMetrics.forEach(metric => {
      if (!operationBreakdown[metric.operationName]) {
        operationBreakdown[metric.operationName] = {
          count: 0,
          successCount: 0,
          totalTime: 0,
          totalApiCalls: 0
        };
      }

      const breakdown = operationBreakdown[metric.operationName];
      breakdown.count++;
      if (metric.success) breakdown.successCount++;
      breakdown.totalTime += metric.duration || 0;
      breakdown.totalApiCalls += metric.apiCalls || 0;
    });

    // Calculate derived stats
    Object.keys(operationBreakdown).forEach(opName => {
      const breakdown = operationBreakdown[opName];
      breakdown.successRate = breakdown.successCount / breakdown.count;
      breakdown.averageTime = breakdown.totalTime / breakdown.count;
    });

    return {
      totalOperations,
      successRate,
      averageResponseTime,
      operationBreakdown
    };
  }

  /**
   * Get API usage statistics
   */
  public getAPIStats(timeRangeMs: number = 3600000): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    rateLimitStatus: Record<string, number>;
    serviceBreakdown: Record<string, {
      requests: number;
      successRate: number;
      averageResponseTime: number;
    }>;
  } {
    const cutoffTime = Date.now() - timeRangeMs;
    const recentMetrics = this.apiMetrics.filter(m => 
      m.timestamp.getTime() >= cutoffTime
    );

    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter(m => m.success).length;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;
    
    const totalTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalRequests > 0 ? totalTime / totalRequests : 0;

    const rateLimitStatus: Record<string, number> = {};
    const serviceBreakdown: Record<string, any> = {};

    recentMetrics.forEach(metric => {
      // Track rate limits
      if (metric.rateLimitRemaining !== undefined) {
        rateLimitStatus[metric.service] = metric.rateLimitRemaining;
      }

      // Track service breakdown
      if (!serviceBreakdown[metric.service]) {
        serviceBreakdown[metric.service] = {
          requests: 0,
          successCount: 0,
          totalTime: 0
        };
      }

      const breakdown = serviceBreakdown[metric.service];
      breakdown.requests++;
      if (metric.success) breakdown.successCount++;
      breakdown.totalTime += metric.responseTime;
    });

    // Calculate derived stats
    Object.keys(serviceBreakdown).forEach(service => {
      const breakdown = serviceBreakdown[service];
      breakdown.successRate = breakdown.successCount / breakdown.requests;
      breakdown.averageResponseTime = breakdown.totalTime / breakdown.requests;
    });

    return {
      totalRequests,
      successRate,
      averageResponseTime,
      rateLimitStatus,
      serviceBreakdown
    };
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(timeRangeMs: number = 3600000): {
    totalOperations: number;
    hitRate: number;
    operationBreakdown: Record<string, number>;
    evictionReasons: Record<string, number>;
  } {
    const cutoffTime = Date.now() - timeRangeMs;
    const recentMetrics = this.cacheMetrics.filter(m => 
      m.timestamp.getTime() >= cutoffTime
    );

    const totalOperations = recentMetrics.length;
    const hits = recentMetrics.filter(m => m.hit).length;
    const hitRate = totalOperations > 0 ? hits / totalOperations : 0;

    const operationBreakdown: Record<string, number> = {};
    const evictionReasons: Record<string, number> = {};

    recentMetrics.forEach(metric => {
      operationBreakdown[metric.operation] = (operationBreakdown[metric.operation] || 0) + 1;
      
      if (metric.evictionReason) {
        evictionReasons[metric.evictionReason] = (evictionReasons[metric.evictionReason] || 0) + 1;
      }
    });

    return {
      totalOperations,
      hitRate,
      operationBreakdown,
      evictionReasons
    };
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  public clearOldMetrics(maxAgeMs: number = 86400000): void { // 24 hours default
    const cutoffTime = Date.now() - maxAgeMs;
    
    this.performanceMetrics = this.performanceMetrics.filter(m => m.startTime >= cutoffTime);
    this.apiMetrics = this.apiMetrics.filter(m => m.timestamp.getTime() >= cutoffTime);
    this.cacheMetrics = this.cacheMetrics.filter(m => m.timestamp.getTime() >= cutoffTime);
    this.errorMetrics = this.errorMetrics.filter(m => m.timestamp.getTime() >= cutoffTime);
    
    this.info('Cleared old metrics', {
      operation: 'cleanup',
      component: 'logger'
    }, {
      cutoffTime: new Date(cutoffTime),
      remainingPerformanceMetrics: this.performanceMetrics.length,
      remainingApiMetrics: this.apiMetrics.length,
      remainingCacheMetrics: this.cacheMetrics.length,
      remainingErrorMetrics: this.errorMetrics.length
    });
  }

  /**
   * Export metrics for external analysis
   */
  public exportMetrics(): {
    logs: LogEntry[];
    performance: PerformanceMetrics[];
    api: APIUsageMetrics[];
    cache: CacheMetrics[];
    errors: ErrorMetrics[];
    exportedAt: Date;
  } {
    return {
      logs: [...this.logBuffer],
      performance: [...this.performanceMetrics],
      api: [...this.apiMetrics],
      cache: [...this.cacheMetrics],
      errors: [...this.errorMetrics],
      exportedAt: new Date()
    };
  }

  /**
   * Setup periodic cleanup of old data
   */
  private setupPeriodicFlush(): void {
    // Clean up old metrics every hour
    setInterval(() => {
      this.clearOldMetrics();
    }, 3600000); // 1 hour
  }

  /**
   * Generate a unique operation ID
   */
  public generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get the global logger instance
 */
export function getImageLogger(): ImageLogger {
  return ImageLogger.getInstance();
}

/**
 * Create a logger context for an operation
 */
export function createLogContext(
  operation: string,
  component: string,
  additionalContext?: Partial<LogContext>
): LogContext {
  return {
    operation,
    component,
    ...additionalContext
  };
}

/**
 * Decorator for automatic performance tracking
 */
export function trackPerformance(operationName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const opName = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const logger = getImageLogger();
      const operationId = logger.generateOperationId();
      const context = createLogContext(propertyKey, target.constructor.name);

      logger.startOperation(operationId, opName, context);

      try {
        const result = await originalMethod.apply(this, args);
        logger.endOperation(operationId, context, true);
        return result;
      } catch (error) {
        logger.endOperation(operationId, context, false, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Utility function to measure execution time
 */
export async function measureTime<T>(
  operation: () => Promise<T>,
  logger: ImageLogger,
  context: LogContext
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    logger.info(`Operation completed successfully`, context, { duration });
    
    return { result, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`Operation failed`, context, error instanceof Error ? error : undefined, { duration });
    
    throw error;
  }
}