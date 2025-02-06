/**
 * Redis utility module providing Redis client management and core operations
 * @module utils/redis
 * @version 1.0.0
 * @package ioredis@^5.3.0
 */

import Redis from 'ioredis';
import { redisConfig } from '../config/redis';
import logger from './logger';

// Global Redis client instance for singleton pattern
let redisClient: Redis | null = null;

/**
 * Returns a singleton Redis client instance with enhanced connection management
 * @returns {Promise<Redis>} Configured Redis client instance
 */
export async function getRedisClient(): Promise<Redis> {
  try {
    // Return existing client if connected
    if (redisClient?.status === 'ready') {
      return redisClient;
    }

    // Create new client if none exists or not connected
    redisClient = await createRedisClient();
    return redisClient;
  } catch (error) {
    logger.error('Failed to get Redis client', { error });
    throw error;
  }
}

/**
 * Creates and configures a new Redis client with optimized settings
 * @returns {Redis} New Redis client instance
 */
function createRedisClient(): Redis {
  const client = new Redis(redisConfig.url, {
    ...redisConfig.options,
    // Connection pool configuration
    maxRetriesPerRequest: 3,
    retryStrategy(times: number): number | null {
      const maxRetryDelay = 2000;
      const delay = Math.min(times * 50, maxRetryDelay);
      return delay;
    },
    // Performance optimization settings
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 1000,
    keepAlive: 10000,
    // TLS configuration for security
    tls: {
      rejectUnauthorized: true
    }
  });

  // Configure memory limits and eviction policy
  client.config('SET', 'maxmemory', redisConfig.maxMemory);
  client.config('SET', 'maxmemory-policy', 'allkeys-lru');

  // Connection event handlers
  client.on('connect', () => {
    logger.info('Redis client connected successfully');
  });

  client.on('error', (error) => {
    logger.error('Redis client error', { error });
  });

  client.on('ready', () => {
    logger.info('Redis client ready for operations');
  });

  client.on('reconnecting', () => {
    logger.info('Redis client attempting to reconnect');
  });

  client.on('end', () => {
    logger.info('Redis client connection closed');
  });

  return client;
}

/**
 * Gracefully closes Redis connection with proper cleanup
 * @returns {Promise<void>}
 */
export async function closeRedisConnection(): Promise<void> {
  try {
    if (redisClient) {
      // Wait for pending operations to complete (5s timeout)
      await Promise.race([
        redisClient.quit(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis quit timeout')), 5000)
        )
      ]);
      redisClient = null;
      logger.info('Redis connection closed successfully');
    }
  } catch (error) {
    logger.error('Error closing Redis connection', { error });
    throw error;
  }
}

/**
 * Comprehensive health check of Redis connection and performance
 * @returns {Promise<boolean>} True if Redis is healthy
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    
    // Verify connection with PING
    const pingStart = Date.now();
    await client.ping();
    const pingLatency = Date.now() - pingStart;

    // Check memory usage
    const info = await client.info('memory');
    const usedMemory = parseInt(
      info.split('\r\n')
        .find(line => line.startsWith('used_memory:'))
        ?.split(':')[1] || '0'
    );
    
    const maxMemory = parseInt(redisConfig.maxMemory);
    const memoryUsagePercent = (usedMemory / maxMemory) * 100;

    // Log health metrics
    logger.info('Redis health check', {
      pingLatency,
      memoryUsagePercent,
      connectionStatus: client.status
    });

    // Health criteria: ping < 100ms, memory usage < 90%, connected status
    return pingLatency < 100 && 
           memoryUsagePercent < 90 && 
           client.status === 'ready';
  } catch (error) {
    logger.error('Redis health check failed', { error });
    return false;
  }
}