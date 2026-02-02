/**
 * Administrative Component for Dynamic Image Configuration Management
 * Provides UI for managing feature flags, sections, and configuration presets
 * Validates: Requirements 8.2, 8.5
 */

'use client';

import React, { useState } from 'react';
import { 
  useImageConfig, 
  useFeatureFlag, 
  useSectionConfig, 
  useBatchConfigOperations,
  useConfigurationPresets,
  useConfigurationHealth
} from '../hooks/useImageConfig';
import { ImageConfig } from '../config';

// ============================================================================
// Feature Flag Toggle Component
// ============================================================================

interface FeatureFlagToggleProps {
  feature: keyof ImageConfig['features'];
  label: string;
  description: string;
}

function FeatureFlagToggle({ feature, label, description }: FeatureFlagToggleProps) {
  const { enabled, toggle, isLoading } = useFeatureFlag(feature);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{label}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => toggle()}
        disabled={isLoading}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}

// ============================================================================
// Section Configuration Component
// ============================================================================

interface SectionConfigProps {
  sectionName: string;
  label: string;
}

function SectionConfig({ sectionName, label }: SectionConfigProps) {
  const { config, enabled, toggle, updateConfig, isLoading } = useSectionConfig(sectionName);

  const handleImageSourceChange = (imageSource: 'unsplash' | 'pexels' | 'both' | 'fallback') => {
    updateConfig({ imageSource });
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{label}</h3>
        <button
          onClick={() => toggle()}
          disabled={isLoading}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${enabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
      
      {enabled && config && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Image Source
          </label>
          <select
            value={config.imageSource}
            onChange={(e) => handleImageSourceChange(e.target.value as any)}
            disabled={isLoading}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="both">Both APIs</option>
            <option value="unsplash">Unsplash Only</option>
            <option value="pexels">Pexels Only</option>
            <option value="fallback">Fallback Only</option>
          </select>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Configuration Health Component
// ============================================================================

function ConfigurationHealth() {
  const health = useConfigurationHealth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Configuration Health</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(health.status)}`}>
          {health.status.toUpperCase()}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm">
          <span>Health Score</span>
          <span>{health.score}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div 
            className={`h-2 rounded-full ${
              health.score >= 80 ? 'bg-green-500' : 
              health.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${health.score}%` }}
          />
        </div>
      </div>

      {health.issues.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700">Issues:</h4>
          {health.issues.map((issue, index) => (
            <div key={index} className={`text-xs p-2 rounded ${
              issue.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
            }`}>
              {issue.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Configuration Presets Component
// ============================================================================

function ConfigurationPresets() {
  const { availablePresets, applyPreset, isLoading } = useConfigurationPresets();
  const [selectedPreset, setSelectedPreset] = useState('');

  const handleApplyPreset = async () => {
    if (selectedPreset) {
      try {
        await applyPreset(selectedPreset);
        alert(`Applied preset: ${selectedPreset}`);
      } catch (error) {
        alert(`Failed to apply preset: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-medium text-gray-900 mb-3">Configuration Presets</h3>
      
      <div className="space-y-3">
        <select
          value={selectedPreset}
          onChange={(e) => setSelectedPreset(e.target.value)}
          disabled={isLoading}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Select a preset...</option>
          {availablePresets.map(preset => (
            <option key={preset} value={preset}>
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </option>
          ))}
        </select>
        
        <button
          onClick={handleApplyPreset}
          disabled={!selectedPreset || isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Applying...' : 'Apply Preset'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Configuration Admin Component
// ============================================================================

export function ImageConfigurationAdmin() {
  const { config, reloadConfig, isLoading } = useImageConfig();
  const { batchToggleFeatures } = useBatchConfigOperations();

  const handleReloadConfig = () => {
    reloadConfig();
  };

  const handleEnableAll = () => {
    const allFeatures: Array<{ name: keyof ImageConfig['features']; enabled: boolean }> = [
      { name: 'enableUnsplash', enabled: true },
      { name: 'enablePexels', enabled: true },
      { name: 'enableCaching', enabled: true },
      { name: 'enableLazyLoading', enabled: true },
      { name: 'enableAttribution', enabled: true },
      { name: 'enableHeroSection', enabled: true },
      { name: 'enableCategoryImages', enabled: true },
      { name: 'enableSectionBackgrounds', enabled: true },
      { name: 'enableImageOptimization', enabled: true },
      { name: 'enableProgressiveLoading', enabled: true }
    ];
    batchToggleFeatures(allFeatures);
  };

  const handleDisableAll = () => {
    const allFeatures: Array<{ name: keyof ImageConfig['features']; enabled: boolean }> = [
      { name: 'enableUnsplash', enabled: false },
      { name: 'enablePexels', enabled: false },
      { name: 'enableCaching', enabled: false },
      { name: 'enableLazyLoading', enabled: false },
      { name: 'enableAttribution', enabled: false },
      { name: 'enableHeroSection', enabled: false },
      { name: 'enableCategoryImages', enabled: false },
      { name: 'enableSectionBackgrounds', enabled: false },
      { name: 'enableImageOptimization', enabled: false },
      { name: 'enableProgressiveLoading', enabled: false }
    ];
    batchToggleFeatures(allFeatures);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Image Configuration Admin</h1>
        <div className="space-x-2">
          <button
            onClick={handleReloadConfig}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            Reload Config
          </button>
          <button
            onClick={handleEnableAll}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Enable All
          </button>
          <button
            onClick={handleDisableAll}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Disable All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Feature Flags</h2>
          
          <FeatureFlagToggle
            feature="enableUnsplash"
            label="Unsplash API"
            description="Enable Unsplash image integration"
          />
          
          <FeatureFlagToggle
            feature="enablePexels"
            label="Pexels API"
            description="Enable Pexels image integration"
          />
          
          <FeatureFlagToggle
            feature="enableCaching"
            label="Image Caching"
            description="Enable local image caching"
          />
          
          <FeatureFlagToggle
            feature="enableLazyLoading"
            label="Lazy Loading"
            description="Enable lazy loading for images"
          />
          
          <FeatureFlagToggle
            feature="enableAttribution"
            label="Attribution"
            description="Show photographer attribution"
          />
          
          <FeatureFlagToggle
            feature="enableHeroSection"
            label="Hero Section Images"
            description="Enable dynamic hero section images"
          />
          
          <FeatureFlagToggle
            feature="enableCategoryImages"
            label="Category Images"
            description="Enable category-specific images"
          />
          
          <FeatureFlagToggle
            feature="enableSectionBackgrounds"
            label="Section Backgrounds"
            description="Enable section background images"
          />
          
          <FeatureFlagToggle
            feature="enableImageOptimization"
            label="Image Optimization"
            description="Enable automatic image optimization"
          />
          
          <FeatureFlagToggle
            feature="enableProgressiveLoading"
            label="Progressive Loading"
            description="Enable progressive image loading"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Section Configuration</h2>
          
          <SectionConfig sectionName="hero" label="Hero Section" />
          <SectionConfig sectionName="categories" label="Categories Section" />
          <SectionConfig sectionName="features" label="Features Section" />
          <SectionConfig sectionName="testimonials" label="Testimonials Section" />
          
          <ConfigurationHealth />
          <ConfigurationPresets />
        </div>
      </div>
    </div>
  );
}

export default ImageConfigurationAdmin;