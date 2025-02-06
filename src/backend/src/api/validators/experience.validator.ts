/**
 * @fileoverview Experience validation schemas and functions using Zod
 * @version 1.0.0
 * @package zod@^3.21.0
 */

import { z } from 'zod';
import { validateSchema } from '../../utils/validation';
import { CreateExperienceDto, UpdateExperienceDto } from '../../types/experience.types';

// Global constants for validation rules
const MAX_TITLE_LENGTH = 100;
const MAX_COMPANY_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;

/**
 * Base schema for common experience fields with strict validation rules
 */
const experienceBaseSchema = {
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(MAX_TITLE_LENGTH, `Title must not exceed ${MAX_TITLE_LENGTH} characters`)
    .regex(/^[\w\s\-\.,()&]+$/, 'Title contains invalid characters'),

  company: z.string()
    .trim()
    .min(1, 'Company is required')
    .max(MAX_COMPANY_LENGTH, `Company must not exceed ${MAX_COMPANY_LENGTH} characters`)
    .regex(/^[\w\s\-\.,()&]+$/, 'Company contains invalid characters'),

  startDate: z.date()
    .refine(date => date <= new Date(), 'Start date cannot be in the future')
    .refine(date => date.getFullYear() >= 1900, 'Start date must be after 1900'),

  endDate: z.date()
    .nullable()
    .refine(
      date => !date || date <= new Date(),
      'End date cannot be in the future'
    ),

  description: z.string()
    .trim()
    .max(MAX_DESCRIPTION_LENGTH, `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`)
    .nullable()
};

/**
 * Schema for validating experience creation requests
 * Enforces strict validation rules for all required fields
 */
export const createExperienceSchema = z.object({
  ...experienceBaseSchema
}).refine(
  data => !data.endDate || data.startDate <= data.endDate,
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
);

/**
 * Schema for validating experience update requests
 * All fields are optional but must meet validation rules if provided
 */
export const updateExperienceSchema = z.object({
  title: experienceBaseSchema.title.optional(),
  company: experienceBaseSchema.company.optional(),
  startDate: experienceBaseSchema.startDate.optional(),
  endDate: experienceBaseSchema.endDate.optional(),
  description: experienceBaseSchema.description.optional()
}).refine(
  data => {
    if (data.startDate && data.endDate) {
      return data.endDate === null || data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
);

/**
 * Validates data for creating a new experience entry
 * Ensures all required fields are present and valid
 * 
 * @param data - Raw input data to validate
 * @returns Validated and sanitized experience creation data
 * @throws ValidationError if validation fails
 */
export async function validateCreateExperience(
  data: unknown
): Promise<CreateExperienceDto> {
  return validateSchema(createExperienceSchema, data);
}

/**
 * Validates data for updating an existing experience entry
 * Allows partial updates while ensuring provided fields are valid
 * 
 * @param data - Raw input data to validate
 * @returns Validated and sanitized experience update data
 * @throws ValidationError if validation fails
 */
export async function validateUpdateExperience(
  data: unknown
): Promise<UpdateExperienceDto> {
  return validateSchema(updateExperienceSchema, data);
}