/**
 * TypeScript type definitions for Remix route parameters, loaders, and actions.
 * Provides comprehensive type safety for route handling in the LinkedIn Profiles Gallery application.
 * @version 1.0.0
 */

import type { LoaderFunction, ActionFunction } from '@remix-run/node'; // ^1.19.0
import type {
  Profile,
  ProfileFormData,
  ProfileResponse,
  ProfileListResponse
} from './profile.types';
import type {
  AuthUser,
  AuthSession,
  AuthResponse
} from './auth.types';
import type {
  ApiResponse,
  QueryParams
} from './common.types';

/**
 * Interface defining route parameters for dynamic routes
 * Ensures type safety for URL parameters across the application
 */
export interface RouteParams {
  profileId: string;
}

/**
 * Interface for gallery route loader data
 * Combines profile list response with authenticated user data
 */
export interface GalleryLoaderData {
  profiles: ProfileListResponse;
  user: AuthUser | null;
  queryParams: QueryParams;
}

/**
 * Interface for profile detail route loader data
 * Combines single profile response with authenticated user data
 */
export interface ProfileLoaderData {
  profile: ProfileResponse;
  user: AuthUser | null;
  isOwner: boolean;
}

/**
 * Interface for authentication route loader data
 * Provides session information for auth-related routes
 */
export interface AuthLoaderData {
  session: AuthSession | null;
  returnTo: string | null;
}

/**
 * Interface for profile action response data
 * Standardizes action responses for profile operations
 */
export interface ProfileActionData {
  success: boolean;
  data: Profile | null;
  error: string | null;
  fieldErrors?: Record<keyof ProfileFormData, string>;
}

/**
 * Type alias for gallery route loader function
 * Ensures type safety for gallery data loading
 */
export type GalleryLoader = LoaderFunction<GalleryLoaderData>;

/**
 * Type alias for profile route loader function
 * Ensures type safety for profile detail data loading
 */
export type ProfileLoader = LoaderFunction<ProfileLoaderData>;

/**
 * Type alias for authentication route loader function
 * Ensures type safety for auth-related data loading
 */
export type AuthLoader = LoaderFunction<AuthLoaderData>;

/**
 * Type alias for profile route action function
 * Ensures type safety for profile mutations
 */
export type ProfileAction = ActionFunction<ApiResponse<Profile>>;

/**
 * Type alias for profile form submission data
 * Ensures type safety for form handling
 */
export type ProfileFormSubmission = ProfileFormData & {
  _action: 'create' | 'update' | 'delete';
};

/**
 * Type guard to check if user is profile owner
 */
export function isProfileOwner(user: AuthUser | null, profile: Profile): boolean {
  return !!user && user.id === profile.userId;
}