/**
 * @fileoverview Express error handling middleware with enhanced security monitoring and correlation tracking
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express'; // ^4.18.0
import logger from '../../utils/logger';
import { isOperationalError, createInternalError } from '../../utils/errors';
import { ApiError } from '../../types/api.types';
import { ENV } from '../../config/constants';

/**
 * Sanitizes error details to prevent sensitive information exposure
 */
const sanitizeErrorDetails = (details: Record<string, any> | null): Record<string, any> | null => {
  if (!details || ENV.IS_PRODUCTION) return null;

  const sensitiveFields = ['password', 'token', 'authorization', 'cookie', 'email'];
  const sanitized = { ...details };

  const sanitizeObject = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    });
  };

  sanitizeObject(sanitized);
  return sanitized;
};

/**
 * Creates security context for error logging
 */
const createSecurityContext = (req: Request) => ({
  ip: req.ip,
  method: req.method,
  path: req.path,
  userAgent: req.get('user-agent') || 'unknown',
  userId: (req as any).user?.id || null,
  sessionId: (req as any).session?.sessionId || null
});

/**
 * Enhanced error handling middleware with security monitoring and correlation tracking
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Extract or generate correlation ID
  const correlationId = req.get('x-correlation-id') || req.get('x-request-id') || 'error-' + Date.now();
  
  // Set correlation ID for logging
  logger.setCorrelationId(correlationId);

  // Create security context
  const securityContext = createSecurityContext(req);

  // Initialize error response
  let errorResponse: ApiError;

  try {
    if (error instanceof Error) {
      // Determine if error is operational
      const isOperational = isOperationalError(error);

      // Log error with security context
      logger.error(error, {
        correlationId,
        securityContext,
        isOperational,
        path: req.path,
        method: req.method
      });

      if ('status' in error && 'code' in error) {
        // Handle ApiError instances
        errorResponse = error as ApiError;
        errorResponse.details = sanitizeErrorDetails(errorResponse.details);
      } else {
        // Create internal server error for unhandled errors
        errorResponse = createInternalError(
          ENV.IS_PRODUCTION ? 'An internal server error occurred' : error.message
        );
      }
    } else {
      // Handle non-Error objects
      errorResponse = createInternalError('An unexpected error occurred');
    }

    // Add security headers
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Check if headers have already been sent
    if (res.headersSent) {
      logger.warn('Headers already sent, unable to send error response', {
        correlationId,
        securityContext
      });
      return next(error);
    }

    // Send error response
    return res.status(errorResponse.status).json({
      success: false,
      error: errorResponse,
      data: null,
      timestamp: new Date().toISOString()
    });

  } catch (unexpectedError) {
    // Log unexpected error in error handler
    logger.error('Error in error handler', {
      correlationId,
      securityContext,
      error: unexpectedError
    });

    // Send fallback error response
    return res.status(500).json({
      success: false,
      error: createInternalError('An unexpected error occurred'),
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};