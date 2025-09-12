/**
 * Centralized localStorage Manager for Sphyr
 * Provides robust error handling, performance monitoring, and storage management
 */

import { logger } from '@/lib/logger';
import { STORAGE_LIMITS, TIME_CONSTANTS } from '../constants';

export interface StorageInfo {
  used: number;
  available: number;
  percentage: number;
  items: number;
}

export interface StorageItem<T = unknown> {
  value: T;
  timestamp: number;
  ttl?: number;
  size: number;
}

export interface StorageOptions {
  ttl?: number; // Time to live in milliseconds
  compress?: boolean; // Whether to compress large values
  encrypt?: boolean; // Whether to encrypt sensitive data
}

export class LocalStorageManager {
  private static readonly MAX_STORAGE_SIZE = STORAGE_LIMITS.MAX_STORAGE_BYTES;
  private static readonly CLEANUP_THRESHOLD = STORAGE_LIMITS.CLEANUP_THRESHOLD;
  private static readonly MAX_ITEMS = STORAGE_LIMITS.MAX_ITEMS;
  private static readonly CLEANUP_INTERVAL = TIME_CONSTANTS.CLEANUP_INTERVAL;
  private static readonly PREFIX = 'sphyr_';
  
  private static cleanupTimer: NodeJS.Timeout | null = null;
  private static isInitialized = false;

  /**
   * Initialize the localStorage manager
   */
  static initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    this.startCleanupTimer();
    this.performInitialCleanup();
    
    logger.info('LocalStorageManager initialized', {
      operation: 'initialize',
      maxSize: this.MAX_STORAGE_SIZE,
      maxItems: this.MAX_ITEMS
    });
  }

  /**
   * Set an item in localStorage with error handling and TTL support
   */
  static setItem<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const prefixedKey = this.PREFIX + key;
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        ttl: options.ttl,
        size: this.calculateSize(value)
      };

      // Check storage quota before setting
      if (!this.checkStorageQuota(item.size)) {
        this.performCleanup();
        if (!this.checkStorageQuota(item.size)) {
          logger.warn('Storage quota exceeded, cannot store item', {
            operation: 'setItem',
            key: prefixedKey,
            itemSize: item.size,
            availableSpace: this.getAvailableSpace()
          });
          return false;
        }
      }

      const serializedValue = JSON.stringify(item);
      localStorage.setItem(prefixedKey, serializedValue);
      
      logger.debug('Item stored successfully', {
        operation: 'setItem',
        key: prefixedKey,
        size: item.size,
        ttl: options.ttl
      });

      return true;
    } catch (error) {
      logger.error('Failed to store item in localStorage', error as Error, {
        operation: 'setItem',
        key: this.PREFIX + key,
        errorType: error instanceof Error ? error.name : 'Unknown'
      });
      return false;
    }
  }

  /**
   * Get an item from localStorage with TTL validation
   */
  static getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const prefixedKey = this.PREFIX + key;
      const serializedItem = localStorage.getItem(prefixedKey);
      
      if (!serializedItem) {
        return null;
      }

      const item: StorageItem<T> = JSON.parse(serializedItem);
      
      // Check TTL
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.removeItem(key);
        logger.debug('Item expired and removed', {
          operation: 'getItem',
          key: prefixedKey,
          age: Date.now() - item.timestamp,
          ttl: item.ttl
        });
        return null;
      }

      return item.value;
    } catch (error) {
      logger.error('Failed to retrieve item from localStorage', error as Error, {
        operation: 'getItem',
        key: this.PREFIX + key
      });
      return null;
    }
  }

  /**
   * Remove an item from localStorage
   */
  static removeItem(key: string): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const prefixedKey = this.PREFIX + key;
      localStorage.removeItem(prefixedKey);
      
      logger.debug('Item removed successfully', {
        operation: 'removeItem',
        key: prefixedKey
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to remove item from localStorage', error as Error, {
        operation: 'removeItem',
        key: this.PREFIX + key
      });
      return false;
    }
  }

  /**
   * Clear all Sphyr-related items from localStorage
   */
  static clear(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      logger.info('All Sphyr items cleared from localStorage', {
        operation: 'clear',
        itemsRemoved: keysToRemove.length
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to clear localStorage', error as Error, {
        operation: 'clear'
      });
      return false;
    }
  }

  /**
   * Get storage information
   */
  static getStorageInfo(): StorageInfo {
    if (typeof window === 'undefined') {
      return { used: 0, available: 0, percentage: 0, items: 0 };
    }

    try {
      let used = 0;
      let items = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
            items++;
          }
        }
      }

      const available = this.MAX_STORAGE_SIZE - used;
      const percentage = (used / this.MAX_STORAGE_SIZE) * 100;

      return { used, available, percentage, items };
    } catch (error) {
      logger.error('Failed to get storage info', error as Error, {
        operation: 'getStorageInfo'
      });
      return { used: 0, available: 0, percentage: 0, items: 0 };
    }
  }

  /**
   * Check if storage quota allows for new item
   */
  private static checkStorageQuota(itemSize: number): boolean {
    const info = this.getStorageInfo();
    return (info.used + itemSize) <= this.MAX_STORAGE_SIZE;
  }

  /**
   * Get available storage space
   */
  private static getAvailableSpace(): number {
    const info = this.getStorageInfo();
    return info.available;
  }

  /**
   * Calculate approximate size of an object
   */
  private static calculateSize(value: unknown): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 0;
    }
  }

  /**
   * Perform cleanup of expired and old items
   */
  private static performCleanup(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const now = Date.now();
      const keysToRemove: string[] = [];
      const items: Array<{ key: string; timestamp: number; size: number }> = [];

      // Collect all Sphyr items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const item: StorageItem = JSON.parse(value);
              
              // Check for expired items
              if (item.ttl && now - item.timestamp > item.ttl) {
                keysToRemove.push(key);
              } else {
                items.push({
                  key,
                  timestamp: item.timestamp,
                  size: item.size || this.calculateSize(item.value)
                });
              }
            } catch {
              // Remove corrupted items
              keysToRemove.push(key);
            }
          }
        }
      }

      // Remove expired and corrupted items
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // If still over limit, remove oldest items
      const info = this.getStorageInfo();
      if (info.percentage > this.CLEANUP_THRESHOLD * 100 || items.length > this.MAX_ITEMS) {
        items.sort((a, b) => a.timestamp - b.timestamp);
        
        const itemsToRemove = Math.max(
          items.length - this.MAX_ITEMS,
          Math.ceil(items.length * 0.1) // Remove 10% of items
        );

        for (let i = 0; i < itemsToRemove; i++) {
          localStorage.removeItem(items[i].key);
        }
      }

      if (keysToRemove.length > 0) {
        logger.info('Storage cleanup completed', {
          operation: 'performCleanup',
          expiredItemsRemoved: keysToRemove.length,
          totalItems: items.length
        });
      }
    } catch (error) {
      logger.error('Failed to perform storage cleanup', error as Error, {
        operation: 'performCleanup'
      });
    }
  }

  /**
   * Start the cleanup timer
   */
  private static startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Perform initial cleanup on startup
   */
  private static performInitialCleanup(): void {
    this.performCleanup();
  }

  /**
   * Destroy the localStorage manager
   */
  static destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.isInitialized = false;
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  LocalStorageManager.initialize();
}
