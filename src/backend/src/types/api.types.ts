/**
 * @fileoverview Core API type definitions for the LinkedIn Profiles Gallery backend
 * @version 1.0.0
 */

import { AuthError } from './auth.types';

/**
 * Generic base interface for all API responses ensuring consistent response structure
 */
export interface ApiResponse<T> {
  /** Indicates if the request was successful */
  success: boolean;
  
  /** Response payload data */
  data: T | null;
  
  /** Error information if request failed */
  error: ApiError | null;
  
  /** ISO timestamp of when the response was generated */
  timestamp: string;
}

/**
 * Generic interface for paginated list responses with comprehensive pagination metadata
 */
export interface PaginatedResponse<T> {
  /** Array of items for current page */
  data: T[];
  
  /** Current page number (1-based) */
  page: number;
  
  /** Number of items per page */
  pageSize: number;
  
  /** Total number of items across all pages */
  total: number;
  
  /** Indicates if there is a next page available */
  hasNextPage: boolean;
  
  /** Indicates if there is a previous page available */
  hasPreviousPage: boolean;
}

/**
 * Comprehensive interface for API error responses with detailed error information
 */
export interface ApiError {
  /** Standardized error code */
  code: ErrorCode;
  
  /** Human-readable error message */
  message: string;
  
  /** HTTP status code */
  status: number;
  
  /** Additional error context and metadata */
  details: Record<string, any> | null;
  
  /** Array of validation errors if applicable */
  validationErrors: ValidationError[] | null;
  
  /** Error stack trace (only included in development) */
  stack: string | null;
}

/**
 * Detailed interface for validation error information including field constraints
 */
export interface ValidationError {
  /** Name of the field that failed validation */
  field: string;
  
  /** Human-readable validation error message */
  message: string;
  
  /** Invalid value that was provided */
  value: any;
  
  /** Name of the validation constraint that failed */
  constraint: string;
}

/**
 * Interface for pagination request parameters with sorting options
 */
export interface PaginationParams {
  /** Page number to retrieve (1-based) */
  page: number;
  
  /** Number of items per page */
  pageSize: number;
  
  /** Field to sort results by */
  sortBy: string | null;
  
  /** Sort direction */
  sortOrder: 'asc' | 'desc' | null;
}

/**
 * Comprehensive enum for standardized API error codes
 */
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

/**
 * Complete enum for HTTP methods supported by the API
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD'
}