/**
 * Core configuration constants for LinkedIn Profiles Gallery backend
 * @module config/constants
 * @version 1.0.0
 */

// Node.js v18.x
import { env } from 'process';

/**
 * Environment configuration flags and settings
 */
export const ENV = {
  NODE_ENV: env.NODE_ENV || 'development',
  IS_PRODUCTION: env.NODE_ENV === 'production',
  IS_DEVELOPMENT: env.NODE_ENV === 'development',
  IS_TEST: env.NODE_ENV === 'test'
} as const;

/**
 * API configuration settings
 * Defines core API parameters for server setup and request handling
 */
export const API = {
  PORT: parseInt(env.PORT || '3000', 10),
  VERSION: 'v1',
  BASE_PATH: `/api/v1`,
  // Technical spec requirement: API Response Time < 200ms for 95th percentile
  TIMEOUT_MS: 15000 // 15 second global timeout
} as const;

/**
 * Rate limiting configuration
 * Implements tiered rate limiting based on authentication status
 */
export const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000, // 1 minute window
  MAX_REQUESTS: {
    ANONYMOUS: 60, // 60 requests per minute for anonymous users
    AUTHENTICATED: 1000, // 1000 requests per minute for authenticated users
    ADMIN: 5000 // 5000 requests per minute for admin users
  }
} as const;

/**
 * Cache configuration settings
 * Redis caching parameters for optimizing performance
 */
export const CACHE = {
  TTL: 3600, // 1 hour default TTL
  PREFIX: 'linkedin_gallery:', // Cache key prefix
  MAX_ITEMS: 10000, // Maximum cached items
  PROFILE_TTL: 300, // 5 minutes for profile data
  GALLERY_TTL: 60 // 1 minute for gallery listings
} as const;

/**
 * Security configuration
 * Authentication and authorization parameters
 */
export const SECURITY = {
  CORS_ORIGINS: env.CORS_ORIGINS ? 
    env.CORS_ORIGINS.split(',') : 
    ['http://localhost:3000'],
  JWT_EXPIRY_SECONDS: 24 * 60 * 60, // 24 hours token expiry
  BCRYPT_ROUNDS: 12, // Password hashing rounds
  CLERK_API_KEY: env.CLERK_API_KEY,
  LINKEDIN_CLIENT_ID: env.LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: env.LINKEDIN_CLIENT_SECRET,
  COOKIE_SECRET: env.COOKIE_SECRET || 'development-secret',
  CSRF_TOKEN_SECRET: env.CSRF_TOKEN_SECRET || 'development-csrf-secret'
} as const;

/**
 * Pagination configuration
 * Controls list endpoint response sizes
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12, // Default items per page for gallery view
  MAX_PAGE_SIZE: 100 // Maximum allowed items per request
} as const;

/**
 * Database configuration
 * PostgreSQL connection and pool settings
 */
export const DATABASE = {
  MAX_CONNECTIONS: 20,
  IDLE_TIMEOUT_MS: 10000,
  CONNECTION_TIMEOUT_MS: 2000,
  STATEMENT_TIMEOUT_MS: 10000
} as const;

/**
 * Monitoring configuration
 * Performance and error tracking parameters
 */
export const MONITORING = {
  SLOW_QUERY_THRESHOLD_MS: 1000,
  ERROR_SAMPLING_RATE: 0.1,
  PERFORMANCE_METRIC_INTERVAL_MS: 60000
} as const;

/**
 * Feature flags
 * Toggle specific functionality based on environment
 */
export const FEATURES = {
  ENABLE_CACHE: env.ENABLE_CACHE === 'true' || ENV.IS_PRODUCTION,
  ENABLE_RATE_LIMITING: env.ENABLE_RATE_LIMITING === 'true' || ENV.IS_PRODUCTION,
  ENABLE_REQUEST_LOGGING: env.ENABLE_REQUEST_LOGGING === 'true' || !ENV.IS_PRODUCTION
} as const;