import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // framer-motion@10.0.0
import { useParams, useNavigate } from '@remix-run/react';
import type { Profile } from '../../types/profile.types';
import ProfileHeader from './ProfileHeader';
import ExperienceList from './ExperienceList';
import { useAuth } from '../../hooks/useAuth';
import { useProfiles } from '../../hooks/useProfiles';
import { useTheme } from '../../hooks/useTheme';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useToast } from '../../hooks/useToast';

interface ProfileDetailProps {
  profile: Profile;
  className?: string;
  theme?: 'light' | 'dark';
  'aria-label'?: string;
}

const ProfileDetail: React.FC<ProfileDetailProps> = ({
  profile: initialProfile,
  className,
  'aria-label': ariaLabel,
}) => {
  // State and hooks
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const { refreshProfiles, updateProfile } = useProfiles({
    initialProfiles: [initialProfile],
    pageSize: 1,
  });

  // Check if current user can edit the profile
  const isEditable = isAuthenticated && user?.id === profile.userId;

  // Animation variants with GPU acceleration
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  // Handle profile updates with optimistic UI
  const handleProfileUpdate = useCallback(async (updatedProfile: Profile) => {
    try {
      setProfile(updatedProfile);
      await updateProfile(updatedProfile);
      showToast('SUCCESS', 'Profile updated successfully');
      refreshProfiles();
    } catch (error) {
      showToast('ERROR', 'Failed to update profile');
      setProfile(profile); // Revert on error
    }
  }, [profile, updateProfile, refreshProfiles, showToast]);

  // Handle favorite toggle with optimistic update
  const handleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      showToast('ERROR', 'Please sign in to favorite profiles');
      return;
    }

    try {
      setIsFavorited(prev => !prev);
      await fetch(`/api/profiles/${profile.id}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      setIsFavorited(prev => !prev); // Revert on error
      showToast('ERROR', 'Failed to update favorite status');
    }
  }, [profile.id, isAuthenticated, showToast]);

  // Handle connect action
  const handleConnect = useCallback(async () => {
    if (!isAuthenticated) {
      showToast('ERROR', 'Please sign in to connect');
      return;
    }

    try {
      await fetch(`/api/profiles/${profile.id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      showToast('SUCCESS', 'Connection request sent');
    } catch (error) {
      showToast('ERROR', 'Failed to send connection request');
    }
  }, [profile.id, isAuthenticated, showToast]);

  // Fetch profile data if needed
  useEffect(() => {
    if (id && id !== profile.id) {
      refreshProfiles();
    }
  }, [id, profile.id, refreshProfiles]);

  return (
    <ErrorBoundary>
      <motion.div
        className={`profile-detail ${className || ''}`}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        layout
        role="article"
        aria-label={ariaLabel || `Profile details for ${profile.headline}`}
      >
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          {/* Profile Header */}
          <ProfileHeader
            profile={profile}
            isEditable={isEditable}
            isFavorited={isFavorited}
            onFavorite={handleFavorite}
            onConnect={handleConnect}
            onImageChange={async (url) => {
              handleProfileUpdate({ ...profile, avatarUrl: url });
            }}
            className="mb-8"
          />

          {/* Experience Section */}
          <section
            className="space-y-4"
            aria-label="Professional experience"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Experience
            </h2>
            <ExperienceList
              experiences={profile.experiences}
              isEditable={isEditable}
              onAdd={async (data) => {
                const updatedProfile = {
                  ...profile,
                  experiences: [...profile.experiences, data],
                };
                await handleProfileUpdate(updatedProfile);
              }}
              onUpdate={async (id, data) => {
                const updatedProfile = {
                  ...profile,
                  experiences: profile.experiences.map(exp =>
                    exp.id === id ? { ...exp, ...data } : exp
                  ),
                };
                await handleProfileUpdate(updatedProfile);
              }}
              onDelete={async (id) => {
                const updatedProfile = {
                  ...profile,
                  experiences: profile.experiences.filter(exp => exp.id !== id),
                };
                await handleProfileUpdate(updatedProfile);
              }}
              prefersReducedMotion={false}
            />
          </section>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
};

export default React.memo(ProfileDetail);