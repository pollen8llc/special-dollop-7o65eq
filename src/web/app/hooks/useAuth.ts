/**
 * Enhanced custom React hook for managing authentication state and operations
 * in the LinkedIn Profiles Gallery application using Clerk authentication service.
 * Implements comprehensive security features, session management, and error handling.
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@remix-run/react';
import {
  AuthState,
  AuthUser,
  AuthError,
  OAuthProvider,
  AuthSession
} from '../types/auth.types';
import {
  clerk,
  signInWithLinkedIn,
  signOut,
  validateSession,
  refreshToken
} from '../lib/clerk';

// Security configuration constants
const SESSION_CHECK_INTERVAL = 60000; // 1 minute
const SESSION_TIMEOUT = 3600000; // 1 hour
const MAX_SIGN_IN_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 300000; // 5 minutes

/**
 * Enhanced authentication hook with comprehensive security features
 * @returns {Object} Authentication state and methods
 */
export function useAuth() {
  // Initialize authentication state with strict type checking
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
    lastUpdated: new Date()
  });

  // Session monitoring refs
  const sessionCheckInterval = useRef<NodeJS.Timeout>();
  const sessionTimeout = useRef<NodeJS.Timeout>();
  const signInAttempts = useRef<number>(0);
  const lastSignInAttempt = useRef<number>(0);

  const navigate = useNavigate();

  /**
   * Enhanced sign-in handler with rate limiting and CSRF protection
   */
  const handleSignIn = useCallback(async (): Promise<void> => {
    try {
      // Rate limiting check
      const now = Date.now();
      if (
        signInAttempts.current >= MAX_SIGN_IN_ATTEMPTS &&
        now - lastSignInAttempt.current < RATE_LIMIT_WINDOW
      ) {
        throw new Error('Too many sign-in attempts. Please try again later.');
      }

      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      signInAttempts.current++;
      lastSignInAttempt.current = now;

      await signInWithLinkedIn();

      // Reset rate limiting on successful sign-in
      signInAttempts.current = 0;
      lastSignInAttempt.current = 0;
    } catch (error) {
      const authError: AuthError = {
        code: 'SIGN_IN_ERROR',
        message: error instanceof Error ? error.message : 'Sign-in failed',
        status: 401,
        timestamp: new Date(),
        details: { error }
      };
      setAuthState(prev => ({ ...prev, error: authError, isLoading: false }));
      throw error;
    }
  }, []);

  /**
   * Enhanced sign-out handler with secure session cleanup
   */
  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Clear all intervals and timeouts
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
      if (sessionTimeout.current) {
        clearTimeout(sessionTimeout.current);
      }

      await signOut();

      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });

      navigate('/', { replace: true });
    } catch (error) {
      const authError: AuthError = {
        code: 'SIGN_OUT_ERROR',
        message: error instanceof Error ? error.message : 'Sign-out failed',
        status: 500,
        timestamp: new Date(),
        details: { error }
      };
      setAuthState(prev => ({ ...prev, error: authError, isLoading: false }));
      throw error;
    }
  }, [navigate]);

  /**
   * Session validation with automatic refresh
   */
  const validateCurrentSession = useCallback(async (): Promise<boolean> => {
    try {
      const session = await validateSession();
      if (!session) {
        await handleSignOut();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }, [handleSignOut]);

  /**
   * Token refresh handler with error boundary
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const newToken = await refreshToken();
      if (!newToken) {
        throw new Error('Failed to refresh token');
      }
      
      // Reset session timeout
      if (sessionTimeout.current) {
        clearTimeout(sessionTimeout.current);
      }
      sessionTimeout.current = setTimeout(() => {
        validateCurrentSession();
      }, SESSION_TIMEOUT);
    } catch (error) {
      console.error('Token refresh error:', error);
      await handleSignOut();
    }
  }, [handleSignOut, validateCurrentSession]);

  // Initialize session monitoring
  useEffect(() => {
    if (authState.isAuthenticated) {
      // Set up periodic session validation
      sessionCheckInterval.current = setInterval(() => {
        validateCurrentSession();
      }, SESSION_CHECK_INTERVAL);

      // Set up session timeout
      sessionTimeout.current = setTimeout(() => {
        validateCurrentSession();
      }, SESSION_TIMEOUT);
    }

    return () => {
      // Cleanup intervals on unmount
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
      if (sessionTimeout.current) {
        clearTimeout(sessionTimeout.current);
      }
    };
  }, [authState.isAuthenticated, validateCurrentSession]);

  // Initialize authentication state from Clerk
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await clerk.user();
        if (user) {
          setAuthState({
            isAuthenticated: true,
            user: {
              id: user.id,
              email: user.primaryEmailAddress?.emailAddress || '',
              firstName: user.firstName,
              lastName: user.lastName,
              imageUrl: user.imageUrl,
              roles: user.publicMetadata.roles || ['USER'],
              lastLoginAt: new Date(user.lastSignInAt || Date.now()),
              metadata: user.publicMetadata
            },
            isLoading: false,
            error: null,
            lastUpdated: new Date()
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        const authError: AuthError = {
          code: 'AUTH_INITIALIZATION_ERROR',
          message: 'Failed to initialize authentication',
          status: 500,
          timestamp: new Date(),
          details: { error }
        };
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: authError
        }));
      }
    };

    initializeAuth();
  }, []);

  return {
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    signIn: handleSignIn,
    signOut: handleSignOut,
    refreshSession,
    validateCurrentSession
  };
}