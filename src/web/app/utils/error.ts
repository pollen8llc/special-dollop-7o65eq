import { isAxiosError } from 'axios'; // axios@1.4.0
import type { ErrorResponse } from '../types/common.types';
import { useToast } from '../hooks/useToast';

/**
 * Error codes for different types of application errors
 */
const ERROR_CODES = {
  VALIDATION: 'VALIDATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
} as const;

/**
 * Maps HTTP status codes to internal error codes
 */
const STATUS_TO_ERROR_CODE: Record<number, string> = {
  400: ERROR_CODES.VALIDATION,
  401: ERROR_CODES.AUTH,
  403: ERROR_CODES.AUTH,
  404: ERROR_CODES.NOT_FOUND,
  500: ERROR_CODES.SERVER
};

/**
 * User-friendly error messages for different error types
 */
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.VALIDATION]: 'Please check your input and try again',
  [ERROR_CODES.NETWORK]: 'Unable to connect. Please check your internet connection',
  [ERROR_CODES.AUTH]: 'Please sign in to continue',
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found',
  [ERROR_CODES.SERVER]: 'An unexpected error occurred. Please try again later',
  [ERROR_CODES.UNKNOWN]: 'Something went wrong. Please try again'
};

/**
 * Parses various error types into a standardized ErrorResponse format
 * @param error - The error to parse
 * @returns Standardized error response object
 */
export const parseError = (error: unknown): ErrorResponse => {
  // Handle Axios errors
  if (isAxiosError(error)) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data as Partial<ErrorResponse>;

    return {
      code: STATUS_TO_ERROR_CODE[status] || ERROR_CODES.UNKNOWN,
      message: errorData?.message || ERROR_MESSAGES[ERROR_CODES.UNKNOWN],
      details: errorData?.details || null,
      status: status,
      timestamp: new Date().toISOString(),
      path: error.config?.url || ''
    };
  }

  // Handle existing ErrorResponse objects
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error &&
    'status' in error
  ) {
    return error as ErrorResponse;
  }

  // Handle network errors
  if (error instanceof Error && error.message.toLowerCase().includes('network')) {
    return {
      code: ERROR_CODES.NETWORK,
      message: ERROR_MESSAGES[ERROR_CODES.NETWORK],
      details: null,
      status: 0,
      timestamp: new Date().toISOString(),
      path: ''
    };
  }

  // Handle generic errors
  return {
    code: ERROR_CODES.UNKNOWN,
    message: error instanceof Error ? error.message : ERROR_MESSAGES[ERROR_CODES.UNKNOWN],
    details: null,
    status: 500,
    timestamp: new Date().toISOString(),
    path: ''
  };
};

/**
 * Converts technical error messages into user-friendly messages
 * @param error - The standardized error response
 * @returns User-friendly error message
 */
export const getErrorMessage = (error: ErrorResponse): string => {
  // Return predefined message if available
  if (error.code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[error.code];
  }

  // Handle validation errors with field-specific messages
  if (error.code === ERROR_CODES.VALIDATION && error.details) {
    const fieldErrors = Object.entries(error.details)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ');
    return `Please correct the following: ${fieldErrors}`;
  }

  // Return default message for unknown errors
  return ERROR_MESSAGES[ERROR_CODES.UNKNOWN];
};

/**
 * Processes errors and displays them via accessible toast notifications
 * @param error - The error to handle
 */
export const handleError = (error: unknown): void => {
  const { showToast } = useToast();
  const parsedError = parseError(error);
  const userMessage = getErrorMessage(parsedError);

  // Show error toast with accessibility support
  showToast('ERROR', userMessage);

  // Log detailed error information in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      code: parsedError.code,
      message: parsedError.message,
      details: parsedError.details,
      status: parsedError.status,
      timestamp: parsedError.timestamp,
      path: parsedError.path
    });
  }
};