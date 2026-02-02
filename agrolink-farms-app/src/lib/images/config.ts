/**
 * Configuration management for the Image Integration System
 * Handles API keys, settings, and environment variable loading
 * Validates: Requirements 1.5, 8.1
 */

import { CategoryMapping, CacheEvictionPolicy } from './types';

// ============================================================================
// Configuration Change Events
// ============================================================================

export type ConfigChangeEvent = {
  type: 'config_updated' | 'feature_toggled' | 'category_updated' | 'api_updated';
  timestamp: Date;
  changes: Partial<ImageConfig>;
  source: 'environment' | 'runtime' | 'admin' | 'feature_flag';
};

export type ConfigChangeListener = (event: ConfigChangeEvent) => void;

// ============================================================================
// Configuration Interfaces
// ============================================================================

export interface ImageConfig {
  apis: {
    unsplash: {
      accessKey: string;
      baseUrl: string;
      rateLimit: number;
      enabled: boolean;
    };
    pexels: {
      apiKey: string;
      baseUrl: string;
      rateLimit: number;
      enabled: boolean;
    };
  };
  cache: {
    maxSize: number;
    defaultTTL: number;
    evictionPolicy: CacheEvictionPolicy;
    enabled: boolean;
  };
  categories: CategoryMapping[];
  fallbackImages: {
    hero: string;
    category: string;
    section: string;
  };
  features: {
    enableUnsplash: boolean;
    enablePexels: boolean;
    enableCaching: boolean;
    enableLazyLoading: boolean;
    enableAttribution: boolean;
    enableHeroSection: boolean;
    enableCategoryImages: boolean;
    enableSectionBackgrounds: boolean;
    enableImageOptimization: boolean;
    enableProgressiveLoading: boolean;
  };
  performance: {
    maxConcurrentRequests: number;
    requestTimeoutMs: number;
    retryAttempts: number;
    retryDelayMs: number;
  };
  sections: {
    [sectionName: string]: {
      enabled: boolean;
      imageSource: 'unsplash' | 'pexels' | 'both' | 'fallback';
      searchTerms?: string[];
      fallbackImage?: string;
    };
  };
  admin: {
    enableConfigUI: boolean;
    enableMetrics: boolean;
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    category: 'livestock',
    primaryTerms: ['cattle', 'cows', 'livestock', 'farm animals', 'dairy', 'beef cattle'],
    fallbackTerms: ['agriculture', 'farming', 'rural', 'pasture'],
    excludeTerms: ['urban', 'city', 'industrial']
  },
  {
    category: 'crops',
    primaryTerms: ['crops', 'wheat', 'corn', 'soybeans', 'harvest', 'grain'],
    fallbackTerms: ['agriculture', 'farming', 'field', 'plantation'],
    excludeTerms: ['urban', 'city', 'industrial']
  },
  {
    category: 'equipment',
    primaryTerms: ['tractor', 'farm equipment', 'agricultural machinery', 'harvester'],
    fallbackTerms: ['agriculture', 'farming', 'rural equipment'],
    excludeTerms: ['urban', 'city', 'construction']
  },
  {
    category: 'farms',
    primaryTerms: ['farm', 'farmhouse', 'barn', 'rural property', 'agricultural land'],
    fallbackTerms: ['agriculture', 'countryside', 'rural'],
    excludeTerms: ['urban', 'city', 'suburban']
  },
  {
    category: 'hero',
    primaryTerms: ['agriculture', 'farming', 'rural landscape', 'farm field', 'countryside'],
    fallbackTerms: ['nature', 'landscape', 'green field'],
    excludeTerms: ['urban', 'city', 'industrial']
  },
  {
    category: 'general',
    primaryTerms: ['agriculture', 'farming', 'rural', 'countryside'],
    fallbackTerms: ['nature', 'landscape', 'green'],
    excludeTerms: ['urban', 'city', 'industrial']
  }
];

const DEFAULT_CONFIG: ImageConfig = {
  apis: {
    unsplash: {
      accessKey: '',
      baseUrl: 'https://api.unsplash.com',
      rateLimit: 50, // requests per hour
      enabled: true
    },
    pexels: {
      apiKey: '',
      baseUrl: 'https://api.pexels.com/v1',
      rateLimit: 200, // requests per hour
      enabled: true
    }
  },
  cache: {
    maxSize: 100, // maximum number of cached images
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    evictionPolicy: 'lru',
    enabled: true
  },
  categories: DEFAULT_CATEGORY_MAPPINGS,
  fallbackImages: {
    hero: '/images/hero-fallback.svg',
    category: '/images/category-farms-fallback.svg',
    section: '/images/section-featured-farms-fallback.svg'
  },
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
  performance: {
    maxConcurrentRequests: 5,
    requestTimeoutMs: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelayMs: 1000 // 1 second base delay
  },
  sections: {
    hero: {
      enabled: true,
      imageSource: 'both',
      searchTerms: ['agriculture', 'farming', 'rural landscape'],
      fallbackImage: '/images/hero-fallback.svg'
    },
    categories: {
      enabled: true,
      imageSource: 'both',
      fallbackImage: '/images/category-farms-fallback.svg'
    },
    features: {
      enabled: true,
      imageSource: 'both',
      searchTerms: ['agriculture technology', 'modern farming'],
      fallbackImage: '/images/section-featured-farms-fallback.svg'
    },
    testimonials: {
      enabled: true,
      imageSource: 'both',
      searchTerms: ['happy farmers', 'agricultural success'],
      fallbackImage: '/images/section-featured-farms-fallback.svg'
    }
  },
  admin: {
    enableConfigUI: false,
    enableMetrics: true,
    enableLogging: true,
    logLevel: 'info'
  }
};

// ============================================================================
// Configuration Loading and Validation
// ============================================================================

export class ImageConfigManager {
  private config: ImageConfig;
  private static instance: ImageConfigManager;
  private listeners: ConfigChangeListener[] = [];
  private configHistory: ConfigChangeEvent[] = [];
  private maxHistorySize = 100;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): ImageConfigManager {
    if (!ImageConfigManager.instance) {
      ImageConfigManager.instance = new ImageConfigManager();
    }
    return ImageConfigManager.instance;
  }

  /**
   * Add a configuration change listener
   */
  public addConfigChangeListener(listener: ConfigChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a configuration change listener
   */
  public removeConfigChangeListener(listener: ConfigChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyConfigChange(event: ConfigChangeEvent): void {
    // Add to history
    this.configHistory.unshift(event);
    if (this.configHistory.length > this.maxHistorySize) {
      this.configHistory = this.configHistory.slice(0, this.maxHistorySize);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in config change listener:', error);
      }
    });
  }

  /**
   * Get configuration change history
   */
  public getConfigHistory(): ConfigChangeEvent[] {
    return [...this.configHistory];
  }

  /**
   * Load configuration from environment variables and defaults
   */
  private loadConfiguration(): ImageConfig {
    const config: ImageConfig = {
      ...DEFAULT_CONFIG,
      apis: {
        unsplash: {
          accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
          baseUrl: process.env.UNSPLASH_BASE_URL || DEFAULT_CONFIG.apis.unsplash.baseUrl,
          rateLimit: parseInt(process.env.UNSPLASH_RATE_LIMIT || '50', 10),
          enabled: process.env.ENABLE_UNSPLASH !== 'false'
        },
        pexels: {
          apiKey: process.env.PEXELS_API_KEY || '',
          baseUrl: process.env.PEXELS_BASE_URL || DEFAULT_CONFIG.apis.pexels.baseUrl,
          rateLimit: parseInt(process.env.PEXELS_RATE_LIMIT || '200', 10),
          enabled: process.env.ENABLE_PEXELS !== 'false'
        }
      },
      cache: {
        maxSize: parseInt(process.env.IMAGE_CACHE_MAX_SIZE || '100', 10),
        defaultTTL: parseInt(process.env.IMAGE_CACHE_TTL || '86400000', 10), // 24 hours
        evictionPolicy: (process.env.IMAGE_CACHE_EVICTION_POLICY as CacheEvictionPolicy) || 'lru',
        enabled: process.env.IMAGE_CACHE_ENABLED !== 'false'
      },
      features: {
        enableUnsplash: process.env.ENABLE_UNSPLASH === 'true',
        enablePexels: process.env.ENABLE_PEXELS === 'true',
        enableCaching: process.env.ENABLE_IMAGE_CACHING !== 'false',
        enableLazyLoading: process.env.ENABLE_LAZY_LOADING !== 'false',
        enableAttribution: process.env.ENABLE_ATTRIBUTION !== 'false',
        enableHeroSection: process.env.ENABLE_HERO_SECTION !== 'false',
        enableCategoryImages: process.env.ENABLE_CATEGORY_IMAGES !== 'false',
        enableSectionBackgrounds: process.env.ENABLE_SECTION_BACKGROUNDS !== 'false',
        enableImageOptimization: process.env.ENABLE_IMAGE_OPTIMIZATION !== 'false',
        enableProgressiveLoading: process.env.ENABLE_PROGRESSIVE_LOADING !== 'false'
      },
      performance: {
        maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_IMAGE_REQUESTS || '5', 10),
        requestTimeoutMs: parseInt(process.env.IMAGE_REQUEST_TIMEOUT || '10000', 10),
        retryAttempts: parseInt(process.env.IMAGE_RETRY_ATTEMPTS || '3', 10),
        retryDelayMs: parseInt(process.env.IMAGE_RETRY_DELAY || '1000', 10)
      },
      admin: {
        enableConfigUI: process.env.ENABLE_IMAGE_CONFIG_UI === 'true',
        enableMetrics: process.env.ENABLE_IMAGE_METRICS !== 'false',
        enableLogging: process.env.ENABLE_IMAGE_LOGGING !== 'false',
        logLevel: (process.env.IMAGE_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info'
      }
    };

    // Load section configurations from environment
    this.loadSectionConfigurations(config);

    // Validate configuration
    this.validateConfiguration(config);

    return config;
  }

  /**
   * Load section-specific configurations from environment variables
   */
  private loadSectionConfigurations(config: ImageConfig): void {
    // Load section configurations from environment variables
    const sectionNames = ['hero', 'categories', 'features', 'testimonials'];
    
    sectionNames.forEach(section => {
      const enabledKey = `ENABLE_${section.toUpperCase()}_IMAGES`;
      const sourceKey = `${section.toUpperCase()}_IMAGE_SOURCE`;
      const termsKey = `${section.toUpperCase()}_SEARCH_TERMS`;
      const fallbackKey = `${section.toUpperCase()}_FALLBACK_IMAGE`;

      if (config.sections[section]) {
        config.sections[section].enabled = process.env[enabledKey] !== 'false';
        
        const imageSource = process.env[sourceKey] as 'unsplash' | 'pexels' | 'both' | 'fallback';
        if (imageSource && ['unsplash', 'pexels', 'both', 'fallback'].includes(imageSource)) {
          config.sections[section].imageSource = imageSource;
        }

        if (process.env[termsKey]) {
          config.sections[section].searchTerms = process.env[termsKey].split(',').map(term => term.trim());
        }

        if (process.env[fallbackKey]) {
          config.sections[section].fallbackImage = process.env[fallbackKey];
        }
      }
    });
  }

  /**
   * Validate the loaded configuration
   */
  private validateConfiguration(config: ImageConfig): void {
    const errors: string[] = [];

    // Validate API keys if features are enabled
    if (config.features.enableUnsplash && config.apis.unsplash.enabled && !config.apis.unsplash.accessKey) {
      errors.push('Unsplash access key is required when Unsplash is enabled');
    }

    if (config.features.enablePexels && config.apis.pexels.enabled && !config.apis.pexels.apiKey) {
      errors.push('Pexels API key is required when Pexels is enabled');
    }

    // Validate cache settings
    if (config.cache.enabled && config.cache.maxSize <= 0) {
      errors.push('Cache max size must be greater than 0');
    }

    if (config.cache.enabled && config.cache.defaultTTL <= 0) {
      errors.push('Cache TTL must be greater than 0');
    }

    // Validate performance settings
    if (config.performance.maxConcurrentRequests <= 0) {
      errors.push('Max concurrent requests must be greater than 0');
    }

    if (config.performance.requestTimeoutMs <= 0) {
      errors.push('Request timeout must be greater than 0');
    }

    // Validate section configurations
    Object.entries(config.sections).forEach(([sectionName, sectionConfig]) => {
      if (sectionConfig.enabled && !['unsplash', 'pexels', 'both', 'fallback'].includes(sectionConfig.imageSource)) {
        errors.push(`Invalid image source for section ${sectionName}: ${sectionConfig.imageSource}`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Image configuration validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Get the current configuration
   */
  public getConfig(): ImageConfig {
    return { ...this.config };
  }

  /**
   * Update configuration at runtime
   */
  public updateConfig(updates: Partial<ImageConfig>, source: ConfigChangeEvent['source'] = 'runtime'): void {
    const previousConfig = { ...this.config };
    
    // Deep merge the updates
    this.config = this.deepMerge(this.config, updates);
    
    // Validate the updated configuration
    this.validateConfiguration(this.config);

    // Create change event
    const changeEvent: ConfigChangeEvent = {
      type: 'config_updated',
      timestamp: new Date(),
      changes: updates,
      source
    };

    // Notify listeners
    this.notifyConfigChange(changeEvent);
  }

  /**
   * Deep merge two objects
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] as any, source[key] as any);
        } else {
          result[key] = source[key] as any;
        }
      }
    }
    
    return result;
  }

  /**
   * Toggle a feature flag
   */
  public toggleFeature(feature: keyof ImageConfig['features'], enabled?: boolean): void {
    const newValue = enabled !== undefined ? enabled : !this.config.features[feature];
    const previousValue = this.config.features[feature];
    
    if (previousValue !== newValue) {
      this.config.features[feature] = newValue;
      
      const changeEvent: ConfigChangeEvent = {
        type: 'feature_toggled',
        timestamp: new Date(),
        changes: { features: { [feature]: newValue } as any },
        source: 'feature_flag'
      };
      
      this.notifyConfigChange(changeEvent);
    }
  }

  /**
   * Update section configuration
   */
  public updateSectionConfig(sectionName: string, config: Partial<ImageConfig['sections'][string]>): void {
    if (!this.config.sections[sectionName]) {
      this.config.sections[sectionName] = {
        enabled: true,
        imageSource: 'both',
        ...config
      };
    } else {
      this.config.sections[sectionName] = {
        ...this.config.sections[sectionName],
        ...config
      };
    }

    const changeEvent: ConfigChangeEvent = {
      type: 'config_updated',
      timestamp: new Date(),
      changes: { sections: { [sectionName]: config } as any },
      source: 'admin'
    };

    this.notifyConfigChange(changeEvent);
  }

  /**
   * Enable or disable a section
   */
  public toggleSection(sectionName: string, enabled?: boolean): void {
    const currentEnabled = this.config.sections[sectionName]?.enabled ?? false;
    const newEnabled = enabled !== undefined ? enabled : !currentEnabled;
    
    if (currentEnabled !== newEnabled) {
      this.updateSectionConfig(sectionName, { enabled: newEnabled });
    }
  }

  /**
   * Get API configuration for a specific service
   */
  public getAPIConfig(service: 'unsplash' | 'pexels') {
    return this.config.apis[service];
  }

  /**
   * Get cache configuration
   */
  public getCacheConfig() {
    return this.config.cache;
  }

  /**
   * Get category mappings
   */
  public getCategoryMappings(): CategoryMapping[] {
    return [...this.config.categories];
  }

  /**
   * Get fallback images configuration
   */
  public getFallbackImages() {
    return this.config.fallbackImages;
  }

  /**
   * Get feature flags
   */
  public getFeatures() {
    return this.config.features;
  }

  /**
   * Get performance settings
   */
  public getPerformanceConfig() {
    return this.config.performance;
  }

  /**
   * Check if a specific feature is enabled
   */
  public isFeatureEnabled(feature: keyof ImageConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * Add or update a category mapping
   */
  public updateCategoryMapping(category: string, mapping: Omit<CategoryMapping, 'category'>): void {
    const existingIndex = this.config.categories.findIndex(c => c.category === category);
    const newMapping: CategoryMapping = { category, ...mapping };

    if (existingIndex >= 0) {
      this.config.categories[existingIndex] = newMapping;
    } else {
      this.config.categories.push(newMapping);
    }
  }

  /**
   * Remove a category mapping
   */
  public removeCategoryMapping(category: string): void {
    this.config.categories = this.config.categories.filter(c => c.category !== category);
  }

  /**
   * Get section configuration
   */
  public getSectionConfig(sectionName: string) {
    return this.config.sections[sectionName] || null;
  }

  /**
   * Get all section configurations
   */
  public getAllSectionConfigs() {
    return { ...this.config.sections };
  }

  /**
   * Check if a section is enabled
   */
  public isSectionEnabled(sectionName: string): boolean {
    return this.config.sections[sectionName]?.enabled ?? false;
  }

  /**
   * Get admin configuration
   */
  public getAdminConfig() {
    return this.config.admin;
  }

  /**
   * Update admin configuration
   */
  public updateAdminConfig(updates: Partial<ImageConfig['admin']>): void {
    this.config.admin = {
      ...this.config.admin,
      ...updates
    };

    const changeEvent: ConfigChangeEvent = {
      type: 'config_updated',
      timestamp: new Date(),
      changes: { admin: updates } as Partial<ImageConfig>,
      source: 'admin'
    };

    this.notifyConfigChange(changeEvent);
  }

  /**
   * Export configuration for backup or transfer
   */
  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  public importConfig(configJson: string, source: ConfigChangeEvent['source'] = 'admin'): void {
    try {
      const importedConfig = JSON.parse(configJson) as ImageConfig;
      this.validateConfiguration(importedConfig);
      
      const previousConfig = { ...this.config };
      this.config = importedConfig;

      const changeEvent: ConfigChangeEvent = {
        type: 'config_updated',
        timestamp: new Date(),
        changes: importedConfig,
        source
      };

      this.notifyConfigChange(changeEvent);
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reset configuration to defaults
   */
  public resetToDefaults(): void {
    const previousConfig = { ...this.config };
    this.config = this.loadConfiguration();

    const changeEvent: ConfigChangeEvent = {
      type: 'config_updated',
      timestamp: new Date(),
      changes: this.config,
      source: 'admin'
    };

    this.notifyConfigChange(changeEvent);
  }

  /**
   * Reload configuration from environment variables
   */
  public reloadConfiguration(): void {
    const previousConfig = { ...this.config };
    this.config = this.loadConfiguration();

    const changeEvent: ConfigChangeEvent = {
      type: 'config_updated',
      timestamp: new Date(),
      changes: this.config,
      source: 'environment'
    };

    this.notifyConfigChange(changeEvent);
  }

  /**
   * Hot reload configuration from external source (e.g., database, API)
   */
  public async hotReloadConfiguration(configSource: () => Promise<Partial<ImageConfig>>): Promise<void> {
    try {
      const externalConfig = await configSource();
      this.updateConfig(externalConfig, 'runtime');
    } catch (error) {
      console.error('Failed to hot reload configuration:', error);
      throw new Error(`Hot reload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule periodic configuration reloads
   */
  public scheduleConfigReload(intervalMs: number, configSource: () => Promise<Partial<ImageConfig>>): () => void {
    const intervalId = setInterval(async () => {
      try {
        await this.hotReloadConfiguration(configSource);
      } catch (error) {
        console.error('Scheduled config reload failed:', error);
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }

  /**
   * Validate feature dependencies
   */
  public validateFeatureDependencies(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const config = this.config;

    // Check API dependencies
    if (config.features.enableUnsplash && (!config.apis.unsplash.enabled || !config.apis.unsplash.accessKey)) {
      issues.push('enableUnsplash feature requires Unsplash API to be enabled and configured');
    }

    if (config.features.enablePexels && (!config.apis.pexels.enabled || !config.apis.pexels.apiKey)) {
      issues.push('enablePexels feature requires Pexels API to be enabled and configured');
    }

    // Check caching dependencies
    if (config.features.enableLazyLoading && !config.features.enableCaching) {
      issues.push('enableLazyLoading works best with enableCaching enabled');
    }

    // Check section dependencies
    Object.entries(config.sections).forEach(([sectionName, sectionConfig]) => {
      if (sectionConfig.enabled) {
        if (sectionConfig.imageSource === 'unsplash' && !config.features.enableUnsplash) {
          issues.push(`Section ${sectionName} uses Unsplash but enableUnsplash is disabled`);
        }
        if (sectionConfig.imageSource === 'pexels' && !config.features.enablePexels) {
          issues.push(`Section ${sectionName} uses Pexels but enablePexels is disabled`);
        }
        if (sectionConfig.imageSource === 'both' && !config.features.enableUnsplash && !config.features.enablePexels) {
          issues.push(`Section ${sectionName} uses both APIs but both are disabled`);
        }
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get configuration schema for validation
   */
  public getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {
        apis: {
          type: 'object',
          properties: {
            unsplash: {
              type: 'object',
              properties: {
                accessKey: { type: 'string' },
                baseUrl: { type: 'string', format: 'uri' },
                rateLimit: { type: 'number', minimum: 1 },
                enabled: { type: 'boolean' }
              },
              required: ['accessKey', 'baseUrl', 'rateLimit', 'enabled']
            },
            pexels: {
              type: 'object',
              properties: {
                apiKey: { type: 'string' },
                baseUrl: { type: 'string', format: 'uri' },
                rateLimit: { type: 'number', minimum: 1 },
                enabled: { type: 'boolean' }
              },
              required: ['apiKey', 'baseUrl', 'rateLimit', 'enabled']
            }
          },
          required: ['unsplash', 'pexels']
        },
        cache: {
          type: 'object',
          properties: {
            maxSize: { type: 'number', minimum: 1 },
            defaultTTL: { type: 'number', minimum: 1000 },
            evictionPolicy: { type: 'string', enum: ['lru', 'fifo'] },
            enabled: { type: 'boolean' }
          },
          required: ['maxSize', 'defaultTTL', 'evictionPolicy', 'enabled']
        },
        features: {
          type: 'object',
          properties: {
            enableUnsplash: { type: 'boolean' },
            enablePexels: { type: 'boolean' },
            enableCaching: { type: 'boolean' },
            enableLazyLoading: { type: 'boolean' },
            enableAttribution: { type: 'boolean' },
            enableHeroSection: { type: 'boolean' },
            enableCategoryImages: { type: 'boolean' },
            enableSectionBackgrounds: { type: 'boolean' },
            enableImageOptimization: { type: 'boolean' },
            enableProgressiveLoading: { type: 'boolean' }
          },
          required: [
            'enableUnsplash', 'enablePexels', 'enableCaching', 'enableLazyLoading',
            'enableAttribution', 'enableHeroSection', 'enableCategoryImages',
            'enableSectionBackgrounds', 'enableImageOptimization', 'enableProgressiveLoading'
          ]
        },
        sections: {
          type: 'object',
          patternProperties: {
            '^[a-zA-Z][a-zA-Z0-9_-]*$': {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                imageSource: { type: 'string', enum: ['unsplash', 'pexels', 'both', 'fallback'] },
                searchTerms: { type: 'array', items: { type: 'string' } },
                fallbackImage: { type: 'string' }
              },
              required: ['enabled', 'imageSource']
            }
          }
        }
      },
      required: ['apis', 'cache', 'features', 'sections']
    };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get the global configuration instance
 */
export function getImageConfig(): ImageConfig {
  return ImageConfigManager.getInstance().getConfig();
}

/**
 * Check if a feature is enabled
 */
export function isImageFeatureEnabled(feature: keyof ImageConfig['features']): boolean {
  return ImageConfigManager.getInstance().isFeatureEnabled(feature);
}

/**
 * Check if a section is enabled
 */
export function isImageSectionEnabled(sectionName: string): boolean {
  return ImageConfigManager.getInstance().isSectionEnabled(sectionName);
}

/**
 * Get section configuration
 */
export function getImageSectionConfig(sectionName: string) {
  return ImageConfigManager.getInstance().getSectionConfig(sectionName);
}

/**
 * Toggle a feature flag
 */
export function toggleImageFeature(feature: keyof ImageConfig['features'], enabled?: boolean): void {
  ImageConfigManager.getInstance().toggleFeature(feature, enabled);
}

/**
 * Toggle a section
 */
export function toggleImageSection(sectionName: string, enabled?: boolean): void {
  ImageConfigManager.getInstance().toggleSection(sectionName, enabled);
}

/**
 * Add configuration change listener
 */
export function addImageConfigChangeListener(listener: ConfigChangeListener): void {
  ImageConfigManager.getInstance().addConfigChangeListener(listener);
}

/**
 * Remove configuration change listener
 */
export function removeImageConfigChangeListener(listener: ConfigChangeListener): void {
  ImageConfigManager.getInstance().removeConfigChangeListener(listener);
}

/**
 * Get category mappings
 */
export function getImageCategoryMappings(): CategoryMapping[] {
  return ImageConfigManager.getInstance().getCategoryMappings();
}

/**
 * Get API configuration for a service
 */
export function getImageAPIConfig(service: 'unsplash' | 'pexels') {
  return ImageConfigManager.getInstance().getAPIConfig(service);
}

/**
 * Hot reload configuration from external source
 */
export async function hotReloadImageConfiguration(configSource: () => Promise<Partial<ImageConfig>>): Promise<void> {
  return ImageConfigManager.getInstance().hotReloadConfiguration(configSource);
}

/**
 * Schedule periodic configuration reloads
 */
export function scheduleImageConfigReload(intervalMs: number, configSource: () => Promise<Partial<ImageConfig>>): () => void {
  return ImageConfigManager.getInstance().scheduleConfigReload(intervalMs, configSource);
}

/**
 * Validate feature dependencies
 */
export function validateImageFeatureDependencies(): { valid: boolean; issues: string[] } {
  return ImageConfigManager.getInstance().validateFeatureDependencies();
}

/**
 * Get configuration schema
 */
export function getImageConfigurationSchema(): any {
  return ImageConfigManager.getInstance().getConfigurationSchema();
}

/**
 * Bulk update multiple configuration sections
 */
export function bulkUpdateImageConfig(updates: {
  features?: Partial<ImageConfig['features']>;
  sections?: Record<string, Partial<ImageConfig['sections'][string]>>;
  apis?: Partial<ImageConfig['apis']>;
  cache?: Partial<ImageConfig['cache']>;
  performance?: Partial<ImageConfig['performance']>;
}): void {
  const configManager = ImageConfigManager.getInstance();
  const currentConfig = configManager.getConfig();
  const fullUpdates: Partial<ImageConfig> = {};

  if (updates.features) {
    fullUpdates.features = {
      ...currentConfig.features,
      ...updates.features
    };
  }

  if (updates.sections) {
    fullUpdates.sections = {
      ...currentConfig.sections
    };
    Object.entries(updates.sections).forEach(([sectionName, sectionUpdates]) => {
      if (fullUpdates.sections) {
        fullUpdates.sections[sectionName] = {
          ...currentConfig.sections[sectionName],
          ...sectionUpdates
        };
      }
    });
  }

  if (updates.apis) {
    fullUpdates.apis = {
      ...currentConfig.apis,
      ...updates.apis
    };
  }

  if (updates.cache) {
    fullUpdates.cache = {
      ...currentConfig.cache,
      ...updates.cache
    };
  }

  if (updates.performance) {
    fullUpdates.performance = {
      ...currentConfig.performance,
      ...updates.performance
    };
  }

  configManager.updateConfig(fullUpdates, 'runtime');
}

// ============================================================================
// Environment Variable Documentation
// ============================================================================

/**
 * Environment Variables for Image Integration System:
 * 
 * API Configuration:
 * - UNSPLASH_ACCESS_KEY: Unsplash API access key
 * - UNSPLASH_BASE_URL: Unsplash API base URL (default: https://api.unsplash.com)
 * - UNSPLASH_RATE_LIMIT: Unsplash rate limit per hour (default: 50)
 * - UNSPLASH_ENABLED: Enable Unsplash API (default: true)
 * - PEXELS_API_KEY: Pexels API key
 * - PEXELS_BASE_URL: Pexels API base URL (default: https://api.pexels.com/v1)
 * - PEXELS_RATE_LIMIT: Pexels rate limit per hour (default: 200)
 * - PEXELS_ENABLED: Enable Pexels API (default: true)
 * 
 * Cache Configuration:
 * - IMAGE_CACHE_MAX_SIZE: Maximum number of cached images (default: 100)
 * - IMAGE_CACHE_TTL: Cache TTL in milliseconds (default: 86400000 = 24 hours)
 * - IMAGE_CACHE_EVICTION_POLICY: Cache eviction policy - 'lru' or 'fifo' (default: lru)
 * - IMAGE_CACHE_ENABLED: Enable image caching (default: true)
 * 
 * Feature Flags:
 * - ENABLE_UNSPLASH: Enable Unsplash integration (default: true)
 * - ENABLE_PEXELS: Enable Pexels integration (default: true)
 * - ENABLE_IMAGE_CACHING: Enable image caching (default: true)
 * - ENABLE_LAZY_LOADING: Enable lazy loading (default: true)
 * - ENABLE_ATTRIBUTION: Enable attribution display (default: true)
 * - ENABLE_HERO_SECTION: Enable hero section images (default: true)
 * - ENABLE_CATEGORY_IMAGES: Enable category images (default: true)
 * - ENABLE_SECTION_BACKGROUNDS: Enable section background images (default: true)
 * - ENABLE_IMAGE_OPTIMIZATION: Enable image optimization (default: true)
 * - ENABLE_PROGRESSIVE_LOADING: Enable progressive loading (default: true)
 * 
 * Section Configuration:
 * - ENABLE_HERO_IMAGES: Enable hero section images (default: true)
 * - HERO_IMAGE_SOURCE: Image source for hero section - 'unsplash', 'pexels', 'both', 'fallback' (default: both)
 * - HERO_SEARCH_TERMS: Comma-separated search terms for hero images
 * - HERO_FALLBACK_IMAGE: Fallback image path for hero section
 * - ENABLE_CATEGORIES_IMAGES: Enable category images (default: true)
 * - CATEGORIES_IMAGE_SOURCE: Image source for categories - 'unsplash', 'pexels', 'both', 'fallback' (default: both)
 * - CATEGORIES_FALLBACK_IMAGE: Fallback image path for categories
 * - ENABLE_FEATURES_IMAGES: Enable feature section images (default: true)
 * - FEATURES_IMAGE_SOURCE: Image source for features - 'unsplash', 'pexels', 'both', 'fallback' (default: both)
 * - FEATURES_SEARCH_TERMS: Comma-separated search terms for feature images
 * - FEATURES_FALLBACK_IMAGE: Fallback image path for features
 * - ENABLE_TESTIMONIALS_IMAGES: Enable testimonial section images (default: true)
 * - TESTIMONIALS_IMAGE_SOURCE: Image source for testimonials - 'unsplash', 'pexels', 'both', 'fallback' (default: both)
 * - TESTIMONIALS_SEARCH_TERMS: Comma-separated search terms for testimonial images
 * - TESTIMONIALS_FALLBACK_IMAGE: Fallback image path for testimonials
 * 
 * Performance Settings:
 * - MAX_CONCURRENT_IMAGE_REQUESTS: Maximum concurrent API requests (default: 5)
 * - IMAGE_REQUEST_TIMEOUT: Request timeout in milliseconds (default: 10000)
 * - IMAGE_RETRY_ATTEMPTS: Number of retry attempts (default: 3)
 * - IMAGE_RETRY_DELAY: Base retry delay in milliseconds (default: 1000)
 * 
 * Admin Configuration:
 * - ENABLE_IMAGE_CONFIG_UI: Enable configuration UI (default: false)
 * - ENABLE_IMAGE_METRICS: Enable metrics collection (default: true)
 * - ENABLE_IMAGE_LOGGING: Enable logging (default: true)
 * - IMAGE_LOG_LEVEL: Log level - 'debug', 'info', 'warn', 'error' (default: info)
 */