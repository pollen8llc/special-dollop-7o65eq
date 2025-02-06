import { useState, useEffect } from 'react'; // v18.0.0
import { BREAKPOINTS, DEVICE_TYPES } from '../constants/breakpoints';

/**
 * Determines device type based on window width using mobile-first approach
 * @param width - Current window width in pixels
 * @returns DeviceType string constant
 */
const getDeviceType = (width: number): typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES] => {
  if (typeof width !== 'number' || width < 0) {
    throw new Error('Invalid width provided to getDeviceType');
  }

  if (width >= BREAKPOINTS.DESKTOP) {
    return DEVICE_TYPES.DESKTOP;
  }

  if (width >= BREAKPOINTS.TABLET) {
    return DEVICE_TYPES.TABLET;
  }

  return DEVICE_TYPES.MOBILE;
};

/**
 * Interface for the hook's return value with strict typing
 */
interface BreakpointInfo {
  width: number;
  deviceType: typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Custom hook for responsive breakpoint detection
 * Implements mobile-first approach with SSR compatibility
 * @returns BreakpointInfo object containing current width, device type and boolean flags
 */
export const useBreakpoint = (): BreakpointInfo => {
  // Initialize with SSR-safe defaults
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return window.innerWidth;
  });

  const [deviceType, setDeviceType] = useState<typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES]>(() => {
    if (typeof window === 'undefined') return DEVICE_TYPES.MOBILE;
    return getDeviceType(window.innerWidth);
  });

  useEffect(() => {
    // Skip effect during SSR
    if (typeof window === 'undefined') return;

    let frameId: number;
    let timeoutId: NodeJS.Timeout;

    // Debounced resize handler using requestAnimationFrame
    const handleResize = () => {
      // Cancel any pending frame
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      // Clear any pending timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Schedule new frame
      frameId = requestAnimationFrame(() => {
        const currentWidth = window.innerWidth;
        setWidth(currentWidth);
        setDeviceType(getDeviceType(currentWidth));
      });

      // Ensure frame gets canceled if no resize end within 150ms
      timeoutId = setTimeout(() => {
        if (frameId) {
          cancelAnimationFrame(frameId);
        }
      }, 150);
    };

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize, { passive: true });

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Calculate boolean flags based on current device type
  const isMobile = deviceType === DEVICE_TYPES.MOBILE;
  const isTablet = deviceType === DEVICE_TYPES.TABLET;
  const isDesktop = deviceType === DEVICE_TYPES.DESKTOP;

  return {
    width,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
  };
};