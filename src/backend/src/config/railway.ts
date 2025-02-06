/**
 * Railway platform configuration module for LinkedIn Profiles Gallery
 * Manages database, Redis, and deployment settings for Railway infrastructure
 * @module config/railway
 * @version 1.0.0
 */

// Node.js v18.x
import { IS_PRODUCTION, IS_DEVELOPMENT } from './constants';

/**
 * Core Railway project configuration
 */
export const RailwayConfig = {
  PROJECT_ID: process.env.RAILWAY_PROJECT_ID,
  ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'development'
} as const;

/**
 * PostgreSQL database configuration for Railway-hosted instance
 * Implements connection pooling and SSL settings based on environment
 */
export const DatabaseConfig = {
  URL: process.env.DATABASE_URL,
  // Production-optimized connection pool settings
  MAX_CONNECTIONS: IS_PRODUCTION ? 20 : 10,
  MIN_CONNECTIONS: IS_PRODUCTION ? 5 : 2,
  CONNECTION_TIMEOUT: 2000, // 2 seconds
  IDLE_TIMEOUT: 10000, // 10 seconds
  // SSL configuration based on environment
  SSL_ENABLED: IS_PRODUCTION,
  SSL_MODE: IS_PRODUCTION ? 'require' : 'prefer'
} as const;

/**
 * Redis cache configuration for Railway-hosted instance
 * Implements memory limits and TTL settings
 */
export const RedisConfig = {
  URL: process.env.REDIS_URL,
  TTL: 3600, // 1 hour default TTL
  // Memory management settings
  MAX_MEMORY: IS_PRODUCTION ? '512mb' : '256mb',
  MAX_MEMORY_POLICY: 'allkeys-lru', // Least Recently Used eviction
  KEY_PREFIX: 'linkedin_gallery:',
  ENABLE_OFFLINE_QUEUE: IS_PRODUCTION
} as const;

/**
 * Validates Railway configuration settings and required environment variables
 * @returns {boolean} True if all required configurations are valid
 */
export function validateRailwayConfig(): boolean {
  try {
    // Validate Railway project configuration
    if (!RailwayConfig.PROJECT_ID) {
      console.error('RAILWAY_PROJECT_ID is not defined');
      return false;
    }

    // Validate database configuration
    if (!DatabaseConfig.URL) {
      console.error('DATABASE_URL is not defined');
      return false;
    }

    // Validate database URL format
    const dbUrlPattern = /^postgres(ql)?:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+(\?.*)?$/;
    if (!dbUrlPattern.test(DatabaseConfig.URL)) {
      console.error('Invalid DATABASE_URL format');
      return false;
    }

    // Validate Redis configuration
    if (!RedisConfig.URL) {
      console.error('REDIS_URL is not defined');
      return false;
    }

    // Validate Redis URL format
    const redisUrlPattern = /^redis:\/\/[^:]*:[^@]*@[^:]+:\d+$/;
    if (!redisUrlPattern.test(RedisConfig.URL)) {
      console.error('Invalid REDIS_URL format');
      return false;
    }

    // Validate memory limits
    const maxMemoryValue = parseInt(RedisConfig.MAX_MEMORY);
    if (isNaN(maxMemoryValue) || maxMemoryValue < 128 || maxMemoryValue > 1024) {
      console.error('Invalid Redis MAX_MEMORY configuration');
      return false;
    }

    // Validate connection pool settings
    if (DatabaseConfig.MAX_CONNECTIONS < DatabaseConfig.MIN_CONNECTIONS) {
      console.error('Invalid connection pool configuration');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Railway configuration validation failed:', error);
    return false;
  }
}