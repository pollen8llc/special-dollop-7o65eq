/**
 * TypeScript type definitions and interfaces for professional experiences in the LinkedIn Profiles Gallery.
 * Provides comprehensive type safety for experience data structures, form handling, and API responses.
 * @version 1.0.0
 */

import { ApiResponse, PaginatedResponse } from '../types/common.types';

/**
 * Core experience entity interface representing a professional experience entry
 * Maps directly to the database schema structure
 */
export interface Experience {
  id: string;
  profileId: string;
  title: string;
  company: string;
  startDate: Date;
  endDate: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for experience form data with additional form-specific fields
 * Used for creating and updating experiences through forms
 */
export interface ExperienceFormData {
  title: string;
  company: string;
  startDate: Date;
  endDate: Date | null;
  description: string | null;
  current: boolean; // Indicates if this is the current position
}

/**
 * Type alias for experience ID to ensure consistent ID typing across the application
 */
export type ExperienceId = string;

/**
 * API response interface for single experience operations
 * Extends the base ApiResponse type with Experience data
 */
export interface ExperienceResponse extends ApiResponse<Experience> {
  data: Experience;
}

/**
 * API response interface for experience list operations
 * Extends the base PaginatedResponse type with Experience array data
 */
export interface ExperienceListResponse extends PaginatedResponse<Experience> {
  data: Experience[];
}