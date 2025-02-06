import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // framer-motion@10.x
import type { GalleryAnimation } from '../../types/animation.types';
import { useGalleryAnimation } from '../../hooks/useAnimation';
import { galleryPreset } from '../../lib/framer-motion';

/**
 * A performance-optimized animated container for the profile gallery grid
 * Implements GPU-accelerated animations with reduced motion support
 */
const GalleryAnimation: React.FC<React.PropsWithChildren<GalleryAnimation>> = ({
  children,
  stagger = 0.05,
  duration = 0.3,
  variants = galleryPreset,
  batchSize = 10,
  reducedMotion = false,
}) => {
  // Initialize animation controls and optimized variants
  const {
    controls,
    variants: animationVariants,
    loadNextBatch
  } = useGalleryAnimation(stagger, batchSize);

  // Set up performance monitoring
  useEffect(() => {
    // Enable will-change optimization before animation starts
    const container = document.querySelector('.gallery-container');
    if (container) {
      container.style.willChange = 'transform, opacity';
    }

    // Start initial animation
    controls.start('animate');

    // Cleanup will-change after animation
    return () => {
      if (container) {
        container.style.willChange = 'auto';
      }
      controls.stop();
    };
  }, [controls]);

  // Apply mobile optimization if needed
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const optimizedVariants = {
    ...variants,
    animate: {
      ...variants.animate,
      transition: {
        ...variants.animate.transition,
        staggerChildren: isMobile ? stagger * 1.5 : stagger,
        stiffness: isMobile ? 200 : 300,
      },
    },
  };

  // Configure reduced motion adaptations
  const accessibleVariants = reducedMotion ? {
    ...optimizedVariants,
    animate: {
      ...optimizedVariants.animate,
      transition: {
        duration: 0.1,
        staggerChildren: 0,
      },
    },
  } : optimizedVariants;

  return (
    <motion.div
      className="gallery-container"
      initial="initial"
      animate={controls}
      exit="exit"
      variants={accessibleVariants}
      style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        willChange: 'transform, opacity',
      }}
      aria-live="polite"
      aria-busy={controls.isAnimating}
    >
      <AnimatePresence mode="wait" onExitComplete={() => loadNextBatch()}>
        {children}
      </AnimatePresence>
    </motion.div>
  );
};

export default GalleryAnimation;