import React, { useState, useCallback } from 'react';
import { motion } from '../../lib/framer-motion';
import clsx from 'clsx'; // clsx@2.0.x

interface AvatarProps {
  /** URL of the avatar image with null handling for fallback state */
  src: string | null;
  /** Comprehensive alternative text for accessibility compliance */
  alt: string;
  /** Responsive size variant with mobile-first considerations */
  size: 'sm' | 'md' | 'lg';
  /** Optional additional CSS classes for custom styling */
  className?: string;
}

/**
 * Maps size prop to responsive Tailwind classes with touch-friendly dimensions
 * @param size - Size variant for the avatar
 * @returns Tailwind CSS classes for responsive dimensions
 */
const getAvatarSize = (size: AvatarProps['size']): string => {
  const sizes = {
    sm: 'w-8 h-8 md:w-10 md:h-10',
    md: 'w-12 h-12 md:w-14 md:h-14',
    lg: 'w-16 h-16 md:w-20 md:h-20'
  };
  return sizes[size];
};

/**
 * A fully accessible avatar component with smooth loading states and fallback handling
 * Supports responsive sizing, dark mode, and WCAG 2.1 Level AA compliance
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size,
  className
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Handles image loading errors with fallback management
   * Updates aria attributes and triggers smooth transition to fallback
   */
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.preventDefault();
    setHasError(true);
    setIsLoading(false);
    console.error('Avatar image failed to load:', src);
  }, [src]);

  /**
   * Handles successful image load with smooth transition
   */
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Generate initials for fallback display
  const initials = alt
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Base container classes with responsive and theme considerations
  const containerClasses = clsx(
    'relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700',
    'transition-all duration-200 ease-in-out',
    getAvatarSize(size),
    className
  );

  // Image classes with loading state handling
  const imageClasses = clsx(
    'w-full h-full object-cover',
    'transition-opacity duration-200',
    isLoading && 'opacity-0',
    !isLoading && !hasError && 'opacity-100'
  );

  // Fallback classes for initials display
  const fallbackClasses = clsx(
    'absolute inset-0',
    'flex items-center justify-center',
    'text-gray-400 dark:text-gray-500',
    'font-medium select-none',
    size === 'sm' && 'text-xs md:text-sm',
    size === 'md' && 'text-sm md:text-base',
    size === 'lg' && 'text-base md:text-lg'
  );

  return (
    <motion.div
      className={containerClasses}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      role="img"
      aria-label={alt}
    >
      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          className={imageClasses}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      )}
      
      {/* Fallback state with initials */}
      {(hasError || !src) && (
        <div 
          className={fallbackClasses}
          aria-hidden="true"
        >
          {initials}
        </div>
      )}

      {/* Loading state overlay */}
      {isLoading && !hasError && (
        <motion.div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
};

export default Avatar;