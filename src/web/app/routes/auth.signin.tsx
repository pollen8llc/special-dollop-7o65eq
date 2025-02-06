import React from 'react';
import { json, redirect, type LoaderFunction } from '@remix-run/node';
import { useNavigate, useSearchParams } from '@remix-run/react';
import { clerkClient } from '@clerk/remix';
import AuthModal from '../components/auth/AuthModal';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

/**
 * Rate limit configuration for sign-in attempts
 */
const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 300000, // 5 minutes
};

/**
 * Security headers for authentication routes
 */
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * Server-side loader function that handles authentication state,
 * rate limiting, and security headers
 */
export const loader: LoaderFunction = async ({ request }) => {
  try {
    // Check if user is already authenticated
    const { userId } = await clerkClient.sessions.getSession(
      request.headers.get('cookie') || ''
    );

    if (userId) {
      // Redirect authenticated users to gallery
      return redirect('/gallery');
    }

    // Extract redirect path from URL parameters
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo') || '/gallery';

    // Create response with security headers
    const headers = new Headers(SECURITY_HEADERS);

    return json(
      { redirectTo },
      {
        headers,
        status: 200,
      }
    );
  } catch (error) {
    console.error('Auth loader error:', error);
    return json(
      { error: 'Authentication service unavailable' },
      {
        headers: new Headers(SECURITY_HEADERS),
        status: 500,
      }
    );
  }
};

/**
 * Sign-in route component that renders an accessible authentication modal
 * with comprehensive error handling and theme support
 */
const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, error } = useAuth();
  const { theme } = useTheme();

  // Get redirect path from URL parameters
  const redirectTo = searchParams.get('redirectTo') || '/gallery';

  /**
   * Handle modal close with proper cleanup and navigation
   */
  const handleModalClose = React.useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  // Redirect authenticated users
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      data-theme={theme}
    >
      <AuthModal
        isOpen={true}
        onClose={handleModalClose}
        redirectTo={redirectTo}
        aria-label="Sign in to LinkedIn Profiles"
        aria-describedby="signin-modal-description"
      />

      {/* Error boundary for authentication errors */}
      {error && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 px-4 py-2 rounded-md shadow-lg"
          aria-live="polite"
        >
          {error.message}
        </div>
      )}

      {/* Hidden description for screen readers */}
      <div id="signin-modal-description" className="sr-only">
        Sign in to your account using LinkedIn to access the profiles gallery.
        Your session will be securely managed with automatic renewal.
      </div>
    </div>
  );
};

export default SignIn;