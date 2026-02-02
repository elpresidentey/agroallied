'use client';

/**
 * Administrative dashboard for Image Integration System monitoring
 * Provides real-time metrics, health status, and management tools
 * Requirements: 8.3
 */

import React, { useState, useEffect } from 'react';
import { MonitoringService, SystemHealthStatus, SystemMetrics, Alert } from '../services/monitoring-service';
import { ImageLogger } from '../utils/logger';
import { ImageConfigManager } from '../config';

interface AdminDashboardProps {
  refreshInterval?: number;
  className?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  refreshInterval = 30000, // 30 seconds
  className = ''
}) => {
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'alerts' | 'logs' | 'config'>('overview');

  const monitoring = MonitoringService.getInstance();
  const logger = ImageLogger.getInstance();
  const config = ImageConfigManager.getInstance();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [healthData, metricsData, alertsData] = await Promise.all([
          monitoring.getSystemHealth(),
          Promise.resolve(monitoring.getSystemMetrics()),
          Promise.resolve(monitoring.getActiveAlerts())
        ]);

        setHealth(healthData);
        setMetrics(metricsData);
        setAlerts(alertsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleClearCache = async () => {
    try {
      await monitoring.clearCache();
      // Refresh data after clearing cache
      const metricsData = monitoring.getSystemMetrics();
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const success = monitoring.resolveAlert(alertId);
      if (success) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve alert');
    }
  };

  const handleForceCleanup = () => {
    monitoring.forceCleanup();
    // Refresh data after cleanup
    const metricsData = monitoring.getSystemMetrics();
    setMetrics(metricsData);
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !health) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Image Integration System Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor system health, performance metrics, and manage configuration
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'metrics', label: 'Metrics' },
            { id: 'alerts', label: 'Alerts' },
            { id: 'logs', label: 'Logs' },
            { id: 'config', label: 'Config' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'alerts' && alerts.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && health && (
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getHealthStatusColor(health.overall)}`}>
                  {health.overall.toUpperCase()}
                </div>
                <div className="text-sm text-gray-500">Overall Status</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getHealthStatusColor(health.components.apis.status)}`}>
                  {health.components.apis.status.toUpperCase()}
                </div>
                <div className="text-sm text-gray-500">APIs</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getHealthStatusColor(health.components.cache.status)}`}>
                  {health.components.cache.status.toUpperCase()}
                </div>
                <div className="text-sm text-gray-500">Cache</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.floor(health.uptime / 1000 / 60)}m
                </div>
                <div className="text-sm text-gray-500">Uptime</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleClearCache}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Cache
              </button>
              <button
                onClick={handleForceCleanup}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Force Cleanup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.performance.totalOperations}
              </div>
              <div className="text-sm text-gray-500">Total Operations</div>
              <div className="mt-2 text-sm text-green-600">
                {(metrics.performance.successRate * 100).toFixed(1)}% success rate
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.performance.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-500">Avg Response Time</div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-2xl font-bold text-gray-900">
                {(metrics.cache.hitRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Cache Hit Rate</div>
              <div className="mt-2 text-sm text-gray-600">
                {metrics.cache.totalOperations} operations
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.errors.totalErrors}
              </div>
              <div className="text-sm text-gray-500">Total Errors</div>
              <div className="mt-2 text-sm text-red-600">
                {metrics.errors.unresolvedErrors} unresolved
              </div>
            </div>
          </div>

          {/* Performance Breakdown */}
          {metrics.performance.slowestOperations.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Slowest Operations</h3>
              <div className="space-y-2">
                {metrics.performance.slowestOperations.slice(0, 5).map((op, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-900">{op.operation}</span>
                    <span className="text-sm text-gray-500">{op.duration}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <div className="text-gray-500">No active alerts</div>
            </div>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="ml-3 text-sm text-gray-500">
                        {alert.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                      {alert.message}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <LogsViewer />
      )}

      {/* Config Tab */}
      {activeTab === 'config' && (
        <ConfigViewer />
      )}
    </div>
  );
};

// Logs Viewer Component
const LogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [logLevel, setLogLevel] = useState<string>('all');
  const logger = ImageLogger.getInstance();

  useEffect(() => {
    const fetchLogs = () => {
      const recentLogs = logger.getRecentLogs(100, logLevel === 'all' ? undefined : logLevel as any);
      setLogs(recentLogs);
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [logLevel]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug': return 'text-gray-600';
      case 'info': return 'text-blue-600';
      case 'warn': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Logs</h3>
          <select
            value={logLevel}
            onChange={(e) => setLogLevel(e.target.value)}
            className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No logs available</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {logs.map((log, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900">{log.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {log.timestamp.toLocaleString()} • {log.context.component}:{log.context.operation}
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="text-xs text-gray-400 mt-1 font-mono">
                        {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Config Viewer Component
const ConfigViewer: React.FC = () => {
  const [configData, setConfigData] = useState<any>(null);
  const config = ImageConfigManager.getInstance();

  useEffect(() => {
    const currentConfig = config.getConfig();
    setConfigData(currentConfig);
  }, []);

  if (!configData) {
    return <div className="p-6">Loading configuration...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Current Configuration</h3>
      <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
        {JSON.stringify(configData, null, 2)}
      </pre>
    </div>
  );
};

export default AdminDashboard;