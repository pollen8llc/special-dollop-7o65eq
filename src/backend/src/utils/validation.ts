/**
 * @fileoverview Core validation utility for type-safe request validation using Zod
 * @version 1.0.0
 * @package zod@^3.21.0
 */

import { z } from 'zod';
import { ValidationError } from '../types/api.types';
import { createValidationError } from './errors';

/**
 * Maximum allowed size for request payloads in bytes (10MB)
 * Prevents DoS attacks through large payloads
 */
const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024;

/**
 * Generic schema validation function that provides type-safe validation
 * with comprehensive error handling
 * 
 * @param schema - Zod schema to validate against
 * @param data - Input data to validate
 * @returns Validated and typed data matching schema type
 * @throws ApiError with VALIDATION_ERROR code if validation fails
 */
export async function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  // Validate payload size to prevent DoS attacks
  if (
    data &&
    typeof data === 'object' &&
    JSON.stringify(data).length > MAX_PAYLOAD_SIZE
  ) {
    throw createValidationError(
      'Request payload too large',
      [{
        field: 'payload',
        message: 'Request payload exceeds maximum allowed size',
        value: 'REDACTED',
        constraint: 'maxSize'
      }]
    );
  }

  try {
    // Parse and validate data with strict mode enabled
    const validatedData = await schema.parseAsync(data, {
      strict: true,
      errorMap: (error, ctx) => {
        // Enhance error messages with validation context
        return {
          message: getEnhancedErrorMessage(error, ctx)
        };
      }
    });

    return validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = transformValidationErrors(error);
      throw createValidationError(
        'Validation failed',
        validationErrors
      );
    }
    throw error;
  }
}

/**
 * Transforms Zod validation errors into application's ValidationError format
 * with enhanced error details and security considerations
 * 
 * @param zodError - Zod validation error
 * @returns Array of formatted validation errors
 */
export function transformValidationErrors(zodError: z.ZodError): ValidationError[] {
  return zodError.errors.map(issue => {
    const field = formatErrorPath(issue.path);
    const constraint = getValidationConstraint(issue);
    
    return {
      field,
      message: sanitizeErrorMessage(issue.message),
      value: sanitizeErrorValue(issue.path, issue.code),
      constraint
    };
  });
}

/**
 * Formats error path into human-readable field name
 * @private
 */
function formatErrorPath(path: (string | number)[]): string {
  return path.join('.');
}

/**
 * Extracts validation constraint from Zod error
 * @private
 */
function getValidationConstraint(issue: z.ZodIssue): string {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return `type_${issue.expected}`;
    case z.ZodIssueCode.too_small:
      return `min_${issue.type}`;
    case z.ZodIssueCode.too_big:
      return `max_${issue.type}`;
    case z.ZodIssueCode.invalid_string:
      return `string_${issue.validation}`;
    default:
      return issue.code;
  }
}

/**
 * Enhances error messages with validation context
 * @private
 */
function getEnhancedErrorMessage(error: z.ZodIssue, ctx: z.ErrorMapCtx): string {
  const baseMessage = ctx.defaultError;
  
  switch (error.code) {
    case z.ZodIssueCode.invalid_type:
      return `Expected ${error.expected}, received ${error.received}`;
    case z.ZodIssueCode.too_small:
      return `Must be ${error.type === 'string' ? 'longer' : 'greater'} than ${error.minimum} ${error.type === 'string' ? 'characters' : ''}`;
    case z.ZodIssueCode.too_big:
      return `Must be ${error.type === 'string' ? 'shorter' : 'less'} than ${error.maximum} ${error.type === 'string' ? 'characters' : ''}`;
    default:
      return baseMessage;
  }
}

/**
 * Sanitizes error messages to prevent information leakage
 * @private
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

/**
 * Sanitizes error values to prevent sensitive data exposure
 * @private
 */
function sanitizeErrorValue(path: (string | number)[], code: z.ZodIssueCode): any {
  // Redact potentially sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  const fieldName = path[path.length - 1]?.toString().toLowerCase();
  
  if (sensitiveFields.some(field => fieldName?.includes(field))) {
    return 'REDACTED';
  }

  // For type errors, return the type instead of the value
  if (code === z.ZodIssueCode.invalid_type) {
    return '[INVALID_TYPE]';
  }

  return '[INVALID_VALUE]';
}