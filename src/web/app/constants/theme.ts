/**
 * Core theme constants and configuration for the LinkedIn Profiles Gallery application.
 * Defines color schemes, breakpoints, spacing, and other theme-related values.
 * Supports light/dark modes and responsive design through Tailwind CSS.
 * @version 1.0.0
 */

import { Theme } from '../types/common.types';

/**
 * Theme mode constants aligned with system preferences
 */
export const THEME_MODES = {
  LIGHT: Theme.LIGHT,
  DARK: Theme.DARK,
} as const;

/**
 * Comprehensive color palette with semantic naming and dark mode variants
 */
export const COLORS = {
  primary: {
    light: '#0A66C2', // LinkedIn blue
    dark: '#0073B1',
    100: '#E7F3FF',
    200: '#B3D1FF',
    300: '#7FB1FF',
    400: '#4C8DFF',
    500: '#0A66C2', // Base
    600: '#084F95',
    700: '#063C70',
    800: '#042B50',
    900: '#021B30',
  },
  secondary: {
    light: '#057642',
    dark: '#0A8F52',
    100: '#E6F4ED',
    200: '#B3E6D1',
    300: '#7FD1B3',
    400: '#4CB894',
    500: '#057642', // Base
    600: '#046235',
    700: '#034D2A',
    800: '#023820',
    900: '#012415',
  },
  background: {
    light: '#FFFFFF',
    dark: '#1D2226',
    paper: {
      light: '#F3F2EF',
      dark: '#000000',
    },
    elevated: {
      light: '#FFFFFF',
      dark: '#2D3338',
    },
  },
  text: {
    primary: {
      light: '#191919',
      dark: '#FFFFFF',
    },
    secondary: {
      light: '#666666',
      dark: '#B3B3B3',
    },
    disabled: {
      light: '#00000061',
      dark: '#FFFFFF61',
    },
  },
  border: {
    light: '#E0E0E0',
    dark: '#38434F',
    focus: {
      light: '#0A66C2',
      dark: '#0073B1',
    },
  },
  error: {
    light: '#D11124',
    dark: '#FF4D4D',
    100: '#FFE6E8',
    500: '#D11124', // Base
    900: '#4D0A0F',
  },
  success: {
    light: '#057642',
    dark: '#0A8F52',
    100: '#E6F4ED',
    500: '#057642', // Base
    900: '#012415',
  },
} as const;

/**
 * Responsive breakpoints following Tailwind CSS conventions
 * Mobile-first approach with standard screen sizes
 */
export const BREAKPOINTS = {
  sm: 640, // Mobile landscape
  md: 768, // Tablet
  lg: 1024, // Desktop
} as const;

/**
 * Consistent spacing scale for layouts and components
 * Based on 4px increments for precise control
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/**
 * Border radius values for consistent component styling
 * Supports both subtle and prominent rounded corners
 */
export const BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

/**
 * Shadow definitions for depth and elevation
 * Optimized for both light and dark modes
 */
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const;

/**
 * Transition timing definitions for smooth animations
 * Follows Material Design timing guidelines
 */
export const TRANSITIONS = {
  default: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;