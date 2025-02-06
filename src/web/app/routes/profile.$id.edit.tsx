import React, { useCallback, useEffect, useState } from 'react';
import { useLoaderData, useNavigate, redirect, Form } from '@remix-run/react';
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { ProfileForm } from '../../components/forms/ProfileForm';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { FadeInAnimation } from '../../components/animations/FadeInAnimation';
import { handleApiError, validateProfileData } from '../../utils/error';
import type { Profile, ProfileFormData } from '../../types/profile.types';
import type { ErrorResponse } from '../../types/common.types';

/**
 * Server-side loader function to fetch and validate profile data
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
  try {
    const { isAuthenticated, user, validateCurrentSession } = useAuth();

    // Verify authentication
    if (!isAuthenticated || !user) {
      return redirect('/login?redirect=/profile/' + params.id + '/edit');
    }

    // Validate active session
    const isValidSession = await validateCurrentSession();
    if (!isValidSession) {
      throw new Error('Invalid session');
    }

    // Fetch profile data
    const response = await fetch(`/api/profiles/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${request.headers.get('Authorization')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const profile: Profile = await response.json();

    // Verify ownership
    if (profile.userId !== user.id) {
      throw new Error('Unauthorized access to profile');
    }

    return json({ profile });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return json({ error: errorResponse }, { status: errorResponse.status });
  }
}

/**
 * Server-side action function to handle profile updates
 */
export async function action({ params, request }: ActionFunctionArgs) {
  try {
    const { isAuthenticated, user, validateCurrentSession } = useAuth();

    // Verify authentication and session
    if (!isAuthenticated || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isValidSession = await validateCurrentSession();
    if (!isValidSession) {
      return json({ error: 'Invalid session' }, { status: 401 });
    }

    // Parse and validate form data
    const formData = await request.formData();
    const profileData = Object.fromEntries(formData) as unknown as ProfileFormData;
    
    const validationResult = validateProfileData(profileData);
    if (!validationResult.success) {
      return json({ error: validationResult.error }, { status: 400 });
    }

    // Update profile
    const response = await fetch(`/api/profiles/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.headers.get('Authorization')}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return json({ success: true });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return json({ error: errorResponse }, { status: errorResponse.status });
  }
}

/**
 * Profile edit route component with real-time validation and autosave
 */
export default function ProfileEditRoute() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { profile, error } = useLoaderData<{ profile?: Profile; error?: ErrorResponse }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Handle form submission with validation
  const handleSubmit = useCallback(async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/profiles/${profile?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      showToast('SUCCESS', 'Profile updated successfully');
      setHasUnsavedChanges(false);
      navigate(`/profile/${profile?.id}`);
    } catch (error) {
      showToast('ERROR', 'Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [profile?.id, navigate, showToast]);

  // Handle autosave functionality
  const handleAutosave = useCallback(async (data: ProfileFormData) => {
    try {
      const response = await fetch(`/api/profiles/${profile?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to autosave');
      }

      setHasUnsavedChanges(false);
      showToast('SUCCESS', 'Changes saved automatically');
    } catch (error) {
      showToast('ERROR', 'Failed to save changes');
      console.error('Autosave error:', error);
    }
  }, [profile?.id, showToast]);

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Display error state if profile load failed
  if (error) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold text-red-500">Error Loading Profile</h1>
        <p className="mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <FadeInAnimation duration={0.3}>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        <ProfileForm
          initialData={profile}
          isLoading={isSubmitting}
          onSubmit={handleSubmit}
          onAutosave={handleAutosave}
          onCancel={() => navigate(`/profile/${profile?.id}`)}
          onChange={() => setHasUnsavedChanges(true)}
        />
      </div>
    </FadeInAnimation>
  );
}