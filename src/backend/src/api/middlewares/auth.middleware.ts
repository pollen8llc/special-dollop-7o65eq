/**
 * Authentication middleware for LinkedIn Profiles Gallery backend
 * @module api/middlewares/auth
 * @version 1.0.0
 * @package @clerk/clerk-sdk-node@^4.x
 */

import { Request, Response, NextFunction } from 'express'; // v4.18.2
import { clerk } from '../../config/clerk';
import { AuthUser, RequestWithAuth } from '../../types/auth.types';
import { createUnauthorizedError, createForbiddenError } from '../../utils/errors';

/**
 * Extracts the JWT token from the Authorization header
 * @param req - Express request object
 * @returns JWT token string or null
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

/**
 * Maps Clerk user data to AuthUser interface
 * @param clerkUser - Clerk user object
 * @returns AuthUser object
 */
const mapClerkUserToAuthUser = async (clerkUser: any): Promise<AuthUser> => {
  return {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
    roles: clerkUser.publicMetadata?.roles || ['USER'],
    lastLoginAt: new Date(clerkUser.lastSignInAt || Date.now())
  };
};

/**
 * Middleware to authenticate requests using Clerk
 * Verifies JWT tokens and attaches user information to request
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractToken(req);
    if (!token) {
      throw createUnauthorizedError('No authentication token provided');
    }

    // Verify token with Clerk
    const session = await clerk.sessions.verifyToken(token);
    if (!session) {
      throw createUnauthorizedError('Invalid authentication token');
    }

    // Get user details from Clerk
    const clerkUser = await clerk.users.getUser(session.userId);
    if (!clerkUser) {
      throw createUnauthorizedError('User not found');
    }

    // Map Clerk user to AuthUser
    const authUser = await mapClerkUserToAuthUser(clerkUser);

    // Attach user to request
    (req as RequestWithAuth).user = authUser;

    next();
  } catch (error) {
    if (error.code === 'unauthorized') {
      next(createUnauthorizedError(error.message));
    } else {
      next(createUnauthorizedError('Authentication failed'));
    }
  }
};

/**
 * Middleware to verify user roles
 * Ensures user has at least one of the required roles
 * @param roles - Array of required roles
 */
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as RequestWithAuth;
      
      // Verify user object exists
      if (!authReq.user) {
        throw createUnauthorizedError('User not authenticated');
      }

      // Check if user has any of the required roles
      const hasRequiredRole = authReq.user.roles.some(role => 
        roles.includes(role.toUpperCase())
      );

      if (!hasRequiredRole) {
        throw createForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to verify admin role
 * Shorthand for requireRole(['ADMIN'])
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Middleware to verify moderator role
 * Shorthand for requireRole(['MODERATOR', 'ADMIN'])
 */
export const requireModerator = requireRole(['MODERATOR', 'ADMIN']);