/**
 * @fileoverview Type definitions for professional experiences in the LinkedIn Profiles Gallery
 * @version 1.0.0
 */

import { ApiResponse } from './api.types';

/**
 * Core interface representing a professional experience entry
 */
export interface Experience {
  /** Unique identifier for the experience */
  id: string;

  /** Reference to the profile this experience belongs to */
  profileId: string;

  /** Job title or position held */
  title: string;

  /** Company or organization name */
  company: string;

  /** Start date of the experience */
  startDate: Date;

  /** End date of the experience (null if current position) */
  endDate: Date | null;

  /** Detailed description of responsibilities and achievements */
  description: string | null;

  /** Timestamp when the experience was created */
  createdAt: Date;

  /** Timestamp when the experience was last updated */
  updatedAt: Date;
}

/**
 * Data transfer object for creating new experience entries
 */
export interface CreateExperienceDto {
  /** Job title or position */
  title: string;

  /** Company or organization name */
  company: string;

  /** Start date of the experience */
  startDate: Date;

  /** End date (null if current position) */
  endDate: Date | null;

  /** Optional detailed description */
  description: string | null;
}

/**
 * Data transfer object for updating existing experience entries
 * All fields are optional to support partial updates
 */
export interface UpdateExperienceDto {
  /** Updated job title */
  title?: string;

  /** Updated company name */
  company?: string;

  /** Updated start date */
  startDate?: Date;

  /** Updated end date */
  endDate?: Date | null;

  /** Updated description */
  description?: string | null;
}

/**
 * Type alias for experience ID to ensure consistent typing
 */
export type ExperienceId = string;

/**
 * API response type for single experience operations
 */
export interface ExperienceResponse extends ApiResponse<Experience> {
  data: Experience;
}

/**
 * API response type for paginated experience list operations
 */
export interface ExperienceListResponse extends ApiResponse<Experience[]> {
  data: Experience[];
  page: number;
  pageSize: number;
  total: number;
}