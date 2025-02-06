/**
 * Redis configuration module for LinkedIn Profiles Gallery
 * Manages Redis client settings, connection handling, and cache parameters
 * @module config/redis
 * @version 1.0.0
 */

// ioredis v5.3.0
import Redis from 'ioredis';
import { CACHE } from './constants';
import { RedisConfig } from './railway';

// Environment-based Redis connection URL
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Core Redis configuration settings
 */
export const redisConfig = {
  url: REDIS_URL,
  options: {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number): number | null {
      // Exponential backoff with max 2000ms delay
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 10000, // 10 seconds
    disconnectTimeout: 2000, // 2 seconds
    commandTimeout: 5000, // 5 seconds
    keepAlive: 10000, // 10 seconds
    enableOfflineQueue: RedisConfig.ENABLE_OFFLINE_QUEUE,
    maxLoadingRetryTime: 2000, // 2 seconds
  },
  maxMemory: RedisConfig.MAX_MEMORY,
  keyPrefix: CACHE.PREFIX,
  ttl: CACHE.TTL,
} as const;

/**
 * Creates and configures a new Redis client instance
 * @returns {Redis} Configured Redis client instance
 */
export function createRedisClient(): Redis {
  const client = new Redis(redisConfig.url, {
    ...redisConfig.options,
    keyPrefix: redisConfig.keyPrefix,
  });

  // Configure client memory limits and eviction policy
  client.config('SET', 'maxmemory', redisConfig.maxMemory);
  client.config('SET', 'maxmemory-policy', 'allkeys-lru');

  // Event handlers for connection management
  client.on('connect', () => {
    console.info('Redis client connected successfully');
  });

  client.on('error', (error) => {
    console.error('Redis client error:', error);
  });

  client.on('ready', () => {
    console.info('Redis client ready for operations');
  });

  client.on('reconnecting', () => {
    console.warn('Redis client attempting to reconnect');
  });

  client.on('end', () => {
    console.info('Redis client connection closed');
  });

  return client;
}

/**
 * Validates Redis connection and configuration settings
 * @returns {Promise<boolean>} True if Redis connection is valid and properly configured
 */
export async function validateRedisConnection(): Promise<boolean> {
  const client = createRedisClient();

  try {
    // Test connection
    await client.ping();

    // Verify memory settings
    const maxMemory = await client.config('GET', 'maxmemory');
    const maxMemoryPolicy = await client.config('GET', 'maxmemory-policy');

    if (!maxMemory || !maxMemoryPolicy) {
      console.error('Redis memory configuration validation failed');
      return false;
    }

    // Verify cache configuration
    if (CACHE.MAX_ITEMS <= 0 || CACHE.TTL <= 0) {
      console.error('Invalid cache configuration parameters');
      return false;
    }

    // Verify connection URL
    const redisUrlPattern = /^redis:\/\/[^:]*:[^@]*@[^:]+:\d+$/;
    if (!redisUrlPattern.test(redisConfig.url)) {
      console.error('Invalid Redis connection URL format');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Redis connection validation failed:', error);
    return false;
  } finally {
    await client.quit();
  }
}