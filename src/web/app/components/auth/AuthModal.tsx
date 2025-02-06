import React, { useCallback, useEffect } from 'react';
import { useNavigate } from '@remix-run/react'; // v1.19.x
import Modal from '../common/Modal';
import { OAuthButtons } from './OAuthButtons';
import { useAuth } from '../../hooks/useAuth';
import { AuthError } from '../../types/auth.types';

interface AuthModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback function when modal closes */
  onClose: () => void;
  /** Path to redirect after successful authentication */
  redirectTo?: string;
  /** Accessibility label for the modal */
  'aria-label'?: string;
  /** ID of element describing the modal */
  'aria-describedby'?: string;
}

/**
 * A secure and accessible authentication modal component that provides
 * LinkedIn OAuth integration with comprehensive error handling and animations.
 */
const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  redirectTo = '/gallery',
  'aria-label': ariaLabel = 'Authentication dialog',
  'aria-describedby': ariaDescribedby = 'auth-modal-description',
}) => {
  const navigate = useNavigate();
  const { isLoading, error, signIn, clearError } = useAuth();

  // Cleanup error state when modal closes
  useEffect(() => {
    if (!isOpen && error) {
      clearError();
    }
  }, [isOpen, error, clearError]);

  /**
   * Handles successful authentication with secure redirect
   */
  const handleAuthSuccess = useCallback(() => {
    // Clear any existing errors
    if (error) {
      clearError();
    }

    // Close modal before navigation
    onClose();

    // Validate and sanitize redirect path
    const sanitizedRedirect = redirectTo.startsWith('/')
      ? redirectTo
      : '/gallery';

    // Navigate to validated path
    navigate(sanitizedRedirect, { replace: true });
  }, [error, clearError, onClose, redirectTo, navigate]);

  /**
   * Handles authentication errors with user feedback
   */
  const handleAuthError = useCallback((authError: AuthError) => {
    console.error('Authentication error:', authError);
    // Error state is managed by useAuth hook
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign in to LinkedIn Profiles"
      className="max-w-md w-full mx-auto"
      initialFocusRef={undefined}
      closeOnOverlayClick={true}
      closeOnEsc={true}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
    >
      {/* Modal description for screen readers */}
      <p id={ariaDescribedby} className="sr-only">
        Sign in to your account using your LinkedIn profile to access the gallery
      </p>

      <div className="space-y-6">
        {/* Description text */}
        <p className="text-center text-gray-600 dark:text-gray-300">
          Connect with your LinkedIn account to view and manage professional profiles
        </p>

        {/* OAuth Buttons */}
        <OAuthButtons
          isLoading={isLoading}
          onSuccess={handleAuthSuccess}
          onError={handleAuthError}
          className="mt-4"
        />

        {/* Privacy notice */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          By continuing, you agree to our{' '}
          <a
            href="/privacy"
            className="text-primary-500 hover:text-primary-600 dark:text-primary-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </Modal>
  );
};

export default AuthModal;
export type { AuthModalProps };