/**
 * Advanced cache service implementation using Redis for LinkedIn Profiles Gallery
 * Provides profile data caching, performance optimization, and cache management
 * @module services/cache.service
 * @version 1.0.0
 * @package ioredis@^5.3.0
 */

import Redis from 'ioredis'; // v5.3.0
import { getRedisClient } from '../utils/redis';
import { redisConfig } from '../config/redis';
import logger from '../utils/logger';

/**
 * Interface for cache entry metadata
 */
interface CacheMetadata {
  createdAt: number;
  expiresAt: number;
  compressed: boolean;
  size: number;
}

/**
 * Interface for cache operation options
 */
interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  tags?: string[];
}

/**
 * Advanced cache service implementing Redis-based caching with monitoring
 */
export class CacheService {
  private redisClient: Redis;
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;
  private readonly compressionThreshold = 1024; // 1KB

  constructor() {
    this.defaultTTL = redisConfig.ttl;
    this.keyPrefix = redisConfig.keyPrefix;
    this.initializeCache();
  }

  /**
   * Initializes the cache service with connection and event handlers
   */
  private async initializeCache(): Promise<void> {
    try {
      this.redisClient = await getRedisClient();
      
      // Monitor cache events
      this.redisClient.on('error', (error) => {
        logger.error('Cache error occurred', { error });
      });

      this.redisClient.on('ready', () => {
        logger.info('Cache service ready');
      });

      await this.validateConnection();
    } catch (error) {
      logger.error('Failed to initialize cache service', { error });
      throw error;
    }
  }

  /**
   * Validates cache connection and configuration
   */
  private async validateConnection(): Promise<void> {
    try {
      await this.redisClient.ping();
      logger.info('Cache connection validated');
    } catch (error) {
      logger.error('Cache connection validation failed', { error });
      throw error;
    }
  }

  /**
   * Sets a value in the cache with advanced options
   */
  public async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const cacheKey = this.buildKey(key);
      const ttl = options.ttl || this.defaultTTL;
      
      // Prepare value for caching
      const serializedValue = JSON.stringify(value);
      let finalValue = serializedValue;
      let compressed = false;

      // Compress large values
      if (
        options.compress !== false && 
        serializedValue.length > this.compressionThreshold
      ) {
        finalValue = await this.compress(serializedValue);
        compressed = true;
      }

      // Store value with metadata
      const metadata: CacheMetadata = {
        createdAt: Date.now(),
        expiresAt: Date.now() + (ttl * 1000),
        compressed,
        size: finalValue.length
      };

      const pipeline = this.redisClient.pipeline();
      pipeline.set(cacheKey, finalValue);
      pipeline.set(`${cacheKey}:metadata`, JSON.stringify(metadata));
      
      if (ttl > 0) {
        pipeline.expire(cacheKey, ttl);
        pipeline.expire(`${cacheKey}:metadata`, ttl);
      }

      if (options.tags?.length) {
        options.tags.forEach(tag => {
          pipeline.sadd(`${this.keyPrefix}tag:${tag}`, cacheKey);
        });
      }

      await pipeline.exec();
      
      logger.debug('Cache set successful', { 
        key: cacheKey, 
        size: finalValue.length,
        ttl 
      });
    } catch (error) {
      logger.error('Failed to set cache value', { error, key });
      throw error;
    }
  }

  /**
   * Retrieves a value from cache with type safety
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.buildKey(key);
      
      // Get value and metadata
      const [value, metadataStr] = await Promise.all([
        this.redisClient.get(cacheKey),
        this.redisClient.get(`${cacheKey}:metadata`)
      ]);

      if (!value || !metadataStr) {
        return null;
      }

      const metadata: CacheMetadata = JSON.parse(metadataStr);
      
      // Handle compressed values
      let finalValue = value;
      if (metadata.compressed) {
        finalValue = await this.decompress(value);
      }

      // Parse and validate type
      const parsed = JSON.parse(finalValue) as T;
      
      logger.debug('Cache hit', { 
        key: cacheKey,
        age: Date.now() - metadata.createdAt 
      });
      
      return parsed;
    } catch (error) {
      logger.error('Failed to get cache value', { error, key });
      return null;
    }
  }

  /**
   * Removes a value from cache with cleanup
   */
  public async delete(key: string): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key);
      
      const pipeline = this.redisClient.pipeline();
      pipeline.del(cacheKey);
      pipeline.del(`${cacheKey}:metadata`);
      
      // Clean up tag references
      const tags = await this.redisClient.smembers(`${this.keyPrefix}tags`);
      tags.forEach(tag => {
        pipeline.srem(`${this.keyPrefix}tag:${tag}`, cacheKey);
      });

      const results = await pipeline.exec();
      const deleted = results?.[0]?.[1] === 1;

      logger.debug('Cache delete operation', { 
        key: cacheKey,
        deleted 
      });

      return deleted;
    } catch (error) {
      logger.error('Failed to delete cache value', { error, key });
      return false;
    }
  }

  /**
   * Clears all cache entries within the service namespace
   */
  public async clear(): Promise<void> {
    try {
      const pattern = `${this.keyPrefix}*`;
      let cursor = '0';
      
      do {
        const [nextCursor, keys] = await this.redisClient.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );
        
        cursor = nextCursor;
        
        if (keys.length) {
          await this.redisClient.del(...keys);
        }
      } while (cursor !== '0');

      logger.info('Cache cleared successfully');
    } catch (error) {
      logger.error('Failed to clear cache', { error });
      throw error;
    }
  }

  /**
   * Performs comprehensive health check of cache service
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    metrics: Record<string, any>;
  }> {
    try {
      const startTime = Date.now();
      await this.redisClient.ping();
      const latency = Date.now() - startTime;

      const info = await this.redisClient.info();
      const metrics = this.parseRedisInfo(info);

      const healthy = latency < 100 && metrics.usedMemoryPercent < 90;

      return {
        healthy,
        metrics: {
          latency,
          ...metrics,
          status: this.redisClient.status
        }
      };
    } catch (error) {
      logger.error('Cache health check failed', { error });
      return {
        healthy: false,
        metrics: {
          error: error.message,
          status: this.redisClient.status
        }
      };
    }
  }

  /**
   * Builds cache key with prefix
   */
  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Compresses string data for storage
   */
  private async compress(data: string): Promise<string> {
    // Implement compression logic here
    return data;
  }

  /**
   * Decompresses stored data
   */
  private async decompress(data: string): Promise<string> {
    // Implement decompression logic here
    return data;
  }

  /**
   * Parses Redis INFO command output
   */
  private parseRedisInfo(info: string): Record<string, any> {
    const metrics: Record<string, any> = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        metrics[key] = value;
      }
    }

    const maxMemory = parseInt(redisConfig.maxMemory);
    const usedMemory = parseInt(metrics.used_memory || '0');
    metrics.usedMemoryPercent = (usedMemory / maxMemory) * 100;

    return metrics;
  }
}