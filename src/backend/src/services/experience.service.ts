/**
 * @fileoverview Experience service implementation for LinkedIn Profiles Gallery
 * Provides CRUD operations for professional experiences with caching and validation
 * @version 1.0.0
 */

import { Prisma } from '@prisma/client'; // ^4.0.0
import prisma from '../utils/prisma';
import { getRedisClient } from '../utils/redis';
import { logger } from '../utils/logger';
import {
  Experience,
  CreateExperienceDto,
  UpdateExperienceDto,
  ExperienceId,
  PaginationParams
} from '../types/experience.types';

// Cache configuration constants
const CACHE_TTL = 3600; // 1 hour cache TTL
const CACHE_PREFIX = 'experience:';
const MAX_BATCH_SIZE = 100;

/**
 * Creates a new experience record with validation and caching
 */
export async function createExperience(
  data: CreateExperienceDto,
  profileId: string
): Promise<Experience> {
  try {
    // Validate required fields
    if (!data.title || !data.company || !data.startDate) {
      throw new Error('Missing required experience fields');
    }

    // Create experience record within a transaction
    const experience = await prisma.$transaction(async (tx) => {
      const created = await tx.experience.create({
        data: {
          ...data,
          profileId,
          endDate: data.endDate || null,
          description: data.description || null
        }
      });

      // Invalidate related caches
      await invalidateExperienceCache(created.id, profileId);

      return created;
    });

    logger.info('Experience created successfully', {
      experienceId: experience.id,
      profileId
    });

    return experience;
  } catch (error) {
    logger.error('Failed to create experience', { error, profileId });
    throw error;
  }
}

/**
 * Retrieves a single experience by ID with caching
 */
export async function getExperienceById(id: ExperienceId): Promise<Experience | null> {
  try {
    const cacheKey = `${CACHE_PREFIX}${id}`;
    const redisClient = await getRedisClient();

    // Check cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info('Experience cache hit', { experienceId: id });
      return JSON.parse(cached);
    }

    // Query database if not cached
    const experience = await prisma.experience.findUnique({
      where: { id },
      include: {
        profile: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });

    if (experience) {
      // Cache the result
      await redisClient.setex(
        cacheKey,
        CACHE_TTL,
        JSON.stringify(experience)
      );
    }

    return experience;
  } catch (error) {
    logger.error('Failed to get experience', { error, experienceId: id });
    throw error;
  }
}

/**
 * Retrieves paginated experiences for a profile with caching
 */
export async function getProfileExperiences(
  profileId: string,
  pagination: PaginationParams
): Promise<{ experiences: Experience[]; total: number }> {
  try {
    const { page, pageSize, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * pageSize;
    const take = Math.min(pageSize, MAX_BATCH_SIZE);

    const cacheKey = `${CACHE_PREFIX}profile:${profileId}:page:${page}:size:${pageSize}`;
    const redisClient = await getRedisClient();

    // Check cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info('Profile experiences cache hit', { profileId, page });
      return JSON.parse(cached);
    }

    // Build sort options
    const orderBy: Prisma.ExperienceOrderByWithRelationInput = {
      [sortBy || 'startDate']: sortOrder || 'desc'
    };

    // Query database with pagination
    const [experiences, total] = await prisma.$transaction([
      prisma.experience.findMany({
        where: { profileId },
        skip,
        take,
        orderBy,
        include: {
          profile: {
            select: {
              id: true,
              userId: true
            }
          }
        }
      }),
      prisma.experience.count({
        where: { profileId }
      })
    ]);

    const result = { experiences, total };

    // Cache the paginated results
    await redisClient.setex(
      cacheKey,
      CACHE_TTL,
      JSON.stringify(result)
    );

    return result;
  } catch (error) {
    logger.error('Failed to get profile experiences', { error, profileId });
    throw error;
  }
}

/**
 * Updates an existing experience with validation and cache invalidation
 */
export async function updateExperience(
  id: ExperienceId,
  data: UpdateExperienceDto
): Promise<Experience> {
  try {
    // Validate update data
    if (Object.keys(data).length === 0) {
      throw new Error('No update data provided');
    }

    // Update experience within a transaction
    const experience = await prisma.$transaction(async (tx) => {
      const updated = await tx.experience.update({
        where: { id },
        data,
        include: {
          profile: {
            select: {
              id: true,
              userId: true
            }
          }
        }
      });

      // Invalidate related caches
      await invalidateExperienceCache(id, updated.profileId);

      return updated;
    });

    logger.info('Experience updated successfully', {
      experienceId: id,
      profileId: experience.profileId
    });

    return experience;
  } catch (error) {
    logger.error('Failed to update experience', { error, experienceId: id });
    throw error;
  }
}

/**
 * Deletes an experience with cache invalidation
 */
export async function deleteExperience(id: ExperienceId): Promise<void> {
  try {
    // Get experience details before deletion for cache invalidation
    const experience = await prisma.experience.findUnique({
      where: { id },
      select: { profileId: true }
    });

    if (!experience) {
      throw new Error('Experience not found');
    }

    // Delete experience within a transaction
    await prisma.$transaction(async (tx) => {
      await tx.experience.delete({
        where: { id }
      });

      // Invalidate related caches
      await invalidateExperienceCache(id, experience.profileId);
    });

    logger.info('Experience deleted successfully', {
      experienceId: id,
      profileId: experience.profileId
    });
  } catch (error) {
    logger.error('Failed to delete experience', { error, experienceId: id });
    throw error;
  }
}

/**
 * Invalidates all related Redis cache entries for an experience
 */
async function invalidateExperienceCache(
  id: ExperienceId,
  profileId: string
): Promise<void> {
  try {
    const redisClient = await getRedisClient();
    const keys = await redisClient.keys(`${CACHE_PREFIX}*`);

    // Filter keys related to this experience or profile
    const keysToDelete = keys.filter(key =>
      key.includes(id) ||
      key.includes(profileId)
    );

    if (keysToDelete.length > 0) {
      await redisClient.del(...keysToDelete);
      logger.info('Experience cache invalidated', {
        experienceId: id,
        profileId,
        keysDeleted: keysToDelete.length
      });
    }
  } catch (error) {
    logger.error('Failed to invalidate experience cache', {
      error,
      experienceId: id,
      profileId
    });
    // Don't throw error to prevent transaction rollback
  }
}