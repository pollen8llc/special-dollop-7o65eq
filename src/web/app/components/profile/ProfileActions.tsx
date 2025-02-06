import React from 'react';
import { useNavigate } from '@remix-run/react';
import { Button } from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import type { Profile } from '../../types/profile.types';

interface ProfileActionsProps {
  /** Profile data for action context */
  profile: Profile;
  /** Indicates if the profile is favorited by current user */
  isFavorited: boolean;
  /** Callback function when favorite action is triggered */
  onFavorite: (profileId: string) => Promise<void>;
  /** Callback function when connect action is triggered */
  onConnect: (profileId: string) => Promise<void>;
  /** Global loading state */
  isLoading?: boolean;
  /** Individual action loading states */
  actionLoadingStates?: Record<string, boolean>;
  /** Error messages for individual actions */
  actionErrors?: Record<string, string>;
}

/**
 * A component that renders action buttons for profile interactions
 * with comprehensive authentication checks and loading states.
 */
const ProfileActions: React.FC<ProfileActionsProps> = React.memo(({
  profile,
  isFavorited,
  onFavorite,
  onConnect,
  isLoading = false,
  actionLoadingStates = {},
  actionErrors = {}
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, checkPermission } = useAuth();

  // Check if current user owns the profile
  const isOwnProfile = user?.id === profile.userId;

  // Handle edit profile navigation with error boundary
  const handleEditClick = React.useCallback(async () => {
    try {
      if (!isOwnProfile) {
        throw new Error('Unauthorized to edit this profile');
      }
      navigate(`/profiles/${profile.id}/edit`);
    } catch (error) {
      console.error('Edit navigation error:', error);
      // Error handling could be enhanced with a toast notification system
    }
  }, [isOwnProfile, navigate, profile.id]);

  // Handle favorite action with loading state
  const handleFavoriteClick = React.useCallback(async () => {
    try {
      await onFavorite(profile.id);
    } catch (error) {
      console.error('Favorite action error:', error);
    }
  }, [onFavorite, profile.id]);

  // Handle connect action with loading state
  const handleConnectClick = React.useCallback(async () => {
    try {
      await onConnect(profile.id);
    } catch (error) {
      console.error('Connect action error:', error);
    }
  }, [onConnect, profile.id]);

  // Early return if global loading state is true
  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          isLoading
          disabled
          aria-label="Loading actions"
        >
          Loading...
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2" role="group" aria-label="Profile actions">
      {/* Edit button - only shown for own profile */}
      {isOwnProfile && (
        <Button
          variant="primary"
          size="sm"
          onClick={handleEditClick}
          isLoading={actionLoadingStates['edit']}
          disabled={actionLoadingStates['edit']}
          aria-label="Edit profile"
        >
          Edit Profile
        </Button>
      )}

      {/* Connect button - shown for authenticated users except own profile */}
      {isAuthenticated && !isOwnProfile && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleConnectClick}
          isLoading={actionLoadingStates['connect']}
          disabled={actionLoadingStates['connect']}
          aria-label="Connect with user"
        >
          {actionLoadingStates['connect'] ? 'Connecting...' : 'Connect'}
        </Button>
      )}

      {/* Favorite button - shown for authenticated users */}
      {isAuthenticated && (
        <Button
          variant={isFavorited ? 'secondary' : 'ghost'}
          size="sm"
          onClick={handleFavoriteClick}
          isLoading={actionLoadingStates['favorite']}
          disabled={actionLoadingStates['favorite']}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorited ? 'Favorited' : 'Favorite'}
        </Button>
      )}

      {/* Error messages display */}
      {Object.entries(actionErrors).map(([action, error]) => (
        <span
          key={action}
          className="text-sm text-error-500 dark:text-error-400"
          role="alert"
        >
          {error}
        </span>
      ))}
    </div>
  );
});

// Display name for debugging
ProfileActions.displayName = 'ProfileActions';

export default ProfileActions;