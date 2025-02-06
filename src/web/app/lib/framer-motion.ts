import { motion, AnimatePresence, useReducedMotion } from "framer-motion"; // framer-motion@10.x
import type { AnimationVariants } from "../types/animation.types";

/**
 * Creates optimized animation configuration for profile card interactions
 * with hardware acceleration and performance considerations
 */
export const createProfileCardAnimation = (
  scale: number = 1.05,
  rotate: number = 5,
  duration: number = 0.3
): AnimationVariants => {
  return {
    initial: {
      scale: 1,
      rotateY: 0,
      opacity: 0,
      y: 20,
      willChange: "transform, opacity",
    },
    animate: {
      scale: 1,
      rotateY: 0,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration,
      },
    },
    hover: {
      scale,
      rotateY: rotate,
      transition: {
        type: "tween",
        duration: 0.2,
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
};

/**
 * Creates performant staggered animation configuration for gallery grid
 * with mobile optimization and reduced motion support
 */
export const createGalleryAnimation = (
  staggerDelay: number = 0.1,
  isMobile: boolean = false
): AnimationVariants => {
  const baseTransition = {
    type: "spring",
    stiffness: isMobile ? 200 : 300,
    damping: isMobile ? 25 : 20,
  };

  return {
    initial: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      willChange: "transform, opacity",
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        ...baseTransition,
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
    hover: {},
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2,
      },
    },
  };
};

/**
 * Performance-optimized animation preset for profile cards
 * with hardware acceleration and touch interaction support
 */
export const profileCardPreset: AnimationVariants = {
  initial: {
    scale: 1,
    opacity: 0,
    y: 20,
    willChange: "transform, opacity",
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      type: "tween",
      duration: 0.2,
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
 * Mobile-optimized animation preset for gallery grid
 * with stagger effects and reduced motion support
 */
export const galleryPreset: AnimationVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    willChange: "transform, opacity",
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 250,
      damping: 20,
      staggerChildren: 0.1,
    },
  },
  hover: {},
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Optimized animation preset for fade transitions
 * with smooth easing and performance considerations
 */
export const fadePreset: AnimationVariants = {
  initial: {
    opacity: 0,
    willChange: "opacity",
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  hover: {},
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Accessible animation preset for loading states
 * with reduced motion support and infinite animation
 */
export const loadingPreset: AnimationVariants = {
  initial: {
    opacity: 0.6,
    scale: 0.98,
    willChange: "transform, opacity",
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      repeat: Infinity,
      repeatType: "reverse",
      duration: 0.8,
      ease: "easeInOut",
    },
  },
  hover: {},
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Hook for creating accessible animations with reduced motion support
 * @returns Animation variants with reduced motion adjustments
 */
export const useAccessibleAnimations = (
  variants: AnimationVariants
): AnimationVariants => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return {
      ...variants,
      animate: {
        ...variants.animate,
        scale: 1,
        rotate: 0,
        transition: {
          duration: 0.1,
        },
      },
      hover: {
        scale: 1,
      },
      exit: {
        opacity: 0,
        transition: {
          duration: 0.1,
        },
      },
    };
  }

  return variants;
};

/**
 * Creates optimized spring animation configuration
 * with performance considerations for smooth transitions
 */
export const createSpringTransition = (
  stiffness: number = 300,
  damping: number = 20
) => ({
  type: "spring" as const,
  stiffness,
  damping,
  willChange: "transform",
});

/**
 * Creates optimized tween animation configuration
 * for simple, performance-focused transitions
 */
export const createTweenTransition = (duration: number = 0.2) => ({
  type: "tween" as const,
  duration,
  ease: "easeOut",
  willChange: "transform, opacity",
});