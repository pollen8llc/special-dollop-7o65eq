/**
 * Server-side Clerk authentication implementation for LinkedIn Profiles Gallery
 * Provides secure authentication, session management, and role-based access control
 * @version 1.0.0
 */

import { Clerk, Session as ClerkSession } from '@clerk/clerk-sdk-node'; // ^4.x
import { createClerkClient } from '@clerk/remix'; // ^3.x
import { AuthUser, UserRole, AuthError } from '../types/auth.types';
import { Redis } from 'ioredis'; // ^5.x
import { json, redirect } from '@remix-run/node'; // ^1.x

// Environment variables and constants
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;
const MAX_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_FAILED_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const CACHE_TTL = 60 * 15; // 15 minutes

// Initialize Clerk client with strict typing
if (!CLERK_SECRET_KEY) throw new Error('CLERK_SECRET_KEY is required');

export const clerk = createClerkClient({
  secretKey: CLERK_SECRET_KEY,
  publishableKey: CLERK_PUBLISHABLE_KEY
});

// Initialize Redis client for session caching and rate limiting
const redis = new Redis(process.env.REDIS_URL || '');

/**
 * Retrieves and validates the current authentication session
 * Implements comprehensive security checks and caching strategy
 */
export async function getAuth(
  request: Request
): Promise<AuthUser | null> {
  try {
    // Extract session token from request
    const sessionToken = request.headers.get('Authorization')?.split(' ')[1] ||
      request.headers.get('Cookie')?.match(/(?:^|; )__session=([^;]+)/)?.[1];

    if (!sessionToken) return null;

    // Check cache first
    const cachedSession = await redis.get(`auth:${sessionToken}`);
    if (cachedSession) {
      return JSON.parse(cachedSession) as AuthUser;
    }

    // Validate session with Clerk
    const session = await clerk.sessions.verifySession(sessionToken);
    if (!session || !(await validateSession(session))) {
      return null;
    }

    // Check for IP-based blocks
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const failedAttempts = await redis.get(`auth:failed:${clientIp}`);
    if (failedAttempts && parseInt(failedAttempts) >= MAX_FAILED_ATTEMPTS) {
      throw new Error('Too many failed attempts');
    }

    // Transform Clerk user to AuthUser
    const user = await clerk.users.getUser(session.userId);
    const authUser: AuthUser = {
      id: user.id,
      email: user.emailAddresses[0].emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      roles: user.publicMetadata.roles || [UserRole.USER],
      lastLoginAt: new Date(session.lastActiveAt),
      metadata: user.publicMetadata
    };

    // Cache valid session
    await redis.setex(`auth:${sessionToken}`, CACHE_TTL, JSON.stringify(authUser));

    // Log successful authentication
    console.info(`Authentication successful for user ${authUser.id}`);

    return authUser;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Middleware to ensure route requires authentication with role-based access control
 * Implements progressive security measures and rate limiting
 */
export async function requireAuth(
  request: Request,
  requiredRoles: UserRole[] = []
): Promise<AuthUser> {
  const user = await getAuth(request);
  
  if (!user) {
    throw redirect('/login');
  }

  // Verify required roles
  if (requiredRoles.length > 0 && 
      !requiredRoles.some(role => user.roles.includes(role))) {
    throw json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Implement rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  const requestCount = await redis.incr(`ratelimit:${clientIp}`);
  await redis.expire(`ratelimit:${clientIp}`, RATE_LIMIT_WINDOW);

  if (requestCount > 100) { // 100 requests per minute
    throw json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  return user;
}

/**
 * Internal helper to validate session integrity and permissions
 * Implements comprehensive security checks
 */
async function validateSession(session: ClerkSession): Promise<boolean> {
  try {
    // Check session expiration
    if (new Date(session.lastActiveAt).getTime() + MAX_SESSION_DURATION < Date.now()) {
      return false;
    }

    // Verify session integrity
    if (!session.status || session.status !== 'active') {
      return false;
    }

    // Check for security flags
    const user = await clerk.users.getUser(session.userId);
    if (user.locked || user.suspended) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

/**
 * Helper to handle failed authentication attempts with progressive delays
 */
async function handleFailedAttempt(clientIp: string): Promise<void> {
  const attempts = await redis.incr(`auth:failed:${clientIp}`);
  await redis.expire(`auth:failed:${clientIp}`, Math.pow(2, attempts) * 1000);
}

/**
 * Helper to clear failed attempts after successful authentication
 */
async function clearFailedAttempts(clientIp: string): Promise<void> {
  await redis.del(`auth:failed:${clientIp}`);
}