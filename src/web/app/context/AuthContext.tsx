/**
 * Authentication Context Provider for LinkedIn Profiles Gallery application.
 * Implements secure authentication state management with comprehensive session handling,
 * role-based access control, and OAuth integration.
 * @version 1.0.0
 */

import { createContext, useContext, ReactNode, useMemo } from 'react'; // ^18.x
import { AuthState, AuthUser, AuthError } from '../types/auth.types';
import { useAuth } from '../hooks/useAuth';

/**
 * Comprehensive type definition for authentication context
 * including enhanced security features and session management
 */
interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  error: AuthError | null;
  sessionVersion: string;
  lastActivity: Date;
  roles: string[];
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  checkPermission: (permission: string) => boolean;
}

/**
 * Create authentication context with strict null checking
 */
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Props interface for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Secure Authentication Provider component with comprehensive session management
 * and role-based access control
 */
export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  // Initialize authentication state using enhanced useAuth hook
  const {
    isAuthenticated,
    user,
    isLoading,
    error,
    signIn,
    signOut,
    refreshSession,
    validateCurrentSession
  } = useAuth();

  /**
   * Enhanced permission checking with role-based access control
   */
  const checkPermission = (permission: string): boolean => {
    if (!user || !user.roles) return false;
    
    // Admin role has all permissions
    if (user.roles.includes('ADMIN')) return true;
    
    // Check specific permission based on user roles
    return user.roles.some(role => {
      switch (role) {
        case 'USER':
          return ['read:profile', 'update:own-profile'].includes(permission);
        default:
          return false;
      }
    });
  };

  /**
   * Memoized context value to prevent unnecessary re-renders
   * while maintaining security features
   */
  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      user,
      isLoading,
      error,
      sessionVersion: '1.0', // Track session version for security
      lastActivity: new Date(), // Monitor user activity
      roles: user?.roles || [],
      signIn,
      signOut,
      refreshToken: refreshSession,
      validateSession: validateCurrentSession,
      checkPermission
    }),
    [
      isAuthenticated,
      user,
      isLoading,
      error,
      signIn,
      signOut,
      refreshSession,
      validateCurrentSession
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context with comprehensive
 * type safety and error handling
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error(
      'useAuthContext must be used within an AuthProvider. ' +
      'Ensure the component is wrapped in an AuthProvider component.'
    );
  }
  
  return context;
};

/**
 * Export type for external usage
 */
export type { AuthContextType };