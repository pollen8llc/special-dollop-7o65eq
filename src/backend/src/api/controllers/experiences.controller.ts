/**
 * @fileoverview Experience controller implementation for LinkedIn Profiles Gallery
 * Handles HTTP requests for managing professional experiences with validation and caching
 * @version 1.0.0
 */

import { Request, Response } from '@types/express'; // ^4.17.17
import {
  createExperience,
  getExperienceById,
  getProfileExperiences,
  updateExperience,
  deleteExperience
} from '../../services/experience.service';
import {
  validateCreateExperience,
  validateUpdateExperience
} from '../validators/experience.validator';
import {
  Experience,
  ExperienceResponse,
  ExperienceListResponse
} from '../../types/experience.types';
import logger from '../../utils/logger';
import {
  createBadRequestError,
  createNotFoundError,
  createInternalError
} from '../../utils/errors';

/**
 * Handles POST requests to create new experience entries
 * Implements input validation and error handling
 */
export async function createExperienceHandler(
  req: Request,
  res: Response<ExperienceResponse>
): Promise<Response<ExperienceResponse>> {
  try {
    // Extract profile ID from authenticated user context
    const profileId = req.user?.profileId;
    if (!profileId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: createBadRequestError('Profile ID is required'),
        timestamp: new Date().toISOString()
      });
    }

    // Validate request body
    const validatedData = await validateCreateExperience(req.body);

    // Create experience record
    const experience = await createExperience(validatedData, profileId);

    // Return success response
    return res.status(201).json({
      success: true,
      data: experience,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to create experience', { error });
    return res.status(500).json({
      success: false,
      data: null,
      error: createInternalError('Failed to create experience'),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handles GET requests to retrieve a single experience by ID
 * Implements caching and error handling
 */
export async function getExperienceHandler(
  req: Request,
  res: Response<ExperienceResponse>
): Promise<Response<ExperienceResponse>> {
  try {
    const { id } = req.params;

    // Retrieve experience with caching
    const experience = await getExperienceById(id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        data: null,
        error: createNotFoundError('Experience not found'),
        timestamp: new Date().toISOString()
      });
    }

    // Set cache control headers
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache

    return res.status(200).json({
      success: true,
      data: experience,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get experience', { error, id: req.params.id });
    return res.status(500).json({
      success: false,
      data: null,
      error: createInternalError('Failed to retrieve experience'),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handles GET requests to retrieve paginated experiences for a profile
 * Implements caching and pagination
 */
export async function getProfileExperiencesHandler(
  req: Request,
  res: Response<ExperienceListResponse>
): Promise<Response<ExperienceListResponse>> {
  try {
    const profileId = req.params.profileId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'startDate';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Get paginated experiences
    const { experiences, total } = await getProfileExperiences(profileId, {
      page,
      pageSize,
      sortBy,
      sortOrder
    });

    // Set cache control headers
    res.set('Cache-Control', 'public, max-age=60'); // 1 minute cache

    return res.status(200).json({
      success: true,
      data: experiences,
      page,
      pageSize,
      total,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get profile experiences', { error, profileId: req.params.profileId });
    return res.status(500).json({
      success: false,
      data: [],
      error: createInternalError('Failed to retrieve experiences'),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handles PUT requests to update an existing experience
 * Implements validation and cache invalidation
 */
export async function updateExperienceHandler(
  req: Request,
  res: Response<ExperienceResponse>
): Promise<Response<ExperienceResponse>> {
  try {
    const { id } = req.params;

    // Validate update data
    const validatedData = await validateUpdateExperience(req.body);

    // Update experience
    const experience = await updateExperience(id, validatedData);

    if (!experience) {
      return res.status(404).json({
        success: false,
        data: null,
        error: createNotFoundError('Experience not found'),
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      data: experience,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to update experience', { error, id: req.params.id });
    return res.status(500).json({
      success: false,
      data: null,
      error: createInternalError('Failed to update experience'),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handles DELETE requests to remove an experience
 * Implements proper cleanup and cache invalidation
 */
export async function deleteExperienceHandler(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const { id } = req.params;

    // Delete experience
    await deleteExperience(id);

    return res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete experience', { error, id: req.params.id });
    return res.status(500).json({
      success: false,
      error: createInternalError('Failed to delete experience'),
      timestamp: new Date().toISOString()
    });
  }
}