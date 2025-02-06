/**
 * Unit tests for CacheService
 * Validates Redis caching operations, performance, and reliability
 * @package jest@^29.0.0
 * @package ioredis-mock@^8.0.0
 */

import { performance } from 'perf_hooks';
import Redis from 'ioredis-mock';
import { CacheService } from '../../../src/services/cache.service';
import { getRedisClient } from '../../../src/utils/redis';
import { redisConfig } from '../../../src/config/redis';

// Mock Redis client
jest.mock('../../../src/utils/redis', () => ({
  getRedisClient: jest.fn()
}));

describe('CacheService', () => {
  let cacheService: CacheService;
  let redisMock: Redis;

  beforeEach(async () => {
    // Create Redis mock instance
    redisMock = new Redis({
      data: {},
      keyPrefix: redisConfig.keyPrefix
    });

    // Configure mock implementation
    (getRedisClient as jest.Mock).mockResolvedValue(redisMock);

    // Initialize cache service
    cacheService = new CacheService();
    await (cacheService as any).initializeCache();
  });

  afterEach(async () => {
    // Clear all mock data
    await redisMock.flushall();
    jest.clearAllMocks();
  });

  describe('set operations', () => {
    it('should set value within 50ms response time', async () => {
      const key = 'test-key';
      const value = { id: 1, name: 'Test Profile' };
      
      const start = performance.now();
      await cacheService.set(key, value);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      
      const storedValue = await redisMock.get(`${redisConfig.keyPrefix}${key}`);
      expect(JSON.parse(storedValue!)).toEqual(value);
    });

    it('should handle values up to 1MB size', async () => {
      const key = 'large-value';
      const largeValue = { data: 'x'.repeat(1024 * 1024) }; // 1MB string

      await expect(cacheService.set(key, largeValue))
        .resolves.not.toThrow();

      const storedValue = await redisMock.get(`${redisConfig.keyPrefix}${key}`);
      expect(JSON.parse(storedValue!)).toEqual(largeValue);
    });

    it('should respect memory limits', async () => {
      const memoryLimit = parseInt(redisConfig.maxMemory);
      const key = 'memory-test';
      const largeValue = { data: 'x'.repeat(memoryLimit + 1000) };

      await expect(cacheService.set(key, largeValue))
        .rejects.toThrow();
    });

    it('should handle serialization errors gracefully', async () => {
      const key = 'circular-ref';
      const circularValue: any = { self: null };
      circularValue.self = circularValue;

      await expect(cacheService.set(key, circularValue))
        .rejects.toThrow();
    });

    it('should enforce TTL correctly', async () => {
      const key = 'ttl-test';
      const value = { test: true };
      const ttl = 1; // 1 second

      await cacheService.set(key, value, { ttl });
      
      const ttlValue = await redisMock.ttl(`${redisConfig.keyPrefix}${key}`);
      expect(ttlValue).toBeLessThanOrEqual(ttl);
    });

    it('should handle concurrent set operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => ({
        key: `concurrent-${i}`,
        value: { id: i }
      }));

      await Promise.all(
        operations.map(op => cacheService.set(op.key, op.value))
      );

      for (const op of operations) {
        const value = await redisMock.get(`${redisConfig.keyPrefix}${op.key}`);
        expect(JSON.parse(value!)).toEqual(op.value);
      }
    });
  });

  describe('get operations', () => {
    it('should retrieve value within 30ms', async () => {
      const key = 'perf-test';
      const value = { id: 1, data: 'test' };
      await cacheService.set(key, value);

      const start = performance.now();
      const retrieved = await cacheService.get<typeof value>(key);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(30);
      expect(retrieved).toEqual(value);
    });

    it('should handle cache misses efficiently', async () => {
      const start = performance.now();
      const result = await cacheService.get('non-existent-key');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
      expect(result).toBeNull();
    });

    it('should manage large value retrieval', async () => {
      const key = 'large-retrieval';
      const largeValue = { data: 'x'.repeat(500 * 1024) }; // 500KB
      await cacheService.set(key, largeValue);

      const retrieved = await cacheService.get<typeof largeValue>(key);
      expect(retrieved).toEqual(largeValue);
    });

    it('should handle deserialization errors', async () => {
      const key = 'invalid-json';
      await redisMock.set(`${redisConfig.keyPrefix}${key}`, 'invalid json{');

      const result = await cacheService.get(key);
      expect(result).toBeNull();
    });

    it('should respect key expiration', async () => {
      const key = 'expiring-key';
      const value = { test: true };
      
      await cacheService.set(key, value, { ttl: 1 });
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result = await cacheService.get(key);
      expect(result).toBeNull();
    });
  });

  describe('delete operations', () => {
    it('should delete cache entry and metadata', async () => {
      const key = 'delete-test';
      await cacheService.set(key, { test: true });

      const deleted = await cacheService.delete(key);
      expect(deleted).toBe(true);

      const value = await redisMock.get(`${redisConfig.keyPrefix}${key}`);
      const metadata = await redisMock.get(`${redisConfig.keyPrefix}${key}:metadata`);
      
      expect(value).toBeNull();
      expect(metadata).toBeNull();
    });
  });

  describe('clear operations', () => {
    it('should clear all cache entries within prefix', async () => {
      const keys = ['test1', 'test2', 'test3'];
      await Promise.all(
        keys.map(key => cacheService.set(key, { test: true }))
      );

      await cacheService.clear();

      for (const key of keys) {
        const value = await redisMock.get(`${redisConfig.keyPrefix}${key}`);
        expect(value).toBeNull();
      }
    });
  });

  describe('health check', () => {
    it('should verify memory usage within 256MB limit', async () => {
      const health = await cacheService.healthCheck();
      
      expect(health.healthy).toBe(true);
      expect(health.metrics.usedMemoryPercent).toBeLessThan(90);
    });

    it('should confirm connection stability', async () => {
      const start = performance.now();
      const health = await cacheService.healthCheck();
      const duration = performance.now() - start;

      expect(health.healthy).toBe(true);
      expect(duration).toBeLessThan(100);
      expect(health.metrics.status).toBe('ready');
    });

    it('should handle connection failures', async () => {
      // Simulate connection failure
      redisMock.disconnect();

      const health = await cacheService.healthCheck();
      expect(health.healthy).toBe(false);
    });
  });
});