import { useContext, useEffect, useCallback } from 'react';
import { THEME_MODES } from '../constants/theme';
import { Theme } from '../types/common.types';

/**
 * Interface for theme context value with state and setters
 */
interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isSystemTheme: boolean;
  setSystemTheme: (useSystem: boolean) => void;
}

/**
 * Interface for useTheme hook return value with extended functionality
 */
interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
  isSystemTheme: boolean;
  setSystemTheme: (useSystem: boolean) => void;
  currentPreference: Theme;
}

/**
 * Helper function to determine initial theme based on localStorage and system preference
 * @returns {Theme} Initial theme value to use
 */
const getInitialTheme = (): Theme => {
  // Check if theme is stored in localStorage
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme && (storedTheme === THEME_MODES.LIGHT || storedTheme === THEME_MODES.DARK)) {
    return storedTheme as Theme;
  }

  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return THEME_MODES.DARK;
  }

  return THEME_MODES.LIGHT;
};

/**
 * Custom hook for managing application theme with system preference support
 * Provides theme state, toggle functionality, and system preference detection
 * @returns {UseThemeReturn} Theme state and management functions
 */
export const useTheme = (): UseThemeReturn => {
  // Access theme context
  const context = useContext<ThemeContextValue | null>(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  const { theme, setTheme, isSystemTheme, setSystemTheme } = context;

  // Initialize system preference media query
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)');

  /**
   * Handle system color scheme changes
   */
  const handleSystemPreference = useCallback((e: MediaQueryListEvent) => {
    if (isSystemTheme) {
      setTheme(e.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT);
    }
  }, [isSystemTheme, setTheme]);

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = useCallback(() => {
    const newTheme = theme === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT;
    setTheme(newTheme);
    setSystemTheme(false);
    localStorage.setItem('theme', newTheme);
  }, [theme, setTheme, setSystemTheme]);

  /**
   * Set up theme transition handling and system preference listener
   */
  useEffect(() => {
    // Add transition class for smooth theme changes
    const html = document.documentElement;
    html.classList.add('theme-transition');
    
    // Remove transition class after animation completes
    const transitionTimeout = setTimeout(() => {
      html.classList.remove('theme-transition');
    }, 300);

    // Set up system preference listener
    systemPreference.addEventListener('change', handleSystemPreference);

    return () => {
      clearTimeout(transitionTimeout);
      systemPreference.removeEventListener('change', handleSystemPreference);
    };
  }, [handleSystemPreference]);

  /**
   * Update document theme classes and CSS variables
   */
  useEffect(() => {
    const html = document.documentElement;
    const currentTheme = isSystemTheme
      ? systemPreference.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT
      : theme;

    // Update theme class
    html.classList.remove(THEME_MODES.LIGHT, THEME_MODES.DARK);
    html.classList.add(currentTheme);

    // Store theme preference if not using system theme
    if (!isSystemTheme) {
      localStorage.setItem('theme', currentTheme);
    } else {
      localStorage.removeItem('theme');
    }
  }, [theme, isSystemTheme]);

  return {
    theme,
    toggleTheme,
    isSystemTheme,
    setSystemTheme,
    currentPreference: systemPreference.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT
  };
};

export default useTheme;