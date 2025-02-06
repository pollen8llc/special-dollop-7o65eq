/**
 * @fileoverview Express middleware for request validation using Zod schemas
 * @version 1.0.0
 * @package express@^4.18.0
 * @package zod@^3.21.0
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateSchema } from '../../utils/validation';
import { createValidationError } from '../../utils/errors';
import { ValidationError } from '../../types/api.types';

/**
 * Maximum number of validation attempts per IP within the time window
 */
const MAX_VALIDATION_ATTEMPTS = 100;

/**
 * Time window for rate limiting validation attempts (in milliseconds)
 */
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

/**
 * Cache TTL for successful validations (in milliseconds)
 */
const VALIDATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Type definition for possible request data locations
 */
type RequestLocation = 'body' | 'query' | 'params';

/**
 * Interface for validation options
 */
interface ValidationOptions {
  /** Enable caching of validation results */
  enableCache?: boolean;
  /** Custom error messages */
  errorMessages?: Record<string, string>;
  /** Additional security checks */
  securityChecks?: boolean;
  /** Performance monitoring */
  monitoring?: boolean;
}

/**
 * Interface for validation metrics
 */
interface ValidationMetrics {
  duration: number;
  success: boolean;
  errorCount: number;
  securityFlags: string[];
}

/**
 * Type definition for validation middleware function
 */
type ValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// In-memory storage for rate limiting and caching
const validationAttempts = new Map<string, number[]>();
const validationCache = new Map<string, { data: any; expires: number }>();

/**
 * Creates a middleware function that validates request data against a Zod schema
 * with enhanced security features and performance monitoring
 * 
 * @param schema - Zod schema to validate against
 * @param location - Request location to validate (body, query, params)
 * @param options - Validation options for customization
 * @returns Express middleware function
 */
export function validateRequest(
  schema: z.ZodSchema,
  location: RequestLocation,
  options: ValidationOptions = {}
): ValidationMiddleware {
  const {
    enableCache = true,
    securityChecks = true,
    monitoring = true
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const metrics: ValidationMetrics = {
      duration: 0,
      success: false,
      errorCount: 0,
      securityFlags: []
    };

    try {
      // Rate limiting check
      if (securityChecks) {
        const clientIp = req.ip;
        const attempts = validationAttempts.get(clientIp) || [];
        const recentAttempts = attempts.filter(
          time => time > Date.now() - RATE_LIMIT_WINDOW
        );

        if (recentAttempts.length >= MAX_VALIDATION_ATTEMPTS) {
          metrics.securityFlags.push('RATE_LIMIT_EXCEEDED');
          throw createValidationError('Too many validation attempts', [{
            field: 'request',
            message: 'Rate limit exceeded for validation attempts',
            value: 'REDACTED',
            constraint: 'rateLimit'
          }]);
        }

        validationAttempts.set(clientIp, [...recentAttempts, Date.now()]);
      }

      // Get data from request based on location
      const data = req[location];

      // Check cache for previous validation results
      if (enableCache) {
        const cacheKey = getCacheKey(req.path, location, data);
        const cached = validationCache.get(cacheKey);
        
        if (cached && cached.expires > Date.now()) {
          req[location] = cached.data;
          metrics.success = true;
          logMetrics(req, metrics);
          return next();
        }
      }

      // Validate data using schema
      const validatedData = await validateSchema(schema, data);

      // Cache successful validation result
      if (enableCache) {
        const cacheKey = getCacheKey(req.path, location, data);
        validationCache.set(cacheKey, {
          data: validatedData,
          expires: Date.now() + VALIDATION_CACHE_TTL
        });
      }

      // Assign validated data back to request
      req[location] = validatedData;
      metrics.success = true;

      // Log metrics if monitoring is enabled
      if (monitoring) {
        metrics.duration = Date.now() - startTime;
        logMetrics(req, metrics);
      }

      next();
    } catch (error) {
      metrics.success = false;
      metrics.errorCount++;
      metrics.duration = Date.now() - startTime;

      if (monitoring) {
        logMetrics(req, metrics);
      }

      next(error);
    }
  };
}

/**
 * Generates a cache key for validation results
 * @private
 */
function getCacheKey(path: string, location: RequestLocation, data: any): string {
  return `${path}:${location}:${JSON.stringify(data)}`;
}

/**
 * Logs validation metrics for monitoring
 * @private
 */
function logMetrics(req: Request, metrics: ValidationMetrics): void {
  // In a production environment, this would send metrics to a monitoring service
  if (process.env.NODE_ENV !== 'test') {
    console.log({
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      metrics
    });
  }
}