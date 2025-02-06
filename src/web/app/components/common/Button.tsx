import React from 'react'; // v18.x
import clsx from 'clsx'; // v2.0.0
import { LoadingSpinner } from './LoadingSpinner';
import { COLORS } from '../../constants/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  
  /**
   * Size variant of the button
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Loading state of the button
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  
  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}

/**
 * A reusable button component with comprehensive styling, loading states,
 * and accessibility features. Implements WCAG 2.1 Level AA standards.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
  children,
  onClick,
  type = 'button',
  ariaLabel,
  ...props
}) => {
  // Size-specific classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Variant-specific classes using theme colors
  const variantClasses = {
    primary: `bg-[${COLORS.primary[500]}] text-white hover:bg-[${COLORS.primary[600]}] 
              dark:bg-[${COLORS.primary.dark}] dark:hover:bg-[${COLORS.primary[400]}]`,
    secondary: `bg-[${COLORS.secondary[500]}] text-white hover:bg-[${COLORS.secondary[600]}] 
                dark:bg-[${COLORS.secondary.dark}] dark:hover:bg-[${COLORS.secondary[400]}]`,
    outline: `border-2 border-[${COLORS.primary[500]}] text-[${COLORS.primary[500]}] 
              hover:bg-[${COLORS.primary[100]}] dark:border-[${COLORS.primary.dark}] 
              dark:text-[${COLORS.primary.dark}] dark:hover:bg-[${COLORS.primary[900]}]`,
    ghost: `text-[${COLORS.primary[500]}] hover:bg-[${COLORS.primary[100]}] 
            dark:text-[${COLORS.primary.dark}] dark:hover:bg-[${COLORS.primary[900]}]`,
    destructive: `bg-[${COLORS.error[500]}] text-white hover:bg-[${COLORS.error[600]}] 
                  dark:bg-[${COLORS.error.dark}] dark:hover:bg-[${COLORS.error[400]}]`,
  };

  // Construct className with conditional styles
  const buttonClasses = clsx(
    // Base styles
    'inline-flex items-center justify-center',
    'rounded-md font-medium',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Size and variant specific styles
    sizeClasses[size],
    variantClasses[variant],
    // Focus ring colors based on variant
    {
      'focus:ring-primary-500 dark:focus:ring-primary-400': variant === 'primary' || variant === 'outline',
      'focus:ring-secondary-500 dark:focus:ring-secondary-400': variant === 'secondary',
      'focus:ring-error-500 dark:focus:ring-error-400': variant === 'destructive',
    },
    // Additional custom classes
    className
  );

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner
            size="sm"
            color={variant === 'outline' || variant === 'ghost' ? 'primary' : 'muted'}
            className="mr-2"
          />
          <span className="sr-only">Loading</span>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Type export for consumers
export type { ButtonProps };