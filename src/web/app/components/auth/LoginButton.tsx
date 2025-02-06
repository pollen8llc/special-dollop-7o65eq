import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';

/**
 * Props interface for the LoginButton component
 */
interface LoginButtonProps {
  /**
   * Additional CSS classes to apply to the button
   */
  className?: string;
  
  /**
   * Visual variant of the button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

/**
 * A reusable authentication button component that handles LinkedIn OAuth login/logout
 * functionality with loading states and proper error handling.
 * 
 * @version 1.0.0
 */
export const LoginButton: React.FC<LoginButtonProps> = ({
  className,
  variant = 'primary'
}) => {
  const {
    isAuthenticated,
    isLoading,
    signIn,
    signOut
  } = useAuth();

  /**
   * Handles authentication actions with proper error handling
   */
  const handleAuthAction = async () => {
    try {
      if (isAuthenticated) {
        await signOut();
      } else {
        await signIn();
      }
    } catch (error) {
      // Error is handled by useAuth hook
      console.error('Authentication action failed:', error);
    }
  };

  // Determine button text and ARIA labels based on auth state
  const buttonText = isAuthenticated ? 'Sign Out' : 'Sign in with LinkedIn';
  const ariaLabel = isAuthenticated 
    ? 'Sign out of your account'
    : 'Sign in with your LinkedIn account';

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleAuthAction}
      isLoading={isLoading}
      disabled={isLoading}
      aria-label={ariaLabel}
      type="button"
      data-testid="auth-button"
    >
      {/* Show loading text during authentication */}
      {isLoading ? (
        isAuthenticated ? 'Signing out...' : 'Signing in...'
      ) : (
        <>
          {/* LinkedIn icon for sign-in button */}
          {!isAuthenticated && (
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {buttonText}
        </>
      )}
    </Button>
  );
};

// Type export for consumers
export type { LoginButtonProps };