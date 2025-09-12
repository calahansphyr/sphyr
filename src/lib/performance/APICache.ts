// API caching strategies and utilities
import { userBehaviorTracker } from '@/lib/analytics/UserBehaviorTracker';
import { logger } from '@/lib/logger';
import { TIME_CONSTANTS, STORAGE_LIMITS } from '../constants';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  strategy?: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  keyPrefix?: string;
  serialize?: boolean;
  compress?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
  hitRate: number;
  memoryUsage: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private stats = {
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0
  };
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || TIME_CONSTANTS.API_CACHE_TTL,
      maxSize: options.maxSize || STORAGE_LIMITS.MAX_CACHE_SIZE,
      strategy: options.strategy || 'memory',
      keyPrefix: options.keyPrefix || 'api_cache_',
      serialize: options.serialize ?? true,
      compress: options.compress ?? false
    };
  }

  // Generate cache key
  private generateKey(url: string, params?: Record<string, unknown>): string {
    const key = `${this.options.keyPrefix}${url}`;
    if (params) {
      const paramString = JSON.stringify(params);
      return `${key}_${this.hashString(paramString)}`;
    }
    return key;
  }

  // Hash string for consistent keys
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Get cache entry
  private getEntry<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry;
  }

  // Set cache entry
  private setEntry<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
      hits: 0,
      size: this.calculateSize(data)
    };

    // Check cache size limit
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    this.stats.entries = this.cache.size;
    this.stats.size += entry.size;
  }

  // Evict oldest entry
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.stats.size -= entry.size;
        this.cache.delete(oldestKey);
      }
    }
  }

  // Calculate data size
  private calculateSize(data: unknown): number {
    if (this.options.serialize) {
      return JSON.stringify(data).length;
    }
    return 1; // Approximate size for non-serialized data
  }

  // Get cached data
  public get<T>(url: string, params?: Record<string, unknown>): T | null {
    const key = this.generateKey(url, params);
    const entry = this.getEntry<T>(key);
    return entry ? entry.data : null;
  }

  // Set cached data
  public set<T>(url: string, data: T, ttl?: number, params?: Record<string, unknown>): void {
    const key = this.generateKey(url, params);
    this.setEntry(key, data, ttl);
  }

  // Check if data is cached
  public has(url: string, params?: Record<string, unknown>): boolean {
    const key = this.generateKey(url, params);
    const entry = this.getEntry(key);
    return entry !== null;
  }

  // Delete cached data
  public delete(url: string, params?: Record<string, unknown>): boolean {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.size -= entry.size;
      this.cache.delete(key);
      this.stats.entries = this.cache.size;
      return true;
    }
    return false;
  }

  // Clear all cache
  public clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      entries: 0
    };
  }

  // Get cache statistics
  public getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      memoryUsage: this.stats.size
    };
  }

  // Clean expired entries
  public cleanExpired(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.stats.size -= entry.size;
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.stats.entries = this.cache.size;
    return cleaned;
  }

  // Get cache keys
  public getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get cache size
  public getSize(): number {
    return this.cache.size;
  }

  // Get memory usage
  public getMemoryUsage(): number {
    return this.stats.size;
  }
}

// Create singleton cache instance
export const apiCache = new APICache();

// Enhanced fetch with caching
export async function cachedFetch<T>(
  url: string,
  options: RequestInit & { 
    cache?: boolean; 
    ttl?: number; 
    params?: Record<string, unknown>;
    strategy?: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
  } = {}
): Promise<T> {
  const {
    cache = true,
    ttl,
    params,
    strategy = 'cache-first',
    ...fetchOptions
  } = options;

  const cacheKey = url;

  // Check cache first
  if (cache && strategy !== 'network-only') {
    const cachedData = apiCache.get<T>(cacheKey, params);
    if (cachedData) {
      userBehaviorTracker.trackEvent('performance', {
        url,
        strategy,
        ttl,
        event_type: 'cache_hit'
      });
      return cachedData;
    }
  }

  // Network request
  if (strategy !== 'cache-only') {
    try {
      const startTime = performance.now();
      const response = await fetch(url, fetchOptions);
      const endTime = performance.now();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache the response
      if (cache && strategy !== 'network-only') {
        apiCache.set(cacheKey, data, ttl, params);
      }

      userBehaviorTracker.trackEvent('performance', {
        url,
        strategy,
        responseTime: endTime - startTime,
        event_type: 'api_request',
        status: response.status,
        cached: false
      });

      return data;
    } catch (error) {
      userBehaviorTracker.trackEvent('error', {
        url,
        strategy,
        error: error instanceof Error ? error.message : 'Unknown error',
        event_type: 'api_error'
      });
      throw error;
    }
  }

  throw new Error('No data available in cache and network request not allowed');
}

// Cache invalidation strategies
export class CacheInvalidation {
  private static instance: CacheInvalidation;
  private invalidationRules = new Map<string, string[]>();

  public static getInstance(): CacheInvalidation {
    if (!CacheInvalidation.instance) {
      CacheInvalidation.instance = new CacheInvalidation();
    }
    return CacheInvalidation.instance;
  }

  // Add invalidation rule
  public addRule(pattern: string, invalidateKeys: string[]): void {
    this.invalidationRules.set(pattern, invalidateKeys);
  }

  // Invalidate cache by pattern
  public invalidateByPattern(pattern: string): void {
    const keys = this.invalidationRules.get(pattern);
    if (keys) {
      keys.forEach(key => {
        apiCache.delete(key);
      });
    }
  }

  // Invalidate cache by URL
  public invalidateByURL(url: string): void {
    const keys = apiCache.getKeys();
    keys.forEach(key => {
      if (key.includes(url)) {
        apiCache.delete(key);
      }
    });
  }

  // Invalidate all cache
  public invalidateAll(): void {
    apiCache.clear();
  }

  // Invalidate expired entries
  public invalidateExpired(): number {
    return apiCache.cleanExpired();
  }
}

// Cache warming strategies
export class CacheWarmer {
  private static instance: CacheWarmer;
  private warmingQueue: Array<() => Promise<void>> = [];

  public static getInstance(): CacheWarmer {
    if (!CacheWarmer.instance) {
      CacheWarmer.instance = new CacheWarmer();
    }
    return CacheWarmer.instance;
  }

  // Add URL to warming queue
  public addToQueue(url: string, params?: Record<string, unknown>, ttl?: number): void {
    this.warmingQueue.push(async () => {
      try {
        await cachedFetch(url, { params, ttl, strategy: 'network-first' });
      } catch (error) {
        logger.warn(`Failed to warm cache for ${url}`, {
          operation: 'warmCache',
          url,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  // Execute warming queue
  public async executeWarming(): Promise<void> {
    const promises = this.warmingQueue.map(fn => fn());
    await Promise.all(promises);
    this.warmingQueue = [];
  }

  // Clear warming queue
  public clearQueue(): void {
    this.warmingQueue = [];
  }
}

// Cache analytics
export class CacheAnalytics {
  private static instance: CacheAnalytics;
  private analytics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    totalResponseTime: 0
  };

  public static getInstance(): CacheAnalytics {
    if (!CacheAnalytics.instance) {
      CacheAnalytics.instance = new CacheAnalytics();
    }
    return CacheAnalytics.instance;
  }

  // Track request
  public trackRequest(responseTime: number, fromCache: boolean): void {
    this.analytics.totalRequests++;
    this.analytics.totalResponseTime += responseTime;
    this.analytics.averageResponseTime = this.analytics.totalResponseTime / this.analytics.totalRequests;

    if (fromCache) {
      this.analytics.cacheHits++;
    } else {
      this.analytics.cacheMisses++;
    }
  }

  // Get analytics
  public getAnalytics() {
    return {
      ...this.analytics,
      hitRate: this.analytics.totalRequests > 0 ? this.analytics.cacheHits / this.analytics.totalRequests : 0
    };
  }

  // Reset analytics
  public reset(): void {
    this.analytics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      totalResponseTime: 0
    };
  }
}

const APICacheModule = {
  APICache,
  apiCache,
  cachedFetch,
  CacheInvalidation,
  CacheWarmer,
  CacheAnalytics
};

export default APICacheModule;
