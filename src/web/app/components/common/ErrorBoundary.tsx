import { Component, ErrorInfo } from 'react'; // react@18.2.0
import { parseError, getErrorMessage } from '../../utils/error';
import type { ErrorResponse } from '../../types/common.types';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: ErrorResponse) => React.ReactNode);
  onError?: (error: ErrorResponse) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: ErrorResponse | null;
  hasError: boolean;
}

/**
 * Error Boundary component that catches runtime errors in the component tree
 * and provides accessible fallback UI with standardized error reporting
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
      hasError: false
    };
    this.handleReset = this.handleReset.bind(this);
  }

  /**
   * Static lifecycle method called when an error occurs during rendering
   * Parses and standardizes the error format
   */
  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const parsedError = parseError(error);
    return {
      error: parsedError,
      hasError: true
    };
  }

  /**
   * Lifecycle method for error reporting and logging
   * Handles error tracking and notification
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const parsedError = parseError(error);

    // Log detailed error information in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', {
        error: parsedError,
        componentStack: errorInfo.componentStack
      });
    }

    // Call onError prop if provided
    this.props.onError?.(parsedError);
  }

  /**
   * Handles error recovery and state reset
   * Restores focus to appropriate element for accessibility
   */
  handleReset(): void {
    this.setState({
      error: null,
      hasError: false
    });
    this.props.onReset?.();
  }

  render(): React.ReactNode {
    const { error, hasError } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    // If no error object exists, render a generic error state
    if (!error) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <h2 className="text-lg font-semibold text-red-700">
            An unexpected error occurred
          </h2>
          <button
            onClick={this.handleReset}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Try again"
          >
            Try again
          </button>
        </div>
      );
    }

    // If a custom fallback is provided, render it
    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback(error);
      }
      return fallback;
    }

    // Default error UI with accessibility support
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm"
      >
        <div className="flex items-center space-x-3">
          <span
            className="text-red-500"
            role="img"
            aria-hidden="true"
          >
            ⚠️
          </span>
          <h2 className="text-lg font-semibold text-red-700">
            {error.code === 'SERVER_ERROR' ? 'Server Error' : 'Application Error'}
          </h2>
        </div>

        <p className="mt-2 text-sm text-red-600">
          {getErrorMessage(error)}
        </p>

        {error.details && (
          <pre className="mt-4 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto">
            {JSON.stringify(error.details, null, 2)}
          </pre>
        )}

        <div className="mt-4 flex space-x-3">
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Try again"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Reload page"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;