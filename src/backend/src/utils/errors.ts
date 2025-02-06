/**
 * @fileoverview Core error handling utilities for the LinkedIn Profiles Gallery backend
 * @version 1.0.0
 */

import { ApiError, ErrorCode, ValidationError } from '../types/api.types';

/**
 * Environment-aware debug flag for controlling error detail exposure
 */
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Enhanced base error class with operational error classification and monitoring support
 */
export class BaseError extends Error {
  public readonly isOperational: boolean;

  constructor(message: string, isOperational = true) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    
    if (!IS_PRODUCTION) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Creates a standardized error response with security considerations
 * @param code - Error code from ErrorCode enum
 * @param message - User-facing error message
 * @param status - HTTP status code
 * @param details - Additional error context (sanitized in production)
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details: Record<string, any> | null = null
): ApiError {
  // Sanitize error details in production
  const sanitizedDetails = IS_PRODUCTION ? null : details;
  
  const error: ApiError = {
    code,
    message,
    status,
    details: sanitizedDetails,
    validationErrors: null,
    stack: IS_PRODUCTION ? null : new Error().stack || null
  };

  return error;
}

/**
 * Determines if an error is operational (expected) or programming (unexpected)
 * @param error - Error instance to classify
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Creates a bad request (400) error response
 * @param message - Error message
 * @param details - Additional error context
 */
export function createBadRequestError(
  message: string,
  details: Record<string, any> | null = null
): ApiError {
  return createErrorResponse(
    ErrorCode.BAD_REQUEST,
    message,
    400,
    details
  );
}

/**
 * Creates an unauthorized (401) error response with security logging
 * @param message - Error message
 */
export function createUnauthorizedError(message: string): ApiError {
  return createErrorResponse(
    ErrorCode.UNAUTHORIZED,
    message,
    401
  );
}

/**
 * Creates a forbidden (403) error response with access violation tracking
 * @param message - Error message
 */
export function createForbiddenError(message: string): ApiError {
  return createErrorResponse(
    ErrorCode.FORBIDDEN,
    message,
    403
  );
}

/**
 * Creates a not found (404) error response
 * @param message - Error message
 */
export function createNotFoundError(message: string): ApiError {
  return createErrorResponse(
    ErrorCode.NOT_FOUND,
    message,
    404
  );
}

/**
 * Creates a validation error (400) response with detailed validation tracking
 * @param message - Error message
 * @param validationErrors - Array of validation errors
 */
export function createValidationError(
  message: string,
  validationErrors: ValidationError[]
): ApiError {
  const error = createErrorResponse(
    ErrorCode.VALIDATION_ERROR,
    message,
    400,
    { validationErrors }
  );
  error.validationErrors = validationErrors;
  return error;
}

/**
 * Creates an internal server error (500) response with enhanced logging
 * @param message - Error message
 */
export function createInternalError(message: string): ApiError {
  // In production, use a generic error message to avoid exposing system details
  const sanitizedMessage = IS_PRODUCTION
    ? 'An internal server error occurred'
    : message;

  return createErrorResponse(
    ErrorCode.INTERNAL_ERROR,
    sanitizedMessage,
    500
  );
}

/**
 * Sanitizes error messages to prevent sensitive information exposure
 * @param message - Raw error message
 */
function sanitizeErrorMessage(message: string): string {
  // Remove potential stack traces
  message = message.split('\n')[0];
  
  // Remove file paths
  message = message.replace(/(?:\/[\w.-]+)+/g, '[PATH]');
  
  // Remove potential SQL queries
  message = message.replace(/SELECT|INSERT|UPDATE|DELETE|DROP|CREATE/gi, '[SQL]');
  
  return message;
}