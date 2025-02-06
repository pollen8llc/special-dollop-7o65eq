import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react'; // v14.0.0
import userEvent from '@testing-library/user-event'; // v14.4.3
import '@testing-library/jest-dom/extend-expect'; // v5.16.5
import { useNavigate } from '@remix-run/react';
import AuthModal from '../../../app/components/auth/AuthModal';
import { useAuth } from '../../../app/hooks/useAuth';
import { LoadingState } from '../../../app/types/common.types';

// Mock dependencies
jest.mock('@remix-run/react', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../../app/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('AuthModal', () => {
  // Common test props
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    redirectTo: '/gallery',
  };

  // Mock navigation
  const mockNavigate = jest.fn();

  // Mock auth state
  const mockAuthState = {
    isLoading: false,
    error: null,
    signIn: jest.fn(),
    clearError: jest.fn(),
    isAuthenticated: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useAuth as jest.Mock).mockReturnValue(mockAuthState);
  });

  describe('Rendering and Accessibility', () => {
    it('renders with correct ARIA attributes', () => {
      render(<AuthModal {...defaultProps} />);

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(modal).toHaveAttribute('aria-describedby', 'auth-modal-description');
    });

    it('renders custom aria labels when provided', () => {
      const customProps = {
        ...defaultProps,
        'aria-label': 'Custom modal label',
        'aria-describedby': 'custom-description',
      };

      render(<AuthModal {...customProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-label', 'Custom modal label');
      expect(modal).toHaveAttribute('aria-describedby', 'custom-description');
    });

    it('manages focus correctly when opened', async () => {
      render(<AuthModal {...defaultProps} />);

      // First focusable element should receive focus
      const linkedInButton = screen.getByRole('button', { name: /continue with linkedin/i });
      await waitFor(() => {
        expect(linkedInButton).toHaveFocus();
      });
    });

    it('traps focus within modal', async () => {
      const user = userEvent.setup();
      render(<AuthModal {...defaultProps} />);

      const focusableElements = screen.getAllByRole('button');
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Tab from last to first element
      await user.tab({ shift: true });
      expect(lastElement).toHaveFocus();

      // Tab from first to last element
      await user.tab();
      expect(firstElement).toHaveFocus();
    });
  });

  describe('Authentication Flow', () => {
    it('handles successful authentication', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <AuthModal
          {...defaultProps}
          onClose={onClose}
          redirectTo="/dashboard"
        />
      );

      // Click LinkedIn sign in button
      const signInButton = screen.getByRole('button', { name: /continue with linkedin/i });
      await user.click(signInButton);

      // Verify auth flow started
      expect(mockAuthState.signIn).toHaveBeenCalled();

      // Simulate successful auth
      await act(async () => {
        mockAuthState.isAuthenticated = true;
      });

      // Verify modal closed and redirect occurred
      expect(onClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('displays loading state during authentication', async () => {
      const user = userEvent.setup();
      mockAuthState.isLoading = true;

      render(<AuthModal {...defaultProps} />);

      const signInButton = screen.getByRole('button', { name: /continue with linkedin/i });
      await user.click(signInButton);

      expect(signInButton).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('handles authentication errors', async () => {
      const user = userEvent.setup();
      mockAuthState.error = {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        status: 401,
        timestamp: new Date(),
        details: {},
      };

      render(<AuthModal {...defaultProps} />);

      const signInButton = screen.getByRole('button', { name: /continue with linkedin/i });
      await user.click(signInButton);

      expect(screen.getByRole('alert')).toHaveTextContent(/authentication failed/i);
    });
  });

  describe('Modal Behavior', () => {
    it('closes on overlay click when enabled', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <AuthModal
          {...defaultProps}
          onClose={onClose}
        />
      );

      const overlay = screen.getByLabelText('Modal overlay');
      await user.click(overlay);

      expect(onClose).toHaveBeenCalled();
    });

    it('closes on escape key press when enabled', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <AuthModal
          {...defaultProps}
          onClose={onClose}
        />
      );

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });

    it('prevents body scroll when open', () => {
      render(<AuthModal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { unmount } = render(<AuthModal {...defaultProps} />);
      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('clears error state when modal closes', () => {
      mockAuthState.error = {
        code: 'AUTH_ERROR',
        message: 'Test error',
        status: 401,
        timestamp: new Date(),
        details: {},
      };

      const { rerender } = render(<AuthModal {...defaultProps} />);

      // Close modal
      rerender(<AuthModal {...defaultProps} isOpen={false} />);

      expect(mockAuthState.clearError).toHaveBeenCalled();
    });

    it('displays error message with correct styling', () => {
      mockAuthState.error = {
        code: 'AUTH_ERROR',
        message: 'Test error',
        status: 401,
        timestamp: new Date(),
        details: {},
      };

      render(<AuthModal {...defaultProps} />);

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveClass('text-destructive');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Security', () => {
    it('sanitizes redirect path', async () => {
      const user = userEvent.setup();
      render(
        <AuthModal
          {...defaultProps}
          redirectTo="javascript:alert('xss')"
        />
      );

      const signInButton = screen.getByRole('button', { name: /continue with linkedin/i });
      await user.click(signInButton);

      // Verify sanitized redirect
      expect(mockNavigate).toHaveBeenCalledWith('/gallery', { replace: true });
    });

    it('prevents XSS in error messages', () => {
      mockAuthState.error = {
        code: 'AUTH_ERROR',
        message: '<script>alert("xss")</script>',
        status: 401,
        timestamp: new Date(),
        details: {},
      };

      render(<AuthModal {...defaultProps} />);

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('<script>alert("xss")</script>');
      expect(errorMessage.innerHTML).not.toContain('<script>');
    });
  });
});