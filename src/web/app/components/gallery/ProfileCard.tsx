import React, { useCallback } from 'react';
import { useNavigate } from '@remix-run/react'; // @remix-run/react@1.19.x
import clsx from 'clsx'; // clsx@2.0.x
import type { Profile } from '../../types/profile.types';
import CardAnimation from '../animations/CardAnimation';
import Avatar from '../common/Avatar';

interface ProfileCardProps {
  /** Profile data to be displayed in the card */
  profile: Profile;
  /** Optional additional CSS classes for custom styling */
  className?: string;
}

/**
 * A performant and accessible profile card component with interactive animations
 * Implements GPU-accelerated transforms, touch support, and WCAG compliance
 */
const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  className
}) => {
  const navigate = useNavigate();

  /**
   * Handles card click navigation with error boundary
   * Implements smooth transition to profile detail view
   */
  const handleCardClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    
    if (!profile.id) {
      console.error('Profile ID is missing:', profile);
      return;
    }

    try {
      navigate(`/profiles/${profile.id}`);
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  }, [profile.id, navigate]);

  // Base container classes with theme and interaction states
  const containerClasses = clsx(
    'w-full max-w-sm rounded-lg overflow-hidden',
    'bg-white dark:bg-gray-800',
    'transition-shadow duration-200',
    'hover:shadow-xl dark:hover:shadow-2xl-dark',
    'focus-within:ring-2 focus-within:ring-blue-500',
    'cursor-pointer select-none',
    className
  );

  // Content wrapper classes for consistent spacing
  const contentClasses = clsx(
    'p-6 flex flex-col items-center',
    'space-y-4'
  );

  // Headline text classes with responsive typography
  const headlineClasses = clsx(
    'mt-4 text-lg font-semibold text-center',
    'text-gray-900 dark:text-white',
    'line-clamp-2 break-words'
  );

  return (
    <CardAnimation
      scale={1.05}
      rotate={5}
      className={containerClasses}
      touchEnabled
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyPress={(e) => e.key === 'Enter' && handleCardClick(e as unknown as React.MouseEvent)}
        className={contentClasses}
        aria-label={`View ${profile.headline}'s profile`}
      >
        {/* Profile Avatar with loading states */}
        <Avatar
          src={profile.avatarUrl}
          alt={profile.headline || 'Profile avatar'}
          size="lg"
          className="ring-4 ring-white dark:ring-gray-800"
        />

        {/* Profile Headline with fallback */}
        <h3 className={headlineClasses}>
          {profile.headline || 'Professional Profile'}
        </h3>

        {/* Social Links Indicators */}
        {profile.socialLinks && (
          <div 
            className="flex gap-2 mt-2"
            aria-label="Social media links"
          >
            {profile.socialLinks.linkedin && (
              <div className="w-2 h-2 rounded-full bg-blue-500" 
                   aria-label="Has LinkedIn profile" 
              />
            )}
            {profile.socialLinks.github && (
              <div className="w-2 h-2 rounded-full bg-gray-700 dark:bg-gray-300" 
                   aria-label="Has GitHub profile" 
              />
            )}
            {profile.socialLinks.website && (
              <div className="w-2 h-2 rounded-full bg-green-500" 
                   aria-label="Has personal website" 
              />
            )}
          </div>
        )}
      </div>
    </CardAnimation>
  );
};

export default ProfileCard;