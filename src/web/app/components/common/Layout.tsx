import React, { useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx'; // v2.0.0
import Header from './Header';
import Footer from './Footer';
import ErrorBoundary from './ErrorBoundary';
import Toast from './Toast';
import { useToast } from '@remix-run/react';

/**
 * Props interface for Layout component with accessibility and theme support
 */
interface LayoutProps {
  /** Child components to render in main content area */
  children: React.ReactNode;
  /** Optional additional CSS classes for layout customization */
  className?: string;
  /** Customizable text for skip-to-main-content link */
  skipLinkText?: string;
}

/**
 * Main layout component that provides consistent page structure with header, main content area,
 * footer, error boundary, and toast notifications. Implements WCAG 2.1 Level AA compliance.
 */
const Layout: React.FC<LayoutProps> = ({
  children,
  className,
  skipLinkText = 'Skip to main content'
}) => {
  // Get toast state and handlers from Remix
  const { toast, showToast, hideToast } = useToast();
  
  // Ref for managing focus after toast notifications
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  
  /**
   * Handles focus management when toast appears/disappears
   */
  useEffect(() => {
    if (toast) {
      // Store currently focused element
      lastFocusedElement.current = document.activeElement as HTMLElement;
      
      // Set focus to toast for accessibility
      const toastElement = document.getElementById('toast');
      if (toastElement) {
        toastElement.focus();
      }
    } else if (lastFocusedElement.current) {
      // Restore focus when toast disappears
      lastFocusedElement.current.focus();
      lastFocusedElement.current = null;
    }
  }, [toast]);

  /**
   * Handles keyboard navigation for skip link
   */
  const handleSkipLinkClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className={clsx(
        'min-h-screen flex flex-col',
        'bg-background text-foreground',
        'transition-colors duration-200',
        className
      )}>
        {/* Skip to main content link for keyboard navigation */}
        <a
          href="#main-content"
          onClick={handleSkipLinkClick}
          className={clsx(
            'sr-only focus:not-sr-only',
            'focus:fixed focus:top-4 focus:left-4',
            'px-4 py-2 bg-primary-500 text-white',
            'rounded-md focus:outline-none focus:ring-2',
            'focus:ring-primary-500 focus:ring-offset-2',
            'z-50'
          )}
        >
          {skipLinkText}
        </a>

        {/* Header with navigation and theme controls */}
        <Header role="banner" />

        {/* Main content area with proper ARIA landmark */}
        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          className={clsx(
            'flex-grow w-full max-w-7xl',
            'mx-auto px-4 sm:px-6 lg:px-8',
            'focus:outline-none'
          )}
        >
          {children}
        </main>

        {/* Footer with navigation and copyright info */}
        <Footer role="contentinfo" />

        {/* Toast notifications with accessibility support */}
        {toast && (
          <Toast
            id="toast"
            type={toast.type}
            message={toast.message}
            onClose={hideToast}
            role="alert"
            aria-live="polite"
            tabIndex={0}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Layout;