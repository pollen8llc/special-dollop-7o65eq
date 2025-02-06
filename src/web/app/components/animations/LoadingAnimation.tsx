import React, { useMemo } from 'react';
import { motion } from 'framer-motion'; // v10.x
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { LoadingAnimation as LoadingAnimationType } from '../../types/animation.types';

interface LoadingAnimationProps {
  /**
   * Size variant of the loading spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Color variant of the loading spinner
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'muted';
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  
  /**
   * Controls the visibility of the loading animation
   * @default true
   */
  isLoading?: boolean;
  
  /**
   * Enables reduced motion mode for accessibility
   * @default false
   */
  reducedMotion?: boolean;
  
  /**
   * Animation duration in seconds
   * @default 0.6
   */
  duration?: number;
}

/**
 * A performance-optimized loading animation component with Framer Motion
 * Features GPU acceleration, reduced motion support, and accessibility
 */
export const LoadingAnimation = React.memo(({
  size = 'md',
  color = 'primary',
  className = '',
  isLoading = true,
  reducedMotion = false,
  duration = 0.6
}: LoadingAnimationProps) => {
  // Memoize animation variants to prevent unnecessary recalculations
  const variants = useMemo(() => ({
    hidden: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: duration * 0.5,
        ease: 'easeOut'
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: duration,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: duration * 0.5,
        ease: 'easeIn'
      }
    }
  }), [duration]);

  // Configure loading spinner animation
  const spinnerAnimation: LoadingAnimationType = {
    duration: reducedMotion ? 2 : 1.2,
    repeat: Infinity,
    ease: 'linear'
  };

  // Performance optimization configuration
  const motionConfig = {
    initial: 'hidden',
    animate: isLoading ? 'visible' : 'hidden',
    exit: 'exit',
    variants,
    // Enable GPU acceleration
    style: {
      willChange: 'transform, opacity',
      // Force GPU acceleration for smoother animations
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden' as const
    }
  };

  return (
    <motion.div
      {...motionConfig}
      className={`flex items-center justify-center ${className}`}
      // Accessibility attributes
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
      // Data attributes for testing
      data-testid="loading-animation"
      data-loading={isLoading}
    >
      {isLoading && (
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            duration: spinnerAnimation.duration,
            repeat: spinnerAnimation.repeat,
            ease: spinnerAnimation.ease,
            // Optimize animation performance
            useTransform: true
          }}
        >
          <LoadingSpinner
            size={size}
            color={color}
            // Additional class for reduced motion support
            className={reducedMotion ? 'motion-reduce:animate-none' : ''}
          />
        </motion.div>
      )}
      {/* Hidden text for screen readers */}
      <span className="sr-only">
        {isLoading ? 'Loading content...' : 'Loading complete'}
      </span>
    </motion.div>
  );
});

// Display name for debugging
LoadingAnimation.displayName = 'LoadingAnimation';

// Type export for consumers
export type { LoadingAnimationProps };