import React from 'react'; // v18.x
import clsx from 'clsx'; // v2.x
import '../../styles/animations.css';

interface LoadingSpinnerProps {
  /**
   * Size variant of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Color variant of the spinner
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'muted';
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
}

/**
 * A reusable loading spinner component with customizable size and color.
 * Features GPU-accelerated animations and accessibility support.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  // Map size variants to Tailwind classes
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  };

  // Map color variants to Tailwind theme colors
  const colorClasses = {
    primary: 'border-primary border-t-transparent',
    secondary: 'border-secondary border-t-transparent',
    muted: 'border-muted border-t-transparent',
  };

  // Construct className string with conditional styles
  const spinnerClasses = clsx(
    'rounded-full animate-loading',
    'transform-gpu', // Enable GPU acceleration
    'motion-reduce:animate-[loading-spinner_2s_linear_infinite]', // Slower animation for reduced motion
    sizeClasses[size],
    colorClasses[color],
    className
  );

  return (
    <div
      role="status"
      aria-label="Loading"
      className={spinnerClasses}
      // Add data attributes for potential testing/styling hooks
      data-size={size}
      data-color={color}
      // Add will-change hint for performance optimization
      style={{ willChange: 'transform' }}
    >
      {/* Hidden text for screen readers */}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Type export for consumers
export type { LoadingSpinnerProps };