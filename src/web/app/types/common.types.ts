/**
 * Core TypeScript type definitions and interfaces for the LinkedIn Profiles Gallery application.
 * Provides comprehensive type safety, standardized API responses, error handling, and common utility types.
 * @version 1.0.0
 */

/**
 * Generic interface for type-safe API responses with strict null checking and timestamp
 * @template T The type of data being returned
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ErrorResponse | null;
  timestamp: string;
}

/**
 * Generic interface for paginated API responses with comprehensive metadata
 * @template T The type of data being returned in the array
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  error: ErrorResponse | null;
  pagination: PaginationMetadata;
  timestamp: string;
}

/**
 * Comprehensive interface for pagination metadata with navigation URLs
 */
export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
}

/**
 * Detailed error response interface with stack traces for development
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details: Record<string, unknown> | null;
  status: number;
  timestamp: string;
  path: string;
  stack?: string;
}

/**
 * Enum for granular loading state management including refresh states
 */
export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  REFRESHING = 'REFRESHING'
}

/**
 * Type-safe enum for sort direction options
 */
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC'
}

/**
 * Comprehensive interface for API query parameters with field selection
 */
export interface QueryParams {
  page: number;
  limit: number;
  sortBy: string;
  sortDirection: SortDirection;
  search?: string;
  filter?: Record<string, unknown>;
  fields: string[];
}

/**
 * Theme enum with system preference support
 */
export enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM'
}