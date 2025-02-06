import { Target, Transition, Variants } from "framer-motion"; // framer-motion@10.x

/**
 * Base animation variant type defining common animation states
 * Used for consistent animation state management across components
 */
export type AnimationVariants = {
  initial: Target;
  animate: Target;
  exit: Target;
  hover: Target;
};

/**
 * Profile card animation configuration interface
 * Defines type-safe animation properties for profile card interactions
 * including 3D rotation and scaling effects
 */
export interface ProfileCardAnimation {
  /** Scale factor for card hover/focus states */
  scale: number;
  /** Rotation angle in degrees for 3D effect */
  rotate: number;
  /** Transition configuration for smooth animations */
  transition: Transition;
}

/**
 * Gallery animation configuration interface
 * Controls the animation of profile cards within the gallery grid
 * including stagger effects for card entry/exit
 */
export interface GalleryAnimation {
  /** Delay between consecutive card animations in seconds */
  stagger: number;
  /** Total animation duration in seconds */
  duration: number;
  /** Animation state variants for gallery items */
  variants: Variants;
}

/**
 * Fade animation configuration interface
 * Used for smooth transitions between component states
 * with configurable opacity and timing
 */
export interface FadeAnimation {
  /** Animation duration in seconds */
  duration: number;
  /** Target opacity value between 0 and 1 */
  opacity: number;
  /** Transition configuration for fade effect */
  transition: Transition;
}

/**
 * Loading animation configuration interface
 * Defines properties for loading state animations
 * with support for infinite loops and easing
 */
export interface LoadingAnimation {
  /** Animation duration per cycle in seconds */
  duration: number;
  /** Number of animation repeats or Infinity for continuous */
  repeat: number | Infinity;
  /** Easing function for smooth animation curves */
  ease: string;
}

/**
 * Type guard to check if a value is a valid animation target
 * @param value - Value to check
 * @returns Boolean indicating if value is a valid Target
 */
export const isValidTarget = (value: unknown): value is Target => {
  return value !== null && typeof value === 'object';
};

/**
 * Type guard to check if a value is a valid transition configuration
 * @param value - Value to check
 * @returns Boolean indicating if value is a valid Transition
 */
export const isValidTransition = (value: unknown): value is Transition => {
  return value !== null && typeof value === 'object';
};

/**
 * Type guard to check if a value is a valid variants configuration
 * @param value - Value to check
 * @returns Boolean indicating if value is a valid Variants
 */
export const isValidVariants = (value: unknown): value is Variants => {
  return value !== null && typeof value === 'object';
};