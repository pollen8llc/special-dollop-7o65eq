/**
 * @fileoverview Controller handling profile-related HTTP requests in the LinkedIn Profiles Gallery
 * Implements RESTful endpoints for profile management with authentication, validation, and caching
 * @version 1.0.0
 */

import { Request, Response } from 'express'; // ^4.18.2
import { ProfileService } from '../../services/profile.service';
import { validateCreateProfile, validateUpdateProfile } from '../validators/profile.validator';
import { RequestWithAuth } from '../../types/auth.types';
import { createNotFoundError, createValidationError } from '../../utils/errors';
import logger from '../../utils/logger';
import { PAGINATION, RATE_LIMIT } from '../../config/constants';
import { PaginationParams } from '../../types/api.types';
import { CreateProfileDto, UpdateProfileDto } from '../../types/profile.types';

/**
 * Controller class handling profile-related HTTP requests with caching and validation
 */
export class ProfilesController {
  private readonly DEFAULT_PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;
  private readonly MAX_PAGE_SIZE = PAGINATION.MAX_PAGE_SIZE;

  constructor(private readonly profileService: ProfileService) {}

  /**
   * Creates a new profile for authenticated user
   * @route POST /api/v1/profiles
   */
  public async createProfile(req: RequestWithAuth, res: Response): Promise<Response> {
    const correlationId = req.headers['x-correlation-id'] as string;
    logger.setCorrelationId(correlationId);

    try {
      // Validate request body
      const validatedData = await validateCreateProfile(req.body);
      
      // Create profile with validated data
      const result = await this.profileService.createProfile({
        ...validatedData,
        userId: req.user.id
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      // Set cache control headers
      res.set('Cache-Control', 'private, no-cache');
      
      logger.info('Profile created successfully', {
        userId: req.user.id,
        profileId: result.data?.id
      });

      return res.status(201).json(result);

    } catch (error) {
      logger.error('Failed to create profile', { error });
      throw error;
    }
  }

  /**
   * Retrieves a profile by ID with caching
   * @route GET /api/v1/profiles/:id
   */
  public async getProfile(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const correlationId = req.headers['x-correlation-id'] as string;
    logger.setCorrelationId(correlationId);

    try {
      // Get profile with caching
      const result = await this.profileService.getProfileById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      // Set cache control and ETag headers
      const etag = `"${result.data?.updatedAt.getTime()}"`;
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'ETag': etag
      });

      // Handle conditional GET requests
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }

      logger.info('Profile retrieved successfully', { profileId: id });
      return res.json(result);

    } catch (error) {
      logger.error('Failed to get profile', { error, profileId: id });
      throw error;
    }
  }

  /**
   * Retrieves paginated list of profiles with filtering and caching
   * @route GET /api/v1/profiles
   */
  public async getProfiles(req: Request, res: Response): Promise<Response> {
    const correlationId = req.headers['x-correlation-id'] as string;
    logger.setCorrelationId(correlationId);

    try {
      // Parse and validate pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(
        this.MAX_PAGE_SIZE,
        parseInt(req.query.pageSize as string) || this.DEFAULT_PAGE_SIZE
      );

      // Parse filter parameters
      const filters = {
        searchTerm: req.query.search as string,
        company: req.query.company as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      // Get profiles with caching
      const result = await this.profileService.getProfiles(page, pageSize, filters);

      // Set cache control headers
      res.set({
        'Cache-Control': 'public, max-age=60', // 1 minute
        'Vary': 'Accept-Encoding'
      });

      logger.info('Profiles retrieved successfully', {
        page,
        pageSize,
        total: result.data?.total
      });

      return res.json(result);

    } catch (error) {
      logger.error('Failed to get profiles', { error });
      throw error;
    }
  }

  /**
   * Updates an existing profile with validation
   * @route PUT /api/v1/profiles/:id
   */
  public async updateProfile(req: RequestWithAuth, res: Response): Promise<Response> {
    const { id } = req.params;
    const correlationId = req.headers['x-correlation-id'] as string;
    logger.setCorrelationId(correlationId);

    try {
      // Validate request body
      const validatedData = await validateUpdateProfile(req.body);

      // Verify profile ownership
      const existingProfile = await this.profileService.getProfileById(id);
      if (!existingProfile.success) {
        return res.status(404).json(existingProfile);
      }

      if (existingProfile.data?.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: createValidationError('Not authorized to update this profile', [])
        });
      }

      // Update profile
      const result = await this.profileService.updateProfile(id, validatedData);

      // Set cache control headers
      res.set('Cache-Control', 'private, no-cache');

      logger.info('Profile updated successfully', {
        profileId: id,
        userId: req.user.id
      });

      return res.json(result);

    } catch (error) {
      logger.error('Failed to update profile', { error, profileId: id });
      throw error;
    }
  }

  /**
   * Deletes a profile with authorization check
   * @route DELETE /api/v1/profiles/:id
   */
  public async deleteProfile(req: RequestWithAuth, res: Response): Promise<Response> {
    const { id } = req.params;
    const correlationId = req.headers['x-correlation-id'] as string;
    logger.setCorrelationId(correlationId);

    try {
      // Verify profile ownership
      const existingProfile = await this.profileService.getProfileById(id);
      if (!existingProfile.success) {
        return res.status(404).json(existingProfile);
      }

      if (existingProfile.data?.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: createValidationError('Not authorized to delete this profile', [])
        });
      }

      // Delete profile
      const result = await this.profileService.deleteProfile(id);

      // Set cache control headers
      res.set('Cache-Control', 'private, no-cache');

      logger.info('Profile deleted successfully', {
        profileId: id,
        userId: req.user.id
      });

      return res.status(204).end();

    } catch (error) {
      logger.error('Failed to delete profile', { error, profileId: id });
      throw error;
    }
  }
}