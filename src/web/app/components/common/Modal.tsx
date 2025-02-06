import React from 'react'; // v18.x
import { motion, AnimatePresence } from 'framer-motion'; // v10.x
import clsx from 'clsx'; // v2.0.0
import FadeInAnimation from '../animations/FadeInAnimation';
import { Button } from './Button';
import { useThemeContext } from '../../context/ThemeContext';
import { COLORS, TRANSITIONS } from '../../constants/theme';

interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback function when modal closes */
  onClose: () => void;
  /** Modal title text */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Optional additional CSS classes */
  className?: string;
  /** Controls visibility of close button */
  showCloseButton?: boolean;
  /** Optional footer actions */
  actions?: React.ReactNode;
  /** Reference to element that should receive focus when modal opens */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Callback fired when animation completes */
  onAnimationComplete?: (definition: string) => void;
  /** Controls if clicking overlay closes modal */
  closeOnOverlayClick?: boolean;
  /** Controls if pressing Escape closes modal */
  closeOnEsc?: boolean;
}

/**
 * A reusable modal component with animation, theme support, and accessibility features.
 * Implements WCAG 2.1 Level AA standards with proper focus management and keyboard navigation.
 */
const Modal: React.FC<ModalProps> = React.memo(({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
  actions,
  initialFocusRef,
  onAnimationComplete,
  closeOnOverlayClick = true,
  closeOnEsc = true,
}) => {
  const { theme } = useThemeContext();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [lastActiveElement] = React.useState(
    typeof document !== 'undefined' ? document.activeElement : null
  );

  // Handle Escape key press
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEsc) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, closeOnEsc, onClose]);

  // Manage focus trap
  React.useEffect(() => {
    if (isOpen) {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (event: KeyboardEvent) => {
          if (event.key === 'Tab') {
            if (event.shiftKey) {
              if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
              }
            }
          }
        };

        document.addEventListener('keydown', handleTabKey);
        (initialFocusRef?.current || firstElement).focus();

        return () => {
          document.removeEventListener('keydown', handleTabKey);
          lastActiveElement instanceof HTMLElement && lastActiveElement.focus();
        };
      }
    }
  }, [isOpen, initialFocusRef, lastActiveElement]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait" onExitComplete={() => onAnimationComplete?.('exit')}>
      <FadeInAnimation
        duration={0.2}
        className="fixed inset-0 z-50 flex items-center justify-center"
        aria-label="Modal overlay"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className={clsx(
            'absolute inset-0',
            theme === 'DARK' ? 'bg-black' : 'bg-gray-600'
          )}
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Modal */}
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={clsx(
            'relative w-full max-w-lg p-6 rounded-lg shadow-xl',
            'bg-white dark:bg-gray-800',
            'transform-gpu',
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              id="modal-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              {title}
            </h2>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1"
                ariaLabel="Close modal"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="relative">{children}</div>

          {/* Footer */}
          {actions && (
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              {actions}
            </div>
          )}
        </motion.div>
      </FadeInAnimation>
    </AnimatePresence>
  );
});

Modal.displayName = 'Modal';

export default Modal;
export type { ModalProps };