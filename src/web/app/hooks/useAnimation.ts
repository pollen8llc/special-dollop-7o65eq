import { useAnimation, AnimationControls, useReducedMotion } from "framer-motion"; // framer-motion@10.x
import { AnimationVariants } from "../types/animation.types";
import { PROFILE_CARD_VARIANTS, GALLERY_GRID_VARIANTS } from "../constants/animations";

/**
 * Custom hook for managing profile card animations with GPU acceleration and accessibility
 * @param scale - Scale factor for hover effect (default: 1.05)
 * @param rotate - Rotation angle in degrees (default: 5)
 * @param springConfig - Custom spring physics configuration
 * @returns Animation controls, variants, and reduced motion state
 */
export const useProfileCardAnimation = (
  scale: number = 1.05,
  rotate: number = 5,
  springConfig: { stiffness: number; damping: number } = { stiffness: 300, damping: 30 }
): {
  controls: AnimationControls;
  variants: AnimationVariants;
  isReducedMotion: boolean;
} => {
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();

  // Validate input parameters
  if (scale <= 0) {
    throw new Error("Scale must be greater than 0");
  }

  // Create GPU-accelerated variants with custom configuration
  const variants: AnimationVariants = {
    ...PROFILE_CARD_VARIANTS,
    hover: {
      scale: prefersReducedMotion ? 1 : scale,
      rotateY: prefersReducedMotion ? 0 : rotate,
      transition: {
        type: "spring",
        ...springConfig,
        rotateY: { duration: 0.3 },
      },
    },
  };

  return {
    controls,
    variants,
    isReducedMotion: Boolean(prefersReducedMotion),
  };
};

/**
 * Custom hook for managing gallery grid animations with stagger effects
 * @param staggerDelay - Delay between item animations in seconds (default: 0.05)
 * @param batchSize - Number of items to animate per batch (default: 10)
 * @returns Animation controls, variants, and batch loading function
 */
export const useGalleryAnimation = (
  staggerDelay: number = 0.05,
  batchSize: number = 10
): {
  controls: AnimationControls;
  variants: AnimationVariants;
  loadNextBatch: () => void;
} => {
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();

  // Create optimized variants with stagger configuration
  const variants: AnimationVariants = {
    ...GALLERY_GRID_VARIANTS,
    animate: {
      ...GALLERY_GRID_VARIANTS.animate,
      transition: {
        ...GALLERY_GRID_VARIANTS.animate.transition,
        staggerChildren: prefersReducedMotion ? 0 : staggerDelay,
      },
    },
  };

  // Progressive loading handler with memory optimization
  const loadNextBatch = async () => {
    await controls.start("animate");
    // Reset animation state for next batch
    controls.set("initial");
  };

  return {
    controls,
    variants,
    loadNextBatch,
  };
};

/**
 * Custom hook for managing fade transitions with accessibility
 * @param duration - Animation duration in seconds (default: 0.3)
 * @param exitDuration - Exit animation duration in seconds (default: 0.2)
 * @returns Animation controls, variants, and animation state
 */
export const useFadeAnimation = (
  duration: number = 0.3,
  exitDuration: number = 0.2
): {
  controls: AnimationControls;
  variants: AnimationVariants;
  isAnimating: boolean;
} => {
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();

  // Create accessible fade variants
  const variants: AnimationVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : duration,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : exitDuration,
        ease: "easeIn",
      },
    },
    hover: {}, // Empty hover state for fade animations
  };

  // Track animation state for ARIA attributes
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = controls.subscribe({
      animationStart: () => setIsAnimating(true),
      animationComplete: () => setIsAnimating(false),
    });

    return () => unsubscribe();
  }, [controls]);

  return {
    controls,
    variants,
    isAnimating,
  };
};