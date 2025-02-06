/**
 * TypeScript type definitions and interfaces for professional profiles in the LinkedIn Profiles Gallery.
 * Provides comprehensive type safety for profile data structures, form handling, and API responses.
 * @version 1.0.0
 */

import { Experience } from './experience.types';
import { ApiResponse, PaginatedResponse } from './common.types';

/**
 * Core profile entity interface defining the structure of a professional profile
 * Maps directly to the database schema structure
 */
export interface Profile {
  id: string;
  userId: string;
  headline: string;
  bio: string | null;
  avatarUrl: string | null;
  socialLinks: SocialLinks;
  experiences: Experience[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for profile social media links with optional fields
 * All fields are nullable to support partial profile completion
 */
export interface SocialLinks {
  linkedin: string | null;
  github: string | null;
  website: string | null;
}

/**
 * Interface for profile form data with partial social links support
 * Used for creating and updating profiles through forms
 */
export interface ProfileFormData {
  headline: string;
  bio: string | null;
  avatarUrl: string | null;
  socialLinks: Partial<SocialLinks>;
}

/**
 * Type alias for profile ID to ensure consistent ID typing across the application
 */
export type ProfileId = string;

/**
 * API response interface for single profile operations
 * Extends the base ApiResponse type with Profile data
 */
export interface ProfileResponse extends ApiResponse<Profile> {
  data: Profile;
  error: ErrorResponse | null;
}

/**
 * API response interface for paginated profile list operations
 * Extends the base PaginatedResponse type with Profile array data
 */
export interface ProfileListResponse extends PaginatedResponse<Profile> {
  data: Profile[];
  pagination: PaginationMetadata;
  error: ErrorResponse | null;
}