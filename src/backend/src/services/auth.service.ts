/**
 * Authentication Service Module
 * Handles user authentication, session management, and JWT operations using Clerk integration
 * @module services/auth
 * @version 1.0.0
 * @package @clerk/clerk-sdk-node@^4.x
 */

import { User } from '@clerk/clerk-sdk-node'; // v4.x
import { clerk, clerkConfig, sessionConfig } from '../config/clerk';
import { AuthUser, JWTPayload } from '../types/auth.types';
import { createUnauthorizedError, createInternalError } from '../utils/errors';

/**
 * Interface for token validation response with enhanced security metadata
 */
interface TokenValidationResponse {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
}

/**
 * Enhanced Authentication Service with comprehensive security features
 */
export class AuthService {
  private static instance: AuthService;
  private tokenRevocationList: Set<string> = new Set();
  private readonly TOKEN_VALIDATION_ATTEMPTS_MAX = 3;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of AuthService
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Validates JWT token with comprehensive security checks
   * @param token - JWT token to validate
   * @returns Promise resolving to validated token payload
   * @throws Unauthorized error if token is invalid
   */
  public async validateToken(token: string): Promise<JWTPayload> {
    try {
      // Check for empty or malformed token
      if (!token || typeof token !== 'string') {
        throw createUnauthorizedError('Invalid token format');
      }

      // Check token revocation list
      if (this.tokenRevocationList.has(token)) {
        throw createUnauthorizedError('Token has been revoked');
      }

      // Verify token with Clerk
      const validationResponse = await clerk.sessions.verifySession(token);

      if (!validationResponse || !validationResponse.userId) {
        throw createUnauthorizedError('Invalid session token');
      }

      // Construct JWT payload with enhanced security claims
      const payload: JWTPayload = {
        sub: validationResponse.userId,
        email: validationResponse.claims?.email || '',
        roles: validationResponse.claims?.roles || ['USER'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + clerkConfig.jwtExpirySeconds,
        sessionId: validationResponse.id
      };

      return payload;
    } catch (error) {
      if (error.code === 'unauthorized') {
        throw createUnauthorizedError(error.message);
      }
      throw createInternalError('Token validation failed');
    }
  }

  /**
   * Retrieves user details from a valid JWT token
   * @param token - Valid JWT token
   * @returns Promise resolving to authenticated user details
   */
  public async getUserFromToken(token: string): Promise<AuthUser> {
    try {
      const payload = await this.validateToken(token);
      const user = await clerk.users.getUser(payload.sub);

      if (!user) {
        throw createUnauthorizedError('User not found');
      }

      return this.mapClerkUserToAuthUser(user);
    } catch (error) {
      throw createUnauthorizedError('Failed to retrieve user details');
    }
  }

  /**
   * Creates a new authenticated session
   * @param userId - Clerk user ID
   * @returns Promise resolving to session details
   */
  public async createSession(userId: string): Promise<{
    token: string;
    expiresIn: number;
  }> {
    try {
      const session = await clerk.sessions.createSession({
        userId,
        expireInSeconds: clerkConfig.jwtExpirySeconds,
        sessionToken: {
          template: 'default'
        }
      });

      return {
        token: session.id,
        expiresIn: clerkConfig.jwtExpirySeconds
      };
    } catch (error) {
      throw createInternalError('Failed to create session');
    }
  }

  /**
   * Revokes an active session
   * @param token - Session token to revoke
   */
  public async revokeSession(token: string): Promise<void> {
    try {
      await clerk.sessions.revokeSession(token);
      this.tokenRevocationList.add(token);
    } catch (error) {
      throw createInternalError('Failed to revoke session');
    }
  }

  /**
   * Maps Clerk user to internal AuthUser type
   * @param clerkUser - Clerk user object
   * @returns Mapped AuthUser object
   * @private
   */
  private mapClerkUserToAuthUser(clerkUser: User): AuthUser {
    return {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      roles: clerkUser.publicMetadata?.roles || ['USER'],
      lastLoginAt: new Date(clerkUser.lastSignInAt || Date.now())
    };
  }

  /**
   * Verifies if a user has required roles
   * @param user - Authenticated user
   * @param requiredRoles - Array of required roles
   * @returns Boolean indicating if user has required roles
   * @private
   */
  private hasRequiredRoles(user: AuthUser, requiredRoles: string[]): boolean {
    return requiredRoles.every(role => user.roles.includes(role));
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();