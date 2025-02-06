import React, { useState, useEffect } from 'react'; // react@18.x
import { Form, useActionData } from '@remix-run/react'; // @remix-run/react@1.19.x
import type { Experience, ExperienceFormData } from '../../types/experience.types';
import { validateExperienceForm } from '../../utils/validation';
import { Button } from '../common/Button';

interface ExperienceFormProps {
  initialData: Experience | null;
  isSubmitting: boolean;
  onSubmit: (data: ExperienceFormData) => void;
}

export const ExperienceForm: React.FC<ExperienceFormProps> = ({
  initialData,
  isSubmitting,
  onSubmit,
}) => {
  // Form state management
  const [formData, setFormData] = useState<ExperienceFormData>({
    title: initialData?.title || '',
    company: initialData?.company || '',
    startDate: initialData?.startDate || new Date(),
    endDate: initialData?.endDate || null,
    description: initialData?.description || null,
    current: !initialData?.endDate,
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const actionData = useActionData();

  // Update form data when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        company: initialData.company,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        description: initialData.description,
        current: !initialData.endDate,
      });
    }
  }, [initialData]);

  // Handle real-time validation
  const validateField = (name: string, value: any) => {
    const validationResult = validateExperienceForm({ 
      ...formData, 
      [name]: value 
    });

    if (!validationResult.success) {
      const fieldError = validationResult.error.errors.find(
        err => err.path[0] === name
      );
      if (fieldError) {
        setErrors(prev => ({ ...prev, [name]: fieldError.message }));
      }
    } else {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    // Handle date conversions
    if (name === 'startDate' || name === 'endDate') {
      newValue = new Date(value);
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (touched[name]) {
      validateField(name, newValue);
    }
  };

  // Handle checkbox changes
  const handleCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormData(prev => ({
      ...prev,
      current: checked,
      endDate: checked ? null : new Date(),
    }));
  };

  // Handle field blur for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof ExperienceFormData]);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationResult = validateExperienceForm(formData);
    
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.errors.forEach(err => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <Form
      onSubmit={handleSubmit}
      className="space-y-6"
      aria-label="Experience form"
      noValidate
    >
      {/* Title field */}
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          onBlur={handleBlur}
          className="form-input"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          required
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-error-500" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      {/* Company field */}
      <div className="space-y-2">
        <label
          htmlFor="company"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Company *
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          onBlur={handleBlur}
          className="form-input"
          aria-invalid={!!errors.company}
          aria-describedby={errors.company ? 'company-error' : undefined}
          required
        />
        {errors.company && (
          <p id="company-error" className="text-sm text-error-500" role="alert">
            {errors.company}
          </p>
        )}
      </div>

      {/* Start date field */}
      <div className="space-y-2">
        <label
          htmlFor="startDate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Start Date *
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={formData.startDate.toISOString().split('T')[0]}
          onChange={handleChange}
          onBlur={handleBlur}
          className="form-input"
          aria-invalid={!!errors.startDate}
          aria-describedby={errors.startDate ? 'startDate-error' : undefined}
          required
        />
        {errors.startDate && (
          <p id="startDate-error" className="text-sm text-error-500" role="alert">
            {errors.startDate}
          </p>
        )}
      </div>

      {/* Current position checkbox */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="current"
          name="current"
          checked={formData.current}
          onChange={handleCurrentChange}
          className="form-checkbox"
        />
        <label
          htmlFor="current"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          I currently work here
        </label>
      </div>

      {/* End date field */}
      {!formData.current && (
        <div className="space-y-2">
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate?.toISOString().split('T')[0] || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className="form-input"
            aria-invalid={!!errors.endDate}
            aria-describedby={errors.endDate ? 'endDate-error' : undefined}
          />
          {errors.endDate && (
            <p id="endDate-error" className="text-sm text-error-500" role="alert">
              {errors.endDate}
            </p>
          )}
        </div>
      )}

      {/* Description field */}
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className="form-input min-h-[100px]"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-error-500" role="alert">
            {errors.description}
          </p>
        )}
      </div>

      {/* Form actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={Object.keys(errors).length > 0 || isSubmitting}
          aria-label={initialData ? 'Update experience' : 'Add experience'}
        >
          {initialData ? 'Update Experience' : 'Add Experience'}
        </Button>
      </div>
    </Form>
  );
};