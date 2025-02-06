import { z } from 'zod'; // zod@3.21.0
import type { Profile, SocialLinks } from '../types/profile.types';
import type { Experience } from '../types/experience.types';
import { handleError } from './error';

/**
 * Cache for validation results to optimize repeated validations
 */
const validationCache = new Map<string, z.SafeParseReturnType<any, any>>();

/**
 * Constants for validation rules
 */
const VALIDATION_RULES = {
  HEADLINE: {
    MIN: 5,
    MAX: 100,
  },
  BIO: {
    MAX: 500,
  },
  EXPERIENCE: {
    TITLE: {
      MIN: 3,
      MAX: 100,
    },
    COMPANY: {
      MIN: 2,
      MAX: 100,
    },
    DESCRIPTION: {
      MAX: 1000,
    },
  },
  URL: {
    MAX: 2048,
  },
} as const;

/**
 * Social links schema with URL validation and platform-specific checks
 */
const socialLinksSchema = z.object({
  linkedin: z.string().url()
    .regex(/^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/, 'Invalid LinkedIn profile URL')
    .nullable(),
  github: z.string().url()
    .regex(/^https:\/\/(www\.)?github\.com\/[\w-]+\/?$/, 'Invalid GitHub profile URL')
    .nullable(),
  website: z.string().url()
    .max(VALIDATION_RULES.URL.MAX, 'URL is too long')
    .regex(/^https:\/\//, 'Website must use HTTPS')
    .nullable(),
});

/**
 * Profile form validation schema with comprehensive validation rules
 */
const profileSchema = z.object({
  headline: z.string()
    .min(VALIDATION_RULES.HEADLINE.MIN, `Headline must be at least ${VALIDATION_RULES.HEADLINE.MIN} characters`)
    .max(VALIDATION_RULES.HEADLINE.MAX, `Headline must be at most ${VALIDATION_RULES.HEADLINE.MAX} characters`)
    .regex(/^[a-zA-Z0-9\s\-,.()]+$/, 'Headline contains invalid characters'),
  bio: z.string()
    .max(VALIDATION_RULES.BIO.MAX, `Bio must be at most ${VALIDATION_RULES.BIO.MAX} characters`)
    .regex(/^[\w\s\-,.()'"]+$/, 'Bio contains invalid characters')
    .nullable(),
  socialLinks: socialLinksSchema.partial(),
});

/**
 * Experience form validation schema with date validation
 */
const experienceSchema = z.object({
  title: z.string()
    .min(VALIDATION_RULES.EXPERIENCE.TITLE.MIN, `Title must be at least ${VALIDATION_RULES.EXPERIENCE.TITLE.MIN} characters`)
    .max(VALIDATION_RULES.EXPERIENCE.TITLE.MAX, `Title must be at most ${VALIDATION_RULES.EXPERIENCE.TITLE.MAX} characters`)
    .regex(/^[\w\s\-,.()]+$/, 'Title contains invalid characters'),
  company: z.string()
    .min(VALIDATION_RULES.EXPERIENCE.COMPANY.MIN, `Company must be at least ${VALIDATION_RULES.EXPERIENCE.COMPANY.MIN} characters`)
    .max(VALIDATION_RULES.EXPERIENCE.COMPANY.MAX, `Company must be at most ${VALIDATION_RULES.EXPERIENCE.COMPANY.MAX} characters`)
    .regex(/^[\w\s\-,.()&]+$/, 'Company contains invalid characters'),
  startDate: z.date()
    .refine((date) => date <= new Date(), 'Start date cannot be in the future'),
  endDate: z.date()
    .nullable()
    .refine((date) => !date || date > new Date(0), 'Invalid end date')
    .refine(
      (date, ctx) => !date || date >= ctx.parent.startDate,
      'End date must be after start date'
    ),
  description: z.string()
    .max(VALIDATION_RULES.EXPERIENCE.DESCRIPTION.MAX, `Description must be at most ${VALIDATION_RULES.EXPERIENCE.DESCRIPTION.MAX} characters`)
    .regex(/^[\w\s\-,.()'"•\n]+$/, 'Description contains invalid characters')
    .nullable(),
});

/**
 * Validates profile form data with caching support
 */
export const validateProfileForm = (
  formData: Partial<Profile>,
  isPartialValidation: boolean = false
): z.SafeParseReturnType<any, any> => {
  try {
    const cacheKey = `profile:${JSON.stringify(formData)}`;
    const cachedResult = validationCache.get(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const schema = isPartialValidation ? profileSchema.partial() : profileSchema;
    const result = schema.safeParse(formData);

    // Cache validation result for 5 seconds
    validationCache.set(cacheKey, result);
    setTimeout(() => validationCache.delete(cacheKey), 5000);

    return result;
  } catch (error) {
    handleError(error);
    return {
      success: false,
      error: new z.ZodError([{
        code: 'custom',
        path: ['validation'],
        message: 'Validation failed due to an unexpected error',
      }]),
    };
  }
};

/**
 * Validates experience form data with comprehensive checks
 */
export const validateExperienceForm = (
  formData: Partial<Experience>
): z.SafeParseReturnType<any, any> => {
  try {
    return experienceSchema.safeParse(formData);
  } catch (error) {
    handleError(error);
    return {
      success: false,
      error: new z.ZodError([{
        code: 'custom',
        path: ['validation'],
        message: 'Experience validation failed due to an unexpected error',
      }]),
    };
  }
};

/**
 * Validates social media links with accessibility checks
 */
export const validateSocialLinks = async (
  links: Partial<SocialLinks>
): Promise<z.SafeParseReturnType<any, any>> => {
  try {
    const result = socialLinksSchema.partial().safeParse(links);

    if (!result.success) {
      return result;
    }

    // Validate URL accessibility for provided links
    const validUrls = await Promise.all(
      Object.entries(links)
        .filter(([_, url]) => url)
        .map(async ([platform, url]) => {
          try {
            const response = await fetch(url as string, { method: 'HEAD' });
            return response.ok;
          } catch {
            return false;
          }
        })
    );

    if (validUrls.some((valid) => !valid)) {
      return {
        success: false,
        error: new z.ZodError([{
          code: 'custom',
          path: ['socialLinks'],
          message: 'One or more social media links are not accessible',
        }]),
      };
    }

    return result;
  } catch (error) {
    handleError(error);
    return {
      success: false,
      error: new z.ZodError([{
        code: 'custom',
        path: ['validation'],
        message: 'Social links validation failed due to an unexpected error',
      }]),
    };
  }
};

/**
 * Formats validation errors with accessibility support
 */
export const getValidationErrors = (
  error: z.ZodError,
  locale: string = 'en'
): Record<string, string> => {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const field = err.path.join('.');
    const message = err.message;

    errors[field] = message;
  });

  return errors;
};