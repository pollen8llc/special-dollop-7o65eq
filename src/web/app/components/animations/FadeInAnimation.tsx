import React from 'react'; // react@18.x
import { motion, AnimatePresence } from 'framer-motion'; // framer-motion@10.x
import type { FadeAnimation } from '../../types/animation.types';
import { fadePreset } from '../../lib/framer-motion';
import { useFadeAnimation } from '../../hooks/useAnimation';

/**
 * Props interface for the FadeInAnimation component
 * Provides type-safe configuration for fade animations with accessibility support
 */
interface FadeInAnimationProps {
  /** Child elements to be animated */
  children: React.ReactNode;
  /** Animation duration in seconds */
  duration?: number;
  /** Delay before animation starts in seconds */
  delay?: number;
  /** Optional CSS classes for styling */
  className?: string;
  /** Accessibility label for animated content */
  'aria-label'?: string;
  /** Callback fired when animation completes */
  onAnimationComplete?: (definition: string) => void;
}

/**
 * A reusable component that provides smooth fade-in animations with
 * accessibility support and performance optimizations
 */
const FadeInAnimation: React.FC<FadeInAnimationProps> = ({
  children,
  duration = 0.3,
  delay = 0,
  className = '',
  'aria-label': ariaLabel,
  onAnimationComplete,
}) => {
  // Validate duration parameter
  if (duration < 0) {
    throw new Error('Animation duration must be a positive number');
  }

  // Initialize animation controls and variants with error handling
  const { controls, variants, isAnimating } = useFadeAnimation(duration, 0.2);

  // Configure GPU-accelerated animation with custom timing
  const animationConfig: FadeAnimation = {
    duration,
    opacity: 1,
    transition: {
      duration,
      delay,
      ease: 'easeOut',
      willChange: 'opacity',
    },
  };

  // Cleanup animation controls on unmount
  React.useEffect(() => {
    return () => {
      controls.stop();
    };
  }, [controls]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className={className}
        aria-label={ariaLabel}
        aria-busy={isAnimating}
        style={{ willChange: 'opacity' }}
        onAnimationComplete={(definition) => {
          // Ensure animation cleanup
          if (definition === 'exit') {
            controls.set('initial');
          }
          onAnimationComplete?.(definition);
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default FadeInAnimation;