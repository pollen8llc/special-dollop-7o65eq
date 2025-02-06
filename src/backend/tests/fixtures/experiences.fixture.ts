/**
 * @fileoverview Test fixtures for professional experiences in the LinkedIn Profiles Gallery
 * @version 1.0.0
 */

import { Experience, CreateExperienceDto } from '../../src/types/experience.types';

// Mock UUIDs for consistent testing
export const MOCK_EXPERIENCE_ID = '00000000-0000-0000-0000-000000000001';
export const MOCK_PROFILE_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Creates a mock experience object with default test values
 * @param overrides - Optional partial Experience object to override default values
 * @returns Complete mock Experience object
 */
export const createMockExperience = (overrides: Partial<Experience> = {}): Experience => {
  const defaults: Experience = {
    id: MOCK_EXPERIENCE_ID,
    profileId: MOCK_PROFILE_ID,
    title: 'Senior Software Engineer',
    company: 'Test Company Inc.',
    startDate: new Date('2020-01-01T00:00:00.000Z'),
    endDate: new Date('2023-01-01T00:00:00.000Z'),
    description: 'Led development of key features and mentored junior developers',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-01T00:00:00.000Z')
  };

  return {
    ...defaults,
    ...overrides
  };
};

/**
 * Creates a mock CreateExperienceDto object for testing experience creation
 * @param overrides - Optional partial CreateExperienceDto to override default values
 * @returns Complete mock CreateExperienceDto object
 */
export const createMockExperienceDto = (overrides: Partial<CreateExperienceDto> = {}): CreateExperienceDto => {
  const defaults: CreateExperienceDto = {
    title: 'Senior Software Engineer',
    company: 'Test Company Inc.',
    startDate: new Date('2020-01-01T00:00:00.000Z'),
    endDate: new Date('2023-01-01T00:00:00.000Z'),
    description: 'Led development of key features and mentored junior developers'
  };

  return {
    ...defaults,
    ...overrides
  };
};

// Common test fixtures
export const mockExperience: Experience = createMockExperience();

export const mockExperienceDto: CreateExperienceDto = createMockExperienceDto();

// Specialized test fixtures
export const mockCurrentExperience: Experience = createMockExperience({
  endDate: null,
  title: 'Current Position',
  company: 'Present Company Ltd.',
  description: 'Ongoing role with current responsibilities'
});

export const mockExperienceNoDescription: Experience = createMockExperience({
  description: null
});

export const mockExperiencePastRole: Experience = createMockExperience({
  id: '00000000-0000-0000-0000-000000000002',
  title: 'Junior Developer',
  company: 'Past Company Corp.',
  startDate: new Date('2018-01-01T00:00:00.000Z'),
  endDate: new Date('2019-12-31T00:00:00.000Z'),
  description: 'Entry level development role focusing on bug fixes and maintenance'
});

// Invalid test fixtures for negative testing
export const mockInvalidExperienceDto: CreateExperienceDto = {
  title: '', // Empty title for validation testing
  company: 'Test Company',
  startDate: new Date('2023-01-01T00:00:00.000Z'),
  endDate: new Date('2022-01-01T00:00:00.000Z'), // End date before start date
  description: null
};

export const mockFutureExperience: Experience = createMockExperience({
  startDate: new Date('2024-01-01T00:00:00.000Z'),
  endDate: new Date('2025-01-01T00:00:00.000Z'),
  title: 'Future Role',
  company: 'Future Corp'
});