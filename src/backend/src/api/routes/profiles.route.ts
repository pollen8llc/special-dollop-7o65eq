/**
 * @fileoverview Express router configuration for profile management endpoints
 * Implements secure, validated, and performance-optimized CRUD operations
 * with role-based access control and comprehensive error handling
 * @version 1.0.0
 */

import { Router } from 'express'; // ^4.18.2
import rateLimit from 'express-rate-limit'; // ^6.7.0
import { ProfilesController } from '../controllers/profiles.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createProfileSchema, updateProfileSchema } from '../validators/profile.validator';
import { RATE_LIMIT } from '../../config/constants';

/**
 * Initializes and configures profile management routes with comprehensive
 * middleware chains for security, validation, and performance optimization
 * 
 * @param controller - Initialized ProfilesController instance
 * @returns Configured Express router for profile routes
 */
function initializeProfileRoutes(controller: ProfilesController): Router {
  const router = Router({ mergeParams: true });

  // Rate limiting configurations based on authentication status
  const listRateLimit = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS.AUTHENTICATED,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
  });

  const createRateLimit = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS.AUTHENTICATED / 100, // More restrictive for creation
    message: { error: 'Too many profile creation attempts' },
    standardHeaders: true,
    legacyHeaders: false
  });

  const updateRateLimit = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS.AUTHENTICATED / 50, // Moderate restriction for updates
    message: { error: 'Too many profile update attempts' },
    standardHeaders: true,
    legacyHeaders: false
  });

  /**
   * GET /api/v1/profiles
   * Retrieves paginated list of profiles with optional filtering
   */
  router.get(
    '/',
    listRateLimit,
    async (req, res, next) => {
      try {
        await controller.getProfiles(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/profiles/:id
   * Retrieves a single profile by ID with caching
   */
  router.get(
    '/:id',
    listRateLimit,
    async (req, res, next) => {
      try {
        await controller.getProfile(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/profiles
   * Creates a new profile with validation and rate limiting
   */
  router.post(
    '/',
    requireAuth,
    validateRequest(createProfileSchema, 'body', {
      securityChecks: true,
      enableCache: false
    }),
    createRateLimit,
    async (req, res, next) => {
      try {
        await controller.createProfile(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * PUT /api/v1/profiles/:id
   * Updates an existing profile with validation and ownership verification
   */
  router.put(
    '/:id',
    requireAuth,
    validateRequest(updateProfileSchema, 'body', {
      securityChecks: true,
      enableCache: false
    }),
    updateRateLimit,
    async (req, res, next) => {
      try {
        await controller.updateProfile(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/v1/profiles/:id
   * Deletes a profile with admin role verification
   */
  router.delete(
    '/:id',
    requireAuth,
    requireRole(['ADMIN']),
    updateRateLimit,
    async (req, res, next) => {
      try {
        await controller.deleteProfile(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

export default initializeProfileRoutes;