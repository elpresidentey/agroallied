/**
 * Monitoring service for the Image Integration System
 * Provides administrative tools, reporting, and system health monitoring
 * Requirements: 8.3
 */

import { ImageLogger, LogLevel, LogEntry, PerformanceMetrics, APIUsageMetrics, CacheMetrics, ErrorMetrics } from '../utils/logger';
import { ImageConfigManager } from '../config';
import { ImageCache } from './image-cache';
import { AttributionManager } from './attribution-manager';

// ============================================================================
// Monitoring Types and Interfaces
// ============================================================================

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    apis: ComponentHealth;
    cache: ComponentHealth;
    attribution: ComponentHealth;
    logging: ComponentHealth;
  };
  lastChecked: Date;
  uptime: number;
  version: string;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  metrics?: Record<string, number>;
  lastError?: string;
  lastErrorTime?: Date;
}

export interface SystemMetrics {
  performance: {
    totalOperations: number;
    successRate: number;
    averageResponseTime: number;
    slowestOperations: Array<{
      operation: string;
      duration: number;
      timestamp: Date;
    }>;
  };
  api: {
    totalRequests: number;
    successRate: number;
    rateLimitStatus: Record<string, number>;
    errorRate: number;
  };
  cache: {
    hitRate: number;
    totalOperations: number;
    currentSize: number;
    evictionCount: number;
  };
  errors: {
    totalErrors: number;
    unresolvedErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: ErrorMetrics[];
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMs: number;
  lastTriggered?: Date;
}

export interface AlertCondition {
  type: 'threshold' | 'rate' | 'error_count' | 'custom';
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  timeWindowMs: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface ReportOptions {
  timeRange: {
    start: Date;
    end: Date;
  };
  includePerformance: boolean;
  includeAPI: boolean;
  includeCache: boolean;
  includeErrors: boolean;
  includeAttribution: boolean;
  format: 'json' | 'csv' | 'html';
}

// ============================================================================
// Monitoring Service Implementation
// ============================================================================

export class MonitoringService {
  private static instance: MonitoringService;
  private logger: ImageLogger;
  private config: ImageConfigManager;
  private cache: ImageCache;
  private attribution: AttributionManager;
  private startTime: Date;
  private alertRules: AlertRule[] = [];
  private activeAlerts: Alert[] = [];
  private healthCheckInterval?: NodeJS.Timeout;

  private constructor() {
    this.logger = ImageLogger.getInstance();
    this.config = ImageConfigManager.getInstance();
    this.cache = new ImageCache();
    this.attribution = new AttributionManager();
    this.startTime = new Date();
    
    this.setupDefaultAlertRules();
    this.startHealthMonitoring();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Get overall system health status
   */
  public async getSystemHealth(): Promise<SystemHealthStatus> {
    const apiHealth = await this.checkAPIHealth();
    const cacheHealth = await this.checkCacheHealth();
    const attributionHealth = await this.checkAttributionHealth();
    const loggingHealth = await this.checkLoggingHealth();

    const components = {
      apis: apiHealth,
      cache: cacheHealth,
      attribution: attributionHealth,
      logging: loggingHealth
    };

    // Determine overall health
    const componentStatuses = Object.values(components).map(c => c.status);
    let overall: SystemHealthStatus['overall'] = 'healthy';
    
    if (componentStatuses.includes('critical')) {
      overall = 'critical';
    } else if (componentStatuses.includes('degraded')) {
      overall = 'degraded';
    }

    return {
      overall,
      components,
      lastChecked: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      version: '1.0.0'
    };
  }

  /**
   * Get comprehensive system metrics
   */
  public getSystemMetrics(timeRangeMs: number = 3600000): SystemMetrics {
    const performanceStats = this.logger.getPerformanceStats(timeRangeMs);
    const apiStats = this.logger.getAPIStats(timeRangeMs);
    const cacheStats = this.logger.getCacheStats(timeRangeMs);
    const errorMetrics = this.logger.getErrorMetrics();
    const recentErrors = errorMetrics.filter(e => 
      e.timestamp.getTime() >= Date.now() - timeRangeMs
    );

    // Get slowest operations
    const allPerformanceMetrics = this.logger.getPerformanceMetrics();
    const slowestOperations = allPerformanceMetrics
      .filter(m => m.duration && m.startTime >= Date.now() - timeRangeMs)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10)
      .map(m => ({
        operation: m.operationName,
        duration: m.duration || 0,
        timestamp: new Date(m.startTime)
      }));

    // Count errors by type
    const errorsByType: Record<string, number> = {};
    recentErrors.forEach(error => {
      errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1;
    });

    return {
      performance: {
        totalOperations: performanceStats.totalOperations,
        successRate: performanceStats.successRate,
        averageResponseTime: performanceStats.averageResponseTime,
        slowestOperations
      },
      api: {
        totalRequests: apiStats.totalRequests,
        successRate: apiStats.successRate,
        rateLimitStatus: apiStats.rateLimitStatus,
        errorRate: 1 - apiStats.successRate
      },
      cache: {
        hitRate: cacheStats.hitRate,
        totalOperations: cacheStats.totalOperations,
        currentSize: 0, // Will be updated by cache service
        evictionCount: cacheStats.evictionReasons.lru || 0
      },
      errors: {
        totalErrors: recentErrors.length,
        unresolvedErrors: recentErrors.filter(e => !e.resolved).length,
        errorsByType,
        recentErrors: recentErrors.slice(0, 20)
      }
    };
  }

  /**
   * Generate comprehensive system report
   */
  public async generateReport(options: ReportOptions): Promise<string> {
    const timeRangeMs = options.timeRange.end.getTime() - options.timeRange.start.getTime();
    const metrics = this.getSystemMetrics(timeRangeMs);
    const health = await this.getSystemHealth();

    const report = {
      generatedAt: new Date(),
      timeRange: options.timeRange,
      systemHealth: health,
      metrics: {
        ...(options.includePerformance && { performance: metrics.performance }),
        ...(options.includeAPI && { api: metrics.api }),
        ...(options.includeCache && { cache: metrics.cache }),
        ...(options.includeErrors && { errors: metrics.errors })
      },
      ...(options.includeAttribution && {
        attribution: await this.attribution.generateAttributionReport()
      })
    };

    switch (options.format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'csv':
        return this.convertToCSV(report);
      case 'html':
        return this.convertToHTML(report);
      default:
        return JSON.stringify(report, null, 2);
    }
  }

  /**
   * Add custom alert rule
   */
  public addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullRule: AlertRule = { id, ...rule };
    
    this.alertRules.push(fullRule);
    
    this.logger.info('Alert rule added', {
      operation: 'add_alert_rule',
      component: 'monitoring'
    }, { ruleId: id, ruleName: rule.name });

    return id;
  }

  /**
   * Remove alert rule
   */
  public removeAlertRule(ruleId: string): boolean {
    const index = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (index >= 0) {
      const rule = this.alertRules[index];
      this.alertRules.splice(index, 1);
      
      this.logger.info('Alert rule removed', {
        operation: 'remove_alert_rule',
        component: 'monitoring'
      }, { ruleId, ruleName: rule.name });
      
      return true;
    }
    return false;
  }

  /**
   * Get all alert rules
   */
  public getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return this.activeAlerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts (including resolved)
   */
  public getAllAlerts(): Alert[] {
    return [...this.activeAlerts];
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      this.logger.info('Alert resolved', {
        operation: 'resolve_alert',
        component: 'monitoring'
      }, { alertId, severity: alert.severity });
      
      return true;
    }
    return false;
  }

  /**
   * Clear cache and reset metrics
   */
  public async clearCache(): Promise<void> {
    await this.cache.clear();
    
    this.logger.info('Cache cleared via monitoring service', {
      operation: 'clear_cache',
      component: 'monitoring'
    });
  }

  /**
   * Get detailed cache inspection data
   */
  public async getCacheInspection(): Promise<{
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    topKeys: Array<{ key: string; accessCount: number; lastAccessed: Date }>;
  }> {
    const stats = await this.cache.getStats();
    const cacheStats = this.logger.getCacheStats();
    
    return {
      size: stats.size,
      maxSize: stats.maxSize,
      hitRate: cacheStats.hitRate,
      oldestEntry: stats.oldestEntry,
      newestEntry: stats.newestEntry,
      topKeys: stats.topKeys || []
    };
  }

  /**
   * Force garbage collection of old metrics
   */
  public forceCleanup(maxAgeMs: number = 86400000): void {
    this.logger.clearOldMetrics(maxAgeMs);
    
    // Clean up old alerts
    const cutoffTime = Date.now() - maxAgeMs;
    this.activeAlerts = this.activeAlerts.filter(alert => 
      alert.timestamp.getTime() >= cutoffTime
    );

    this.logger.info('Forced cleanup completed', {
      operation: 'force_cleanup',
      component: 'monitoring'
    }, { maxAgeMs, remainingAlerts: this.activeAlerts.length });
  }

  /**
   * Export all monitoring data
   */
  public exportMonitoringData(): {
    health: SystemHealthStatus;
    metrics: SystemMetrics;
    alerts: Alert[];
    alertRules: AlertRule[];
    logs: LogEntry[];
    exportedAt: Date;
  } {
    return {
      health: {} as SystemHealthStatus, // Will be populated async
      metrics: this.getSystemMetrics(),
      alerts: this.getAllAlerts(),
      alertRules: this.getAlertRules(),
      logs: this.logger.getRecentLogs(1000),
      exportedAt: new Date()
    };
  }

  /**
   * Check API health
   */
  private async checkAPIHealth(): Promise<ComponentHealth> {
    const apiStats = this.logger.getAPIStats(300000); // 5 minutes
    const config = this.config.getConfig();
    
    if (apiStats.totalRequests === 0) {
      return {
        status: 'healthy',
        message: 'No recent API activity',
        metrics: { requests: 0, successRate: 1 }
      };
    }

    const errorRate = 1 - apiStats.successRate;
    let status: ComponentHealth['status'] = 'healthy';
    let message = 'APIs functioning normally';

    if (errorRate > 0.5) {
      status = 'critical';
      message = `High API error rate: ${(errorRate * 100).toFixed(1)}%`;
    } else if (errorRate > 0.2) {
      status = 'degraded';
      message = `Elevated API error rate: ${(errorRate * 100).toFixed(1)}%`;
    }

    // Check rate limits
    Object.entries(apiStats.rateLimitStatus).forEach(([service, remaining]) => {
      if (remaining < 10) {
        status = 'degraded';
        message = `${service} API approaching rate limit (${remaining} remaining)`;
      }
    });

    return {
      status,
      message,
      metrics: {
        totalRequests: apiStats.totalRequests,
        successRate: apiStats.successRate,
        averageResponseTime: apiStats.averageResponseTime
      }
    };
  }

  /**
   * Check cache health
   */
  private async checkCacheHealth(): Promise<ComponentHealth> {
    try {
      const stats = await this.cache.getStats();
      const cacheStats = this.logger.getCacheStats(300000); // 5 minutes
      
      let status: ComponentHealth['status'] = 'healthy';
      let message = 'Cache functioning normally';

      if (cacheStats.hitRate < 0.3 && cacheStats.totalOperations > 10) {
        status = 'degraded';
        message = `Low cache hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`;
      }

      if (stats.size >= stats.maxSize * 0.9) {
        status = 'degraded';
        message = `Cache near capacity: ${stats.size}/${stats.maxSize}`;
      }

      return {
        status,
        message,
        metrics: {
          size: stats.size,
          maxSize: stats.maxSize,
          hitRate: cacheStats.hitRate,
          totalOperations: cacheStats.totalOperations
        }
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Cache error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        lastErrorTime: new Date()
      };
    }
  }

  /**
   * Check attribution health
   */
  private async checkAttributionHealth(): Promise<ComponentHealth> {
    try {
      const report = await this.attribution.generateAttributionReport();
      
      let status: ComponentHealth['status'] = 'healthy';
      let message = 'Attribution tracking normal';

      if (report.totalImages > 0 && report.missingAttributions > 0) {
        const missingRate = report.missingAttributions / report.totalImages;
        if (missingRate > 0.1) {
          status = 'degraded';
          message = `${report.missingAttributions} images missing attribution`;
        }
      }

      return {
        status,
        message,
        metrics: {
          totalImages: report.totalImages,
          missingAttributions: report.missingAttributions,
          totalUsage: report.totalUsage
        }
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Attribution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        lastErrorTime: new Date()
      };
    }
  }

  /**
   * Check logging health
   */
  private async checkLoggingHealth(): Promise<ComponentHealth> {
    const recentLogs = this.logger.getRecentLogs(100);
    const errorLogs = recentLogs.filter(log => log.level === 'error');
    
    let status: ComponentHealth['status'] = 'healthy';
    let message = 'Logging functioning normally';

    if (errorLogs.length > recentLogs.length * 0.2) {
      status = 'degraded';
      message = `High error log rate: ${errorLogs.length}/${recentLogs.length}`;
    }

    return {
      status,
      message,
      metrics: {
        totalLogs: recentLogs.length,
        errorLogs: errorLogs.length,
        errorRate: recentLogs.length > 0 ? errorLogs.length / recentLogs.length : 0
      }
    };
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    const defaultRules: Omit<AlertRule, 'id'>[] = [
      {
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds 20%',
        condition: {
          type: 'threshold',
          metric: 'error_rate',
          operator: '>',
          value: 0.2,
          timeWindowMs: 300000 // 5 minutes
        },
        severity: 'high',
        enabled: true,
        cooldownMs: 600000 // 10 minutes
      },
      {
        name: 'API Rate Limit Warning',
        description: 'Alert when API rate limit is low',
        condition: {
          type: 'threshold',
          metric: 'rate_limit_remaining',
          operator: '<',
          value: 10,
          timeWindowMs: 60000 // 1 minute
        },
        severity: 'medium',
        enabled: true,
        cooldownMs: 300000 // 5 minutes
      },
      {
        name: 'Low Cache Hit Rate',
        description: 'Alert when cache hit rate is below 30%',
        condition: {
          type: 'threshold',
          metric: 'cache_hit_rate',
          operator: '<',
          value: 0.3,
          timeWindowMs: 600000 // 10 minutes
        },
        severity: 'medium',
        enabled: true,
        cooldownMs: 1800000 // 30 minutes
      },
      {
        name: 'Slow Response Time',
        description: 'Alert when average response time exceeds 5 seconds',
        condition: {
          type: 'threshold',
          metric: 'average_response_time',
          operator: '>',
          value: 5000,
          timeWindowMs: 300000 // 5 minutes
        },
        severity: 'medium',
        enabled: true,
        cooldownMs: 600000 // 10 minutes
      }
    ];

    defaultRules.forEach(rule => {
      this.addAlertRule(rule);
    });
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Check health every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkAlerts();
      } catch (error) {
        this.logger.error('Health check failed', {
          operation: 'health_check',
          component: 'monitoring'
        }, error instanceof Error ? error : undefined);
      }
    }, 300000); // 5 minutes
  }

  /**
   * Check alert conditions and trigger alerts
   */
  private async checkAlerts(): Promise<void> {
    const metrics = this.getSystemMetrics(300000); // 5 minutes
    const now = new Date();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered && 
          now.getTime() - rule.lastTriggered.getTime() < rule.cooldownMs) {
        continue;
      }

      const shouldTrigger = this.evaluateAlertCondition(rule.condition, metrics);
      
      if (shouldTrigger) {
        const alert: Alert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ruleId: rule.id,
          severity: rule.severity,
          message: `${rule.name}: ${rule.description}`,
          timestamp: now,
          resolved: false,
          metadata: { rule: rule.name, condition: rule.condition }
        };

        this.activeAlerts.push(alert);
        rule.lastTriggered = now;

        this.logger.warn(`Alert triggered: ${rule.name}`, {
          operation: 'alert_triggered',
          component: 'monitoring'
        }, {
          alertId: alert.id,
          severity: alert.severity,
          ruleId: rule.id
        });
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateAlertCondition(condition: AlertCondition, metrics: SystemMetrics): boolean {
    let value: number;

    switch (condition.metric) {
      case 'error_rate':
        value = metrics.api.errorRate;
        break;
      case 'cache_hit_rate':
        value = metrics.cache.hitRate;
        break;
      case 'average_response_time':
        value = metrics.performance.averageResponseTime;
        break;
      case 'rate_limit_remaining':
        value = Math.min(...Object.values(metrics.api.rateLimitStatus));
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case '>':
        return value > condition.value;
      case '<':
        return value < condition.value;
      case '>=':
        return value >= condition.value;
      case '<=':
        return value <= condition.value;
      case '==':
        return value === condition.value;
      case '!=':
        return value !== condition.value;
      default:
        return false;
    }
  }

  /**
   * Convert report to CSV format
   */
  private convertToCSV(report: any): string {
    // Simple CSV conversion - in a real implementation, this would be more sophisticated
    const lines: string[] = [];
    lines.push('Timestamp,Component,Metric,Value');
    
    // Add performance metrics
    if (report.metrics.performance) {
      const perf = report.metrics.performance;
      lines.push(`${report.generatedAt},Performance,Total Operations,${perf.totalOperations}`);
      lines.push(`${report.generatedAt},Performance,Success Rate,${perf.successRate}`);
      lines.push(`${report.generatedAt},Performance,Average Response Time,${perf.averageResponseTime}`);
    }

    return lines.join('\n');
  }

  /**
   * Convert report to HTML format
   */
  private convertToHTML(report: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Image Integration System Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #e9e9e9; border-radius: 3px; }
        .status-healthy { color: green; }
        .status-degraded { color: orange; }
        .status-critical { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Image Integration System Report</h1>
        <p>Generated: ${report.generatedAt}</p>
        <p>Time Range: ${report.timeRange.start} to ${report.timeRange.end}</p>
    </div>
    
    <div class="section">
        <h2>System Health</h2>
        <p class="status-${report.systemHealth.overall}">Overall Status: ${report.systemHealth.overall}</p>
    </div>
    
    ${report.metrics.performance ? `
    <div class="section">
        <h2>Performance Metrics</h2>
        <div class="metric">Total Operations: ${report.metrics.performance.totalOperations}</div>
        <div class="metric">Success Rate: ${(report.metrics.performance.successRate * 100).toFixed(1)}%</div>
        <div class="metric">Average Response Time: ${report.metrics.performance.averageResponseTime}ms</div>
    </div>
    ` : ''}
    
    ${report.metrics.api ? `
    <div class="section">
        <h2>API Metrics</h2>
        <div class="metric">Total Requests: ${report.metrics.api.totalRequests}</div>
        <div class="metric">Success Rate: ${(report.metrics.api.successRate * 100).toFixed(1)}%</div>
        <div class="metric">Error Rate: ${(report.metrics.api.errorRate * 100).toFixed(1)}%</div>
    </div>
    ` : ''}
    
</body>
</html>
    `.trim();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get the global monitoring service instance
 */
export function getMonitoringService(): MonitoringService {
  return MonitoringService.getInstance();
}

/**
 * Quick health check
 */
export async function quickHealthCheck(): Promise<SystemHealthStatus> {
  return getMonitoringService().getSystemHealth();
}

/**
 * Generate quick report
 */
export async function generateQuickReport(timeRangeMs: number = 3600000): Promise<string> {
  const monitoring = getMonitoringService();
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - timeRangeMs);
  
  return monitoring.generateReport({
    timeRange: { start: startTime, end: endTime },
    includePerformance: true,
    includeAPI: true,
    includeCache: true,
    includeErrors: true,
    includeAttribution: false,
    format: 'json'
  });
}