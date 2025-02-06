/**
 * Breakpoint constants for responsive design implementation
 * Following mobile-first approach aligned with Tailwind CSS defaults
 * @version 1.0.0
 */

/**
 * Numeric breakpoint values in pixels for different device sizes
 * Used for media queries and responsive layout calculations
 */
export const BREAKPOINTS = {
  /** Minimum width for mobile devices (640px) */
  MOBILE: 640,
  /** Minimum width for tablet devices (768px) */
  TABLET: 768,
  /** Minimum width for desktop devices (1024px) */
  DESKTOP: 1024
} as const;

/**
 * String literals for device type identification
 * Used for conditional rendering and device-specific logic
 */
export const DEVICE_TYPES = {
  /** Identifier for mobile devices */
  MOBILE: 'mobile',
  /** Identifier for tablet devices */
  TABLET: 'tablet',
  /** Identifier for desktop devices */
  DESKTOP: 'desktop'
} as const;

// Type definitions for better TypeScript support
export type Breakpoint = typeof BREAKPOINTS[keyof typeof BREAKPOINTS];
export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];