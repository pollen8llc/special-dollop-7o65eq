import React from 'react'; // react@18.x
import { motion, AnimatePresence } from 'framer-motion'; // framer-motion@10.x
import type { ProfileCardAnimation } from '../../types/animation.types';
import { useProfileCardAnimation } from '../../hooks/useAnimation';
import { profileCardPreset } from '../../lib/framer-motion';

interface CardAnimationProps {
  /** Child elements to be animated */
  children: React.ReactNode;
  /** Scale factor for hover effect */
  scale?: number;
  /** Rotation angle in degrees */
  rotate?: number;
  /** Optional CSS classes */
  className?: string;
  /** Enable reduced motion for accessibility */
  reducedMotion?: boolean;
  /** Enable touch interactions for mobile devices */
  touchEnabled?: boolean;
}

/**
 * A performance-optimized animated card component with GPU acceleration,
 * touch support, and accessibility features.
 */
const CardAnimation: React.FC<CardAnimationProps> = ({
  children,
  scale = 1.05,
  rotate = 5,
  className = '',
  reducedMotion = false,
  touchEnabled = true,
}) => {
  // Initialize animation controls and variants with cleanup
  const { controls, variants, isReducedMotion } = useProfileCardAnimation(
    reducedMotion ? 1 : scale,
    reducedMotion ? 0 : rotate,
    { stiffness: 300, damping: 30 }
  );

  // Configure performance-optimized animation settings
  const animationConfig = {
    ...profileCardPreset,
    animate: {
      ...profileCardPreset.animate,
      transition: {
        ...profileCardPreset.animate.transition,
        willChange: 'transform, opacity',
      },
    },
  };

  // Touch interaction handlers for mobile devices
  const touchHandlers = touchEnabled
    ? {
        onTouchStart: () => controls.start('hover'),
        onTouchEnd: () => controls.start('animate'),
      }
    : {};

  // Error boundary for animation failures
  React.useEffect(() => {
    return () => {
      controls.stop();
    };
  }, [controls]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={`card-animation ${className}`}
        initial="initial"
        animate={controls}
        exit="exit"
        variants={isReducedMotion ? undefined : variants}
        whileHover={isReducedMotion ? undefined : 'hover'}
        style={{
          willChange: 'transform, opacity',
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
        {...touchHandlers}
        aria-live="polite"
        aria-atomic="true"
        data-reduced-motion={isReducedMotion}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default CardAnimation;