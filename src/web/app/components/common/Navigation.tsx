import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useLocation } from '@remix-run/react';
import { motion, AnimatePresence } from 'framer-motion'; // v10.x
import clsx from 'clsx'; // v2.0.0
import { Button } from './Button';
import { LoginButton } from '../auth/LoginButton';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';

interface NavigationProps {
  className?: string;
  skipToContent?: boolean;
}

/**
 * Enhanced responsive navigation component with authentication, accessibility,
 * and theme support for the LinkedIn Profiles Gallery application.
 * Implements WCAG 2.1 Level AA compliance.
 */
const Navigation: React.FC<NavigationProps> = ({
  className,
  skipToContent = true,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { isAuthenticated, user, signOut, isLoading: authLoading } = useAuth();

  // Handle sign out with loading state and error handling
  const handleSignOut = async (event: React.MouseEvent) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      await signOut();
      // Announce sign out to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.textContent = 'Successfully signed out';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard navigation for accessibility
  const handleKeyboardNavigation = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isMenuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation items with active state handling
  const navItems = [
    { path: ROUTES.HOME, label: 'Home' },
    { path: ROUTES.GALLERY, label: 'Gallery' },
    ...(isAuthenticated ? [{ path: `${ROUTES.PROFILE.ROOT}/${user?.id}`, label: 'My Profile' }] : []),
  ];

  return (
    <nav
      className={clsx(
        'fixed top-0 left-0 right-0 z-50',
        'bg-white dark:bg-gray-900',
        'border-b border-gray-200 dark:border-gray-700',
        'transition-colors duration-200',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
      onKeyDown={handleKeyboardNavigation}
    >
      {/* Skip to content link for accessibility */}
      {skipToContent && (
        <a
          href="#main-content"
          className={clsx(
            'sr-only focus:not-sr-only',
            'focus:absolute focus:top-4 focus:left-4',
            'px-4 py-2 bg-primary-500 text-white',
            'rounded-md focus:outline-none focus:ring-2',
            'focus:ring-primary-500 focus:ring-offset-2'
          )}
        >
          Skip to content
        </a>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              to={ROUTES.HOME}
              className="text-xl font-bold text-gray-900 dark:text-white"
              aria-label="LinkedIn Profiles Gallery Home"
            >
              Profiles Gallery
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {navItems.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={clsx(
                  'px-3 py-2 rounded-md text-sm font-medium',
                  'transition-colors duration-200',
                  location.pathname === path
                    ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
                aria-current={location.pathname === path ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
            
            {/* Authentication buttons */}
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                isLoading={isLoading}
                className="ml-4"
                aria-label="Sign out of your account"
              >
                Sign Out
              </Button>
            ) : (
              <LoginButton
                variant="primary"
                className="ml-4"
              />
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className={clsx(
                'inline-flex items-center justify-center p-2',
                'rounded-md text-gray-700 dark:text-gray-300',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-inset',
                'focus:ring-primary-500'
              )}
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">
                {isMenuOpen ? 'Close menu' : 'Open menu'}
              </span>
              <motion.svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={isMenuOpen ? 'open' : 'closed'}
                variants={{
                  open: { rotate: 45 },
                  closed: { rotate: 0 },
                }}
                transition={{ duration: 0.2 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </motion.svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            className="sm:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={clsx(
                    'block px-3 py-2 rounded-md text-base font-medium',
                    'transition-colors duration-200',
                    location.pathname === path
                      ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                  aria-current={location.pathname === path ? 'page' : undefined}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              
              {/* Mobile authentication buttons */}
              <div className="mt-4 px-3">
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    isLoading={isLoading}
                    className="w-full"
                    aria-label="Sign out of your account"
                  >
                    Sign Out
                  </Button>
                ) : (
                  <LoginButton
                    variant="primary"
                    className="w-full"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;