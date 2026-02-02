/**
 * ImageCache - Local storage and retrieval of fetched images
 * Implements LRU (Least Recently Used) eviction policy with TTL support
 */

import { ImageCache as IImageCache, CachedImage, CacheStats, CacheEvictionCallback } from '../types';
import { ImageLogger, createLogContext } from '../utils/logger';

interface CacheNode {
  key: string;
  value: CachedImage;
  prev: CacheNode | null;
  next: CacheNode | null;
}

export class ImageCache implements IImageCache {
  private cache: Map<string, CacheNode> = new Map();
  private head: CacheNode | null = null;
  private tail: CacheNode | null = null;
  private maxSize: number;
  private defaultTTL: number;
  private evictionCallback?: CacheEvictionCallback;
  private logger: ImageLogger;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    sets: 0,
    gets: 0
  };

  constructor(
    maxSize: number = 100,
    defaultTTL: number = 3600000, // 1 hour in milliseconds
    evictionCallback?: CacheEvictionCallback
  ) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.evictionCallback = evictionCallback;
    this.logger = ImageLogger.getInstance();
  }

  async get(key: string): Promise<CachedImage | null> {
    this.stats.gets++;
    const context = createLogContext('get', 'ImageCache', { imageId: key });
    
    const node = this.cache.get(key);
    if (!node) {
      this.stats.misses++;
      this.logger.trackCacheOperation({
        operation: 'get',
        key,
        hit: false
      });
      this.logger.debug('Cache miss', context, { key });
      return null;
    }

    // Check if expired
    if (this.isExpired(node.value)) {
      await this.evict(key);
      this.stats.misses++;
      this.logger.trackCacheOperation({
        operation: 'get',
        key,
        hit: false,
        evictionReason: 'expired'
      });
      this.logger.debug('Cache miss - expired', context, { key });
      return null;
    }

    // Update access time and move to front (most recently used)
    node.value.lastAccessed = new Date();
    node.value.accessCount++;
    this.moveToFront(node);
    
    this.stats.hits++;
    this.logger.trackCacheOperation({
      operation: 'get',
      key,
      hit: true,
      size: this.cache.size
    });
    this.logger.debug('Cache hit', context, { key, accessCount: node.value.accessCount });
    
    return { ...node.value }; // Return a copy to prevent external mutations
  }

  async set(key: string, image: CachedImage, ttl?: number): Promise<void> {
    this.stats.sets++;
    const context = createLogContext('set', 'ImageCache', { imageId: key });
    
    const effectiveTTL = ttl || this.defaultTTL;
    
    // Use the provided expiresAt if it exists, otherwise calculate new one
    const cachedImage: CachedImage = {
      ...image,
      expiresAt: image.expiresAt || new Date(Date.now() + effectiveTTL),
      lastAccessed: new Date(),
      accessCount: 1
    };

    // If key already exists, update it
    const existingNode = this.cache.get(key);
    if (existingNode) {
      existingNode.value = cachedImage;
      this.moveToFront(existingNode);
      this.logger.trackCacheOperation({
        operation: 'set',
        key,
        hit: true,
        size: this.cache.size
      });
      this.logger.debug('Cache updated', context, { key, ttl: effectiveTTL });
      return;
    }

    // Create new node
    const newNode: CacheNode = {
      key,
      value: cachedImage,
      prev: null,
      next: null
    };

    // Add to cache
    this.cache.set(key, newNode);
    this.addToFront(newNode);

    this.logger.trackCacheOperation({
      operation: 'set',
      key,
      hit: false,
      size: this.cache.size
    });
    this.logger.debug('Cache entry added', context, { key, ttl: effectiveTTL, cacheSize: this.cache.size });

    // Check if we need to evict
    if (this.cache.size > this.maxSize) {
      await this.evictLRU();
    }
  }

  async has(key: string): Promise<boolean> {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    // Check if expired
    if (this.isExpired(node.value)) {
      await this.evict(key);
      return false;
    }

    return true;
  }

  async evict(key: string): Promise<void> {
    const context = createLogContext('evict', 'ImageCache', { imageId: key });
    const node = this.cache.get(key);
    if (!node) {
      this.logger.debug('Attempted to evict non-existent key', context, { key });
      return;
    }

    // Call eviction callback if provided
    if (this.evictionCallback) {
      this.evictionCallback(key, node.value);
    }

    // Remove from cache and linked list
    this.cache.delete(key);
    this.removeNode(node);
    this.stats.evictions++;

    this.logger.trackCacheOperation({
      operation: 'evict',
      key,
      hit: false,
      size: this.cache.size,
      evictionReason: 'manual'
    });
    this.logger.debug('Cache entry evicted', context, { key, remainingSize: this.cache.size });
  }

  async clear(): Promise<void> {
    const context = createLogContext('clear', 'ImageCache');
    const initialSize = this.cache.size;

    // Call eviction callback for all items if provided
    if (this.evictionCallback) {
      for (const [key, node] of this.cache) {
        this.evictionCallback(key, node.value);
      }
    }

    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.stats.evictions += initialSize;

    this.logger.trackCacheOperation({
      operation: 'clear',
      key: 'all',
      hit: false,
      size: 0,
      evictionReason: 'clear'
    });
    this.logger.info('Cache cleared', context, { clearedItems: initialSize });
  }

  async getStats(): Promise<CacheStats> {
    const context = createLogContext('getStats', 'ImageCache');
    const now = new Date();
    let oldestEntry: Date | undefined;
    let newestEntry: Date | undefined;
    let totalSize = 0;
    const topKeys: Array<{ key: string; accessCount: number; lastAccessed: Date }> = [];

    // Calculate stats from current cache contents
    for (const [key, node] of this.cache) {
      const cachedAt = node.value.cachedAt;
      totalSize += this.estimateImageSize(node.value);
      
      if (!oldestEntry || cachedAt < oldestEntry) {
        oldestEntry = cachedAt;
      }
      if (!newestEntry || cachedAt > newestEntry) {
        newestEntry = cachedAt;
      }

      topKeys.push({
        key,
        accessCount: node.value.accessCount,
        lastAccessed: node.value.lastAccessed
      });
    }

    // Sort by access count and take top 10
    topKeys.sort((a, b) => b.accessCount - a.accessCount);
    const topKeysLimited = topKeys.slice(0, 10);

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;

    const stats: CacheStats = {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      missRate,
      evictionCount: this.stats.evictions,
      oldestEntry,
      newestEntry,
      topKeys: topKeysLimited,
      totalSize,
      utilizationPercent: (this.cache.size / this.maxSize) * 100
    };

    this.logger.debug('Cache stats retrieved', context, {
      size: stats.size,
      hitRate: stats.hitRate,
      utilizationPercent: stats.utilizationPercent
    });

    return stats;
  }

  /**
   * Get all cached keys (for debugging/inspection)
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache capacity and current size
   */
  getCapacityInfo(): { current: number; max: number; utilizationPercent: number } {
    const current = this.cache.size;
    const utilizationPercent = (current / this.maxSize) * 100;
    return {
      current,
      max: this.maxSize,
      utilizationPercent
    };
  }

  /**
   * Manually trigger cleanup of expired items
   */
  async cleanupExpired(): Promise<number> {
    const context = createLogContext('cleanupExpired', 'ImageCache');
    const expiredKeys: string[] = [];
    
    for (const [key, node] of this.cache) {
      if (this.isExpired(node.value)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.evict(key);
    }

    this.logger.info('Expired items cleaned up', context, { 
      expiredCount: expiredKeys.length,
      remainingSize: this.cache.size 
    });

    return expiredKeys.length;
  }

  /**
   * Update cache configuration
   */
  updateConfig(maxSize?: number, defaultTTL?: number): void {
    const context = createLogContext('updateConfig', 'ImageCache');
    const oldMaxSize = this.maxSize;
    const oldTTL = this.defaultTTL;

    if (maxSize !== undefined) {
      this.maxSize = maxSize;
      // If new size is smaller, evict excess items
      while (this.cache.size > this.maxSize) {
        this.evictLRU();
      }
    }
    
    if (defaultTTL !== undefined) {
      this.defaultTTL = defaultTTL;
    }

    this.logger.info('Cache configuration updated', context, {
      oldMaxSize,
      newMaxSize: this.maxSize,
      oldTTL,
      newTTL: this.defaultTTL,
      currentSize: this.cache.size
    });
  }

  // Private helper methods

  private isExpired(cachedImage: CachedImage): boolean {
    return new Date() > cachedImage.expiresAt;
  }

  private async evictLRU(): Promise<void> {
    if (!this.tail) {
      return;
    }

    const lruKey = this.tail.key;
    const context = createLogContext('evictLRU', 'ImageCache', { imageId: lruKey });
    
    this.logger.trackCacheOperation({
      operation: 'evict',
      key: lruKey,
      hit: false,
      size: this.cache.size - 1,
      evictionReason: 'lru'
    });
    
    this.logger.debug('LRU eviction triggered', context, { 
      evictedKey: lruKey,
      cacheSize: this.cache.size 
    });
    
    await this.evict(lruKey);
  }

  private addToFront(node: CacheNode): void {
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
  }

  private moveToFront(node: CacheNode): void {
    if (node === this.head) {
      return; // Already at front
    }

    // Remove from current position
    this.removeNode(node);
    
    // Add to front
    this.addToFront(node);
  }

  private removeNode(node: CacheNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    node.prev = null;
    node.next = null;
  }

  private estimateImageSize(cachedImage: CachedImage): number {
    // Rough estimation based on image metadata and URLs
    const baseSize = 1000; // Base overhead
    const urlSize = cachedImage.imageResult.url.length * 2; // Rough UTF-16 size
    const thumbnailSize = cachedImage.imageResult.thumbnailUrl.length * 2;
    const metadataSize = JSON.stringify(cachedImage.imageResult.metadata).length * 2;
    
    return baseSize + urlSize + thumbnailSize + metadataSize;
  }
}