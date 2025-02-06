import React, { useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx'; // v2.0.0
import Navigation from './Navigation';
import useTheme from '../../hooks/useTheme';
import { COLORS } from '../../constants/theme';

interface HeaderProps {
  /**
   * Additional CSS classes for styling
   */
  className?: string;
  
  /**
   * Accessibility label for the header
   * @default 'Main site header'
   */
  ariaLabel?: string;
  
  /**
   * Controls sticky positioning behavior
   * @default true
   */
  isSticky?: boolean;
}

/**
 * A responsive header component with theme switching, navigation, and comprehensive accessibility support.
 * Implements WCAG 2.1 Level AA compliance with proper ARIA labels and keyboard navigation.
 * 
 * @version 1.0.0
 */
const Header: React.FC<HeaderProps> = ({
  className,
  ariaLabel = 'Main site header',
  isSticky = true,
}) => {
  const { theme, toggleTheme, isSystemTheme } = useTheme();
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  /**
   * Handles theme toggle with enhanced accessibility and animations
   */
  const handleThemeToggle = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    
    // Add will-change for performance optimization
    if (headerRef.current) {
      headerRef.current.style.willChange = 'background-color';
    }

    // Toggle theme with animation
    toggleTheme();

    // Update ARIA attributes
    const button = event.currentTarget as HTMLButtonElement;
    button.setAttribute('aria-pressed', theme === 'LIGHT' ? 'true' : 'false');

    // Cleanup will-change after animation
    setTimeout(() => {
      if (headerRef.current) {
        headerRef.current.style.willChange = 'auto';
      }
    }, 300);
  }, [theme, toggleTheme]);

  /**
   * Handles keyboard navigation within the header
   */
  const handleKeyboardNavigation = useCallback((event: React.KeyboardEvent) => {
    // Theme toggle shortcut
    if (event.altKey && event.key === 't') {
      event.preventDefault();
      const themeButton = headerRef.current?.querySelector('#theme-toggle');
      if (themeButton instanceof HTMLButtonElement) {
        themeButton.click();
      }
    }
  }, []);

  /**
   * Implements scroll-based header visibility
   */
  useEffect(() => {
    if (!isSticky) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const header = headerRef.current;

      if (header) {
        // Show/hide header based on scroll direction
        if (currentScrollY > lastScrollY.current) {
          header.style.transform = 'translateY(-100%)';
        } else {
          header.style.transform = 'translateY(0)';
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSticky]);

  return (
    <header
      ref={headerRef}
      className={clsx(
        'w-full bg-white dark:bg-gray-900',
        'border-b border-gray-200 dark:border-gray-700',
        'transition-all duration-300 ease-in-out',
        isSticky && 'sticky top-0 z-50',
        'print:static print:bg-white print:border-none',
        className
      )}
      role="banner"
      aria-label={ariaLabel}
      onKeyDown={handleKeyboardNavigation}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Primary Navigation */}
          <Navigation className="flex-1" />

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle"
            type="button"
            className={clsx(
              'p-2 rounded-md',
              'text-gray-500 dark:text-gray-400',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'focus:outline-none focus:ring-2',
              'focus:ring-primary-500 dark:focus:ring-primary-400',
              'transition-colors duration-200'
            )}
            onClick={handleThemeToggle}
            aria-label={`Switch to ${theme === 'LIGHT' ? 'dark' : 'light'} theme`}
            aria-pressed={theme === 'DARK'}
            data-testid="theme-toggle"
          >
            {theme === 'LIGHT' ? (
              // Moon icon for dark mode
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              // Sun icon for light mode
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;