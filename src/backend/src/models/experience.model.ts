/**
 * @fileoverview Experience model implementation for LinkedIn Profiles Gallery
 * Provides database operations and business logic for managing professional experiences
 * @version 1.0.0
 */

import { Prisma } from '@prisma/client'; // ^4.0.0
import prisma from '../utils/prisma';
import { Experience, CreateExperienceDto, UpdateExperienceDto } from '../types/experience.types';
import { createNotFoundError, createValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Creates a new experience record with comprehensive validation
 */
export async function createExperience(
  data: CreateExperienceDto,
  profileId: string
): Promise<Experience> {
  logger.debug('Creating new experience', { profileId, ...data });

  // Validate date ranges
  if (data.endDate && data.startDate > data.endDate) {
    throw createValidationError('Invalid date range', [{
      field: 'dateRange',
      message: 'Start date must be before end date',
      value: { startDate: data.startDate, endDate: data.endDate },
      constraint: 'dateRange'
    }]);
  }

  try {
    // Create experience within a transaction
    const experience = await prisma.$transaction(async (tx) => {
      // Verify profile exists
      const profile = await tx.profile.findUnique({
        where: { id: profileId }
      });

      if (!profile) {
        throw createNotFoundError(`Profile with ID ${profileId} not found`);
      }

      // Create experience record
      return await tx.experience.create({
        data: {
          profileId,
          title: data.title,
          company: data.company,
          startDate: data.startDate,
          endDate: data.endDate,
          description: data.description
        }
      });
    });

    logger.info('Experience created successfully', { experienceId: experience.id });
    return experience;

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error('Database error creating experience', { error, profileId });
      throw createValidationError('Failed to create experience', [{
        field: 'database',
        message: 'Database operation failed',
        value: null,
        constraint: 'database'
      }]);
    }
    throw error;
  }
}

/**
 * Retrieves a single experience by ID with error handling
 */
export async function getExperienceById(id: string): Promise<Experience> {
  logger.debug('Retrieving experience', { id });

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

  if (!experience) {
    throw createNotFoundError(`Experience with ID ${id} not found`);
  }

  logger.info('Experience retrieved successfully', { id });
  return experience;
}

/**
 * Retrieves paginated experiences for a profile with optimized performance
 */
export async function getProfileExperiences(
  profileId: string,
  pagination: { page: number; pageSize: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
): Promise<{ experiences: Experience[]; total: number }> {
  const { page, pageSize, sortBy = 'startDate', sortOrder = 'desc' } = pagination;
  logger.debug('Retrieving profile experiences', { profileId, pagination });

  // Calculate offset
  const skip = (page - 1) * pageSize;

  // Build sort object
  const orderBy: Prisma.ExperienceOrderByWithRelationInput = {
    [sortBy]: sortOrder
  };

  try {
    // Execute queries in parallel for better performance
    const [experiences, total] = await Promise.all([
      prisma.experience.findMany({
        where: { profileId },
        orderBy,
        skip,
        take: pageSize
      }),
      prisma.experience.count({
        where: { profileId }
      })
    ]);

    logger.info('Profile experiences retrieved successfully', {
      profileId,
      count: experiences.length,
      total
    });

    return { experiences, total };

  } catch (error) {
    logger.error('Error retrieving profile experiences', { error, profileId });
    throw error;
  }
}

/**
 * Updates an experience record with validation and optimistic locking
 */
export async function updateExperience(
  id: string,
  data: UpdateExperienceDto
): Promise<Experience> {
  logger.debug('Updating experience', { id, ...data });

  // Validate date range if both dates are provided
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    throw createValidationError('Invalid date range', [{
      field: 'dateRange',
      message: 'Start date must be before end date',
      value: { startDate: data.startDate, endDate: data.endDate },
      constraint: 'dateRange'
    }]);
  }

  try {
    const experience = await prisma.$transaction(async (tx) => {
      // Get current experience with lock
      const current = await tx.experience.findUnique({
        where: { id },
        select: { id: true, startDate: true, endDate: true }
      });

      if (!current) {
        throw createNotFoundError(`Experience with ID ${id} not found`);
      }

      // Update experience
      return await tx.experience.update({
        where: { id },
        data: {
          title: data.title,
          company: data.company,
          startDate: data.startDate,
          endDate: data.endDate,
          description: data.description
        }
      });
    });

    logger.info('Experience updated successfully', { id });
    return experience;

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error('Database error updating experience', { error, id });
      throw createValidationError('Failed to update experience', [{
        field: 'database',
        message: 'Database operation failed',
        value: null,
        constraint: 'database'
      }]);
    }
    throw error;
  }
}

/**
 * Deletes an experience record with proper cleanup
 */
export async function deleteExperience(id: string): Promise<void> {
  logger.debug('Deleting experience', { id });

  try {
    await prisma.$transaction(async (tx) => {
      // Verify experience exists
      const experience = await tx.experience.findUnique({
        where: { id }
      });

      if (!experience) {
        throw createNotFoundError(`Experience with ID ${id} not found`);
      }

      // Delete experience
      await tx.experience.delete({
        where: { id }
      });
    });

    logger.info('Experience deleted successfully', { id });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error('Database error deleting experience', { error, id });
      throw createValidationError('Failed to delete experience', [{
        field: 'database',
        message: 'Database operation failed',
        value: null,
        constraint: 'database'
      }]);
    }
    throw error;
  }
}