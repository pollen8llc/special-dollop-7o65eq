import React, { createContext, useState, useCallback } from 'react'; // react@18.x
import Toast, { ToastType } from '../components/common/Toast';

/**
 * Interface defining the state structure for toast notifications
 */
export interface ToastContextState {
  /** Type of toast notification */
  type: ToastType;
  /** Message to display in the toast */
  message: string;
  /** Duration in milliseconds before auto-dismiss */
  duration: number;
}

/**
 * Interface defining the context value structure with toast management functions
 */
export interface ToastContextValue {
  /** Current toast state or null if no toast is displayed */
  toast: ToastContextState | null;
  /** Function to display a new toast notification */
  showToast: (type: ToastType, message: string, duration?: number) => void;
  /** Function to manually hide the current toast */
  hideToast: () => void;
}

/**
 * Default duration for toast notifications in milliseconds
 */
const DEFAULT_TOAST_DURATION = 3000;

/**
 * Create the toast context with null as initial value
 * Context provides toast state and management functions
 */
export const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Props interface for the ToastProvider component
 */
interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that manages toast notification state and provides
 * methods to show/hide toasts with proper cleanup and error handling
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  // State to manage current toast notification
  const [toast, setToast] = useState<ToastContextState | null>(null);

  // Timer reference for cleanup
  const timerRef = React.useRef<NodeJS.Timeout>();

  /**
   * Cleanup function to clear any existing timers
   */
  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  /**
   * Function to hide the current toast notification
   * Cleans up timers and resets state
   */
  const hideToast = useCallback(() => {
    cleanupTimer();
    setToast(null);
  }, [cleanupTimer]);

  /**
   * Function to show a new toast notification
   * Handles cleanup of existing toasts and sets up auto-dismiss
   */
  const showToast = useCallback(
    (type: ToastType, message: string, duration: number = DEFAULT_TOAST_DURATION) => {
      // Validate input parameters
      if (!message.trim()) {
        console.warn('Toast message cannot be empty');
        return;
      }

      if (duration < 0) {
        console.warn('Toast duration must be positive');
        return;
      }

      // Clean up any existing toast
      hideToast();

      // Set new toast state
      setToast({
        type,
        message,
        duration,
      });

      // Set up auto-dismiss timer if duration is positive
      if (duration > 0) {
        timerRef.current = setTimeout(hideToast, duration);
      }
    },
    [hideToast]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cleanupTimer();
    };
  }, [cleanupTimer]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      toast,
      showToast,
      hideToast,
    }),
    [toast, showToast, hideToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Render toast component when state is present */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
};

/**
 * Custom hook to access toast context with type safety
 * Throws an error if used outside of ToastProvider
 */
export const useToast = (): ToastContextValue => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};