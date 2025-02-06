/**
 * @fileoverview Profile model implementation for LinkedIn Profiles Gallery
 * Provides database operations and business logic for managing professional profiles
 * @version 1.0.0
 */

import { Prisma } from '@prisma/client'; // ^4.0.0
import prisma from '../utils/prisma';
import { 
  Profile, 
  CreateProfileDto, 
  UpdateProfileDto, 
  ProfileListResponse, 
  ProfileFilters 
} from '../types/profile.types';
import logger from '../utils/logger';
import { 
  createNotFoundError, 
  createValidationError, 
  createForbiddenError 
} from '../utils/errors';
import { CACHE, PAGINATION } from '../config/constants';

/**
 * Creates a new profile with associated experiences
 * @param data Profile creation data
 * @param userId Authenticated user ID
 */
export async function createProfile(
  data: CreateProfileDto,
  userId: string
): Promise<Profile> {
  logger.debug('Creating new profile', { userId });

  try {
    // Validate headline length
    if (!data.headline || data.headline.length < 3) {
      throw createValidationError('Invalid headline', [{
        field: 'headline',
        message: 'Headline must be at least 3 characters long',
        value: data.headline,
        constraint: 'minLength'
      }]);
    }

    // Create profile with experiences in a transaction
    const profile = await prisma.$transaction(async (tx) => {
      // Create base profile
      const newProfile = await tx.profile.create({
        data: {
          userId,
          headline: data.headline,
          bio: data.bio,
          avatarUrl: data.avatarUrl,
          socialLinks: data.socialLinks || {},
        },
        include: {
          experiences: true
        }
      });

      logger.info('Profile created successfully', { 
        profileId: newProfile.id,
        userId 
      });

      return newProfile;
    });

    return profile;

  } catch (error) {
    logger.error('Failed to create profile', { error, userId });
    throw error;
  }
}

/**
 * Retrieves paginated profiles with filtering and caching
 * @param pagination Pagination parameters
 * @param filters Profile filters
 */
export async function getProfiles(
  pagination: { cursor?: string; limit: number },
  filters: ProfileFilters
): Promise<ProfileListResponse> {
  const { cursor, limit = PAGINATION.DEFAULT_PAGE_SIZE } = pagination;
  
  try {
    // Construct base query
    const where: Prisma.ProfileWhereInput = {
      deletedAt: null
    };

    // Apply filters if provided
    if (filters.headline) {
      where.headline = { contains: filters.headline, mode: 'insensitive' };
    }

    // Execute paginated query
    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          experiences: {
            orderBy: { startDate: 'desc' }
          }
        }
      }),
      prisma.profile.count({ where })
    ]);

    // Check if there are more results
    const hasNextPage = profiles.length > limit;
    const items = hasNextPage ? profiles.slice(0, -1) : profiles;
    const nextCursor = hasNextPage ? profiles[limit].id : null;

    logger.debug('Retrieved profiles', { 
      total,
      limit,
      hasNextPage
    });

    return {
      success: true,
      data: items,
      page: cursor ? parseInt(cursor) : 1,
      pageSize: limit,
      total,
      error: null,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Failed to retrieve profiles', { error });
    throw error;
  }
}

/**
 * Updates an existing profile with validation and authorization
 * @param id Profile ID
 * @param data Update data
 * @param userId Authenticated user ID
 */
export async function updateProfile(
  id: string,
  data: UpdateProfileDto,
  userId: string
): Promise<Profile> {
  try {
    // Verify profile exists and user has access
    const existingProfile = await prisma.profile.findUnique({
      where: { id },
      include: { experiences: true }
    });

    if (!existingProfile) {
      throw createNotFoundError('Profile not found');
    }

    if (existingProfile.userId !== userId) {
      throw createForbiddenError('Not authorized to update this profile');
    }

    // Validate headline if provided
    if (data.headline && data.headline.length < 3) {
      throw createValidationError('Invalid headline', [{
        field: 'headline',
        message: 'Headline must be at least 3 characters long',
        value: data.headline,
        constraint: 'minLength'
      }]);
    }

    // Update profile in transaction
    const updatedProfile = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.update({
        where: { id },
        data: {
          headline: data.headline,
          bio: data.bio,
          avatarUrl: data.avatarUrl,
          socialLinks: data.socialLinks ? {
            ...existingProfile.socialLinks,
            ...data.socialLinks
          } : undefined,
          updatedAt: new Date()
        },
        include: {
          experiences: true
        }
      });

      logger.info('Profile updated successfully', { 
        profileId: id,
        userId 
      });

      return profile;
    });

    return updatedProfile;

  } catch (error) {
    logger.error('Failed to update profile', { error, profileId: id });
    throw error;
  }
}

/**
 * Performs soft delete of profile with security validation
 * @param id Profile ID
 * @param userId Authenticated user ID
 */
export async function deleteProfile(
  id: string,
  userId: string
): Promise<void> {
  try {
    // Verify profile exists and user has access
    const profile = await prisma.profile.findUnique({
      where: { id }
    });

    if (!profile) {
      throw createNotFoundError('Profile not found');
    }

    if (profile.userId !== userId) {
      throw createForbiddenError('Not authorized to delete this profile');
    }

    // Soft delete profile and experiences in transaction
    await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Soft delete experiences
      await tx.experience.updateMany({
        where: { profileId: id },
        data: { deletedAt: now }
      });

      // Soft delete profile
      await tx.profile.update({
        where: { id },
        data: { deletedAt: now }
      });
    });

    logger.info('Profile deleted successfully', {
      profileId: id,
      userId
    });

  } catch (error) {
    logger.error('Failed to delete profile', { error, profileId: id });
    throw error;
  }
}