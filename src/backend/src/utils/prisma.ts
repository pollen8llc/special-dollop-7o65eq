/**
 * @fileoverview Core Prisma ORM utility for LinkedIn Profiles Gallery
 * Provides database client management with enhanced security, monitoring, and performance optimizations
 * @version 1.0.0
 * @package @prisma/client@^4.0.0
 */

import { PrismaClient } from '@prisma/client'; // ^4.0.0
import { getDatabaseConfig } from '../config/database';
import logger from './logger';

/**
 * Metrics for database performance monitoring
 */
interface DatabaseMetrics {
  activeConnections: number;
  queryCount: number;
  slowQueries: number;
  errors: number;
  lastHealthCheck: Date;
}

/**
 * Global metrics tracker for database monitoring
 */
const metrics: DatabaseMetrics = {
  activeConnections: 0,
  queryCount: 0,
  slowQueries: 0,
  errors: 0,
  lastHealthCheck: new Date()
};

/**
 * Creates and configures a new PrismaClient instance with advanced settings
 */
function createPrismaClient(): PrismaClient {
  const config = getDatabaseConfig();
  
  return new PrismaClient({
    datasources: config.prisma.datasources,
    log: [
      { level: 'error', emit: 'event' },
      { level: 'info', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'query', emit: 'event' }
    ],
    errorFormat: 'pretty',
    // Connection pooling configuration
    connection: {
      pool: {
        min: config.prisma.connectionPool.min,
        max: config.prisma.connectionPool.max,
        idleTimeoutMs: config.prisma.connectionPool.idleTimeoutMs,
        connectionTimeoutMs: config.prisma.connectionPool.connectionTimeoutMs
      }
    }
  });
}

// Initialize Prisma client with enhanced error handling
const prisma = createPrismaClient();

// Configure event listeners for comprehensive monitoring
prisma.$on('query', (e: any) => {
  metrics.queryCount++;
  
  // Track slow queries (>1s)
  if (e.duration > 1000) {
    metrics.slowQueries++;
    logger.warn('Slow query detected', {
      query: e.query,
      duration: e.duration,
      timestamp: new Date().toISOString()
    });
  }
});

prisma.$on('error', (e: any) => {
  metrics.errors++;
  logger.error('Database error occurred', {
    error: e.error,
    message: e.message,
    timestamp: new Date().toISOString()
  });
});

prisma.$on('info', (e: any) => {
  logger.info('Database event', {
    message: e.message,
    timestamp: new Date().toISOString()
  });
});

prisma.$on('warn', (e: any) => {
  logger.warn('Database warning', {
    message: e.message,
    timestamp: new Date().toISOString()
  });
});

/**
 * Establishes database connection with retry mechanism and health checks
 */
export async function connectDatabase(): Promise<void> {
  const maxRetries = 5;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      await prisma.$connect();
      
      // Verify connection with a test query
      await prisma.$executeRaw`SELECT 1`;
      
      logger.info('Database connection established successfully', {
        timestamp: new Date().toISOString(),
        metrics: {
          ...metrics,
          activeConnections: metrics.activeConnections + 1
        }
      });
      
      metrics.activeConnections++;
      metrics.lastHealthCheck = new Date();
      return;
      
    } catch (error) {
      retryCount++;
      metrics.errors++;
      
      logger.error('Database connection failed', {
        error,
        retryCount,
        maxRetries,
        timestamp: new Date().toISOString()
      });
      
      if (retryCount === maxRetries) {
        throw new Error('Failed to establish database connection after maximum retries');
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }
  }
}

/**
 * Safely disconnects from database with connection draining
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    // Wait for active queries to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await prisma.$disconnect();
    
    metrics.activeConnections = 0;
    logger.info('Database connection closed successfully', {
      timestamp: new Date().toISOString(),
      metrics
    });
    
  } catch (error) {
    logger.error('Error disconnecting from database', {
      error,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// Export configured Prisma client instance
export default prisma;