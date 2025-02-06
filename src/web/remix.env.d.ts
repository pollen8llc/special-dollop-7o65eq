/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

import type { Session as RemixSession } from '@remix-run/node';
import type { AuthUser } from './app/types/auth.types';
import type { LoadingState, Theme } from './app/types/common.types';

/**
 * Extend NodeJS ProcessEnv interface with strict environment variable types
 * @version 1.0.0
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * Application environment
     */
    NODE_ENV: 'development' | 'production' | 'test';

    /**
     * Clerk authentication configuration
     */
    CLERK_PUBLISHABLE_KEY: string;
    CLERK_SECRET_KEY: string;

    /**
     * Infrastructure configuration
     */
    REDIS_URL: string;
    API_URL: string;
    DATABASE_URL: string;

    /**
     * Application configuration
     */
    SESSION_SECRET: string;
    PORT: string;
    HOST: string;
  }
}

/**
 * Extended Session interface with authentication and user data
 */
export interface Session extends RemixSession {
  /**
   * Authenticated user information
   */
  user: AuthUser | null;

  /**
   * Authentication token
   */
  token: string | null;

  /**
   * Session expiration timestamp
   */
  expiresAt: number;

  /**
   * Authentication state
   */
  isAuthenticated: boolean;
}

/**
 * Extended AppLoadContext with application-specific data
 */
export interface AppLoadContext {
  /**
   * Current authenticated user
   */
  user: AuthUser | null;

  /**
   * Environment variables
   */
  env: ProcessEnv;

  /**
   * Session data
   */
  session: Session;

  /**
   * Application state
   */
  loadingState: LoadingState;
  theme: Theme;

  /**
   * Request metadata
   */
  requestId: string;
  timestamp: number;
}

/**
 * Extend default MetaFunction return type
 */
export interface MetaDescriptor {
  title?: string;
  description?: string;
  'og:title'?: string;
  'og:description'?: string;
  'og:image'?: string;
  'twitter:card'?: string;
  'twitter:title'?: string;
  'twitter:description'?: string;
  'twitter:image'?: string;
}