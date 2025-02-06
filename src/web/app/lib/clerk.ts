/**
 * Client-side Clerk authentication configuration and utilities for LinkedIn Profiles Gallery.
 * Provides secure authentication state management, session handling, and LinkedIn OAuth integration.
 * @version 1.0.0
 */

import { Clerk } from '@clerk/clerk-react'; // ^4.x
import { 
  ClerkProvider, 
  useClerk, 
  useUser, 
  useSignIn, 
  useSignOut 
} from '@clerk/remix'; // ^4.x
import { 
  AuthUser, 
  AuthState, 
  AuthError, 
  OAuthProvider,
  UserRole 
} from '../types/auth.types';

// Validation of required environment variables
if (!process.env.CLERK_PUBLISHABLE_KEY) {
  throw new Error('CLERK_PUBLISHABLE_KEY environment variable is required');
}

if (!process.env.LINKEDIN_CLIENT_ID) {
  throw new Error('LINKEDIN_CLIENT_ID environment variable is required');
}

/**
 * Enhanced security configuration for Clerk client
 */
const SECURITY_CONFIG = {
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    httpOnly: true
  },
  csrfProtection: true,
  sessionVersioning: true,
  retryOptions: {
    maxRetries: 3,
    backoff: 'exponential' as const
  }
};

/**
 * OAuth configuration for LinkedIn provider
 */
const LINKEDIN_CONFIG = {
  provider: OAuthProvider.LINKEDIN,
  clientId: process.env.LINKEDIN_CLIENT_ID,
  scope: ['r_liteprofile', 'r_emailaddress'],
  responseType: 'code',
  prompt: 'consent'
};

/**
 * Initialize Clerk client with enhanced security configuration
 */
const initializeClerk = (): Clerk => {
  try {
    const clerk = new Clerk(process.env.CLERK_PUBLISHABLE_KEY!, {
      ...SECURITY_CONFIG,
      appearance: {
        variables: { colorPrimary: '#0077B5' },
        elements: { formButtonPrimary: 'bg-linkedin hover:bg-linkedin-dark' }
      },
      signIn: {
        providers: [LINKEDIN_CONFIG]
      }
    });

    // Set up error tracking
    clerk.addListener((event) => {
      if (event.type === 'error') {
        console.error('Clerk error:', event.error);
        // Implement your error tracking service here
      }
    });

    return clerk;
  } catch (error) {
    console.error('Failed to initialize Clerk:', error);
    throw error;
  }
};

/**
 * Cached Clerk instance with security configuration
 */
export const clerk = initializeClerk();

/**
 * Enhanced hook for managing authentication state with comprehensive error handling
 * @returns {AuthState} Current authentication state with strict null checks
 */
export const useAuthState = (): AuthState => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [error, setError] = useState<AuthError | null>(null);

  // Transform Clerk user to AuthUser with validation
  const transformUser = useCallback((clerkUser: User | null): AuthUser | null => {
    if (!clerkUser) return null;

    try {
      return {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        roles: [UserRole.USER], // Default role, extend based on your requirements
        lastLoginAt: new Date(clerkUser.lastSignInAt ?? Date.now()),
        metadata: clerkUser.publicMetadata
      };
    } catch (e) {
      setError({
        code: 'USER_TRANSFORM_ERROR',
        message: 'Failed to transform user data',
        status: 500,
        timestamp: new Date(),
        details: { error: e }
      });
      return null;
    }
  }, []);

  return {
    isAuthenticated: isLoaded && isSignedIn,
    user: transformUser(user),
    isLoading: !isLoaded,
    error,
    lastUpdated: new Date()
  };
};

/**
 * Initiates LinkedIn OAuth authentication flow with enhanced error handling
 * @returns {Promise<void>} Resolves when OAuth flow completes
 */
export const signInWithLinkedIn = async (): Promise<void> => {
  const { signIn } = useSignIn();
  
  if (!signIn) {
    throw new Error('Sign in not available');
  }

  try {
    const strategy = signIn.createStrategy({
      strategy: 'oauth_linkedin',
      ...LINKEDIN_CONFIG
    });

    const result = await strategy.startOAuthFlow({
      redirectUrl: `${window.location.origin}/auth/callback`,
      redirectUrlComplete: `${window.location.origin}/dashboard`
    });

    if (result.status === 'complete') {
      await clerk.setSession(result.createdSessionId);
    } else {
      throw new Error('LinkedIn authentication failed');
    }
  } catch (error) {
    console.error('LinkedIn sign in error:', error);
    throw error;
  }
};

/**
 * Signs out the current user with secure session cleanup
 * @returns {Promise<void>} Resolves when sign out completes
 */
export const signOut = async (): Promise<void> => {
  const { signOut } = useSignOut();
  
  if (!signOut) {
    throw new Error('Sign out not available');
  }

  try {
    await signOut();
    // Clear any application state or cached data
    localStorage.removeItem('auth_state');
    sessionStorage.clear();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Export initialized clerk instance as default
export default clerk;