/**
 * @fileoverview Experience routes configuration for LinkedIn Profiles Gallery
 * Implements secure CRUD operations for managing professional experiences
 * @version 1.0.0
 */

import { Router } from 'express'; // ^4.18.2
import { requireAuth } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import {
  createExperienceHandler,
  getExperienceHandler,
  getProfileExperiencesHandler,
  updateExperienceHandler,
  deleteExperienceHandler
} from '../controllers/experiences.controller';
import {
  createExperienceSchema,
  updateExperienceSchema
} from '../validators/experience.validator';
import { RATE_LIMIT } from '../../config/constants';
import rateLimit from 'express-rate-limit'; // ^6.7.0

/**
 * Configure rate limiting for experience endpoints
 * Implements tiered rate limiting based on authentication status
 */
const experienceRateLimit = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: (req) => {
    if (req.user?.roles.includes('ADMIN')) {
      return RATE_LIMIT.MAX_REQUESTS.ADMIN;
    }
    return req.user ? RATE_LIMIT.MAX_REQUESTS.AUTHENTICATED : RATE_LIMIT.MAX_REQUESTS.ANONYMOUS;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later'
});

/**
 * Initialize and configure experience router
 */
const experienceRouter = Router();

// Apply global middleware
experienceRouter.use(experienceRateLimit);

/**
 * POST /experiences
 * Create a new experience entry
 * @requires Authentication
 * @requires Validation
 */
experienceRouter.post(
  '/',
  requireAuth,
  validateRequest(createExperienceSchema, 'body'),
  createExperienceHandler
);

/**
 * GET /experiences/:id
 * Retrieve a single experience by ID
 * @requires Authentication
 */
experienceRouter.get(
  '/:id',
  requireAuth,
  getExperienceHandler
);

/**
 * GET /profiles/:profileId/experiences
 * Retrieve paginated experiences for a profile
 * @requires Authentication
 */
experienceRouter.get(
  '/profiles/:profileId/experiences',
  requireAuth,
  getProfileExperiencesHandler
);

/**
 * PUT /experiences/:id
 * Update an existing experience
 * @requires Authentication
 * @requires Validation
 */
experienceRouter.put(
  '/:id',
  requireAuth,
  validateRequest(updateExperienceSchema, 'body'),
  updateExperienceHandler
);

/**
 * DELETE /experiences/:id
 * Delete an experience entry
 * @requires Authentication
 */
experienceRouter.delete(
  '/:id',
  requireAuth,
  deleteExperienceHandler
);

// Export configured router
export default experienceRouter;