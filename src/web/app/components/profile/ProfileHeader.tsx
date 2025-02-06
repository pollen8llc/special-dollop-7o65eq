import React, { useCallback } from 'react';
import { motion } from 'framer-motion'; // framer-motion@10.x
import clsx from 'clsx'; // clsx@2.0.x
import { Profile } from '../../types/profile.types';
import ProfileImage from './ProfileImage';
import { useTheme } from '../../hooks/useTheme';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useProfileCardAnimation } from '../../hooks/useAnimation';
import { COLORS } from '../../constants/theme';

interface ProfileHeaderProps {
  /** Profile object containing user data */
  profile: Profile;
  /** Whether the profile can be edited */
  isEditable: boolean;
  /** Whether the profile is favorited */
  isFavorited: boolean;
  /** Async callback when favorite status changes */
  onFavorite: (profileId: string) => Promise<void>;
  /** Async callback when connect button is clicked */
  onConnect: (profileId: string) => Promise<void>;
  /** Async callback when profile image is updated */
  onImageChange: (url: string) => Promise<void>;
  /** Optional additional CSS classes */
  className?: string;
  /** Accessibility label for the header section */
  ariaLabel?: string;
}

/**
 * ProfileHeader component that displays the user's profile image, headline,
 * and action buttons with animations and accessibility support.
 */
const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isEditable,
  isFavorited,
  onFavorite,
  onConnect,
  onImageChange,
  className,
  ariaLabel,
}) => {
  const { theme } = useTheme();
  const { controls, variants, isReducedMotion } = useProfileCardAnimation();

  // Handle favorite toggle with loading state
  const handleFavorite = useCallback(async () => {
    try {
      await onFavorite(profile.id);
    } catch (error) {
      console.error('Failed to update favorite status:', error);
    }
  }, [profile.id, onFavorite]);

  // Handle connect button click with loading state
  const handleConnect = useCallback(async () => {
    try {
      await onConnect(profile.id);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }, [profile.id, onConnect]);

  // Container classes with theme support
  const containerClasses = clsx(
    'relative p-6 rounded-lg shadow-lg',
    'bg-white dark:bg-gray-800',
    'transition-colors duration-200',
    className
  );

  // Action button classes
  const actionButtonClasses = clsx(
    'inline-flex items-center px-4 py-2 rounded-md',
    'text-sm font-medium transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );

  return (
    <ErrorBoundary>
      <motion.div
        className={containerClasses}
        variants={variants}
        initial="initial"
        animate="animate"
        whileHover={isReducedMotion ? undefined : "hover"}
        role="region"
        aria-label={ariaLabel || `Profile header for ${profile.headline}`}
      >
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Profile Image */}
          <ProfileImage
            profile={profile}
            size="lg"
            isEditable={isEditable}
            onImageChange={onImageChange}
            className="flex-shrink-0"
          />

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <motion.h1
              className="text-2xl font-bold text-gray-900 dark:text-white"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {profile.headline}
            </motion.h1>

            {/* Social Links */}
            {profile.socialLinks && (
              <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-2">
                {profile.socialLinks.linkedin && (
                  <a
                    href={profile.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    aria-label="LinkedIn profile"
                  >
                    LinkedIn
                  </a>
                )}
                {profile.socialLinks.github && (
                  <a
                    href={profile.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:underline"
                    aria-label="GitHub profile"
                  >
                    GitHub
                  </a>
                )}
                {profile.socialLinks.website && (
                  <a
                    href={profile.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:underline"
                    aria-label="Personal website"
                  >
                    Website
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
          <button
            onClick={handleConnect}
            className={clsx(
              actionButtonClasses,
              'bg-primary-500 text-white hover:bg-primary-600',
              'focus:ring-primary-500'
            )}
            aria-label="Connect with profile"
          >
            Connect
          </button>
          <button
            onClick={handleFavorite}
            className={clsx(
              actionButtonClasses,
              isFavorited
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200',
              'focus:ring-yellow-500'
            )}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorited}
          >
            <span className="mr-2" aria-hidden="true">
              {isFavorited ? '★' : '☆'}
            </span>
            {isFavorited ? 'Favorited' : 'Favorite'}
          </button>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
};

export default React.memo(ProfileHeader);