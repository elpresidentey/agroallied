# Image Integration System - Administrative Guide

This guide covers the administrative tools and monitoring capabilities of the Image Integration System.

## Overview

The Image Integration System provides comprehensive monitoring, logging, and administrative tools to help you manage and maintain the system effectively.

## Administrative Tools

### 1. Web Dashboard

Access the web-based administrative dashboard at `/admin/image-system` to:

- Monitor system health in real-time
- View performance metrics and statistics
- Manage alerts and notifications
- Inspect cache contents and performance
- View system logs
- Manage configuration settings

**Features:**
- Real-time health monitoring
- Interactive metrics visualization
- Alert management and resolution
- Log filtering and search
- Configuration validation
- Cache inspection and management

### 2. Command Line Interface (CLI)

Use the CLI for automated tasks and scripting:

```bash
# Check system health
npm run image-admin health

# View metrics for the last 30 minutes
npm run image-admin metrics 30

# Show cache statistics
npm run image-admin cache-stats

# Clear cache (with confirmation)
npm run image-admin cache-clear --confirm

# View recent logs
npm run image-admin logs 100

# Generate attribution report
npm run image-admin attribution-report

# Show configuration
npm run image-admin config-show

# Validate configuration
npm run image-admin config-validate

# Show active alerts
npm run image-admin alerts

# Generate system report
npm run image-admin report --csv --time=2h

# Force cleanup of old data
npm run image-admin cleanup 24h

# Show all available commands
npm run image-admin help
```

## Monitoring and Logging

### System Health Monitoring

The system continuously monitors:

- **API Health**: Availability and performance of external APIs (Unsplash, Pexels)
- **Cache Health**: Cache hit rates, capacity utilization, and performance
- **Attribution Health**: Compliance with attribution requirements
- **Logging Health**: Error rates and log system functionality

Health statuses:
- **Healthy**: All systems operating normally
- **Degraded**: Some issues detected but system still functional
- **Critical**: Significant issues requiring immediate attention

### Performance Metrics

Track key performance indicators:

- **Operation Metrics**: Total operations, success rates, response times
- **API Metrics**: Request counts, success rates, rate limit status
- **Cache Metrics**: Hit rates, eviction counts, utilization
- **Error Metrics**: Error counts by type, unresolved issues

### Logging System

Structured logging with multiple levels:

- **Debug**: Detailed diagnostic information
- **Info**: General operational information
- **Warn**: Warning conditions that should be monitored
- **Error**: Error conditions requiring attention

Log entries include:
- Timestamp and log level
- Component and operation context
- Structured metadata
- Performance timing information
- Error details and stack traces

## Alert System

### Default Alert Rules

The system includes pre-configured alerts for:

1. **High Error Rate**: Triggers when error rate exceeds 20%
2. **API Rate Limit Warning**: Alerts when API rate limits are low
3. **Low Cache Hit Rate**: Warns when cache hit rate drops below 30%
4. **Slow Response Time**: Alerts when average response time exceeds 5 seconds

### Custom Alerts

Create custom alert rules programmatically:

```typescript
import { MonitoringService } from './services/monitoring-service';

const monitoring = MonitoringService.getInstance();

monitoring.addAlertRule({
  name: 'Custom Alert',
  description: 'Alert description',
  condition: {
    type: 'threshold',
    metric: 'error_rate',
    operator: '>',
    value: 0.1,
    timeWindowMs: 300000
  },
  severity: 'medium',
  enabled: true,
  cooldownMs: 600000
});
```

## Cache Management

### Cache Statistics

Monitor cache performance:
- Current size and capacity utilization
- Hit/miss rates
- Eviction counts and reasons
- Most frequently accessed items
- Age distribution of cached items

### Cache Operations

Administrative cache operations:

```bash
# View cache statistics
npm run image-admin cache-stats

# Inspect cache contents
npm run image-admin cache-inspect

# Clear entire cache
npm run image-admin cache-clear --confirm

# Cleanup expired items
npm run image-admin cleanup
```

### Cache Configuration

Configure cache behavior through environment variables:

```env
# Cache settings
IMAGE_CACHE_MAX_SIZE=100
IMAGE_CACHE_TTL=86400000
IMAGE_CACHE_EVICTION_POLICY=lru
IMAGE_CACHE_ENABLED=true
```

## Attribution Management

### Compliance Reporting

Generate attribution compliance reports:

```bash
# Generate attribution report
npm run image-admin attribution-report
```

Report includes:
- Total images and usage statistics
- Images by source (Unsplash, Pexels)
- Photographer credits and attribution requirements
- Compliance issues and missing attributions

### Attribution Tracking

The system automatically tracks:
- Image source and photographer information
- Usage statistics for compliance reporting
- Attribution display requirements
- License compliance status

## Configuration Management

### Environment Variables

Key configuration variables:

```env
# API Configuration
UNSPLASH_ACCESS_KEY=your_key_here
PEXELS_API_KEY=your_key_here
UNSPLASH_ENABLED=true
PEXELS_ENABLED=true

# Feature Flags
ENABLE_IMAGE_CACHING=true
ENABLE_LAZY_LOADING=true
ENABLE_ATTRIBUTION=true
ENABLE_IMAGE_METRICS=true
ENABLE_IMAGE_LOGGING=true

# Performance Settings
MAX_CONCURRENT_IMAGE_REQUESTS=5
IMAGE_REQUEST_TIMEOUT=10000
IMAGE_RETRY_ATTEMPTS=3

# Admin Settings
ENABLE_IMAGE_CONFIG_UI=false
IMAGE_LOG_LEVEL=info
```

### Configuration Validation

Validate configuration dependencies:

```bash
npm run image-admin config-validate
```

This checks for:
- Required API keys when features are enabled
- Valid configuration values and ranges
- Feature dependency conflicts
- Section configuration consistency

## Reporting

### System Reports

Generate comprehensive system reports:

```bash
# JSON report (default)
npm run image-admin report

# CSV format
npm run image-admin report --csv

# HTML format
npm run image-admin report --html

# Custom time range
npm run image-admin report --time=6h
```

Reports include:
- System health status
- Performance metrics
- API usage statistics
- Cache performance
- Error summaries
- Attribution compliance data

### Export Data

Export monitoring data for external analysis:

```typescript
import { MonitoringService } from './services/monitoring-service';

const monitoring = MonitoringService.getInstance();
const data = monitoring.exportMonitoringData();

// Contains logs, metrics, alerts, and configuration
console.log(data);
```

## Troubleshooting

### Common Issues

1. **High Error Rates**
   - Check API key validity and rate limits
   - Verify network connectivity
   - Review error logs for specific issues

2. **Low Cache Hit Rates**
   - Check cache size configuration
   - Review TTL settings
   - Monitor eviction patterns

3. **Performance Issues**
   - Review concurrent request limits
   - Check timeout settings
   - Monitor API response times

4. **Attribution Compliance**
   - Run attribution reports regularly
   - Verify photographer credit display
   - Check license compliance

### Diagnostic Commands

```bash
# Quick health check
npm run image-admin health

# View recent errors
npm run image-admin logs 50 error

# Check configuration
npm run image-admin config-validate

# Monitor performance
npm run image-admin metrics 60
```

## Best Practices

### Monitoring

1. **Regular Health Checks**: Monitor system health at least daily
2. **Alert Management**: Review and resolve alerts promptly
3. **Performance Monitoring**: Track key metrics and trends
4. **Log Analysis**: Regularly review logs for issues and patterns

### Cache Management

1. **Capacity Planning**: Monitor cache utilization and adjust size as needed
2. **TTL Optimization**: Balance cache freshness with performance
3. **Eviction Monitoring**: Track eviction patterns and reasons
4. **Regular Cleanup**: Schedule periodic cleanup of expired items

### Configuration

1. **Environment Separation**: Use different configurations for development, staging, and production
2. **Security**: Keep API keys secure and rotate regularly
3. **Validation**: Validate configuration changes before deployment
4. **Documentation**: Document custom configuration changes

### Compliance

1. **Attribution Tracking**: Ensure all images have proper attribution
2. **License Compliance**: Verify compliance with API terms of service
3. **Usage Reporting**: Generate regular usage reports for compliance
4. **Audit Trail**: Maintain logs of all administrative actions

## API Reference

### Monitoring Service

```typescript
import { MonitoringService } from './services/monitoring-service';

const monitoring = MonitoringService.getInstance();

// Get system health
const health = await monitoring.getSystemHealth();

// Get metrics
const metrics = monitoring.getSystemMetrics(timeRangeMs);

// Generate report
const report = await monitoring.generateReport(options);

// Manage alerts
const alertId = monitoring.addAlertRule(rule);
monitoring.resolveAlert(alertId);
```

### Logger

```typescript
import { ImageLogger, createLogContext } from './utils/logger';

const logger = ImageLogger.getInstance();
const context = createLogContext('operation', 'component');

// Log messages
logger.info('Message', context, metadata);
logger.error('Error', context, error, metadata);

// Performance tracking
const operationId = logger.generateOperationId();
logger.startOperation(operationId, 'operationName', context);
logger.endOperation(operationId, context, success, metadata);

// Get metrics
const performanceMetrics = logger.getPerformanceMetrics();
const apiMetrics = logger.getAPIMetrics();
```

### Admin CLI

```typescript
import { executeAdminCommand } from './utils/admin-cli';

// Execute commands programmatically
await executeAdminCommand('health');
await executeAdminCommand('metrics', ['30']);
await executeAdminCommand('cache-clear', ['--confirm']);
```

## Support

For additional support or questions about the administrative tools:

1. Check the system logs for detailed error information
2. Run diagnostic commands to identify issues
3. Review configuration validation results
4. Generate system reports for analysis
5. Consult the main system documentation

The administrative tools are designed to provide comprehensive visibility and control over the Image Integration System, enabling effective monitoring, maintenance, and troubleshooting.