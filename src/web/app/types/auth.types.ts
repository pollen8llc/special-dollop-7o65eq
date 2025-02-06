/**
 * Authentication type definitions for the LinkedIn Profiles Gallery application.
 * Provides comprehensive type safety for authentication, authorization, and session management.
 * @version 1.0.0
 */

import { User } from '@clerk/clerk-sdk-node'; // ^4.x
import { ApiResponse, ErrorResponse } from './common.types';

/**
 * Enum defining available user roles for role-based access control
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

/**
 * Enum for supported OAuth providers with extensibility for future additions
 */
export enum OAuthProvider {
  LINKEDIN = 'LINKEDIN'
}

/**
 * Interface representing an authenticated user with strict type safety
 */
export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly imageUrl: string | null;
  readonly roles: readonly UserRole[];
  readonly lastLoginAt: Date;
  readonly metadata: Record<string, unknown>;
}

/**
 * Interface representing an authentication session with versioning support
 */
export interface AuthSession {
  readonly user: Readonly<AuthUser>;
  readonly token: string;
  readonly expiresIn: number;
  readonly refreshToken: string;
  readonly version: string;
}

/**
 * Type for comprehensive authentication error handling
 */
export type AuthError = {
  code: string;
  message: string;
  status: number;
  timestamp: Date;
  details: Record<string, unknown>;
};

/**
 * Type for standardized authentication API responses
 */
export type AuthResponse = ApiResponse<AuthSession>;

/**
 * Interface for comprehensive authentication state management
 */
export interface AuthState {
  readonly isAuthenticated: boolean;
  readonly user: Readonly<AuthUser> | null;
  readonly isLoading: boolean;
  readonly error: AuthError | null;
  readonly lastUpdated: Date;
}

/**
 * Type guard to check if a user has admin role
 */
export function isAdmin(user: AuthUser): boolean {
  return user.roles.includes(UserRole.ADMIN);
}

/**
 * Type guard to check if a user has specific role
 */
export function hasRole(user: AuthUser, role: UserRole): boolean {
  return user.roles.includes(role);
}

/**
 * Type for mapping Clerk User to AuthUser
 */
export type ClerkToAuthUser = (clerkUser: User) => AuthUser;

/**
 * Type for authentication configuration options
 */
export interface AuthConfig {
  readonly tokenExpirationTime: number;
  readonly refreshTokenExpirationTime: number;
  readonly sessionVersion: string;
  readonly providers: readonly OAuthProvider[];
}