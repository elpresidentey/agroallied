/**
 * Configuration Management Utilities
 * Provides administrative tools for managing image integration configuration
 * Validates: Requirements 8.2, 8.5
 */

import { ImageConfigManager, ImageConfig, ConfigChangeEvent } from '../config';

// ============================================================================
// Configuration Management Interface
// ============================================================================

export interface ConfigurationSnapshot {
  config: ImageConfig;
  timestamp: Date;
  version: string;
  checksum: string;
}

export interface ConfigurationDiff {
  added: Partial<ImageConfig>;
  modified: Partial<ImageConfig>;
  removed: string[];
  timestamp: Date;
}

export interface FeatureFlagStatus {
  name: keyof ImageConfig['features'];
  enabled: boolean;
  description: string;
  dependencies?: string[];
  impact: 'low' | 'medium' | 'high';
}

export interface SectionStatus {
  name: string;
  enabled: boolean;
  imageSource: 'unsplash' | 'pexels' | 'both' | 'fallback';
  searchTerms?: string[];
  fallbackImage?: string;
  lastUpdated?: Date;
}

// ============================================================================
// Configuration Manager Class
// ============================================================================

export class ConfigurationManager {
  private configManager: ImageConfigManager;
  private snapshots: ConfigurationSnapshot[] = [];
  private maxSnapshots = 50;

  constructor() {
    this.configManager = ImageConfigManager.getInstance();
  }

  /**
   * Create a configuration snapshot
   */
  public createSnapshot(version?: string): ConfigurationSnapshot {
    const config = this.configManager.getConfig();
    const snapshot: ConfigurationSnapshot = {
      config: JSON.parse(JSON.stringify(config)), // Deep copy
      timestamp: new Date(),
      version: version || this.generateVersion(),
      checksum: this.generateChecksum(config)
    };

    this.snapshots.unshift(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(0, this.maxSnapshots);
    }

    return snapshot;
  }

  /**
   * Get all configuration snapshots
   */
  public getSnapshots(): ConfigurationSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Restore configuration from snapshot
   */
  public restoreFromSnapshot(snapshot: ConfigurationSnapshot): void {
    this.configManager.updateConfig(snapshot.config, 'admin');
  }

  /**
   * Compare two configurations and generate diff
   */
  public compareConfigurations(config1: ImageConfig, config2: ImageConfig): ConfigurationDiff {
    const diff: ConfigurationDiff = {
      added: {},
      modified: {},
      removed: [],
      timestamp: new Date()
    };

    // This is a simplified diff - in a real implementation, you'd want a more sophisticated diff algorithm
    const keys1 = this.flattenObject(config1);
    const keys2 = this.flattenObject(config2);

    // Find added and modified keys
    Object.keys(keys2).forEach(key => {
      if (!(key in keys1)) {
        this.setNestedProperty(diff.added, key, keys2[key]);
      } else if (keys1[key] !== keys2[key]) {
        this.setNestedProperty(diff.modified, key, keys2[key]);
      }
    });

    // Find removed keys
    Object.keys(keys1).forEach(key => {
      if (!(key in keys2)) {
        diff.removed.push(key);
      }
    });

    return diff;
  }

  /**
   * Get all feature flag statuses
   */
  public getFeatureFlagStatuses(): FeatureFlagStatus[] {
    const config = this.configManager.getConfig();
    const features = config.features;

    return [
      {
        name: 'enableUnsplash',
        enabled: features.enableUnsplash,
        description: 'Enable Unsplash API integration for image fetching',
        dependencies: ['UNSPLASH_ACCESS_KEY'],
        impact: 'high'
      },
      {
        name: 'enablePexels',
        enabled: features.enablePexels,
        description: 'Enable Pexels API integration for image fetching',
        dependencies: ['PEXELS_API_KEY'],
        impact: 'high'
      },
      {
        name: 'enableCaching',
        enabled: features.enableCaching,
        description: 'Enable image caching for improved performance',
        impact: 'medium'
      },
      {
        name: 'enableLazyLoading',
        enabled: features.enableLazyLoading,
        description: 'Enable lazy loading for images below the fold',
        impact: 'medium'
      },
      {
        name: 'enableAttribution',
        enabled: features.enableAttribution,
        description: 'Enable photographer attribution display',
        impact: 'low'
      },
      {
        name: 'enableHeroSection',
        enabled: features.enableHeroSection,
        description: 'Enable dynamic images in hero section',
        impact: 'high'
      },
      {
        name: 'enableCategoryImages',
        enabled: features.enableCategoryImages,
        description: 'Enable dynamic images for category sections',
        impact: 'medium'
      },
      {
        name: 'enableSectionBackgrounds',
        enabled: features.enableSectionBackgrounds,
        description: 'Enable dynamic background images for sections',
        impact: 'medium'
      },
      {
        name: 'enableImageOptimization',
        enabled: features.enableImageOptimization,
        description: 'Enable automatic image optimization and resizing',
        impact: 'medium'
      },
      {
        name: 'enableProgressiveLoading',
        enabled: features.enableProgressiveLoading,
        description: 'Enable progressive image loading with placeholders',
        impact: 'low'
      }
    ];
  }

  /**
   * Get all section statuses
   */
  public getSectionStatuses(): SectionStatus[] {
    const config = this.configManager.getConfig();
    const sections = config.sections;

    return Object.entries(sections).map(([name, sectionConfig]) => ({
      name,
      enabled: sectionConfig.enabled,
      imageSource: sectionConfig.imageSource,
      searchTerms: sectionConfig.searchTerms,
      fallbackImage: sectionConfig.fallbackImage
    }));
  }

  /**
   * Toggle multiple feature flags at once
   */
  public bulkToggleFeatures(features: Array<{ name: keyof ImageConfig['features']; enabled: boolean }>): void {
    features.forEach(({ name, enabled }) => {
      this.configManager.toggleFeature(name, enabled);
    });
  }

  /**
   * Update multiple sections at once
   */
  public bulkUpdateSections(sections: Array<{ name: string; config: Partial<ImageConfig['sections'][string]> }>): void {
    sections.forEach(({ name, config }) => {
      this.configManager.updateSectionConfig(name, config);
    });
  }

  /**
   * Validate configuration and return validation results
   */
  public validateConfiguration(config?: ImageConfig): { valid: boolean; errors: string[]; warnings: string[] } {
    const configToValidate = config || this.configManager.getConfig();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Create a temporary config manager to validate
      const tempManager = new (ImageConfigManager as any)();
      tempManager.validateConfiguration(configToValidate);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }

    // Additional warnings
    if (configToValidate.features.enableUnsplash && !configToValidate.apis.unsplash.accessKey) {
      warnings.push('Unsplash is enabled but no access key is configured');
    }

    if (configToValidate.features.enablePexels && !configToValidate.apis.pexels.apiKey) {
      warnings.push('Pexels is enabled but no API key is configured');
    }

    if (!configToValidate.features.enableUnsplash && !configToValidate.features.enablePexels) {
      warnings.push('Both Unsplash and Pexels are disabled - only fallback images will be used');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get configuration health status
   */
  public getConfigurationHealth(): {
    status: 'healthy' | 'warning' | 'error';
    score: number;
    issues: Array<{ type: 'error' | 'warning'; message: string; severity: 'low' | 'medium' | 'high' }>;
  } {
    const validation = this.validateConfiguration();
    const dependencies = this.configManager.validateFeatureDependencies();
    const issues: Array<{ type: 'error' | 'warning'; message: string; severity: 'low' | 'medium' | 'high' }> = [];

    // Add validation errors
    validation.errors.forEach(error => {
      issues.push({ type: 'error', message: error, severity: 'high' });
    });

    // Add validation warnings
    validation.warnings.forEach(warning => {
      issues.push({ type: 'warning', message: warning, severity: 'medium' });
    });

    // Add dependency issues
    dependencies.issues.forEach(issue => {
      issues.push({ type: 'warning', message: issue, severity: 'medium' });
    });

    // Calculate health score (0-100)
    const errorWeight = 30;
    const warningWeight = 10;
    const maxScore = 100;
    
    const errorPenalty = validation.errors.length * errorWeight;
    const warningPenalty = (validation.warnings.length + dependencies.issues.length) * warningWeight;
    const score = Math.max(0, maxScore - errorPenalty - warningPenalty);

    // Determine status
    let status: 'healthy' | 'warning' | 'error';
    if (validation.errors.length > 0) {
      status = 'error';
    } else if (validation.warnings.length > 0 || dependencies.issues.length > 0) {
      status = 'warning';
    } else {
      status = 'healthy';
    }

    return { status, score, issues };
  }

  /**
   * Create configuration preset for common scenarios
   */
  public createConfigurationPreset(presetName: string): Partial<ImageConfig> {
    const presets: Record<string, Partial<ImageConfig>> = {
      'development': {
        features: {
          enableUnsplash: true,
          enablePexels: true,
          enableCaching: true,
          enableLazyLoading: false, // Disable for faster development
          enableAttribution: true,
          enableHeroSection: true,
          enableCategoryImages: true,
          enableSectionBackgrounds: true,
          enableImageOptimization: false, // Disable for faster development
          enableProgressiveLoading: false
        },
        cache: {
          maxSize: 50,
          defaultTTL: 60 * 60 * 1000, // 1 hour for development
          evictionPolicy: 'lru',
          enabled: true
        },
        admin: {
          enableConfigUI: true,
          enableMetrics: true,
          enableLogging: true,
          logLevel: 'debug'
        }
      },
      'production': {
        features: {
          enableUnsplash: true,
          enablePexels: true,
          enableCaching: true,
          enableLazyLoading: true,
          enableAttribution: true,
          enableHeroSection: true,
          enableCategoryImages: true,
          enableSectionBackgrounds: true,
          enableImageOptimization: true,
          enableProgressiveLoading: true
        },
        cache: {
          maxSize: 200,
          defaultTTL: 24 * 60 * 60 * 1000, // 24 hours for production
          evictionPolicy: 'lru',
          enabled: true
        },
        admin: {
          enableConfigUI: false,
          enableMetrics: true,
          enableLogging: true,
          logLevel: 'info'
        }
      },
      'minimal': {
        features: {
          enableUnsplash: false,
          enablePexels: false,
          enableCaching: false,
          enableLazyLoading: false,
          enableAttribution: false,
          enableHeroSection: false,
          enableCategoryImages: false,
          enableSectionBackgrounds: false,
          enableImageOptimization: false,
          enableProgressiveLoading: false
        },
        sections: {
          hero: { enabled: false, imageSource: 'fallback' },
          categories: { enabled: false, imageSource: 'fallback' },
          features: { enabled: false, imageSource: 'fallback' },
          testimonials: { enabled: false, imageSource: 'fallback' }
        }
      },
      'unsplash-only': {
        features: {
          enableUnsplash: true,
          enablePexels: false,
          enableCaching: true,
          enableLazyLoading: true,
          enableAttribution: true,
          enableHeroSection: true,
          enableCategoryImages: true,
          enableSectionBackgrounds: true,
          enableImageOptimization: true,
          enableProgressiveLoading: true
        },
        sections: {
          hero: { enabled: true, imageSource: 'unsplash' },
          categories: { enabled: true, imageSource: 'unsplash' },
          features: { enabled: true, imageSource: 'unsplash' },
          testimonials: { enabled: true, imageSource: 'unsplash' }
        }
      },
      'pexels-only': {
        features: {
          enableUnsplash: false,
          enablePexels: true,
          enableCaching: true,
          enableLazyLoading: true,
          enableAttribution: true,
          enableHeroSection: true,
          enableCategoryImages: true,
          enableSectionBackgrounds: true,
          enableImageOptimization: true,
          enableProgressiveLoading: true
        },
        sections: {
          hero: { enabled: true, imageSource: 'pexels' },
          categories: { enabled: true, imageSource: 'pexels' },
          features: { enabled: true, imageSource: 'pexels' },
          testimonials: { enabled: true, imageSource: 'pexels' }
        }
      }
    };

    return presets[presetName] || {};
  }

  /**
   * Apply configuration preset
   */
  public applyConfigurationPreset(presetName: string): void {
    const preset = this.createConfigurationPreset(presetName);
    if (Object.keys(preset).length > 0) {
      this.configManager.updateConfig(preset, 'admin');
    } else {
      throw new Error(`Unknown configuration preset: ${presetName}`);
    }
  }

  /**
   * Get available configuration presets
   */
  public getAvailablePresets(): string[] {
    return ['development', 'production', 'minimal', 'unsplash-only', 'pexels-only'];
  }

  /**
   * Export configuration with metadata
   */
  public exportConfigurationWithMetadata(): {
    config: ImageConfig;
    metadata: {
      exportedAt: Date;
      version: string;
      checksum: string;
      health: ReturnType<ConfigurationManager['getConfigurationHealth']>;
    };
  } {
    const config = this.configManager.getConfig();
    const health = this.getConfigurationHealth();

    return {
      config,
      metadata: {
        exportedAt: new Date(),
        version: this.generateVersion(),
        checksum: this.generateChecksum(config),
        health
      }
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}.${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  }

  private generateChecksum(config: ImageConfig): string {
    const configString = JSON.stringify(config, Object.keys(config).sort());
    let hash = 0;
    for (let i = 0; i < configString.length; i++) {
      const char = configString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    });
    
    return flattened;
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

let configManagerInstance: ConfigurationManager | null = null;

/**
 * Get the global configuration manager instance
 */
export function getConfigurationManager(): ConfigurationManager {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigurationManager();
  }
  return configManagerInstance;
}

/**
 * Create a configuration snapshot
 */
export function createConfigSnapshot(version?: string): ConfigurationSnapshot {
  return getConfigurationManager().createSnapshot(version);
}

/**
 * Get feature flag statuses
 */
export function getFeatureFlagStatuses(): FeatureFlagStatus[] {
  return getConfigurationManager().getFeatureFlagStatuses();
}

/**
 * Get section statuses
 */
export function getSectionStatuses(): SectionStatus[] {
  return getConfigurationManager().getSectionStatuses();
}

/**
 * Get configuration health
 */
export function getConfigurationHealth() {
  return getConfigurationManager().getConfigurationHealth();
}

/**
 * Apply configuration preset
 */
export function applyImageConfigurationPreset(presetName: string): void {
  return getConfigurationManager().applyConfigurationPreset(presetName);
}

/**
 * Get available configuration presets
 */
export function getAvailableImageConfigPresets(): string[] {
  return getConfigurationManager().getAvailablePresets();
}

/**
 * Create configuration preset
 */
export function createImageConfigurationPreset(presetName: string): Partial<ImageConfig> {
  return getConfigurationManager().createConfigurationPreset(presetName);
}