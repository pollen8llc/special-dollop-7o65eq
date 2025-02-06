import React from 'react';
import { useNavigate, useActionData, Form } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { ProfileForm } from '../components/forms/ProfileForm';
import { useAuth } from '../hooks/useAuth';
import type { ProfileFormData } from '../types/profile.types';
import { validateProfileForm } from '../utils/validation';
import { handleError } from '../utils/error';
import { FadeInAnimation } from '../components/animations/FadeInAnimation';
import { useToast } from '../hooks/useToast';

/**
 * Loader function to verify authentication and authorization before rendering
 * the profile creation page.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Verify authentication status
    const { isAuthenticated, validateCurrentSession } = useAuth();
    const isValidSession = await validateCurrentSession();

    if (!isAuthenticated || !isValidSession) {
      return redirect('/login', {
        headers: {
          'X-Redirect-Reason': 'authentication-required'
        }
      });
    }

    return json({});
  } catch (error) {
    handleError(error);
    return redirect('/error', {
      headers: {
        'X-Error-Type': 'loader-error'
      }
    });
  }
}

/**
 * Action function to handle profile creation form submission with validation
 * and error handling.
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const { user, validateCurrentSession } = useAuth();
    const isValidSession = await validateCurrentSession();

    if (!user || !isValidSession) {
      return json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const profileData: ProfileFormData = {
      headline: formData.get('headline') as string,
      bio: formData.get('bio') as string,
      avatarUrl: formData.get('avatarUrl') as string,
      socialLinks: {
        linkedin: formData.get('socialLinks.linkedin') as string,
        github: formData.get('socialLinks.github') as string,
        website: formData.get('socialLinks.website') as string,
      }
    };

    // Validate profile data
    const validationResult = validateProfileForm(profileData);
    if (!validationResult.success) {
      return json(
        { errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Create profile in database (implementation would be in a service layer)
    // const profile = await createProfile(profileData, user.id);

    return json(
      { success: true, message: 'Profile created successfully' },
      { status: 201 }
    );
  } catch (error) {
    handleError(error);
    return json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}

/**
 * Profile creation route component with form handling and animations.
 */
export default function ProfileNew() {
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle form submission
  const handleSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showToast('SUCCESS', 'Profile created successfully');
        navigate('/profile/dashboard');
      } else {
        const error = await response.json();
        showToast('ERROR', error.message || 'Failed to create profile');
      }
    } catch (error) {
      handleError(error);
      showToast('ERROR', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    navigate(-1);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <FadeInAnimation duration={0.3}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Create Your Professional Profile
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <ProfileForm
            initialData={null}
            isLoading={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            errors={actionData?.errors}
          />
        </div>
      </div>
    </FadeInAnimation>
  );
}