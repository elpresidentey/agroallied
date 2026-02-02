/**
 * Core TypeScript interfaces and types for the Image Integration System
 * Defines all data models, interfaces, and type definitions used throughout the system
 */

// ============================================================================
// Core Image Data Models
// ============================================================================

export interface ImageResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  altText: string;
  attribution: Attribution;
  source: 'unsplash' | 'pexels' | 'cache' | 'fallback';
  metadata: ImageMetadata;
}

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  dominantColors: string[];
  tags: string[];
  downloadUrl: string;
  apiId: string;
  fetchedAt: Date;
}

export interface Attribution {
  photographer: string;
  photographerUrl: string;
  source: string;
  sourceUrl: string;
  required: boolean;
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface ImageService {
  getHeroImage(theme?: string): Promise<ImageResult>;
  getCategoryImages(category: string, count: number): Promise<ImageResult[]>;
  getSectionImage(section: string): Promise<ImageResult>;
  preloadImages(queries: string[]): Promise<void>;
  clearCache(): Promise<void>;
}

export interface CategoryMatcher {
  getSearchTerms(category: string): string[];
  getHeroThemes(): string[];
  getFallbackTerms(): string[];
  validateImageRelevance(image: ImageResult, category: string): boolean;
}

export interface ImageCache {
  get(key: string): Promise<CachedImage | null>;
  set(key: string, image: CachedImage, ttl: number): Promise<void>;
  has(key: string): Promise<boolean>;
  evict(key: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): Promise<CacheStats>;
}

export interface AttributionManager {
  formatAttribution(image: ImageResult): string;
  getAttributionLink(image: ImageResult): string;
  trackUsage(image: ImageResult): Promise<void>;
  generateAttributionReport(): Promise<AttributionReport>;
}

// ============================================================================
// API Adapter Interfaces
// ============================================================================

export interface ImageAPIAdapter {
  search(query: string, options: SearchOptions): Promise<APIImageResult[]>;
  getImage(id: string): Promise<APIImageResult>;
  getRateLimit(): Promise<RateLimitInfo>;
}

export interface SearchOptions {
  count: number;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'small' | 'medium' | 'large';
  category?: string;
}

export interface APIImageResult {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  photographer: {
    name: string;
    url: string;
  };
  description?: string;
  tags: string[];
}

export interface RateLimitInfo {
  remaining: number;
  total: number;
  resetTime: Date;
}

// ============================================================================
// Cache Data Models
// ============================================================================

export interface CachedImage {
  imageResult: ImageResult;
  cachedAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  oldestEntry?: Date;
  newestEntry?: Date;
  topKeys?: Array<{ key: string; accessCount: number; lastAccessed: Date }>;
  totalSize?: number;
  utilizationPercent?: number;
}

// ============================================================================
// Category and Configuration Models
// ============================================================================

export interface CategoryMapping {
  category: string;
  primaryTerms: string[];
  fallbackTerms: string[];
  excludeTerms: string[];
}

export interface AttributionReport {
  totalImages: number;
  totalUsage: number;
  missingAttributions: number;
  imagesBySource: Record<string, number>;
  photographerCredits: Array<{
    photographer: string;
    imageCount: number;
    source: string;
  }>;
  complianceIssues?: string[];
  generatedAt: Date;
}

// ============================================================================
// Error Handling Models
// ============================================================================

export enum ImageErrorType {
  API_AUTHENTICATION = 'API_AUTHENTICATION',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface ImageError {
  code: ImageErrorType;
  message: string;
  source?: 'unsplash' | 'pexels' | 'cache';
  retryable: boolean;
  fallbackStrategy: 'cache' | 'alternative_api' | 'placeholder';
  originalError?: Error;
}

// ============================================================================
// React Component Props
// ============================================================================

export interface HeroImageProps {
  theme?: string;
  fallbackImage?: string;
  onImageLoad?: (image: ImageResult) => void;
  onImageError?: (error: ImageError) => void;
  className?: string;
}

export interface CategoryImageProps {
  category: string;
  size: 'small' | 'medium' | 'large';
  lazy?: boolean;
  fallbackImage?: string;
  showAttribution?: boolean;
  className?: string;
}

export interface SectionBackgroundProps {
  section: string;
  overlay?: boolean;
  overlayOpacity?: number;
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type ImageSource = 'unsplash' | 'pexels' | 'cache' | 'fallback';

export type ImageOrientation = 'landscape' | 'portrait' | 'square';

export type ImageSize = 'small' | 'medium' | 'large';

export type CacheEvictionPolicy = 'lru' | 'fifo';

export type FallbackStrategy = 'cache' | 'alternative_api' | 'placeholder';

// ============================================================================
// Event and Callback Types
// ============================================================================

export type ImageLoadCallback = (image: ImageResult) => void;

export type ImageErrorCallback = (error: ImageError) => void;

export type CacheEvictionCallback = (key: string, image: CachedImage) => void;

// ============================================================================
// API Response Types (for external API integration)
// ============================================================================

export interface UnsplashImageResponse {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  description?: string;
  alt_description?: string;
  tags: Array<{ title: string }>;
  width: number;
  height: number;
  color: string;
  links: {
    download: string;
  };
}

export interface PexelsImageResponse {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashImageResponse[];
}

export interface PexelsSearchResponse {
  page: number;
  per_page: number;
  photos: PexelsImageResponse[];
  total_results: number;
  next_page?: string;
}