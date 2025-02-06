import { motion, AnimatePresence } from "framer-motion"; // framer-motion@10.x
import type { AnimationVariants, ProfileCardAnimation } from "../types/animation.types";

/**
 * Default transition configuration optimized for smooth, natural motion
 * Uses spring physics for more organic movement
 */
const DEFAULT_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
  // Enable GPU acceleration for better performance
  translateX: { type: "spring", stiffness: 300 },
  translateY: { type: "spring", stiffness: 300 },
  scale: { type: "spring", stiffness: 300 },
  rotate: { type: "spring", stiffness: 300 }
};

// Animation timing constants
const DEFAULT_DURATION = 0.3;
const STAGGER_DELAY = 0.05;
const HOVER_SCALE = 1.05;
const HOVER_ROTATE = 2;

/**
 * Creates optimized profile card animation configuration with GPU acceleration
 * @param options - Optional custom animation settings
 * @returns Complete animation variant configuration
 */
export const createProfileCardAnimation = (
  options: Partial<ProfileCardAnimation> = {}
): AnimationVariants => {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  return {
    initial: {
      scale: 1,
      rotate: 0,
      opacity: 0,
      y: 20,
      willChange: "transform, opacity",
      transform: "perspective(1000px)",
    },
    animate: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      y: 0,
      transition: {
        ...DEFAULT_TRANSITION,
        ...options.transition,
      },
    },
    hover: prefersReducedMotion
      ? {}
      : {
          scale: options.scale || HOVER_SCALE,
          rotate: options.rotate || HOVER_ROTATE,
          transition: {
            ...DEFAULT_TRANSITION,
            ...options.transition,
          },
          willChange: "transform",
        },
    exit: {
      scale: 0.95,
      opacity: 0,
      transition: {
        ...DEFAULT_TRANSITION,
        duration: DEFAULT_DURATION,
      },
    },
  };
};

/**
 * Creates staggered gallery animation configuration with performance optimizations
 * @param staggerChildren - Delay between child animations
 * @param delayChildren - Initial delay before starting animations
 * @returns Optimized gallery animation configuration
 */
export const createGalleryAnimation = (
  staggerChildren = STAGGER_DELAY,
  delayChildren = 0
): AnimationVariants => {
  return {
    initial: {
      opacity: 0,
      willChange: "opacity, transform",
    },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren,
        staggerDirection: 1,
        when: "beforeChildren",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: STAGGER_DELAY / 2,
        staggerDirection: -1,
        when: "afterChildren",
      },
    },
    hover: {},
  };
};

/**
 * Creates optimized fade animation with accessibility support
 * @param duration - Animation duration in seconds
 * @returns Fade animation configuration
 */
export const createFadeAnimation = (
  duration = DEFAULT_DURATION
): AnimationVariants => {
  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  return {
    initial: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 10,
      willChange: "opacity, transform",
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -10,
      transition: {
        duration: duration / 2,
        ease: "easeIn",
      },
    },
    hover: {},
  };
};

/**
 * Pre-configured animation presets for profile cards
 */
export const profileCardPresets = {
  default: createProfileCardAnimation(),
  hover: createProfileCardAnimation({
    scale: 1.08,
    rotate: 3,
    transition: {
      ...DEFAULT_TRANSITION,
      mass: 0.6,
    },
  }),
};

/**
 * Pre-configured animation presets for gallery layout
 */
export const galleryPresets = {
  grid: createGalleryAnimation(),
  items: createGalleryAnimation(STAGGER_DELAY * 1.5, 0.2),
};

/**
 * Pre-configured animation presets for fade transitions
 */
export const fadePresets = {
  default: createFadeAnimation(),
  fast: createFadeAnimation(DEFAULT_DURATION / 2),
  slow: createFadeAnimation(DEFAULT_DURATION * 1.5),
};

/**
 * Performance-optimized loading animation configuration
 */
export const loadingAnimation: AnimationVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    willChange: "opacity, transform",
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      ...DEFAULT_TRANSITION,
      repeat: Infinity,
      repeatType: "reverse",
      duration: DEFAULT_DURATION * 2,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: DEFAULT_DURATION / 2,
    },
  },
  hover: {},
};