/**
 * Integration tests for experiences API endpoints
 * Tests CRUD operations, validation, authentication, and performance
 * @version 1.0.0
 */

import supertest from 'supertest'; // ^6.3.3
import { mockExperience, mockExperienceDto, createMockExperience } from '../../fixtures/experiences.fixture';
import prisma from '../../../src/utils/prisma';
import { getRedisClient } from '../../../src/utils/redis';
import { Experience } from '../../../src/types/experience.types';
import { ErrorCode } from '../../../src/types/api.types';

// Constants
const BASE_URL = '/api/v1/experiences';
const TEST_TIMEOUT = 10000;

// Mock authentication tokens
const validToken = 'valid-test-token';
const expiredToken = 'expired-test-token';
const invalidToken = 'invalid-test-token';

describe('Experiences API Integration Tests', () => {
  let app: any;
  let redis: any;
  let testProfileId: string;

  // Setup test environment
  beforeAll(async () => {
    // Initialize test database connection
    await prisma.$connect();

    // Clear Redis cache
    redis = await getRedisClient();
    await redis.flushall();

    // Create test profile
    const testProfile = await prisma.profile.create({
      data: {
        id: mockExperience.profileId,
        userId: 'test-user-id',
        headline: 'Test Profile',
        bio: 'Test Bio'
      }
    });
    testProfileId = testProfile.id;

    // Set test timeouts
    jest.setTimeout(TEST_TIMEOUT);
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up test data
    await prisma.experience.deleteMany({
      where: { profileId: testProfileId }
    });
    await prisma.profile.delete({
      where: { id: testProfileId }
    });

    // Close connections
    await prisma.$disconnect();
    await redis.quit();
  });

  // Reset state before each test
  beforeEach(async () => {
    // Clear test data
    await prisma.experience.deleteMany({
      where: { profileId: testProfileId }
    });
    // Clear cache
    await redis.flushall();
  });

  describe('POST /experiences', () => {
    it('should create a new experience with valid data and return 201', async () => {
      const startTime = Date.now();

      const response = await supertest(app)
        .post(BASE_URL)
        .set('Authorization', `Bearer ${validToken}`)
        .send(mockExperienceDto);

      const responseTime = Date.now() - startTime;

      // Verify response time < 200ms
      expect(responseTime).toBeLessThan(200);

      // Verify response
      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        ...mockExperienceDto,
        profileId: testProfileId
      });

      // Verify database record
      const dbRecord = await prisma.experience.findUnique({
        where: { id: response.body.data.id }
      });
      expect(dbRecord).toBeTruthy();

      // Verify cache invalidation
      const cachedData = await redis.get(`experience:${response.body.data.id}`);
      expect(cachedData).toBeNull();
    });

    it('should handle concurrent experience creation requests', async () => {
      const requests = Array(5).fill(mockExperienceDto).map(() =>
        supertest(app)
          .post(BASE_URL)
          .set('Authorization', `Bearer ${validToken}`)
          .send(mockExperienceDto)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.data.profileId).toBe(testProfileId);
      });
    });
  });

  describe('GET /experiences/:id', () => {
    it('should retrieve experience with cache optimization', async () => {
      // Create test experience
      const experience = await prisma.experience.create({
        data: {
          ...mockExperienceDto,
          profileId: testProfileId
        }
      });

      // First request (cache miss)
      const startTime1 = Date.now();
      const response1 = await supertest(app)
        .get(`${BASE_URL}/${experience.id}`)
        .set('Authorization', `Bearer ${validToken}`);
      const responseTime1 = Date.now() - startTime1;

      // Second request (cache hit)
      const startTime2 = Date.now();
      const response2 = await supertest(app)
        .get(`${BASE_URL}/${experience.id}`)
        .set('Authorization', `Bearer ${validToken}`);
      const responseTime2 = Date.now() - startTime2;

      // Verify response times
      expect(responseTime1).toBeLessThan(200);
      expect(responseTime2).toBeLessThan(responseTime1);

      // Verify response data
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.data).toEqual(response2.body.data);
    });
  });

  describe('PUT /experiences/:id', () => {
    it('should update experience and invalidate cache', async () => {
      // Create test experience
      const experience = await prisma.experience.create({
        data: {
          ...mockExperienceDto,
          profileId: testProfileId
        }
      });

      const updateData = {
        title: 'Updated Title',
        company: 'Updated Company'
      };

      const startTime = Date.now();
      const response = await supertest(app)
        .put(`${BASE_URL}/${experience.id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData);
      const responseTime = Date.now() - startTime;

      // Verify response time
      expect(responseTime).toBeLessThan(200);

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject(updateData);

      // Verify cache invalidation
      const cachedData = await redis.get(`experience:${experience.id}`);
      expect(cachedData).toBeNull();
    });
  });

  describe('DELETE /experiences/:id', () => {
    it('should delete experience and clear cache', async () => {
      // Create test experience
      const experience = await prisma.experience.create({
        data: {
          ...mockExperienceDto,
          profileId: testProfileId
        }
      });

      // Cache the experience
      await redis.set(
        `experience:${experience.id}`,
        JSON.stringify(experience)
      );

      const startTime = Date.now();
      const response = await supertest(app)
        .delete(`${BASE_URL}/${experience.id}`)
        .set('Authorization', `Bearer ${validToken}`);
      const responseTime = Date.now() - startTime;

      // Verify response time
      expect(responseTime).toBeLessThan(200);

      // Verify response
      expect(response.status).toBe(204);

      // Verify database deletion
      const dbRecord = await prisma.experience.findUnique({
        where: { id: experience.id }
      });
      expect(dbRecord).toBeNull();

      // Verify cache deletion
      const cachedData = await redis.get(`experience:${experience.id}`);
      expect(cachedData).toBeNull();
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle validation errors appropriately', async () => {
      const invalidData = {
        title: '', // Empty title
        company: 'Test Company',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2022-01-01'), // End date before start date
        description: 'x'.repeat(1001) // Exceeds max length
      };

      const response = await supertest(app)
        .post(BASE_URL)
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.body.error.validationErrors).toHaveLength(3);
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle authentication errors correctly', async () => {
      // Test missing token
      const noTokenResponse = await supertest(app)
        .post(BASE_URL)
        .send(mockExperienceDto);
      expect(noTokenResponse.status).toBe(401);

      // Test expired token
      const expiredTokenResponse = await supertest(app)
        .post(BASE_URL)
        .set('Authorization', `Bearer ${expiredToken}`)
        .send(mockExperienceDto);
      expect(expiredTokenResponse.status).toBe(401);

      // Test invalid token
      const invalidTokenResponse = await supertest(app)
        .post(BASE_URL)
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(mockExperienceDto);
      expect(invalidTokenResponse.status).toBe(401);
    });
  });
});