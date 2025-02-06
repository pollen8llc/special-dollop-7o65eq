/**
 * Clerk Authentication Configuration Module
 * @module config/clerk
 * @version 1.0.0
 * @package @clerk/clerk-sdk-node@^4.x
 */

import Clerk from '@clerk/clerk-sdk-node'; // v4.x
import { IS_PRODUCTION } from '../config/constants';
import { AuthUser } from '../types/auth.types';

/**
 * Custom error class for Clerk configuration issues
 */
class ClerkConfigurationError extends Error {
  constructor(message: string) {
    super(`Clerk Configuration Error: ${message}`);
    this.name = 'ClerkConfigurationError';
  }
}

/**
 * Validates all required Clerk configuration settings
 * @throws {ClerkConfigurationError} If any validation fails
 */
export const validateClerkConfig = (): void => {
  if (!process.env.CLERK_API_KEY) {
    throw new ClerkConfigurationError('CLERK_API_KEY environment variable is required');
  }

  if (!process.env.CLERK_FRONTEND_API) {
    throw new ClerkConfigurationError('CLERK_FRONTEND_API environment variable is required');
  }

  // Validate API key format (should be a long string starting with 'clerk_')
  if (!/^clerk_[a-zA-Z0-9]{32,}$/.test(process.env.CLERK_API_KEY)) {
    throw new ClerkConfigurationError('Invalid CLERK_API_KEY format');
  }

  // Validate frontend API URL format
  if (!/^https:\/\/[a-zA-Z0-9-]+\.clerk\.accounts\.dev$/.test(process.env.CLERK_FRONTEND_API)) {
    throw new ClerkConfigurationError('Invalid CLERK_FRONTEND_API URL format');
  }

  // Additional production-specific validations
  if (IS_PRODUCTION) {
    if (!process.env.CLERK_OAUTH_CALLBACK_URL) {
      throw new ClerkConfigurationError('CLERK_OAUTH_CALLBACK_URL is required in production');
    }
    
    if (!process.env.CLERK_OAUTH_CALLBACK_URL.startsWith('https://')) {
      throw new ClerkConfigurationError('Production OAuth callback URL must use HTTPS');
    }
  }
};

/**
 * Clerk configuration object with environment-specific settings
 */
export const clerkConfig = {
  apiKey: process.env.CLERK_API_KEY!,
  frontendApi: process.env.CLERK_FRONTEND_API!,
  // JWT expiry set to 24 hours as per security specifications
  jwtExpirySeconds: 24 * 60 * 60,
  oauthCallbackUrl: IS_PRODUCTION
    ? process.env.CLERK_OAUTH_CALLBACK_URL
    : 'http://localhost:3000/auth/callback',
  securitySettings: {
    csrfProtection: true,
    sessionTokenExpiry: 24 * 60 * 60, // 24 hours
    requireVerifiedEmail: true,
    passwordSettings: {
      requireStrongPassword: true,
      minLength: 12
    },
    oauth: {
      providers: ['linkedin'],
      scope: ['r_emailaddress', 'r_liteprofile'],
      promptSelectionScreen: true
    },
    mfa: {
      enabled: IS_PRODUCTION,
      enforced: false
    }
  }
} as const;

/**
 * Initialize Clerk SDK with validated configuration
 */
validateClerkConfig();

export const clerk = Clerk({ apiKey: clerkConfig.apiKey });

/**
 * Type guard to validate Clerk user data
 */
export const isValidClerkUser = (user: any): user is AuthUser => {
  return (
    typeof user === 'object' &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    Array.isArray(user.roles)
  );
};

/**
 * Clerk session configuration for token management
 */
export const sessionConfig = {
  tokenKey: 'clerk_session_token',
  cookieOptions: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    maxAge: clerkConfig.jwtExpirySeconds * 1000
  }
} as const;

/**
 * OAuth configuration for LinkedIn integration
 */
export const oauthConfig = {
  provider: 'linkedin',
  scope: ['r_emailaddress', 'r_liteprofile'],
  responseType: 'code',
  promptSelectionScreen: true,
  redirectUrl: clerkConfig.oauthCallbackUrl
} as const;