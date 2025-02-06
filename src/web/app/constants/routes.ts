/**
 * Route constants and path generation utilities for the LinkedIn Profiles Gallery application.
 * Provides centralized route definitions with type safety and comprehensive authentication support.
 * @version 1.0.0
 */

import type { RouteParams } from '../types/route.types';

/**
 * Type for profile route actions to ensure type safety in path generation
 */
type ProfileAction = 'edit' | 'view';

/**
 * Comprehensive route constants for the application
 * Organized hierarchically for better maintainability
 */
export const ROUTES = {
  /**
   * Home/landing page route
   */
  HOME: '/',

  /**
   * Profile gallery route for browsing all profiles
   */
  GALLERY: '/gallery',

  /**
   * Profile-related routes with nested structure
   */
  PROFILE: {
    /**
     * Base profile route
     */
    ROOT: '/profile',

    /**
     * Route for creating new profiles
     */
    NEW: '/profile/new',

    /**
     * Dynamic route for viewing specific profiles
     * Requires :id parameter
     */
    VIEW: '/profile/:id',

    /**
     * Dynamic route for editing specific profiles
     * Requires :id parameter and proper authorization
     */
    EDIT: '/profile/:id/edit'
  },

  /**
   * Authentication-related routes
   */
  AUTH: {
    /**
     * Sign-in route with LinkedIn OAuth support
     */
    SIGNIN: '/auth/signin',

    /**
     * Sign-out route for terminating sessions
     */
    SIGNOUT: '/auth/signout',

    /**
     * OAuth callback route for handling authentication responses
     */
    CALLBACK: '/auth/callback',

    /**
     * Route for handling authentication errors
     */
    ERROR: '/auth/error'
  }
} as const;

/**
 * Generates a type-safe profile route path with optional action parameter
 * @param id - The profile ID to generate the path for
 * @param action - Optional action modifier (edit or view)
 * @returns The complete profile route path
 */
export function getProfilePath(id: string, action?: ProfileAction): string {
  // Validate id parameter
  if (!id) {
    throw new Error('Profile ID is required for path generation');
  }

  // Generate the appropriate path based on the action
  switch (action) {
    case 'edit':
      return ROUTES.PROFILE.EDIT.replace(':id', id);
    case 'view':
      return ROUTES.PROFILE.VIEW.replace(':id', id);
    default:
      return `${ROUTES.PROFILE.ROOT}/${id}`;
  }
}

/**
 * Type guard to validate profile route parameters
 * @param params - Route parameters to validate
 * @returns Boolean indicating if parameters are valid profile route parameters
 */
export function isProfileRouteParams(params: unknown): params is RouteParams {
  return (
    typeof params === 'object' &&
    params !== null &&
    'profileId' in params &&
    typeof (params as RouteParams).profileId === 'string'
  );
}

/**
 * Generates a gallery route with optional query parameters
 * @param page - Optional page number for pagination
 * @returns The complete gallery route path with query parameters
 */
export function getGalleryPath(page?: number): string {
  if (!page || page <= 1) {
    return ROUTES.GALLERY;
  }
  return `${ROUTES.GALLERY}?page=${page}`;
}

/**
 * Generates an authentication route with optional return URL
 * @param returnTo - Optional URL to redirect to after authentication
 * @returns The complete authentication route with encoded return URL
 */
export function getAuthPath(returnTo?: string): string {
  if (!returnTo) {
    return ROUTES.AUTH.SIGNIN;
  }
  return `${ROUTES.AUTH.SIGNIN}?returnTo=${encodeURIComponent(returnTo)}`;
}