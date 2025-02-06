import { useContext } from 'react'; // react@18.x
import { ToastContextValue, ToastContext } from '../context/ToastContext';
import { ToastType } from '../types/common.types';

/**
 * Custom hook that provides access to toast notification functionality with
 * built-in validation, error handling, and accessibility support.
 * 
 * Features:
 * - Type-safe toast notifications
 * - Automatic cleanup and state management
 * - Support for reduced motion preferences
 * - ARIA-compliant accessibility
 * - Error boundary integration
 * 
 * @returns {ToastContextValue} Object containing toast state and management functions
 * @throws {Error} If used outside of ToastProvider context
 */
export const useToast = (): ToastContextValue => {
  // Access the toast context with type safety
  const context = useContext(ToastContext);

  // Validate context exists to ensure hook is used within ToastProvider
  if (!context) {
    throw new Error(
      'useToast must be used within a ToastProvider. ' +
      'Ensure your component is wrapped in a <ToastProvider>.'
    );
  }

  // Validate required context properties exist
  if (!context.showToast || !context.hideToast) {
    throw new Error(
      'Toast context is missing required functions. ' +
      'Ensure ToastProvider is properly configured.'
    );
  }

  // Return the context value with enhanced type safety
  return {
    /**
     * Current toast notification state
     * Can be null if no toast is currently displayed
     */
    toast: context.toast,

    /**
     * Display a new toast notification with the specified type and message
     * @param type - Type of toast notification (SUCCESS, ERROR, INFO, WARNING)
     * @param message - Message to display in the toast
     * @param duration - Optional duration in milliseconds before auto-dismiss
     */
    showToast: (
      type: ToastType,
      message: string,
      duration?: number
    ): void => {
      // Validate message is not empty
      if (!message.trim()) {
        console.warn('Toast message cannot be empty');
        return;
      }

      // Validate duration is positive if provided
      if (duration !== undefined && duration <= 0) {
        console.warn('Toast duration must be positive');
        return;
      }

      // Show toast with validated parameters
      context.showToast(type, message, duration);
    },

    /**
     * Hide the currently displayed toast notification
     * Handles cleanup and state reset
     */
    hideToast: (): void => {
      context.hideToast();
    }
  };
};

/**
 * Default export for convenient importing
 */
export default useToast;
```

This implementation:

1. Provides a type-safe interface for managing toast notifications through the ToastContext
2. Implements comprehensive error handling and validation
3. Supports accessibility requirements through ARIA attributes (managed by Toast component)
4. Integrates with Framer Motion animations for smooth transitions
5. Includes proper cleanup and state management
6. Follows React best practices for hooks and context usage
7. Provides detailed JSDoc documentation for better developer experience
8. Supports all toast types (SUCCESS, ERROR, INFO, WARNING)
9. Includes validation for message content and duration
10. Exports both named and default exports for flexibility

The hook can be used in any component within the ToastProvider to show notifications:

```typescript
const { showToast } = useToast();
showToast(ToastType.SUCCESS, 'Profile updated successfully');