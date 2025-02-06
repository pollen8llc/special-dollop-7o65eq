import React, { useCallback, useState } from 'react';
import { useSignIn } from '@clerk/remix'; // ^4.x
import { Button } from '../common/Button';
import { signInWithLinkedIn } from '../../lib/clerk';
import { OAuthProvider, AuthError } from '../../types/auth.types';
import { LoadingState } from '../../types/common.types';
import { COLORS } from '../../constants/theme';

interface OAuthButtonsProps {
  /**
   * Loading state of the authentication process
   * @default false
   */
  isLoading?: boolean;

  /**
   * Callback fired on successful authentication
   */
  onSuccess?: () => void;

  /**
   * Callback fired on authentication error
   */
  onError?: (error: AuthError) => void;

  /**
   * Additional CSS classes to apply
   */
  className?: string;

  /**
   * Disabled state of the buttons
   * @default false
   */
  disabled?: boolean;
}

/**
 * OAuth authentication buttons component with LinkedIn integration.
 * Features accessibility support, loading states, and comprehensive error handling.
 */
export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  isLoading = false,
  onSuccess,
  onError,
  className = '',
  disabled = false,
}) => {
  // Initialize Clerk sign-in hook
  const { signIn } = useSignIn();
  
  // Local loading state management
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  /**
   * Handles LinkedIn OAuth sign-in with retry logic and error handling
   */
  const handleLinkedInSignIn = useCallback(async () => {
    if (!signIn || loadingState === LoadingState.LOADING) return;

    try {
      setLoadingState(LoadingState.LOADING);

      await signInWithLinkedIn();
      
      setLoadingState(LoadingState.SUCCESS);
      setRetryCount(0);
      onSuccess?.();

    } catch (error) {
      console.error('LinkedIn sign in error:', error);
      
      // Handle retry logic
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        // Exponential backoff
        const backoffDelay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => handleLinkedInSignIn(), backoffDelay);
        return;
      }

      setLoadingState(LoadingState.ERROR);
      
      const authError: AuthError = {
        code: 'LINKEDIN_AUTH_ERROR',
        message: error instanceof Error ? error.message : 'LinkedIn authentication failed',
        status: 500,
        timestamp: new Date(),
        details: { error }
      };

      onError?.(authError);
    }
  }, [signIn, loadingState, retryCount, onSuccess, onError]);

  /**
   * Keyboard event handler for accessibility
   */
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLinkedInSignIn();
    }
  }, [handleLinkedInSignIn]);

  const isButtonLoading = isLoading || loadingState === LoadingState.LOADING;
  const isButtonDisabled = disabled || isButtonLoading;

  return (
    <div 
      className={`flex flex-col space-y-4 ${className}`}
      role="group"
      aria-label="Authentication options"
    >
      <Button
        variant="primary"
        size="lg"
        isLoading={isButtonLoading}
        disabled={isButtonDisabled}
        onClick={handleLinkedInSignIn}
        onKeyPress={handleKeyPress}
        className={`
          w-full bg-[${COLORS.primary[500]}] hover:bg-[${COLORS.primary[600]}]
          dark:bg-[${COLORS.primary.dark}] dark:hover:bg-[${COLORS.primary[400]}]
          flex items-center justify-center space-x-3
          transition-all duration-200
          focus:ring-2 focus:ring-offset-2 focus:ring-[${COLORS.primary[500]}]
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-busy={isButtonLoading}
        aria-disabled={isButtonDisabled}
        data-provider={OAuthProvider.LINKEDIN}
      >
        {/* LinkedIn Icon */}
        <svg
          className="w-5 h-5"
          aria-hidden="true"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
            clipRule="evenodd"
          />
        </svg>
        <span>Continue with LinkedIn</span>
      </Button>

      {/* Error Message Display */}
      {loadingState === LoadingState.ERROR && (
        <div
          role="alert"
          className="text-[#D11124] dark:text-[#FF4D4D] text-sm text-center"
          aria-live="polite"
        >
          Authentication failed. Please try again.
        </div>
      )}
    </div>
  );
};

export type { OAuthButtonsProps };