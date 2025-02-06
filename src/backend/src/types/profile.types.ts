/**
 * @fileoverview Core type definitions for professional profiles in the LinkedIn Profiles Gallery backend
 * @version 1.0.0
 */

import { ApiResponse } from './api.types';
import { User } from './user.types';
import { Experience } from './experience.types';

/**
 * Core interface representing a professional profile entity
 */
export interface Profile {
  /** Unique identifier for the profile */
  id: string;

  /** Reference to the user who owns this profile */
  userId: string;

  /** Professional headline or tagline */
  headline: string;

  /** Detailed professional bio or summary */
  bio: string | null;

  /** URL to profile avatar image */
  avatarUrl: string | null;

  /** Collection of social media profile links */
  socialLinks: SocialLinks;

  /** Array of professional experiences */
  experiences: Experience[];

  /** Timestamp when the profile was created */
  createdAt: Date;

  /** Timestamp when the profile was last updated */
  updatedAt: Date;
}

/**
 * Interface defining social media profile links
 */
export interface SocialLinks {
  /** LinkedIn profile URL */
  linkedin: string | null;

  /** GitHub profile URL */
  github: string | null;

  /** Personal website URL */
  website: string | null;
}

/**
 * Data transfer object for creating new profiles
 */
export interface CreateProfileDto {
  /** Professional headline or tagline */
  headline: string;

  /** Optional professional bio */
  bio: string | null;

  /** Optional avatar image URL */
  avatarUrl: string | null;

  /** Optional social media links */
  socialLinks: Partial<SocialLinks>;
}

/**
 * Data transfer object for updating existing profiles
 * All fields are optional to support partial updates
 */
export interface UpdateProfileDto {
  /** Updated professional headline */
  headline?: string;

  /** Updated professional bio */
  bio?: string | null;

  /** Updated avatar image URL */
  avatarUrl?: string | null;

  /** Updated social media links */
  socialLinks?: Partial<SocialLinks>;
}

/**
 * API response type for single profile operations
 * Extends the base ApiResponse with Profile data
 */
export interface ProfileResponse extends ApiResponse<Profile> {
  data: Profile;
}

/**
 * API response type for paginated profile list operations
 * Includes pagination metadata
 */
export interface ProfileListResponse extends ApiResponse<Profile[]> {
  /** Array of profile data */
  data: Profile[];

  /** Current page number */
  page: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of profiles */
  total: number;
}

/**
 * Type alias for profile ID to ensure consistent typing
 */
export type ProfileId = string;