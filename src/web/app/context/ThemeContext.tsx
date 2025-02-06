/**
 * Theme Context Provider for the LinkedIn Profiles Gallery application.
 * Manages application-wide theme state with system theme detection and persistence.
 * Integrates with Tailwind CSS for consistent theme application.
 * @version 1.0.0
 */

import React from 'react'; // v18.x
import { Theme } from '../types/common.types';
import { THEME_MODES } from '../constants/theme';

/**
 * Interface defining the shape of theme context value
 */
interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isSystemTheme: boolean;
  syncWithSystemTheme: () => void;
}

// Create theme context with null initial value
const ThemeContext = React.createContext<ThemeContextValue | null>(null);

/**
 * Retrieves initial theme from localStorage or system preferences
 * @returns {Theme} The initial theme value
 */
const getInitialTheme = (): Theme => {
  // Check if window is defined (client-side)
  if (typeof window !== 'undefined') {
    // Try to get theme from localStorage
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    
    if (storedTheme && Object.values(THEME_MODES).includes(storedTheme)) {
      return storedTheme;
    }

    // Check system color scheme preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEME_MODES.DARK;
    }
  }

  // Default to light theme
  return THEME_MODES.LIGHT;
};

/**
 * Theme Provider Component
 * Manages theme state and provides theme context to child components
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize theme state with persisted or system preference
  const [theme, setThemeState] = React.useState<Theme>(getInitialTheme);
  const [isSystemTheme, setIsSystemTheme] = React.useState<boolean>(false);

  /**
   * Updates theme in both state and localStorage
   */
  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    setIsSystemTheme(false);
  }, []);

  /**
   * Toggles between light and dark themes
   */
  const toggleTheme = React.useCallback(() => {
    setTheme(theme === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT);
  }, [theme, setTheme]);

  /**
   * Syncs theme with system preference
   */
  const syncWithSystemTheme = React.useCallback(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setThemeState(isDarkMode ? THEME_MODES.DARK : THEME_MODES.LIGHT);
    setIsSystemTheme(true);
    localStorage.removeItem('theme');
  }, []);

  // Effect to apply theme class to document and handle system theme changes
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(THEME_MODES.LIGHT, THEME_MODES.DARK);
    root.classList.add(theme);

    // Set up system theme change listener if using system theme
    if (isSystemTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setThemeState(e.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, isSystemTheme]);

  // Memoize context value to prevent unnecessary rerenders
  const contextValue = React.useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isSystemTheme,
      syncWithSystemTheme,
    }),
    [theme, setTheme, toggleTheme, isSystemTheme, syncWithSystemTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to access theme context
 * @throws {Error} If used outside of ThemeProvider
 * @returns {ThemeContextValue} Theme context value
 */
export const useThemeContext = (): ThemeContextValue => {
  const context = React.useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  
  return context;
};