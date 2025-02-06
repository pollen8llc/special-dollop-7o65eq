import { Transition } from "framer-motion"; // framer-motion@10.x
import { AnimationVariants, ProfileCardAnimation } from "../types/animation.types";

/**
 * Base transition configuration for profile card animations
 * Uses spring physics for natural-feeling interactions
 */
export const PROFILE_CARD_TRANSITION: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

/**
 * Stagger delay for gallery grid animations
 * Optimized for visual appeal while maintaining performance
 */
export const GALLERY_STAGGER_DELAY = 0.05;

/**
 * Standard duration for fade animations
 * Balanced for smooth transitions without feeling sluggish
 */
export const FADE_DURATION = 0.3;

/**
 * Duration for loading animations
 * Tuned for infinite loops without being visually distracting
 */
export const LOADING_DURATION = 1.2;

/**
 * Profile card animation variants with GPU-accelerated transforms
 * Implements smooth hover states and transitions with 3D effects
 */
export const PROFILE_CARD_VARIANTS: AnimationVariants = {
  initial: {
    scale: 1,
    rotateY: 0,
    opacity: 0,
    y: 20,
    transition: PROFILE_CARD_TRANSITION,
  },
  animate: {
    scale: 1,
    rotateY: 0,
    opacity: 1,
    y: 0,
    transition: {
      ...PROFILE_CARD_TRANSITION,
      opacity: { duration: 0.2 },
    },
  },
  hover: {
    scale: 1.05,
    rotateY: 5,
    transition: {
      ...PROFILE_CARD_TRANSITION,
      rotateY: { duration: 0.3 },
    },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Gallery grid animation variants with staggered children
 * Optimized for large lists with smooth entry/exit animations
 */
export const GALLERY_GRID_VARIANTS: AnimationVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: GALLERY_STAGGER_DELAY,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: GALLERY_STAGGER_DELAY / 2,
      staggerDirection: -1,
    },
  },
  hover: {}, // Empty hover state as grid container doesn't animate on hover
};

/**
 * Fade animation variants for modals and overlays
 * Implements smooth opacity transitions with exit animations
 */
export const FADE_VARIANTS: AnimationVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: FADE_DURATION,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: FADE_DURATION,
      ease: "easeIn",
    },
  },
  hover: {}, // Empty hover state as fade container doesn't animate on hover
};

/**
 * Loading animation variants for spinners and loading states
 * Uses CPU-efficient infinite rotation animation
 */
export const LOADING_VARIANTS: AnimationVariants = {
  initial: {
    rotate: 0,
    opacity: 0,
  },
  animate: {
    rotate: 360,
    opacity: 1,
    transition: {
      rotate: {
        duration: LOADING_DURATION,
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop",
      },
      opacity: {
        duration: 0.2,
      },
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
  hover: {}, // Empty hover state as loading animations don't respond to hover
};

/**
 * Profile card 3D effect configuration
 * Defines GPU-accelerated transform values for card interactions
 */
export const PROFILE_CARD_3D: ProfileCardAnimation = {
  scale: 1.05,
  rotate: 5,
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.5,
  },
};

/**
 * Stagger children animation helper
 * Creates staggered animation delays for list items
 * @param index - Child index in the list
 * @returns Delay in seconds
 */
export const getStaggerDelay = (index: number): number => index * GALLERY_STAGGER_DELAY;