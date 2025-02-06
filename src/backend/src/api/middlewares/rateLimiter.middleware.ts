/**
 * Redis-based distributed rate limiting middleware for LinkedIn Profiles Gallery API
 * Implements request throttling with Redis for scalable rate control across instances
 * @module api/middlewares/rateLimiter
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express'; // ^4.18.0
import { createRedisClient } from '../../config/redis';
import { RATE_LIMIT } from '../../config/constants';
import { createErrorResponse, ErrorCode } from '../../utils/errors';

// Redis key namespace for rate limiting
const RATE_LIMIT_PREFIX = 'rate_limit:';

/**
 * Generates a unique Redis key for rate limiting with proper namespacing
 * @param ip - Client IP address
 * @returns Namespaced Redis key for rate tracking
 */
function getRateLimitKey(ip: string): string {
  // Calculate current time window
  const window = Math.floor(Date.now() / RATE_LIMIT.WINDOW_MS);
  
  // Sanitize IP address to prevent injection
  const sanitizedIp = ip.replace(/[^0-9a-fA-F:.]/g, '');
  
  return `${RATE_LIMIT_PREFIX}${sanitizedIp}:${window}`;
}

/**
 * Express middleware implementing distributed rate limiting using Redis
 * Enforces request rate limits based on client IP with proper headers
 */
export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const redis = createRedisClient();
  
  try {
    // Extract client IP with proxy support
    const clientIp = (req.headers['x-forwarded-for'] as string) || 
                    req.socket.remoteAddress || 
                    'unknown';
    
    // Generate rate limit key for current window
    const key = getRateLimitKey(clientIp);
    
    // Increment request count atomically with expiration
    const requestCount = await redis.incr(key);
    
    // Set key expiration on first request in window
    if (requestCount === 1) {
      await redis.expire(key, RATE_LIMIT.WINDOW_MS / 1000);
    }

    // Get remaining window time
    const ttl = await redis.ttl(key);
    
    // Calculate rate limit values
    const maxRequests = req.user?.roles?.includes('ADMIN') 
      ? RATE_LIMIT.MAX_REQUESTS.ADMIN
      : req.user 
        ? RATE_LIMIT.MAX_REQUESTS.AUTHENTICATED 
        : RATE_LIMIT.MAX_REQUESTS.ANONYMOUS;
    
    const remaining = Math.max(0, maxRequests - requestCount);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': (Date.now() + (ttl * 1000)).toString()
    });

    // Check if rate limit exceeded
    if (requestCount > maxRequests) {
      // Log security incident
      console.warn(`Rate limit exceeded for IP ${clientIp}`);
      
      const error = createErrorResponse(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'Too many requests, please try again later',
        429,
        {
          retryAfter: ttl,
          limit: maxRequests,
          windowMs: RATE_LIMIT.WINDOW_MS
        }
      );

      res.status(429).json({ error });
      return;
    }

    next();
  } catch (error) {
    // Log Redis errors but allow request to proceed
    console.error('Rate limiter Redis error:', error);
    next();
  } finally {
    // Ensure Redis connection is properly closed
    await redis.quit().catch(console.error);
  }
}