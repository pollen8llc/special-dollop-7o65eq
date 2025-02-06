/**
 * Core security utility module for LinkedIn Profiles Gallery backend
 * Provides JWT validation, encryption, and role-based access control
 * @module utils/security
 * @version 1.0.0
 */

import { RequestHandler } from 'express';
import * as crypto from 'node:crypto';
import * as jwt from 'jsonwebtoken'; // v9.0.0
import { clerkConfig } from '../config/clerk';
import { createUnauthorizedError, createForbiddenError } from './errors';
import { AuthUser, JWTPayload, UserRole } from '../types/auth.types';

// Environment variables for security configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

if (!ENCRYPTION_KEY || !JWT_SECRET) {
  throw new Error('Security configuration error: Missing required environment variables');
}

/**
 * Validates a JWT token with comprehensive security checks
 * @param token - JWT token to validate
 * @returns Decoded and validated JWT payload
 * @throws Unauthorized error if validation fails
 */
export async function validateJWT(token: string): Promise<JWTPayload> {
  try {
    // Validate token format
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    // Verify JWT signature and decode payload
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      maxAge: clerkConfig.jwtExpirySeconds
    }) as JWTPayload;

    // Validate payload structure
    if (!decoded.sub || !decoded.roles || !Array.isArray(decoded.roles)) {
      throw new Error('Invalid token payload structure');
    }

    // Validate token expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp <= now) {
      throw new Error('Token has expired');
    }

    return decoded;
  } catch (error) {
    throw createUnauthorizedError(
      error instanceof Error ? error.message : 'Invalid token'
    );
  }
}

/**
 * Encrypts sensitive data using AES-256-GCM with secure IV handling
 * @param data - Data to encrypt
 * @returns Encrypted data with IV prepended
 */
export function encryptData(data: string): string {
  try {
    // Generate random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine IV, encrypted data, and auth tag
    return Buffer.concat([
      iv,
      Buffer.from(encrypted, 'hex'),
      authTag
    ]).toString('hex');
  } catch (error) {
    throw new Error('Encryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Decrypts data encrypted with encryptData function
 * @param encryptedData - Encrypted data to decrypt
 * @returns Original decrypted data
 */
export function decryptData(encryptedData: string): string {
  try {
    // Convert hex to buffer
    const buffer = Buffer.from(encryptedData, 'hex');

    // Extract IV, encrypted data, and auth tag
    const iv = buffer.subarray(0, 16);
    const authTag = buffer.subarray(buffer.length - 16);
    const encrypted = buffer.subarray(16, buffer.length - 16);

    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    // Set auth tag
    decipher.setAuthTag(authTag);

    // Decrypt data
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Decryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Checks if a user has a specific role
 * @param user - Authenticated user object
 * @param role - Role to check
 * @returns True if user has role, false otherwise
 */
export function hasRole(user: AuthUser, role: UserRole): boolean {
  try {
    // Validate user object
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    // Validate role parameter
    if (!Object.values(UserRole).includes(role)) {
      return false;
    }

    return user.roles.includes(role);
  } catch {
    return false;
  }
}

/**
 * Express middleware that ensures user has required role
 * @param role - Required role for access
 * @returns Express middleware function
 */
export function requireRole(role: UserRole): RequestHandler {
  return (req, res, next) => {
    try {
      const user = req.user as AuthUser;

      // Validate user object
      if (!user || !user.id) {
        throw createUnauthorizedError('Authentication required');
      }

      // Check role
      if (!hasRole(user, role)) {
        throw createForbiddenError(`Required role: ${role}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}