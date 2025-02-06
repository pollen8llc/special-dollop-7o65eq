/**
 * OAuth callback route handler for LinkedIn authentication
 * Implements secure token handling, session management, and CSRF protection
 * @version 1.0.0
 */

import { redirect, type LoaderFunction } from '@remix-run/node';
import { useClerk } from '@clerk/remix';
import { getAuth } from '../../lib/clerk.server';
import type { AuthError } from '../../types/auth.types';

// Route constants with strict typing
const GALLERY_ROUTE = '/gallery' as const;
const LOGIN_ROUTE = '/auth/signin' as const;
const MAX_AUTH_RETRIES = 3;
const AUTH_RETRY_DELAY = 1000;

/**
 * Secure callback processor with comprehensive error handling
 * Implements retry mechanism and progressive delay
 */
async function handleCallback(
  code: string,
  state: string,
  request: Request
): Promise<void> {
  let retryCount = 0;
  const clerk = useClerk();

  while (retryCount < MAX_AUTH_RETRIES) {
    try {
      // Validate state parameter to prevent CSRF attacks
      const storedState = await clerk.session.getToken(['oauth_state']);
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for tokens with security validation
      await clerk.authenticateWithRedirect({
        strategy: "oauth_callback",
        redirectUrl: new URL(request.url).origin + '/auth/callback',
        code,
      });

      // Clear any stored state tokens
      await clerk.session.removeToken(['oauth_state']);
      return;

    } catch (error) {
      retryCount++;
      if (retryCount === MAX_AUTH_RETRIES) {
        throw error;
      }
      // Implement progressive delay between retries
      await new Promise(resolve => 
        setTimeout(resolve, AUTH_RETRY_DELAY * Math.pow(2, retryCount))
      );
    }
  }
}

/**
 * Enhanced Remix loader for OAuth callback processing
 * Implements comprehensive security measures and error handling
 */
export const loader: LoaderFunction = async ({ request }) => {
  try {
    // Validate request origin
    const origin = request.headers.get('Origin');
    if (origin && !origin.startsWith(new URL(request.url).origin)) {
      throw new Error('Invalid request origin');
    }

    // Extract and validate callback parameters
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      const authError: AuthError = {
        code: error,
        message: errorDescription || 'Authentication failed',
        details: {
          description: errorDescription,
          timestamp: new Date().toISOString()
        }
      };
      console.error('OAuth error:', authError);
      return redirect(`${LOGIN_ROUTE}?error=${encodeURIComponent(authError.message)}`);
    }

    // Validate required parameters
    if (!code || !state) {
      throw new Error('Missing required OAuth parameters');
    }

    // Process callback with retry mechanism
    await handleCallback(code, state, request);

    // Verify authentication success
    const auth = await getAuth(request);
    if (!auth) {
      throw new Error('Authentication failed');
    }

    // Redirect to gallery with success
    return redirect(GALLERY_ROUTE, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Callback processing error:', error);
    
    // Handle different error scenarios
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    
    // Redirect to login with error
    return redirect(
      `${LOGIN_ROUTE}?error=${encodeURIComponent(errorMessage)}`,
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
  }
};