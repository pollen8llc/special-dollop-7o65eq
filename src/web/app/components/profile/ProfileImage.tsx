import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion'; // framer-motion@10.x
import clsx from 'clsx'; // clsx@2.0.x
import { Profile } from '../../types/profile.types';
import Avatar from '../common/Avatar';

interface ProfileImageProps {
  /** Profile object containing avatar URL and related data */
  profile: Profile;
  /** Size variant of the profile image */
  size: 'sm' | 'md' | 'lg';
  /** Whether the image can be edited by the user */
  isEditable?: boolean;
  /** Async callback for image changes with error handling */
  onImageChange?: (url: string) => Promise<void>;
  /** Optional additional CSS classes for styling customization */
  className?: string;
  /** Optional custom aria label for accessibility */
  ariaLabel?: string;
}

/**
 * A comprehensive component for displaying and managing profile avatar images
 * with animations, accessibility features, and mobile optimization.
 */
const ProfileImage: React.FC<ProfileImageProps> = ({
  profile,
  size,
  isEditable = false,
  onImageChange,
  className,
  ariaLabel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles image file upload with validation and optimization
   */
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to Railway storage
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await response.json();

      // Call the onImageChange callback with the new URL
      if (onImageChange) {
        await onImageChange(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      console.error('Image upload error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onImageChange]);

  // Container classes with responsive and theme considerations
  const containerClasses = clsx(
    'relative inline-block',
    {
      'cursor-pointer': isEditable,
      'opacity-70': isLoading,
    },
    className
  );

  // Upload button classes
  const uploadButtonClasses = clsx(
    'absolute bottom-0 right-0',
    'bg-primary-500 dark:bg-primary-400',
    'p-1.5 rounded-full shadow-lg',
    'transform transition-transform duration-200',
    'hover:scale-110 focus:scale-110',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    {
      'hidden': !isEditable,
    }
  );

  return (
    <motion.div
      className={containerClasses}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      role={isEditable ? 'button' : 'img'}
      aria-label={ariaLabel || `Profile image of ${profile.headline}`}
    >
      {/* Avatar component with loading and error states */}
      <Avatar
        src={profile.avatarUrl}
        alt={profile.headline}
        size={size}
        className={clsx({
          'ring-2 ring-primary-500': isEditable,
        })}
      />

      {/* Edit button for editable state */}
      {isEditable && (
        <label
          className={uploadButtonClasses}
          tabIndex={0}
          role="button"
          aria-label="Upload new profile image"
        >
          <input
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            disabled={isLoading}
            aria-disabled={isLoading}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
            />
          </svg>
        </label>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            className="animate-spin h-6 w-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          className="absolute -bottom-8 left-0 right-0 text-red-500 text-sm text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProfileImage;