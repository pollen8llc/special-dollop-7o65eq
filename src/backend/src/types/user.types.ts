/**
 * @fileoverview Core type definitions for user entities in the LinkedIn Profiles Gallery backend
 * @version 1.0.0
 * @package @clerk/clerk-sdk-node@^4.x
 */

import { User as ClerkUser } from '@clerk/clerk-sdk-node';
import { UserRole } from './auth.types';

/**
 * Core user entity interface defining the structure of user data in the system
 */
export interface User {
  /** Unique identifier for the user */
  id: string;

  /** User's email address */
  email: string;

  /** User's full name (optional) */
  name: string | null;

  /** Additional user metadata including roles and preferences */
  metadata: UserMetadata;

  /** Timestamp when the user was created */
  createdAt: Date;

  /** Timestamp when the user was last updated */
  updatedAt: Date;
}

/**
 * Interface for storing user metadata including roles and preferences
 */
export interface UserMetadata {
  /** Timestamp of user's last login */
  lastLoginAt: Date | null;

  /** Array of user roles for role-based access control */
  roles: UserRole[];

  /** User customization preferences */
  preferences: UserPreferences;
}

/**
 * Interface defining user customization preferences
 */
export interface UserPreferences {
  /** User's preferred theme setting */
  theme: ThemePreference;

  /** Flag indicating whether email notifications are enabled */
  emailNotifications: boolean;
}

/**
 * Enum defining available theme options for user interface customization
 */
export enum ThemePreference {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM'
}

/**
 * Data transfer object for creating new user entities
 */
export interface CreateUserDto {
  /** User's email address */
  email: string;

  /** User's full name (optional) */
  name: string | null;

  /** Optional metadata for user creation */
  metadata: Partial<UserMetadata>;
}

/**
 * Data transfer object for updating existing user entities
 */
export interface UpdateUserDto {
  /** Updated user name (optional) */
  name?: string | null;

  /** Updated user metadata (optional) */
  metadata?: Partial<UserMetadata>;
}

/**
 * Interface combining user data with associated profile ID reference
 */
export interface UserWithProfileId {
  /** Complete user entity */
  user: User;

  /** Associated profile ID (if exists) */
  profileId: string | null;
}