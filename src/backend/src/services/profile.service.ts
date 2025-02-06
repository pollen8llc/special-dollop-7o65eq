/**
 * Profile service implementation for LinkedIn Profiles Gallery
 * Handles profile management with caching, validation, and error handling
 * @module services/profile.service
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client'; // ^4.0.0
import { validate } from 'class-validator'; // ^0.14.0
import { CacheService } from './cache.service';
import { Logger } from '../utils/logger';
import prisma from '../utils/prisma';
import { createValidationError, createNotFoundError } from '../utils/errors';
import { ApiResponse, PaginatedResponse } from '../types/api.types';

/**
 * Interface for profile creation data
 */
interface CreateProfileDto {
  userId: string;
  headline: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: Record<string, string>;
}

/**
 * Interface for profile update data
 */
interface UpdateProfileDto extends Partial<CreateProfileDto> {
  experiences?: {
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
  }[];
}

/**
 * Interface for profile filtering parameters
 */
interface FilterParams {
  searchTerm?: string;
  company?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Profile service class implementing core profile management functionality
 */
export class ProfileService {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'profile:';

  constructor(
    private readonly prismaClient: PrismaClient = prisma,
    private readonly cacheService: CacheService,
    private readonly logger: Logger
  ) {}

  /**
   * Creates a new profile with validation and caching
   */
  public async createProfile(
    data: CreateProfileDto
  ): Promise<ApiResponse<any>> {
    try {
      // Validate input data
      const errors = await validate(data);
      if (errors.length > 0) {
        return {
          success: false,
          data: null,
          error: createValidationError('Invalid profile data', errors),
          timestamp: new Date().toISOString()
        };
      }

      // Create profile with transaction
      const profile = await this.prismaClient.$transaction(async (tx) => {
        const newProfile = await tx.profile.create({
          data: {
            userId: data.userId,
            headline: data.headline,
            bio: data.bio,
            avatarUrl: data.avatarUrl,
            socialLinks: data.socialLinks,
          },
          include: {
            experiences: true
          }
        });

        // Cache the new profile
        await this.cacheService.set(
          `${this.CACHE_PREFIX}${newProfile.id}`,
          newProfile,
          { ttl: this.CACHE_TTL }
        );

        return newProfile;
      });

      this.logger.info('Profile created successfully', { profileId: profile.id });

      return {
        success: true,
        data: profile,
        error: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to create profile', { error });
      throw error;
    }
  }

  /**
   * Retrieves a profile by ID with caching
   */
  public async getProfileById(id: string): Promise<ApiResponse<any>> {
    try {
      // Check cache first
      const cacheKey = `${this.CACHE_PREFIX}${id}`;
      const cachedProfile = await this.cacheService.get(cacheKey);

      if (cachedProfile) {
        return {
          success: true,
          data: cachedProfile,
          error: null,
          timestamp: new Date().toISOString()
        };
      }

      // Query database if not in cache
      const profile = await this.prismaClient.profile.findUnique({
        where: { id },
        include: {
          experiences: true
        }
      });

      if (!profile) {
        return {
          success: false,
          data: null,
          error: createNotFoundError('Profile not found'),
          timestamp: new Date().toISOString()
        };
      }

      // Cache the profile
      await this.cacheService.set(cacheKey, profile, { ttl: this.CACHE_TTL });

      return {
        success: true,
        data: profile,
        error: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get profile', { error, profileId: id });
      throw error;
    }
  }

  /**
   * Updates a profile with validation and cache refresh
   */
  public async updateProfile(
    id: string,
    data: UpdateProfileDto
  ): Promise<ApiResponse<any>> {
    try {
      // Validate update data
      const errors = await validate(data);
      if (errors.length > 0) {
        return {
          success: false,
          data: null,
          error: createValidationError('Invalid update data', errors),
          timestamp: new Date().toISOString()
        };
      }

      // Update profile with transaction
      const updatedProfile = await this.prismaClient.$transaction(async (tx) => {
        const profile = await tx.profile.update({
          where: { id },
          data: {
            headline: data.headline,
            bio: data.bio,
            avatarUrl: data.avatarUrl,
            socialLinks: data.socialLinks,
            experiences: {
              deleteMany: {},
              create: data.experiences
            }
          },
          include: {
            experiences: true
          }
        });

        // Update cache
        const cacheKey = `${this.CACHE_PREFIX}${id}`;
        await this.cacheService.set(cacheKey, profile, { ttl: this.CACHE_TTL });

        return profile;
      });

      this.logger.info('Profile updated successfully', { profileId: id });

      return {
        success: true,
        data: updatedProfile,
        error: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to update profile', { error, profileId: id });
      throw error;
    }
  }

  /**
   * Deletes a profile with cache cleanup
   */
  public async deleteProfile(id: string): Promise<ApiResponse<void>> {
    try {
      await this.prismaClient.$transaction(async (tx) => {
        // Delete profile and related data
        await tx.experience.deleteMany({
          where: { profileId: id }
        });

        await tx.profile.delete({
          where: { id }
        });

        // Remove from cache
        const cacheKey = `${this.CACHE_PREFIX}${id}`;
        await this.cacheService.delete(cacheKey);
      });

      this.logger.info('Profile deleted successfully', { profileId: id });

      return {
        success: true,
        data: null,
        error: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to delete profile', { error, profileId: id });
      throw error;
    }
  }

  /**
   * Retrieves paginated profiles with filtering
   */
  public async getProfiles(
    page: number = 1,
    pageSize: number = 12,
    filters: FilterParams = {}
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      const skip = (page - 1) * pageSize;
      const cacheKey = `${this.CACHE_PREFIX}list:${page}:${pageSize}:${JSON.stringify(filters)}`;

      // Check cache first
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        return {
          success: true,
          data: cachedResult,
          error: null,
          timestamp: new Date().toISOString()
        };
      }

      // Build filter conditions
      const where = {
        ...(filters.searchTerm && {
          OR: [
            { headline: { contains: filters.searchTerm, mode: 'insensitive' } },
            { bio: { contains: filters.searchTerm, mode: 'insensitive' } }
          ]
        }),
        ...(filters.company && {
          experiences: {
            some: {
              company: { contains: filters.company, mode: 'insensitive' }
            }
          }
        })
      };

      // Query with pagination
      const [profiles, total] = await Promise.all([
        this.prismaClient.profile.findMany({
          where,
          include: {
            experiences: true
          },
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' }
        }),
        this.prismaClient.profile.count({ where })
      ]);

      const result: PaginatedResponse<any> = {
        data: profiles,
        page,
        pageSize,
        total,
        hasNextPage: skip + profiles.length < total,
        hasPreviousPage: page > 1
      };

      // Cache the results
      await this.cacheService.set(cacheKey, result, { ttl: 60 }); // Cache for 1 minute

      return {
        success: true,
        data: result,
        error: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get profiles', { error });
      throw error;
    }
  }
}