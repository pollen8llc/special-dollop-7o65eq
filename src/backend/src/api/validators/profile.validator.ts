/**
 * @fileoverview Profile validation schemas and functions using Zod for the LinkedIn Profiles Gallery
 * @version 1.0.0
 * @package zod@^3.21.0
 */

import { z } from 'zod';
import { CreateProfileDto, UpdateProfileDto } from '../../types/profile.types';
import { validateSchema } from '../../utils/validation';

// URL validation regex for social links and avatar URLs
const URL_REGEX = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

/**
 * Schema for validating social media profile links
 */
const socialLinksSchema = z.object({
  linkedin: z.string().nullable()
    .refine(val => val === null || URL_REGEX.test(val), {
      message: 'Invalid LinkedIn URL format'
    }),
  github: z.string().nullable()
    .refine(val => val === null || URL_REGEX.test(val), {
      message: 'Invalid GitHub URL format'
    }),
  website: z.string().nullable()
    .refine(val => val === null || URL_REGEX.test(val), {
      message: 'Invalid website URL format'
    })
}).partial();

/**
 * Schema for validating profile creation requests
 * Enforces required fields and data constraints
 */
export const createProfileSchema = z.object({
  headline: z.string()
    .min(3, 'Headline must be at least 3 characters long')
    .max(100, 'Headline cannot exceed 100 characters')
    .trim(),
  
  bio: z.string()
    .max(2000, 'Bio cannot exceed 2000 characters')
    .nullable()
    .transform(val => val === '' ? null : val?.trim()),
  
  avatarUrl: z.string()
    .refine(val => val === null || URL_REGEX.test(val), {
      message: 'Invalid avatar URL format'
    })
    .nullable()
    .transform(val => val === '' ? null : val?.trim()),
  
  socialLinks: socialLinksSchema.default({})
}).strict();

/**
 * Schema for validating profile update requests
 * All fields are optional to support partial updates
 */
export const updateProfileSchema = z.object({
  headline: z.string()
    .min(3, 'Headline must be at least 3 characters long')
    .max(100, 'Headline cannot exceed 100 characters')
    .trim()
    .optional(),
  
  bio: z.string()
    .max(2000, 'Bio cannot exceed 2000 characters')
    .nullable()
    .transform(val => val === '' ? null : val?.trim())
    .optional(),
  
  avatarUrl: z.string()
    .refine(val => val === null || URL_REGEX.test(val), {
      message: 'Invalid avatar URL format'
    })
    .nullable()
    .transform(val => val === '' ? null : val?.trim())
    .optional(),
  
  socialLinks: socialLinksSchema.optional()
}).strict();

/**
 * Validates profile creation request data
 * @param data - Request data to validate
 * @returns Validated and sanitized profile creation data
 * @throws ApiError with validation details if validation fails
 */
export async function validateCreateProfile(data: unknown): Promise<CreateProfileDto> {
  return validateSchema(createProfileSchema, data);
}

/**
 * Validates profile update request data
 * @param data - Request data to validate
 * @returns Validated and sanitized profile update data
 * @throws ApiError with validation details if validation fails
 */
export async function validateUpdateProfile(data: unknown): Promise<UpdateProfileDto> {
  return validateSchema(updateProfileSchema, data);
}