/**
 * Administrative CLI tools for Image Integration System
 * Provides command-line interface for cache management and reporting
 * Requirements: 6.3, 8.3
 */

import { MonitoringService } from '../services/monitoring-service';
import { ImageLogger } from './logger';
import { ImageConfigManager } from '../config';
import { AttributionManager } from '../services/attribution-manager';
import { ImageCache } from '../services/image-cache';

// ============================================================================
// CLI Command Types
// ============================================================================

export interface CLICommand {
  name: string;
  description: string;
  execute: (args: string[]) => Promise<void>;
}

export interface CLIOptions {
  verbose?: boolean;
  format?: 'json' | 'table' | 'csv';
  output?: string;
}

// ============================================================================
// Administrative CLI Implementation
// ============================================================================

export class AdminCLI {
  private monitoring: MonitoringService;
  private logger: ImageLogger;
  private config: ImageConfigManager;
  private attribution: AttributionManager;
  private cache: ImageCache;
  private commands: Map<string, CLICommand> = new Map();

  constructor() {
    this.monitoring = MonitoringService.getInstance();
    this.logger = ImageLogger.getInstance();
    this.config = ImageConfigManager.getInstance();
    this.attribution = new AttributionManager();
    this.cache = new ImageCache();
    
    this.registerCommands();
  }

  /**
   * Register all available CLI commands
   */
  private registerCommands(): void {
    const commands: CLICommand[] = [
      {
        name: 'health',
        description: 'Check system health status',
        execute: this.healthCommand.bind(this)
      },
      {
        name: 'metrics',
        description: 'Display system metrics',
        execute: this.metricsCommand.bind(this)
      },
      {
        name: 'cache-stats',
        description: 'Show cache statistics',
        execute: this.cacheStatsCommand.bind(this)
      },
      {
        name: 'cache-clear',
        description: 'Clear the image cache',
        execute: this.cacheClearCommand.bind(this)
      },
      {
        name: 'cache-inspect',
        description: 'Inspect cache contents',
        execute: this.cacheInspectCommand.bind(this)
      },
      {
        name: 'logs',
        description: 'View recent logs',
        execute: this.logsCommand.bind(this)
      },
      {
        name: 'attribution-report',
        description: 'Generate attribution compliance report',
        execute: this.attributionReportCommand.bind(this)
      },
      {
        name: 'config-show',
        description: 'Display current configuration',
        execute: this.configShowCommand.bind(this)
      },
      {
        name: 'config-validate',
        description: 'Validate configuration dependencies',
        execute: this.configValidateCommand.bind(this)
      },
      {
        name: 'alerts',
        description: 'Show active alerts',
        execute: this.alertsCommand.bind(this)
      },
      {
        name: 'report',
        description: 'Generate comprehensive system report',
        execute: this.reportCommand.bind(this)
      },
      {
        name: 'cleanup',
        description: 'Force cleanup of old data',
        execute: this.cleanupCommand.bind(this)
      },
      {
        name: 'help',
        description: 'Show available commands',
        execute: this.helpCommand.bind(this)
      }
    ];

    commands.forEach(cmd => this.commands.set(cmd.name, cmd));
  }

  /**
   * Execute a CLI command
   */
  async executeCommand(commandName: string, args: string[] = [], options: CLIOptions = {}): Promise<void> {
    const command = this.commands.get(commandName);
    if (!command) {
      console.error(`Unknown command: ${commandName}`);
      console.error('Use "help" to see available commands');
      return;
    }

    try {
      await command.execute(args);
    } catch (error) {
      console.error(`Error executing command "${commandName}":`, error);
    }
  }

  /**
   * Health command - Check system health
   */
  private async healthCommand(args: string[]): Promise<void> {
    console.log('🔍 Checking system health...\n');
    
    const health = await this.monitoring.getSystemHealth();
    
    const statusIcon = (status: string) => {
      switch (status) {
        case 'healthy': return '✅';
        case 'degraded': return '⚠️';
        case 'critical': return '❌';
        default: return '❓';
      }
    };

    console.log(`Overall Status: ${statusIcon(health.overall)} ${health.overall.toUpperCase()}`);
    console.log(`Uptime: ${Math.floor(health.uptime / 1000 / 60)} minutes`);
    console.log(`Last Checked: ${health.lastChecked.toLocaleString()}\n`);

    console.log('Component Health:');
    Object.entries(health.components).forEach(([name, component]) => {
      console.log(`  ${statusIcon(component.status)} ${name}: ${component.message}`);
      if (component.metrics) {
        Object.entries(component.metrics).forEach(([metric, value]) => {
          console.log(`    ${metric}: ${value}`);
        });
      }
    });
  }

  /**
   * Metrics command - Display system metrics
   */
  private async metricsCommand(args: string[]): Promise<void> {
    const timeRange = args[0] ? parseInt(args[0]) * 1000 : 3600000; // Default 1 hour
    console.log(`📊 System metrics (last ${timeRange / 1000 / 60} minutes):\n`);
    
    const metrics = this.monitoring.getSystemMetrics(timeRange);

    console.log('Performance:');
    console.log(`  Total Operations: ${metrics.performance.totalOperations}`);
    console.log(`  Success Rate: ${(metrics.performance.successRate * 100).toFixed(1)}%`);
    console.log(`  Average Response Time: ${metrics.performance.averageResponseTime.toFixed(0)}ms`);

    console.log('\nAPI:');
    console.log(`  Total Requests: ${metrics.api.totalRequests}`);
    console.log(`  Success Rate: ${(metrics.api.successRate * 100).toFixed(1)}%`);
    console.log(`  Error Rate: ${(metrics.api.errorRate * 100).toFixed(1)}%`);

    console.log('\nCache:');
    console.log(`  Hit Rate: ${(metrics.cache.hitRate * 100).toFixed(1)}%`);
    console.log(`  Total Operations: ${metrics.cache.totalOperations}`);
    console.log(`  Current Size: ${metrics.cache.currentSize}`);

    console.log('\nErrors:');
    console.log(`  Total Errors: ${metrics.errors.totalErrors}`);
    console.log(`  Unresolved: ${metrics.errors.unresolvedErrors}`);

    if (Object.keys(metrics.errors.errorsByType).length > 0) {
      console.log('  By Type:');
      Object.entries(metrics.errors.errorsByType).forEach(([type, count]) => {
        console.log(`    ${type}: ${count}`);
      });
    }
  }

  /**
   * Cache stats command
   */
  private async cacheStatsCommand(args: string[]): Promise<void> {
    console.log('💾 Cache Statistics:\n');
    
    const stats = await this.cache.getStats();
    const inspection = await this.monitoring.getCacheInspection();

    console.log(`Size: ${stats.size}/${stats.maxSize} (${stats.utilizationPercent?.toFixed(1)}% full)`);
    console.log(`Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
    console.log(`Miss Rate: ${(stats.missRate * 100).toFixed(1)}%`);
    console.log(`Evictions: ${stats.evictionCount}`);
    
    if (stats.oldestEntry) {
      console.log(`Oldest Entry: ${stats.oldestEntry.toLocaleString()}`);
    }
    if (stats.newestEntry) {
      console.log(`Newest Entry: ${stats.newestEntry.toLocaleString()}`);
    }

    if (inspection.topKeys && inspection.topKeys.length > 0) {
      console.log('\nMost Accessed Keys:');
      inspection.topKeys.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.key} (${item.accessCount} accesses)`);
      });
    }
  }

  /**
   * Cache clear command
   */
  private async cacheClearCommand(args: string[]): Promise<void> {
    const confirm = args.includes('--confirm');
    
    if (!confirm) {
      console.log('⚠️  This will clear all cached images.');
      console.log('Use --confirm flag to proceed: cache-clear --confirm');
      return;
    }

    console.log('🗑️  Clearing cache...');
    await this.monitoring.clearCache();
    console.log('✅ Cache cleared successfully');
  }

  /**
   * Cache inspect command
   */
  private async cacheInspectCommand(args: string[]): Promise<void> {
    console.log('🔍 Cache Inspection:\n');
    
    const keys = this.cache.getKeys();
    const capacity = this.cache.getCapacityInfo();

    console.log(`Capacity: ${capacity.current}/${capacity.max} (${capacity.utilizationPercent.toFixed(1)}%)`);
    console.log(`Total Keys: ${keys.length}\n`);

    if (keys.length > 0) {
      console.log('Cache Keys:');
      keys.slice(0, 20).forEach((key, index) => {
        console.log(`  ${index + 1}. ${key}`);
      });
      
      if (keys.length > 20) {
        console.log(`  ... and ${keys.length - 20} more`);
      }
    }
  }

  /**
   * Logs command
   */
  private async logsCommand(args: string[]): Promise<void> {
    const count = args[0] ? parseInt(args[0]) : 50;
    const level = args[1] as any;
    
    console.log(`📝 Recent logs (${count} entries):\n`);
    
    const logs = this.logger.getRecentLogs(count, level);
    
    logs.forEach(log => {
      const timestamp = log.timestamp.toLocaleString();
      const levelIcon = this.getLogLevelIcon(log.level);
      console.log(`${levelIcon} [${timestamp}] ${log.level.toUpperCase()} ${log.context.component}:${log.context.operation}`);
      console.log(`   ${log.message}`);
      if (log.metadata && Object.keys(log.metadata).length > 0) {
        console.log(`   Metadata: ${JSON.stringify(log.metadata)}`);
      }
      console.log('');
    });
  }

  /**
   * Attribution report command
   */
  private async attributionReportCommand(args: string[]): Promise<void> {
    console.log('📄 Attribution Compliance Report:\n');
    
    const report = await this.attribution.generateAttributionReport();

    console.log(`Total Images: ${report.totalImages}`);
    console.log(`Total Usage: ${report.totalUsage}`);
    console.log(`Missing Attributions: ${report.missingAttributions}`);
    
    if (report.imagesBySource && Object.keys(report.imagesBySource).length > 0) {
      console.log('\nImages by Source:');
      Object.entries(report.imagesBySource).forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });
    }

    if (report.photographerCredits && report.photographerCredits.length > 0) {
      console.log('\nTop Photographers:');
      report.photographerCredits.slice(0, 10).forEach((credit, index) => {
        console.log(`  ${index + 1}. ${credit.photographer} (${credit.imageCount} images)`);
      });
    }

    if (report.complianceIssues && report.complianceIssues.length > 0) {
      console.log('\n⚠️  Compliance Issues:');
      report.complianceIssues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
  }

  /**
   * Config show command
   */
  private async configShowCommand(args: string[]): Promise<void> {
    const section = args[0];
    const config = this.config.getConfig();

    if (section) {
      const sectionData = (config as any)[section];
      if (sectionData) {
        console.log(`📋 Configuration - ${section}:\n`);
        console.log(JSON.stringify(sectionData, null, 2));
      } else {
        console.log(`❌ Unknown configuration section: ${section}`);
        console.log('Available sections: apis, cache, features, sections, admin');
      }
    } else {
      console.log('📋 Full Configuration:\n');
      console.log(JSON.stringify(config, null, 2));
    }
  }

  /**
   * Config validate command
   */
  private async configValidateCommand(args: string[]): Promise<void> {
    console.log('✅ Validating configuration dependencies:\n');
    
    const validation = this.config.validateFeatureDependencies();
    
    if (validation.valid) {
      console.log('✅ All configuration dependencies are valid');
    } else {
      console.log('❌ Configuration validation failed:');
      validation.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
  }

  /**
   * Alerts command
   */
  private async alertsCommand(args: string[]): Promise<void> {
    const alerts = this.monitoring.getActiveAlerts();
    
    console.log(`🚨 Active Alerts (${alerts.length}):\n`);
    
    if (alerts.length === 0) {
      console.log('No active alerts');
      return;
    }

    alerts.forEach((alert, index) => {
      const severityIcon = this.getSeverityIcon(alert.severity);
      console.log(`${severityIcon} Alert ${index + 1}:`);
      console.log(`   Severity: ${alert.severity}`);
      console.log(`   Message: ${alert.message}`);
      console.log(`   Time: ${alert.timestamp.toLocaleString()}`);
      console.log('');
    });
  }

  /**
   * Report command
   */
  private async reportCommand(args: string[]): Promise<void> {
    const format = args.includes('--csv') ? 'csv' : args.includes('--html') ? 'html' : 'json';
    const timeRange = args.find(arg => arg.startsWith('--time='))?.split('=')[1] || '1h';
    
    console.log(`📊 Generating system report (${format} format)...\n`);
    
    const timeRangeMs = this.parseTimeRange(timeRange);
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - timeRangeMs);

    const report = await this.monitoring.generateReport({
      timeRange: { start: startTime, end: endTime },
      includePerformance: true,
      includeAPI: true,
      includeCache: true,
      includeErrors: true,
      includeAttribution: true,
      format: format as any
    });

    console.log(report);
  }

  /**
   * Cleanup command
   */
  private async cleanupCommand(args: string[]): Promise<void> {
    const maxAge = args[0] ? this.parseTimeRange(args[0]) : 86400000; // 24 hours default
    
    console.log(`🧹 Forcing cleanup of data older than ${maxAge / 1000 / 60 / 60} hours...\n`);
    
    this.monitoring.forceCleanup(maxAge);
    
    console.log('✅ Cleanup completed');
  }

  /**
   * Help command
   */
  private async helpCommand(args: string[]): Promise<void> {
    console.log('🛠️  Image Integration System - Administrative CLI\n');
    console.log('Available commands:\n');
    
    Array.from(this.commands.values()).forEach(cmd => {
      console.log(`  ${cmd.name.padEnd(20)} ${cmd.description}`);
    });
    
    console.log('\nUsage examples:');
    console.log('  health                    - Check system health');
    console.log('  metrics 30                - Show metrics for last 30 minutes');
    console.log('  logs 100 error            - Show last 100 error logs');
    console.log('  cache-clear --confirm     - Clear cache with confirmation');
    console.log('  report --csv --time=2h    - Generate CSV report for last 2 hours');
  }

  /**
   * Helper methods
   */
  private getLogLevelIcon(level: string): string {
    switch (level) {
      case 'debug': return '🐛';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  }

  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'low': return '🔵';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  }

  private parseTimeRange(timeRange: string): number {
    const match = timeRange.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid time range format: ${timeRange}. Use format like "30m", "2h", "1d"`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: throw new Error(`Unknown time unit: ${unit}`);
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create and execute CLI command
 */
export async function executeAdminCommand(command: string, args: string[] = [], options: CLIOptions = {}): Promise<void> {
  const cli = new AdminCLI();
  await cli.executeCommand(command, args, options);
}

/**
 * Interactive CLI session
 */
export async function startInteractiveCLI(): Promise<void> {
  const cli = new AdminCLI();
  
  console.log('🛠️  Image Integration System - Interactive CLI');
  console.log('Type "help" for available commands, "exit" to quit\n');

  // Note: In a real implementation, you would use a library like 'readline' for interactive input
  // This is a simplified version for demonstration
  await cli.executeCommand('help');
}

/**
 * Quick health check
 */
export async function quickHealthCheck(): Promise<void> {
  const cli = new AdminCLI();
  await cli.executeCommand('health');
}

/**
 * Quick metrics overview
 */
export async function quickMetrics(): Promise<void> {
  const cli = new AdminCLI();
  await cli.executeCommand('metrics');
}

/**
 * Generate quick report
 */
export async function generateQuickReport(format: 'json' | 'csv' | 'html' = 'json'): Promise<void> {
  const cli = new AdminCLI();
  const args = format === 'csv' ? ['--csv'] : format === 'html' ? ['--html'] : [];
  await cli.executeCommand('report', args);
}