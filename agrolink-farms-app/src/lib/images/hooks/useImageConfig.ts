/**
 * React Hook for Image Configuration Management
 * Provides reactive access to image configuration and feature flags
 * Validates: Requirements 8.2, 8.5
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ImageConfig, 
  ConfigChangeEvent, 
  ConfigChangeListener,
  ImageConfigManager,
  addImageConfigChangeListener,
  removeImageConfigChangeListener,
  getImageConfig,
  isImageFeatureEnabled,
  isImageSectionEnabled,
  getImageSectionConfig,
  toggleImageFeature,
  toggleImageSection
} from '../config';

// ============================================================================
// Hook Types
// ============================================================================

export interface UseImageConfigReturn {
  config: ImageConfig;
  isFeatureEnabled: (feature: keyof ImageConfig['features']) => boolean;
  isSectionEnabled: (sectionName: string) => boolean;
  getSectionConfig: (sectionName: string) => ImageConfig['sections'][string] | null;
  toggleFeature: (feature: keyof ImageConfig['features'], enabled?: boolean) => void;
  toggleSection: (sectionName: string, enabled?: boolean) => void;
  updateConfig: (updates: Partial<ImageConfig>) => void;
  reloadConfig: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  changeHistory: ConfigChangeEvent[];
}

export interface UseFeatureFlagReturn {
  enabled: boolean;
  toggle: (enabled?: boolean) => void;
  isLoading: boolean;
}

export interface UseSectionConfigReturn {
  config: ImageConfig['sections'][string] | null;
  enabled: boolean;
  toggle: (enabled?: boolean) => void;
  updateConfig: (updates: Partial<ImageConfig['sections'][string]>) => void;
  isLoading: boolean;
}

// ============================================================================
// Main Configuration Hook
// ============================================================================

/**
 * Hook for accessing and managing image configuration
 */
export function useImageConfig(): UseImageConfigReturn {
  const [config, setConfig] = useState<ImageConfig>(() => getImageConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [changeHistory, setChangeHistory] = useState<ConfigChangeEvent[]>([]);
  const configManagerRef = useRef<ImageConfigManager | null>(null);

  // Initialize config manager
  useEffect(() => {
    configManagerRef.current = ImageConfigManager.getInstance();
    setChangeHistory(configManagerRef.current.getConfigHistory());
  }, []);

  // Set up configuration change listener
  useEffect(() => {
    const listener: ConfigChangeListener = (event) => {
      setConfig(getImageConfig());
      setLastUpdated(event.timestamp);
      setChangeHistory(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 changes
    };

    addImageConfigChangeListener(listener);

    return () => {
      removeImageConfigChangeListener(listener);
    };
  }, []);

  // Feature flag checker
  const isFeatureEnabledCallback = useCallback((feature: keyof ImageConfig['features']) => {
    return isImageFeatureEnabled(feature);
  }, [config.features]);

  // Section enabled checker
  const isSectionEnabledCallback = useCallback((sectionName: string) => {
    return isImageSectionEnabled(sectionName);
  }, [config.sections]);

  // Get section config
  const getSectionConfigCallback = useCallback((sectionName: string) => {
    return getImageSectionConfig(sectionName);
  }, [config.sections]);

  // Toggle feature
  const toggleFeatureCallback = useCallback((feature: keyof ImageConfig['features'], enabled?: boolean) => {
    setIsLoading(true);
    try {
      toggleImageFeature(feature, enabled);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle section
  const toggleSectionCallback = useCallback((sectionName: string, enabled?: boolean) => {
    setIsLoading(true);
    try {
      toggleImageSection(sectionName, enabled);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update config
  const updateConfigCallback = useCallback((updates: Partial<ImageConfig>) => {
    setIsLoading(true);
    try {
      configManagerRef.current?.updateConfig(updates, 'runtime');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload config
  const reloadConfigCallback = useCallback(() => {
    setIsLoading(true);
    try {
      configManagerRef.current?.reloadConfiguration();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    config,
    isFeatureEnabled: isFeatureEnabledCallback,
    isSectionEnabled: isSectionEnabledCallback,
    getSectionConfig: getSectionConfigCallback,
    toggleFeature: toggleFeatureCallback,
    toggleSection: toggleSectionCallback,
    updateConfig: updateConfigCallback,
    reloadConfig: reloadConfigCallback,
    isLoading,
    lastUpdated,
    changeHistory
  };
}

// ============================================================================
// Feature Flag Hook
// ============================================================================

/**
 * Hook for managing a specific feature flag
 */
export function useFeatureFlag(feature: keyof ImageConfig['features']): UseFeatureFlagReturn {
  const [enabled, setEnabled] = useState(() => isImageFeatureEnabled(feature));
  const [isLoading, setIsLoading] = useState(false);

  // Listen for configuration changes
  useEffect(() => {
    const listener: ConfigChangeListener = (event) => {
      if (event.changes.features && feature in event.changes.features) {
        setEnabled(isImageFeatureEnabled(feature));
      }
    };

    addImageConfigChangeListener(listener);

    return () => {
      removeImageConfigChangeListener(listener);
    };
  }, [feature]);

  // Toggle function
  const toggle = useCallback((enabled?: boolean) => {
    setIsLoading(true);
    try {
      toggleImageFeature(feature, enabled);
    } finally {
      setIsLoading(false);
    }
  }, [feature]);

  return {
    enabled,
    toggle,
    isLoading
  };
}

// ============================================================================
// Section Configuration Hook
// ============================================================================

/**
 * Hook for managing a specific section configuration
 */
export function useSectionConfig(sectionName: string): UseSectionConfigReturn {
  const [config, setConfig] = useState(() => getImageSectionConfig(sectionName));
  const [isLoading, setIsLoading] = useState(false);
  const configManagerRef = useRef<ImageConfigManager | null>(null);

  // Initialize config manager
  useEffect(() => {
    configManagerRef.current = ImageConfigManager.getInstance();
  }, []);

  // Listen for configuration changes
  useEffect(() => {
    const listener: ConfigChangeListener = (event) => {
      if (event.changes.sections && sectionName in event.changes.sections) {
        setConfig(getImageSectionConfig(sectionName));
      }
    };

    addImageConfigChangeListener(listener);

    return () => {
      removeImageConfigChangeListener(listener);
    };
  }, [sectionName]);

  // Toggle section enabled
  const toggle = useCallback((enabled?: boolean) => {
    setIsLoading(true);
    try {
      toggleImageSection(sectionName, enabled);
    } finally {
      setIsLoading(false);
    }
  }, [sectionName]);

  // Update section config
  const updateConfig = useCallback((updates: Partial<ImageConfig['sections'][string]>) => {
    setIsLoading(true);
    try {
      configManagerRef.current?.updateSectionConfig(sectionName, updates);
    } finally {
      setIsLoading(false);
    }
  }, [sectionName]);

  return {
    config,
    enabled: config?.enabled ?? false,
    toggle,
    updateConfig,
    isLoading
  };
}

// ============================================================================
// Batch Operations Hook
// ============================================================================

/**
 * Hook for batch configuration operations
 */
export function useBatchConfigOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const configManagerRef = useRef<ImageConfigManager | null>(null);

  // Initialize config manager
  useEffect(() => {
    configManagerRef.current = ImageConfigManager.getInstance();
  }, []);

  const batchToggleFeatures = useCallback(async (
    features: Array<{ name: keyof ImageConfig['features']; enabled: boolean }>
  ) => {
    setIsLoading(true);
    try {
      // Apply all changes in a single update to minimize re-renders
      const updates: Partial<ImageConfig> = {
        features: features.reduce((acc, { name, enabled }) => {
          acc[name] = enabled;
          return acc;
        }, {} as ImageConfig['features'])
      };
      
      configManagerRef.current?.updateConfig(updates, 'runtime');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const batchUpdateSections = useCallback(async (
    sections: Array<{ name: string; config: Partial<ImageConfig['sections'][string]> }>
  ) => {
    setIsLoading(true);
    try {
      const updates: Partial<ImageConfig> = {
        sections: sections.reduce((acc, { name, config }) => {
          acc[name] = { ...getImageSectionConfig(name), ...config };
          return acc;
        }, {} as ImageConfig['sections'])
      };
      
      configManagerRef.current?.updateConfig(updates, 'runtime');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hotReloadConfig = useCallback(async (configSource: () => Promise<Partial<ImageConfig>>) => {
    setIsLoading(true);
    try {
      await configManagerRef.current?.hotReloadConfiguration(configSource);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyPreset = useCallback(async (presetName: string) => {
    setIsLoading(true);
    try {
      const configManager = await import('../utils/config-manager');
      configManager.applyImageConfigurationPreset(presetName);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateDependencies = useCallback(() => {
    return configManagerRef.current?.validateFeatureDependencies() || { valid: true, issues: [] };
  }, []);

  return {
    batchToggleFeatures,
    batchUpdateSections,
    hotReloadConfig,
    applyPreset,
    validateDependencies,
    isLoading
  };
}

// ============================================================================
// Configuration Validation Hook
// ============================================================================

/**
 * Hook for configuration validation
 */
export function useConfigValidation() {
  const { config } = useImageConfig();
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>({ valid: true, errors: [], warnings: [] });

  useEffect(() => {
    // Simple validation - in a real implementation, you'd use the ConfigurationManager
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check API keys
    if (config.features.enableUnsplash && !config.apis.unsplash.accessKey) {
      warnings.push('Unsplash is enabled but no access key is configured');
    }

    if (config.features.enablePexels && !config.apis.pexels.apiKey) {
      warnings.push('Pexels is enabled but no API key is configured');
    }

    // Check if any image sources are available
    if (!config.features.enableUnsplash && !config.features.enablePexels) {
      warnings.push('Both Unsplash and Pexels are disabled - only fallback images will be used');
    }

    setValidationResult({
      valid: errors.length === 0,
      errors,
      warnings
    });
  }, [config]);

  return validationResult;
}

// ============================================================================
// Configuration Presets Hook
// ============================================================================

/**
 * Hook for managing configuration presets
 */
export function useConfigurationPresets() {
  const [availablePresets, setAvailablePresets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const configManager = await import('../utils/config-manager');
        setAvailablePresets(configManager.getAvailableImageConfigPresets());
      } catch (error) {
        console.error('Failed to load configuration presets:', error);
      }
    };

    loadPresets();
  }, []);

  const applyPreset = useCallback(async (presetName: string) => {
    setIsLoading(true);
    try {
      const configManager = await import('../utils/config-manager');
      configManager.applyImageConfigurationPreset(presetName);
    } catch (error) {
      console.error('Failed to apply preset:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPresetConfig = useCallback(async (presetName: string) => {
    try {
      const configManager = await import('../utils/config-manager');
      return configManager.createImageConfigurationPreset(presetName);
    } catch (error) {
      console.error('Failed to get preset config:', error);
      throw error;
    }
  }, []);

  return {
    availablePresets,
    applyPreset,
    getPresetConfig,
    isLoading
  };
}

// ============================================================================
// Configuration Health Hook
// ============================================================================

/**
 * Hook for monitoring configuration health
 */
export function useConfigurationHealth() {
  const [health, setHealth] = useState<{
    status: 'healthy' | 'warning' | 'error';
    score: number;
    issues: Array<{ type: 'error' | 'warning'; message: string; severity: 'low' | 'medium' | 'high' }>;
  }>({ status: 'healthy', score: 100, issues: [] });

  const { config } = useImageConfig();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const configManager = await import('../utils/config-manager');
        const healthStatus = configManager.getConfigurationHealth();
        setHealth(healthStatus);
      } catch (error) {
        console.error('Failed to check configuration health:', error);
        setHealth({
          status: 'error',
          score: 0,
          issues: [{ type: 'error', message: 'Failed to check configuration health', severity: 'high' }]
        });
      }
    };

    checkHealth();
  }, [config]);

  return health;
}