// Image Integration System - Main exports
export * from './types';
export * from './config';

// Service implementations (avoid conflicts with interface names)
export { ImageService as ImageServiceImpl } from './services/image-service';
export { CategoryMatcher as CategoryMatcherImpl } from './services/category-matcher';
export { ImageCache as ImageCacheImpl } from './services/image-cache';
export { AttributionManager as AttributionManagerImpl } from './services/attribution-manager';
export * from './services/monitoring-service';

// API adapters
export { ImageAPIAdapter as ImageAPIAdapterImpl } from './adapters/image-api-adapter';
export { UnsplashAdapter } from './adapters/unsplash-adapter';
export { PexelsAdapter } from './adapters/pexels-adapter';

// Utilities
export * from './utils/error-handler';
export * from './utils/logger';

// Components
export * from './components/hero-image';
export * from './components/category-image';
export * from './components/section-background';
export * from './components/admin-dashboard';

// Test utilities
export * from './test-utils/test-utils';