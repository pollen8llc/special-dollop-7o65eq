/**
 * Integration tests for profile management endpoints
 * Tests CRUD operations, authentication, validation, error handling, and performance
 * @version 1.0.0
 */

import supertest from 'supertest'; // ^6.3.3
import { PrismaClient } from '@prisma/client';
import { createMockProfile, mockProfiles } from '../../fixtures/profiles.fixture';
import { ProfileService } from '../../../src/services/profile.service';
import { CacheService } from '../../../src/services/cache.service';
import prisma from '../../../src/utils/prisma';
import { ApiResponse, PaginatedResponse } from '../../../src/types/api.types';
import { Profile } from '../../../src/types/profile.types';
import logger from '../../../src/utils/logger';

// Initialize test app and services
const app = require('../../../src/app').default;
const request = supertest(app);
const cacheService = new CacheService();
const profileService = new ProfileService(prisma, cacheService, logger);

// Performance tracking
const responseTimeThreshold = 200; // 200ms per technical spec
const responseTimes: number[] = [];

describe('Profile API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
    await prisma.profile.deleteMany();
    
    // Seed test data
    for (const profile of mockProfiles) {
      await prisma.profile.create({
        data: {
          ...profile,
          experiences: {
            create: profile.experiences
          }
        }
      });
    }

    // Clear cache
    await cacheService.clear();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.profile.deleteMany();
    await prisma.$disconnect();
    await cacheService.clear();

    // Log performance metrics
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
    logger.info('API Performance Metrics', {
      averageResponseTime: avgResponseTime,
      p95ResponseTime,
      totalRequests: responseTimes.length
    });
  });

  beforeEach(async () => {
    await cacheService.clear();
    jest.clearAllMocks();
  });

  describe('GET /api/profiles', () => {
    it('should return paginated profiles with performance under 200ms', async () => {
      const startTime = Date.now();

      const response = await request
        .get('/api/profiles')
        .query({ page: 1, pageSize: 12 })
        .expect(200);

      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);

      expect(responseTime).toBeLessThan(responseTimeThreshold);
      
      const { data } = response.body as ApiResponse<PaginatedResponse<Profile>>;
      expect(data.data).toHaveLength(10);
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(12);
      expect(data.total).toBe(10);

      // Verify cache storage
      const cacheKey = 'profile:list:1:12:{}';
      const cachedData = await cacheService.get(cacheKey);
      expect(cachedData).toBeTruthy();
    });

    it('should filter profiles by search term', async () => {
      const searchTerm = mockProfiles[0].headline.split(' ')[0];
      
      const response = await request
        .get('/api/profiles')
        .query({ 
          search: searchTerm,
          page: 1,
          pageSize: 12 
        })
        .expect(200);

      const { data } = response.body as ApiResponse<PaginatedResponse<Profile>>;
      expect(data.data.every(profile => 
        profile.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      )).toBe(true);
    });

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(5).fill(null).map(() => 
        request.get('/api/profiles').query({ page: 1, pageSize: 12 })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
        const { data } = response.body as ApiResponse<PaginatedResponse<Profile>>;
        expect(data.data).toHaveLength(10);
      });

      // Average response time should be under threshold
      expect(totalTime / responses.length).toBeLessThan(responseTimeThreshold);
    });
  });

  describe('GET /api/profiles/:id', () => {
    it('should return profile by id with performance under 200ms', async () => {
      const profile = mockProfiles[0];
      const startTime = Date.now();

      const response = await request
        .get(`/api/profiles/${profile.id}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);

      expect(responseTime).toBeLessThan(responseTimeThreshold);

      const { data } = response.body as ApiResponse<Profile>;
      expect(data.id).toBe(profile.id);
      expect(data.headline).toBe(profile.headline);

      // Verify cache storage
      const cacheKey = `profile:${profile.id}`;
      const cachedData = await cacheService.get(cacheKey);
      expect(cachedData).toBeTruthy();
    });

    it('should return 404 for non-existent profile', async () => {
      const response = await request
        .get('/api/profiles/non-existent-id')
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Profile not found');
    });
  });

  describe('POST /api/profiles', () => {
    it('should create new profile with validation', async () => {
      const newProfile = createMockProfile(mockProfiles[0].userId);
      const startTime = Date.now();

      const response = await request
        .post('/api/profiles')
        .send(newProfile)
        .expect(201);

      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);

      expect(responseTime).toBeLessThan(responseTimeThreshold);

      const { data } = response.body as ApiResponse<Profile>;
      expect(data.headline).toBe(newProfile.headline);
      expect(data.experiences).toHaveLength(newProfile.experiences.length);

      // Verify cache invalidation
      const cacheKey = 'profile:list:1:12:{}';
      const cachedData = await cacheService.get(cacheKey);
      expect(cachedData).toBeNull();
    });

    it('should validate required fields', async () => {
      const invalidProfile = {
        userId: mockProfiles[0].userId,
        // Missing required headline
        bio: 'Test bio'
      };

      const response = await request
        .post('/api/profiles')
        .send(invalidProfile)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.validationErrors).toBeTruthy();
    });
  });

  describe('PUT /api/profiles/:id', () => {
    it('should update existing profile', async () => {
      const profile = mockProfiles[0];
      const updateData = {
        headline: 'Updated Headline',
        bio: 'Updated Bio'
      };

      const startTime = Date.now();
      const response = await request
        .put(`/api/profiles/${profile.id}`)
        .send(updateData)
        .expect(200);

      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);

      expect(responseTime).toBeLessThan(responseTimeThreshold);

      const { data } = response.body as ApiResponse<Profile>;
      expect(data.headline).toBe(updateData.headline);
      expect(data.bio).toBe(updateData.bio);

      // Verify cache update
      const cacheKey = `profile:${profile.id}`;
      const cachedData = await cacheService.get(cacheKey);
      expect(cachedData.headline).toBe(updateData.headline);
    });
  });

  describe('DELETE /api/profiles/:id', () => {
    it('should delete profile and clear cache', async () => {
      const profile = mockProfiles[0];
      
      const startTime = Date.now();
      await request
        .delete(`/api/profiles/${profile.id}`)
        .expect(204);

      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);

      expect(responseTime).toBeLessThan(responseTimeThreshold);

      // Verify profile deletion
      const deletedProfile = await prisma.profile.findUnique({
        where: { id: profile.id }
      });
      expect(deletedProfile).toBeNull();

      // Verify cache deletion
      const cacheKey = `profile:${profile.id}`;
      const cachedData = await cacheService.get(cacheKey);
      expect(cachedData).toBeNull();
    });
  });
});