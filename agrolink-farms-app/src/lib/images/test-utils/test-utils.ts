/**
 * Test utilities for image integration system
 */

import { ImageResult, APIImageResult, CachedImage } from '../types';

export const createMockImageResult = (overrides: Partial<ImageResult> = {}): ImageResult => ({
  id: 'test-image-1',
  url: 'https://example.com/image.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  altText: 'Test agricultural image',
  attribution: {
    photographer: 'Test Photographer',
    photographerUrl: 'https://example.com/photographer',
    source: 'test',
    sourceUrl: 'https://example.com/source',
    required: true
  },
  source: 'unsplash',
  metadata: {
    width: 1920,
    height: 1080,
    aspectRatio: 16/9,
    dominantColors: ['#4a5d23', '#8fbc8f'],
    tags: ['agriculture', 'farming', 'crops'],
    downloadUrl: 'https://example.com/download',
    apiId: 'api-123',
    fetchedAt: new Date()
  },
  ...overrides
});

export const createMockAPIImageResult = (overrides: Partial<APIImageResult> = {}): APIImageResult => ({
  id: 'api-image-1',
  urls: {
    raw: 'https://example.com/raw.jpg',
    full: 'https://example.com/full.jpg',
    regular: 'https://example.com/regular.jpg',
    small: 'https://example.com/small.jpg',
    thumb: 'https://example.com/thumb.jpg'
  },
  photographer: {
    name: 'Test Photographer',
    url: 'https://example.com/photographer'
  },
  description: 'Test agricultural scene',
  tags: ['agriculture', 'farming'],
  ...overrides
});

export const createMockCachedImage = (overrides: Partial<CachedImage> = {}): CachedImage => ({
  imageResult: createMockImageResult(),
  cachedAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  accessCount: 1,
  lastAccessed: new Date(),
  ...overrides
});