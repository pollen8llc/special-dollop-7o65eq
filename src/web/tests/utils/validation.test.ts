import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'; // @jest/globals@29.5.0
import { z } from 'zod'; // zod@3.21.0
import mockAxios from 'jest-mock-axios'; // jest-mock-axios@4.7.2

import {
  validateProfileForm,
  validateExperienceForm,
  validateSocialLinks,
  getValidationErrors
} from '../../app/utils/validation';
import type { Profile } from '../../app/types/profile.types';
import type { Experience } from '../../app/types/experience.types';

// Test fixtures
const mockProfileData: Partial<Profile> = {
  headline: "Senior Software Engineer",
  bio: "Experienced developer with focus on web technologies",
  socialLinks: {
    linkedin: "https://www.linkedin.com/in/johndoe",
    github: "https://github.com/johndoe",
    website: "https://example.com"
  }
};

const mockExperienceData: Partial<Experience> = {
  title: "Senior Developer",
  company: "Tech Corp",
  startDate: new Date("2020-01-01"),
  endDate: new Date("2023-01-01"),
  description: "Led development of enterprise applications"
};

const mockSocialLinks = {
  linkedin: "https://www.linkedin.com/in/valid-user",
  github: "https://github.com/valid-user",
  website: "https://valid-website.com"
};

describe('validateProfileForm', () => {
  it('should validate a complete profile successfully', () => {
    const result = validateProfileForm(mockProfileData);
    expect(result.success).toBe(true);
  });

  it('should allow partial validation for draft profiles', () => {
    const partialData = { headline: "Software Engineer" };
    const result = validateProfileForm(partialData, true);
    expect(result.success).toBe(true);
  });

  it('should enforce headline length constraints', () => {
    const shortHeadline = { headline: "Dev" };
    const longHeadline = { headline: "a".repeat(101) };
    
    expect(validateProfileForm(shortHeadline).success).toBe(false);
    expect(validateProfileForm(longHeadline).success).toBe(false);
  });

  it('should sanitize HTML content in text fields', () => {
    const dataWithHtml = {
      ...mockProfileData,
      bio: "<script>alert('xss')</script>Bio content"
    };
    const result = validateProfileForm(dataWithHtml);
    expect(result.success).toBe(false);
  });

  it('should validate bio length limits', () => {
    const longBio = {
      ...mockProfileData,
      bio: "a".repeat(501)
    };
    const result = validateProfileForm(longBio);
    expect(result.success).toBe(false);
  });

  it('should cache validation results for performance', () => {
    const firstResult = validateProfileForm(mockProfileData);
    const secondResult = validateProfileForm(mockProfileData);
    expect(firstResult).toBe(secondResult);
  });
});

describe('validateExperienceForm', () => {
  it('should validate complete experience data', () => {
    const result = validateExperienceForm(mockExperienceData);
    expect(result.success).toBe(true);
  });

  it('should validate title and company field constraints', () => {
    const invalidData = {
      ...mockExperienceData,
      title: "a",
      company: "b"
    };
    const result = validateExperienceForm(invalidData);
    expect(result.success).toBe(false);
  });

  it('should validate date ranges correctly', () => {
    const invalidDates = {
      ...mockExperienceData,
      startDate: new Date("2023-01-01"),
      endDate: new Date("2022-01-01")
    };
    const result = validateExperienceForm(invalidDates);
    expect(result.success).toBe(false);
  });

  it('should handle current position with null end date', () => {
    const currentPosition = {
      ...mockExperienceData,
      endDate: null
    };
    const result = validateExperienceForm(currentPosition);
    expect(result.success).toBe(true);
  });

  it('should validate description length and formatting', () => {
    const longDescription = {
      ...mockExperienceData,
      description: "a".repeat(1001)
    };
    const result = validateExperienceForm(longDescription);
    expect(result.success).toBe(false);
  });

  it('should prevent future start dates', () => {
    const futureDate = {
      ...mockExperienceData,
      startDate: new Date("2025-01-01")
    };
    const result = validateExperienceForm(futureDate);
    expect(result.success).toBe(false);
  });
});

describe('validateSocialLinks', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  afterEach(() => {
    mockAxios.reset();
  });

  it('should validate correct social link formats', async () => {
    mockAxios.head.mockResolvedValueOnce({ status: 200 });
    const result = await validateSocialLinks(mockSocialLinks);
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL formats', async () => {
    const invalidLinks = {
      linkedin: "invalid-url",
      github: "not-a-url",
      website: "wrong-format"
    };
    const result = await validateSocialLinks(invalidLinks);
    expect(result.success).toBe(false);
  });

  it('should validate LinkedIn profile URL format', async () => {
    const invalidLinkedIn = {
      ...mockSocialLinks,
      linkedin: "https://linkedin.com/company/invalid"
    };
    const result = await validateSocialLinks(invalidLinkedIn);
    expect(result.success).toBe(false);
  });

  it('should validate GitHub profile URL format', async () => {
    const invalidGithub = {
      ...mockSocialLinks,
      github: "https://github.com/org/repo"
    };
    const result = await validateSocialLinks(invalidGithub);
    expect(result.success).toBe(false);
  });

  it('should require HTTPS for website URLs', async () => {
    const httpWebsite = {
      ...mockSocialLinks,
      website: "http://example.com"
    };
    const result = await validateSocialLinks(httpWebsite);
    expect(result.success).toBe(false);
  });

  it('should handle network timeouts gracefully', async () => {
    mockAxios.head.mockRejectedValueOnce(new Error('Timeout'));
    const result = await validateSocialLinks(mockSocialLinks);
    expect(result.success).toBe(false);
  });
});

describe('getValidationErrors', () => {
  it('should format single field errors correctly', () => {
    const error = new z.ZodError([{
      code: 'custom',
      path: ['headline'],
      message: 'Invalid headline'
    }]);
    const errors = getValidationErrors(error);
    expect(errors.headline).toBe('Invalid headline');
  });

  it('should handle multiple field errors', () => {
    const error = new z.ZodError([
      {
        code: 'custom',
        path: ['headline'],
        message: 'Invalid headline'
      },
      {
        code: 'custom',
        path: ['bio'],
        message: 'Invalid bio'
      }
    ]);
    const errors = getValidationErrors(error);
    expect(Object.keys(errors).length).toBe(2);
    expect(errors.headline).toBeDefined();
    expect(errors.bio).toBeDefined();
  });

  it('should handle nested field errors', () => {
    const error = new z.ZodError([{
      code: 'custom',
      path: ['socialLinks', 'linkedin'],
      message: 'Invalid LinkedIn URL'
    }]);
    const errors = getValidationErrors(error);
    expect(errors['socialLinks.linkedin']).toBe('Invalid LinkedIn URL');
  });

  it('should support error message localization', () => {
    const error = new z.ZodError([{
      code: 'custom',
      path: ['headline'],
      message: 'Invalid headline'
    }]);
    const errors = getValidationErrors(error, 'es');
    expect(errors.headline).toBeDefined();
  });
});