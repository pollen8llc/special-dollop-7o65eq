import React, { useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form'; // v7.45.0
import { motion } from 'framer-motion'; // v10.12.0
import { ProfileFormData } from '../../types/profile.types';
import { Button } from '../common/Button';
import { validateProfileForm } from '../../utils/validation';
import { FadeInAnimation } from '../animations/FadeInAnimation';
import { useToast } from '../../hooks/useToast';
import { COLORS } from '../../constants/theme';

interface ProfileFormProps {
  /** Initial profile data for editing, null for new profile */
  initialData: ProfileFormData | null;
  /** Loading state for form submission */
  isLoading: boolean;
  /** Form submission handler */
  onSubmit: (data: ProfileFormData) => Promise<void>;
  /** Enable autosave functionality */
  enableAutosave?: boolean;
  /** Cancel form handler */
  onCancel: () => void;
}

/**
 * A comprehensive form component for creating and editing professional profiles
 * with real-time validation, accessibility features, and smooth animations.
 */
export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  isLoading,
  onSubmit,
  enableAutosave = false,
  onCancel,
}) => {
  const { showToast } = useToast();
  
  // Initialize form with react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<ProfileFormData>({
    defaultValues: {
      headline: initialData?.headline || '',
      bio: initialData?.bio || null,
      avatarUrl: initialData?.avatarUrl || null,
      socialLinks: initialData?.socialLinks || {},
    },
    mode: 'onChange',
  });

  // Autosave functionality
  const formData = watch();
  const handleAutosave = useCallback(
    async (data: ProfileFormData) => {
      try {
        await onSubmit(data);
        showToast('SUCCESS', 'Profile saved automatically');
      } catch (error) {
        showToast('ERROR', 'Failed to autosave profile');
      }
    },
    [onSubmit, showToast]
  );

  useEffect(() => {
    if (enableAutosave && isDirty) {
      const timer = setTimeout(() => {
        handleAutosave(formData);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [enableAutosave, formData, handleAutosave, isDirty]);

  // Form submission handler
  const handleFormSubmit = async (data: ProfileFormData) => {
    try {
      const validationResult = validateProfileForm(data);
      if (!validationResult.success) {
        const errors = validationResult.error.errors;
        errors.forEach(error => {
          showToast('ERROR', error.message);
        });
        return;
      }

      await onSubmit(data);
      showToast('SUCCESS', 'Profile saved successfully');
      reset(data);
    } catch (error) {
      showToast('ERROR', 'Failed to save profile');
    }
  };

  return (
    <FadeInAnimation duration={0.3}>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
        noValidate
      >
        {/* Headline Field */}
        <div className="space-y-2">
          <label
            htmlFor="headline"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Professional Headline
          </label>
          <Controller
            name="headline"
            control={control}
            rules={{
              required: 'Headline is required',
              minLength: {
                value: 5,
                message: 'Headline must be at least 5 characters',
              },
            }}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                id="headline"
                className={`form-input ${
                  errors.headline ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-invalid={errors.headline ? 'true' : 'false'}
                aria-describedby={errors.headline ? 'headline-error' : undefined}
                disabled={isLoading}
              />
            )}
          />
          {errors.headline && (
            <p id="headline-error" className="text-sm text-red-500">
              {errors.headline.message}
            </p>
          )}
        </div>

        {/* Bio Field */}
        <div className="space-y-2">
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Professional Bio
          </label>
          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                id="bio"
                rows={4}
                className="form-input"
                aria-invalid={errors.bio ? 'true' : 'false'}
                aria-describedby={errors.bio ? 'bio-error' : undefined}
                disabled={isLoading}
              />
            )}
          />
          {errors.bio && (
            <p id="bio-error" className="text-sm text-red-500">
              {errors.bio.message}
            </p>
          )}
        </div>

        {/* Social Links Section */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Social Links
          </legend>

          {/* LinkedIn */}
          <Controller
            name="socialLinks.linkedin"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <input
                  {...field}
                  type="url"
                  placeholder="LinkedIn Profile URL"
                  className="form-input flex-1"
                  aria-label="LinkedIn Profile URL"
                  disabled={isLoading}
                />
              </div>
            )}
          />

          {/* GitHub */}
          <Controller
            name="socialLinks.github"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <input
                  {...field}
                  type="url"
                  placeholder="GitHub Profile URL"
                  className="form-input flex-1"
                  aria-label="GitHub Profile URL"
                  disabled={isLoading}
                />
              </div>
            )}
          />

          {/* Website */}
          <Controller
            name="socialLinks.website"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <input
                  {...field}
                  type="url"
                  placeholder="Personal Website URL"
                  className="form-input flex-1"
                  aria-label="Personal Website URL"
                  disabled={isLoading}
                />
              </div>
            )}
          />
        </fieldset>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Cancel profile changes"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!isDirty || isLoading}
            aria-label="Save profile changes"
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </FadeInAnimation>
  );
};

export type { ProfileFormProps };