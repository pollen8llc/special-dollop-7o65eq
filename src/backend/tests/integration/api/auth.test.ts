/**
 * Integration tests for authentication endpoints with comprehensive security validation
 * @package jest@^29.0.0
 * @package supertest@^6.3.0
 */

import request from 'supertest';
import express, { Express } from 'express';
import { AuthController } from '../../../src/api/controllers/auth.controller';
import { AuthService } from '../../../src/services/auth.service';
import { AuthUser } from '../../../src/types/auth.types';
import { RATE_LIMIT, SECURITY } from '../../../src/config/constants';

// Mock AuthService
jest.mock('../../../src/services/auth.service');

describe('Auth API Integration Tests', () => {
  let app: Express;
  let mockAuthService: jest.Mocked<AuthService>;
  let authController: AuthController;

  // Test data
  const validToken = 'valid.jwt.token';
  const expiredToken = 'expired.jwt.token';
  const invalidToken = 'invalid.token';
  const mockUser: AuthUser = {
    id: '123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: 'https://example.com/avatar.jpg',
    roles: ['USER'],
    lastLoginAt: new Date()
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create fresh Express app
    app = express();
    app.use(express.json());

    // Setup mock AuthService
    mockAuthService = {
      validateToken: jest.fn(),
      createSession: jest.fn(),
      getUserFromToken: jest.fn(),
      verifyRoleAccess: jest.fn(),
      checkRateLimits: jest.fn()
    } as unknown as jest.Mocked<AuthService>;

    // Initialize controller with mock service
    authController = new AuthController(mockAuthService);

    // Configure routes
    app.post('/auth/signin', authController.signIn);
    app.post('/auth/signout', authController.signOut);
    app.get('/auth/validate', authController.validateSession);
  });

  describe('POST /auth/signin', () => {
    it('should return 200 and session data with valid token and proper security headers', async () => {
      // Setup mocks
      mockAuthService.validateToken.mockResolvedValue({
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
        iat: Date.now(),
        exp: Date.now() + 3600,
        sessionId: 'session123'
      });
      mockAuthService.createSession.mockResolvedValue({
        token: validToken,
        expiresIn: SECURITY.JWT_EXPIRY_SECONDS
      });

      const response = await request(app)
        .post('/auth/signin')
        .set('Authorization', `Bearer ${validToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          token: validToken,
          expiresIn: SECURITY.JWT_EXPIRY_SECONDS
        },
        timestamp: expect.any(String)
      });
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    it('should return 401 with invalid token format', async () => {
      const response = await request(app)
        .post('/auth/signin')
        .set('Authorization', invalidToken)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with expired token', async () => {
      mockAuthService.validateToken.mockRejectedValue(new Error('Token expired'));

      const response = await request(app)
        .post('/auth/signin')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 429 when rate limit exceeded', async () => {
      // Simulate rate limit exceeded
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/auth/signin')
          .set('Authorization', `Bearer ${invalidToken}`)
          .send();
      }

      const response = await request(app)
        .post('/auth/signin')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send();

      expect(response.status).toBe(429);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('POST /auth/signout', () => {
    it('should return 200 on successful signout with session cleanup', async () => {
      // Setup cookie with valid session token
      const response = await request(app)
        .post('/auth/signout')
        .set('Cookie', [`${SECURITY.COOKIE_SECRET}=${validToken}`])
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 with invalid session token', async () => {
      const response = await request(app)
        .post('/auth/signout')
        .set('Cookie', [`${SECURITY.COOKIE_SECRET}=${invalidToken}`])
        .send();

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /auth/validate', () => {
    it('should return 200 and user data with valid session and security headers', async () => {
      mockAuthService.validateToken.mockResolvedValue({
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
        iat: Date.now(),
        exp: Date.now() + 3600,
        sessionId: 'session123'
      });
      mockAuthService.getUserFromToken.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/auth/validate')
        .set('Cookie', [`${SECURITY.COOKIE_SECRET}=${validToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.data.user).toEqual(mockUser);
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should return 401 with expired session token', async () => {
      mockAuthService.validateToken.mockRejectedValue(new Error('Session expired'));

      const response = await request(app)
        .get('/auth/validate')
        .set('Cookie', [`${SECURITY.COOKIE_SECRET}=${expiredToken}`]);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 with insufficient permissions', async () => {
      mockAuthService.validateToken.mockResolvedValue({
        sub: mockUser.id,
        email: mockUser.email,
        roles: ['USER'],
        iat: Date.now(),
        exp: Date.now() + 3600,
        sessionId: 'session123'
      });
      mockAuthService.verifyRoleAccess.mockResolvedValue(false);

      const response = await request(app)
        .get('/auth/validate')
        .set('Cookie', [`${SECURITY.COOKIE_SECRET}=${validToken}`])
        .set('X-Required-Roles', ['ADMIN']);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});