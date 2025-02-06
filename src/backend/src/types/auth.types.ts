/**
 * @fileoverview Type definitions for authentication-related entities
 * @version 1.0.0
 * @package @clerk/clerk-sdk-node@^4.x
 */

import { User as ClerkUser } from '@clerk/clerk-sdk-node';

/**
 * Enum defining available user roles for role-based access control
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

/**
 * Interface representing an authenticated user with essential profile information and roles
 */
export interface AuthUser {
  /** Unique identifier for the user */
  id: string;
  
  /** User's email address */
  email: string;
  
  /** User's first name (optional) */
  firstName: string | null;
  
  /** User's last name (optional) */
  lastName: string | null;
  
  /** URL to user's profile image (optional) */
  imageUrl: string | null;
  
  /** Array of user roles for RBAC */
  roles: string[];
  
  /** Timestamp of user's last login */
  lastLoginAt: Date;
}

/**
 * Interface defining the structure of JWT token payload with security claims
 */
export interface JWTPayload {
  /** Subject identifier (user ID) */
  sub: string;
  
  /** User's email address */
  email: string;
  
  /** Array of user roles */
  roles: string[];
  
  /** Token issued at timestamp */
  iat: number;
  
  /** Token expiration timestamp */
  exp: number;
  
  /** Unique session identifier */
  sessionId: string;
}

/**
 * Interface representing an authentication session with tokens and expiration
 */
export interface AuthSession {
  /** Authenticated user information */
  user: AuthUser;
  
  /** JWT access token */
  token: string;
  
  /** Token expiration time in seconds */
  expiresIn: number;
  
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  
  /** Unique session identifier */
  sessionId: string;
}

/**
 * Interface extending Express Request with authentication context
 */
export interface RequestWithAuth {
  /** Authenticated user information */
  user: AuthUser;
  
  /** Current authentication session */
  session: AuthSession;
  
  /** JWT access token */
  token: string;
}