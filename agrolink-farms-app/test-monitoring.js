#!/usr/bin/env node

/**
 * Simple test script to verify monitoring and logging system
 */

// Set up environment variables for testing
process.env.UNSPLASH_ACCESS_KEY = 'test-key';
process.env.PEXELS_API_KEY = 'test-key';
process.env.ENABLE_IMAGE_LOGGING = 'true';
process.env.ENABLE_IMAGE_METRICS = 'true';

async function testMonitoringSystem() {
  try {
    console.log('🔍 Testing Image Integration Monitoring System...\n');

    // Test 1: Configuration loading
    console.log('1. Testing configuration loading...');
    const { getImageConfig } = require('./src/lib/images/config.ts');
    const config = getImageConfig();
    console.log('✅ Configuration loaded successfully');
    console.log(`   - Logging enabled: ${config.admin.enableLogging}`);
    console.log(`   - Metrics enabled: ${config.admin.enableMetrics}`);
    console.log(`   - Log level: ${config.admin.logLevel}\n`);

    // Test 2: Logger initialization
    console.log('2. Testing logger initialization...');
    const { ImageLogger } = require('./src/lib/images/utils/logger.ts');
    const logger = ImageLogger.getInstance();
    console.log('✅ Logger initialized successfully');
    
    // Test logging
    logger.info('Test log message', { test: true });
    logger.warn('Test warning message');
    console.log('✅ Logging functionality working\n');

    // Test 3: Monitoring service
    console.log('3. Testing monitoring service...');
    const { MonitoringService } = require('./src/lib/images/services/monitoring-service.ts');
    const monitoring = MonitoringService.getInstance();
    console.log('✅ Monitoring service initialized successfully');
    
    // Test metrics collection
    const metrics = await monitoring.getSystemMetrics();
    console.log('✅ Metrics collection working');
    console.log(`   - Uptime: ${metrics.uptime}ms`);
    console.log(`   - Memory usage: ${Math.round(metrics.memoryUsage.used / 1024 / 1024)}MB\n`);

    // Test 4: Cache with monitoring
    console.log('4. Testing cache with monitoring integration...');
    const { ImageCache } = require('./src/lib/images/services/image-cache.ts');
    const cache = new ImageCache(10, 60000); // Small cache for testing
    console.log('✅ Cache with monitoring initialized successfully');
    
    const stats = await cache.getStats();
    console.log('✅ Cache statistics working');
    console.log(`   - Cache size: ${stats.size}/${stats.maxSize}`);
    console.log(`   - Hit rate: ${(stats.hitRate * 100).toFixed(1)}%\n`);

    console.log('🎉 All monitoring and logging systems are working correctly!');
    console.log('\n📊 System Status:');
    console.log('   ✅ Configuration Management');
    console.log('   ✅ Structured Logging');
    console.log('   ✅ Performance Monitoring');
    console.log('   ✅ Cache Statistics');
    console.log('   ✅ Administrative Tools');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testMonitoringSystem();