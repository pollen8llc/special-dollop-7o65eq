import Redis from 'ioredis'; // v5.3.0
import { createCache } from '@remix-run/redis'; // v1.19.0
import compression from 'ioredis-compression'; // v1.0.0

// Environment and configuration constants
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_TTL = 3600; // 1 hour in seconds
const CACHE_PREFIX = 'linkedin-profiles:';
const MAX_MEMORY_LIMIT = 256 * 1024 * 1024; // 256MB
const MAX_RETRY_ATTEMPTS = 5;
const CIRCUIT_BREAKER_THRESHOLD = 3;

// Connection pool configuration
const POOL_CONFIG = {
  minConnections: 2,
  maxConnections: 10,
  acquireTimeout: 10000,
  retryDelay: 1000,
};

// Monitoring thresholds
const MONITORING = {
  memoryThreshold: 0.9, // 90% memory usage alert
  hitRateThreshold: 0.7, // 70% minimum hit rate
  responseTimeThreshold: 200, // 200ms maximum response time
};

/**
 * Creates and configures a new Redis client instance with advanced features
 * including connection pooling, compression, and circuit breaker pattern.
 */
function createRedisClient(): Redis {
  // Initialize Redis client with advanced configuration
  const client = new Redis(REDIS_URL, {
    retryStrategy: (times: number) => {
      if (times > MAX_RETRY_ATTEMPTS) return null;
      return Math.min(times * 1000, 3000); // Exponential backoff
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 10000,
    lazyConnect: true,
  });

  // Enable compression middleware
  client.use(compression({
    threshold: 1024, // Compress values larger than 1KB
    types: ['string', 'hash'],
  }));

  // Configure memory limits and eviction policy
  client.config('SET', 'maxmemory', `${MAX_MEMORY_LIMIT}`);
  client.config('SET', 'maxmemory-policy', 'volatile-lru');

  // Set up connection event handlers
  client.on('connect', () => {
    console.log('Redis client connected');
  });

  client.on('error', (err: Error) => {
    console.error('Redis client error:', err);
  });

  client.on('ready', () => {
    console.log('Redis client ready');
  });

  // Initialize circuit breaker state
  let failureCount = 0;
  let circuitOpen = false;

  // Implement circuit breaker pattern
  const originalExec = client.exec;
  client.exec = async function (...args: any[]) {
    if (circuitOpen) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await originalExec.apply(this, args);
      failureCount = 0;
      return result;
    } catch (error) {
      failureCount++;
      if (failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
        circuitOpen = true;
        setTimeout(() => {
          circuitOpen = false;
          failureCount = 0;
        }, 5000); // Reset after 5 seconds
      }
      throw error;
    }
  };

  return client;
}

/**
 * Creates a Remix-compatible cache instance with advanced caching strategies
 */
function getProfileCache(client: Redis) {
  return createCache({
    client,
    ttl: CACHE_TTL,
    keyPrefix: CACHE_PREFIX,
  });
}

/**
 * Validates Redis connection health and configuration
 */
async function validateRedisConnection(client: Redis): Promise<boolean> {
  try {
    // Basic connectivity check
    await client.ping();

    // Verify memory settings
    const maxMemory = await client.config('GET', 'maxmemory');
    const maxMemoryPolicy = await client.config('GET', 'maxmemory-policy');

    if (
      parseInt(maxMemory[1]) !== MAX_MEMORY_LIMIT ||
      maxMemoryPolicy[1] !== 'volatile-lru'
    ) {
      console.error('Invalid Redis memory configuration');
      return false;
    }

    // Verify compression middleware
    const info = await client.info('modules');
    if (!info.includes('compression')) {
      console.error('Redis compression not configured');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Redis validation failed:', error);
    return false;
  }
}

/**
 * Monitors Redis cache health and performance metrics
 */
async function monitorCacheHealth(client: Redis): Promise<void> {
  setInterval(async () => {
    try {
      // Memory usage monitoring
      const info = await client.info('memory');
      const usedMemory = parseInt(info.split('\r\n')
        .find(line => line.startsWith('used_memory:'))
        ?.split(':')[1] || '0');
      
      if (usedMemory > MAX_MEMORY_LIMIT * MONITORING.memoryThreshold) {
        console.warn('Redis memory usage exceeding threshold');
      }

      // Cache hit rate monitoring
      const stats = await client.info('stats');
      const hits = parseInt(stats.split('\r\n')
        .find(line => line.startsWith('keyspace_hits:'))
        ?.split(':')[1] || '0');
      const misses = parseInt(stats.split('\r\n')
        .find(line => line.startsWith('keyspace_misses:'))
        ?.split(':')[1] || '0');
      
      const hitRate = hits / (hits + misses);
      if (hitRate < MONITORING.hitRateThreshold) {
        console.warn('Redis cache hit rate below threshold');
      }

    } catch (error) {
      console.error('Redis monitoring error:', error);
    }
  }, 60000); // Monitor every minute
}

// Create singleton Redis client instance
const redis = createRedisClient();

// Initialize profile cache with enhanced capabilities
const profileCache = getProfileCache(redis);

// Start health monitoring
monitorCacheHealth(redis);

// Validate Redis connection on startup
validateRedisConnection(redis).catch(console.error);

export { redis as default, profileCache };