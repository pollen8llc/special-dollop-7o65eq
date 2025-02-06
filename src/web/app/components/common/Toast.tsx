import React, { useState, useEffect, useCallback } from 'react'; // react@18.x
import FadeInAnimation from '../animations/FadeInAnimation';

/**
 * Enum defining available toast notification types
 */
export enum ToastType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  INFO = 'INFO',
  WARNING = 'WARNING'
}

/**
 * Interface defining the props for the Toast component
 */
interface ToastProps {
  /** Optional CSS classes for custom styling */
  className?: string;
  /** Message to display in the toast */
  message: string;
  /** Type of toast notification */
  type: ToastType;
  /** Duration in milliseconds before auto-dismiss */
  duration?: number;
  /** Callback function when toast is closed */
  onClose?: () => void;
}

/**
 * Mapping of toast types to their respective Tailwind CSS classes
 */
const TOAST_STYLES = {
  [ToastType.SUCCESS]: 'bg-green-500 text-white',
  [ToastType.ERROR]: 'bg-red-500 text-white',
  [ToastType.INFO]: 'bg-blue-500 text-white',
  [ToastType.WARNING]: 'bg-yellow-500 text-black'
};

/**
 * Animation duration in milliseconds for fade transitions
 */
const ANIMATION_DURATION = 300;

/**
 * Default duration for toast display in milliseconds
 */
const DEFAULT_TOAST_DURATION = 3000;

/**
 * A reusable toast notification component that displays temporary messages
 * with different styles and smooth animations.
 */
export const Toast: React.FC<ToastProps> = ({
  className = '',
  message,
  type,
  duration = DEFAULT_TOAST_DURATION,
  onClose
}) => {
  // Manage visibility state of the toast
  const [visible, setVisible] = useState(true);

  // Memoized close handler to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    setVisible(false);
    // Allow animation to complete before triggering onClose
    setTimeout(() => {
      onClose?.();
    }, ANIMATION_DURATION);
  }, [onClose]);

  // Auto-dismiss effect with cleanup
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  // Return null if toast is not visible
  if (!visible) {
    return null;
  }

  // Combine base styles with type-specific styles and custom classes
  const toastStyles = `
    fixed top-4 right-4 z-50 
    flex items-center justify-between
    px-4 py-3 rounded-lg shadow-lg
    ${TOAST_STYLES[type]}
    ${className}
  `.trim();

  return (
    <FadeInAnimation
      duration={ANIMATION_DURATION / 1000}
      className={toastStyles}
      aria-label={`${type.toLowerCase()} notification`}
    >
      <div className="flex items-center space-x-2">
        {/* Icon based on toast type */}
        <span className="flex-shrink-0" role="img" aria-hidden="true">
          {type === ToastType.SUCCESS && '✓'}
          {type === ToastType.ERROR && '✕'}
          {type === ToastType.INFO && 'ℹ'}
          {type === ToastType.WARNING && '⚠'}
        </span>
        
        {/* Message with proper text wrapping */}
        <p className="flex-1 text-sm font-medium break-words">
          {message}
        </p>
      </div>

      {/* Close button with hover effect */}
      <button
        onClick={handleClose}
        className="ml-4 opacity-75 hover:opacity-100 focus:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <span aria-hidden="true">×</span>
      </button>
    </FadeInAnimation>
  );
};

export default Toast;