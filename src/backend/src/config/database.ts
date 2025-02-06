/**
 * Database configuration module for LinkedIn Profiles Gallery
 * Manages PostgreSQL connection settings and Prisma client configuration
 * @module config/database
 * @version 1.0.0
 */

// Node.js v18.x
import dotenv from 'dotenv'; // ^16.0.0
import { getRailwayConfig, RAILWAY_RESOURCES } from './railway';
import { ENV } from './constants';

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  url: string;
  directUrl: string;
  prisma: {
    datasources: {
      db: {
        url: string;
      };
    };
    connectionPool: {
      min: number;
      max: number;
      idleTimeoutMs: number;
      connectionTimeoutMs: number;
    };
    log: string[];
    ssl: {
      enabled: boolean;
      rejectUnauthorized: boolean;
    };
  };
}

/**
 * Default database configuration settings
 */
export const DATABASE_CONFIG = {
  pooling: {
    min: ENV.IS_PRODUCTION ? 5 : 2,
    max: ENV.IS_PRODUCTION ? 20 : 10,
    idleTimeoutMs: 10000, // 10 seconds
    connectionTimeoutMs: 2000 // 2 seconds
  },
  ssl: {
    enabled: ENV.IS_PRODUCTION,
    rejectUnauthorized: ENV.IS_PRODUCTION
  },
  logging: {
    levels: ['error', 'warn', 'info']
  }
} as const;

/**
 * Validates database configuration parameters and environment variables
 * @param config - Database configuration object to validate
 * @throws Error if configuration is invalid
 */
function validateDatabaseConfig(config: DatabaseConfig): boolean {
  // Validate database URLs
  if (!config.url || !config.directUrl) {
    throw new Error('Database URLs are required');
  }

  // Validate URL format
  const urlPattern = /^postgres(ql)?:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+(\?.*)?$/;
  if (!urlPattern.test(config.url) || !urlPattern.test(config.directUrl)) {
    throw new Error('Invalid database URL format');
  }

  // Validate SSL configuration in production
  if (ENV.IS_PRODUCTION && !config.prisma.ssl.enabled) {
    throw new Error('SSL must be enabled in production');
  }

  // Validate connection pool settings
  const { min, max } = config.prisma.connectionPool;
  if (min > max || min < 1) {
    throw new Error('Invalid connection pool configuration');
  }

  return true;
}

/**
 * Retrieves database configuration settings based on environment
 * @returns DatabaseConfig object with validated configuration
 */
export function getDatabaseConfig(): DatabaseConfig {
  // Load environment variables in non-production environments
  if (!ENV.IS_PRODUCTION) {
    dotenv.config();
  }

  // Get Railway configuration for database resources
  const railwayConfig = getRailwayConfig();

  // Validate required environment variables
  if (!process.env.DATABASE_URL || !process.env.DATABASE_DIRECT_URL) {
    throw new Error('Database environment variables are not configured');
  }

  const config: DatabaseConfig = {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DATABASE_DIRECT_URL,
    prisma: {
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      connectionPool: {
        min: DATABASE_CONFIG.pooling.min,
        max: DATABASE_CONFIG.pooling.max,
        idleTimeoutMs: DATABASE_CONFIG.pooling.idleTimeoutMs,
        connectionTimeoutMs: DATABASE_CONFIG.pooling.connectionTimeoutMs
      },
      log: DATABASE_CONFIG.logging.levels,
      ssl: {
        enabled: DATABASE_CONFIG.ssl.enabled,
        rejectUnauthorized: DATABASE_CONFIG.ssl.rejectUnauthorized
      }
    }
  };

  // Validate configuration
  validateDatabaseConfig(config);

  return config;
}