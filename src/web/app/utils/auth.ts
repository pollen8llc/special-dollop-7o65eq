/**
 * Authentication utility functions for the LinkedIn Profiles Gallery application.
 * Provides secure user authentication, role validation, and session management.
 * @version 1.0.0
 */

import { redirect } from '@remix-run/node';
import { AuthUser, AuthError, UserRole, AuthState } from '../types/auth.types';
import { clerk, getAuthenticatedUser } from '../lib/clerk';

// Authentication configuration constants
const LOGIN_ROUTE = '/auth/signin';
const GALLERY_ROUTE = '/gallery';
const MAX_AUTH_RETRIES = 3;
const AUTH_RETRY_DELAY = 1000;

/**
 * Checks if the current user is authenticated with retry logic and exponential backoff
 * @returns Promise<boolean> Authentication status
 */
export async function isAuthenticated(): Promise<boolean> {
  let retries = 0;
  let delay = AUTH_RETRY_DELAY;

  while (retries < MAX_AUTH_RETRIES) {
    try {
      const session = await clerk.session;
      if (!session) return false;

      const lastActivityTime = new Date(session.lastActiveAt).getTime();
      const currentTime = new Date().getTime();
      const sessionValid = currentTime - lastActivityTime < session.expireAt;

      return session.status === 'active' && sessionValid;
    } catch (error) {
      retries++;
      if (retries === MAX_AUTH_RETRIES) {
        console.error('Authentication check failed:', error);
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  return false;
}

/**
 * Validates if the authenticated user has the required role with role hierarchy
 * @param requiredRole The minimum role required for access
 * @returns Promise<boolean> Role validation result
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.roles?.length) return false;

    // Role hierarchy implementation
    const roleHierarchy = {
      [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.USER],
      [UserRole.USER]: [UserRole.USER]
    };

    const userRoles = user.roles;
    const allowedRoles = roleHierarchy[requiredRole];

    return userRoles.some(role => allowedRoles.includes(role));
  } catch (error) {
    console.error('Role validation error:', error);
    return false;
  }
}

/**
 * Higher-order function to enforce authentication with enhanced security checks
 * @param request Incoming request object
 * @returns Promise<AuthUser> Authenticated user data
 * @throws Redirect to login if not authenticated
 */
export async function requireAuthentication(request: Request): Promise<AuthUser> {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      const searchParams = new URLSearchParams([
        ['redirect', request.url],
        ['error', 'session_expired']
      ]);
      throw redirect(`${LOGIN_ROUTE}?${searchParams.toString()}`);
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      throw redirect(LOGIN_ROUTE);
    }

    return user;
  } catch (error) {
    if (error instanceof Response) throw error;
    
    const authError: AuthError = {
      code: 'AUTH_REQUIRED',
      message: 'Authentication required',
      status: 401,
      timestamp: new Date(),
      details: { originalError: error }
    };
    console.error('Authentication error:', authError);
    throw redirect(LOGIN_ROUTE);
  }
}

/**
 * Higher-order function to enforce role-based access with comprehensive validation
 * @param request Incoming request object
 * @param requiredRole Minimum role required for access
 * @returns Promise<AuthUser> Authorized user data
 * @throws Redirect to appropriate route if unauthorized
 */
export async function requireRole(
  request: Request,
  requiredRole: UserRole
): Promise<AuthUser> {
  try {
    const user = await requireAuthentication(request);
    const hasRequiredRole = await hasRole(requiredRole);

    if (!hasRequiredRole) {
      const authError: AuthError = {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Required role: ${requiredRole}`,
        status: 403,
        timestamp: new Date(),
        details: { userRoles: user.roles }
      };
      console.error('Authorization error:', authError);
      throw redirect(GALLERY_ROUTE);
    }

    return user;
  } catch (error) {
    if (error instanceof Response) throw error;
    throw redirect(GALLERY_ROUTE);
  }
}

/**
 * Retrieves current authentication state with comprehensive status tracking
 * @returns Promise<AuthState> Current authentication state
 */
export async function getAuthState(): Promise<AuthState> {
  const state: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
    lastUpdated: new Date()
  };

  try {
    const authCheckPromise = isAuthenticated();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Auth check timeout')), 5000);
    });

    const authenticated = await Promise.race([authCheckPromise, timeoutPromise]);
    state.isAuthenticated = authenticated as boolean;

    if (state.isAuthenticated) {
      state.user = await getAuthenticatedUser();
    }
  } catch (error) {
    state.error = {
      code: 'AUTH_STATE_ERROR',
      message: 'Failed to get authentication state',
      status: 500,
      timestamp: new Date(),
      details: { error }
    };
    console.error('Auth state error:', state.error);
  } finally {
    state.isLoading = false;
    state.lastUpdated = new Date();
  }

  return state;
}