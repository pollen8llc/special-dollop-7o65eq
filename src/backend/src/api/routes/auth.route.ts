/**
 * Authentication routes for LinkedIn Profiles Gallery
 * Implements secure authentication endpoints with Clerk integration
 * @module api/routes/auth
 * @version 1.0.0
 */

import { Router } from 'express'; // ^4.18.0
import { AuthController } from '../controllers/auth.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { rateLimiter } from '../middlewares/rateLimiter.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { z } from 'zod'; // ^3.21.0
import { SECURITY } from '../../config/constants';

// Validation schemas for auth endpoints
const signInSchema = z.object({
  token: z.string().min(1).max(1000),
  provider: z.enum(['linkedin']).default('linkedin')
});

const signOutSchema = z.object({
  all: z.boolean().optional().default(false)
});

/**
 * Initializes authentication routes with comprehensive security measures
 * @param authController - Instance of AuthController for handling auth operations
 * @returns Configured Express router with secured auth endpoints
 */
function initializeAuthRoutes(authController: AuthController): Router {
  const router = Router();

  // Apply security headers to all routes
  router.use((req, res, next) => {
    res.set({
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': "default-src 'self'",
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    next();
  });

  // Apply rate limiting to all auth endpoints
  router.use(rateLimiter);

  /**
   * @route POST /auth/signin
   * @description Authenticates user with Clerk using LinkedIn OAuth
   * @access Public
   */
  router.post(
    '/signin',
    validateRequest(signInSchema, 'body'),
    async (req, res, next) => {
      try {
        await authController.signIn(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @route POST /auth/signout
   * @description Signs out user and invalidates session
   * @access Protected
   */
  router.post(
    '/signout',
    requireAuth,
    validateRequest(signOutSchema, 'body'),
    async (req, res, next) => {
      try {
        await authController.signOut(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @route GET /auth/validate
   * @description Validates current session and returns user details
   * @access Protected
   */
  router.get(
    '/validate',
    requireAuth,
    async (req, res, next) => {
      try {
        await authController.validateSession(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @route POST /auth/refresh
   * @description Refreshes access token using refresh token
   * @access Protected
   */
  router.post(
    '/refresh',
    requireAuth,
    rateLimiter,
    async (req, res, next) => {
      try {
        const token = req.cookies[SECURITY.COOKIE_SECRET];
        if (!token) {
          res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'No refresh token provided',
              status: 401
            }
          });
          return;
        }

        await authController.validateSession(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @route GET /auth/roles
   * @description Returns available roles for the authenticated user
   * @access Protected + Admin
   */
  router.get(
    '/roles',
    requireAuth,
    requireRole(['ADMIN']),
    async (req, res) => {
      res.json({
        success: true,
        data: {
          roles: ['USER', 'ADMIN', 'MODERATOR'],
          userRoles: req.user?.roles || []
        },
        timestamp: new Date().toISOString()
      });
    }
  );

  return router;
}

export default initializeAuthRoutes;