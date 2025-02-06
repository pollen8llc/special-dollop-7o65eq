/**
 * Enhanced sign-out route component for LinkedIn Profiles Gallery application.
 * Implements secure session termination with comprehensive cleanup and error handling.
 * @version 1.0.0
 */

import { useEffect } from 'react'; // ^18.x
import { redirect } from '@remix-run/node'; // ^1.19.x
import { useNavigate } from '@remix-run/react'; // ^1.19.x
import { useAuth } from '../hooks/useAuth';
import type { LoaderFunction } from '@remix-run/node';
import type { AuthError } from '../types/auth.types';

/**
 * Security headers for sign-out response
 */
const SECURITY_HEADERS = {
  'Clear-Site-Data': '"cache", "cookies", "storage"',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store'
};

/**
 * Server-side loader function to handle sign-out request with enhanced security
 */
export const loader: LoaderFunction = async ({ request }) => {
  try {
    // Verify CSRF token from request headers
    const csrfToken = request.headers.get('X-CSRF-Token');
    if (!csrfToken) {
      throw new Error('CSRF token missing');
    }

    // Create redirect response with security headers
    const response = redirect('/', {
      status: 302,
      headers: {
        ...SECURITY_HEADERS,
        'Set-Cookie': [
          'auth.session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax',
          'auth.remembered=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax'
        ]
      }
    });

    return response;
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
};

/**
 * Enhanced sign-out route component with comprehensive cleanup and error handling
 */
export default function SignOutRoute() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const maxRetries = 3;
  let retryCount = 0;

  useEffect(() => {
    let isCleanedUp = false;
    const timeoutId = setTimeout(async () => {
      if (isCleanedUp) return;

      const handleSignOut = async (): Promise<void> => {
        try {
          // Execute sign-out with retry logic
          while (retryCount < maxRetries) {
            try {
              await signOut();
              break;
            } catch (error) {
              retryCount++;
              if (retryCount === maxRetries) throw error;
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }

          // Clear all sensitive data from storage
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear all cookies
          document.cookie.split(';').forEach(cookie => {
            document.cookie = cookie
              .replace(/^ +/, '')
              .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
          });

          // Navigate to home page
          navigate('/', { replace: true });
        } catch (error) {
          const authError: AuthError = {
            code: 'SIGN_OUT_ERROR',
            message: error instanceof Error ? error.message : 'Sign-out failed',
            status: 500,
            timestamp: new Date(),
            details: { error }
          };
          console.error('Sign-out error:', authError);
          
          // Navigate to error page with details
          navigate('/error', {
            replace: true,
            state: { error: authError }
          });
        }
      };

      await handleSignOut();
    }, 0);

    return () => {
      isCleanedUp = true;
      clearTimeout(timeoutId);
    };
  }, [navigate, signOut]);

  // Component doesn't render any UI
  return null;
}