/**
 * Unit tests for ProfileService class
 * Tests profile management functionality including CRUD operations, caching, and error handling
 * @package jest@^29.0.0
 */

import { ProfileService } from '../../src/services/profile.service';
import { CacheService } from '../../src/services/cache.service';
import { mockProfiles, createMockProfile } from '../../fixtures/profiles.fixture';
import prisma from '../../src/utils/prisma';
import { ValidationError, NotFoundError } from '../../src/types/api.types';
import logger from '../../src/utils/logger';

// Mock dependencies
jest.mock('../../src/utils/prisma');
jest.mock('../../src/services/cache.service');
jest.mock('../../src/utils/logger');

describe('ProfileService', () => {
  let profileService: ProfileService;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockPrisma: jest.Mocked<typeof prisma>;
  let mockLogger: jest.Mocked<typeof logger>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Initialize mocked dependencies
    mockCacheService = new CacheService() as jest.Mocked<CacheService>;
    mockPrisma = prisma as jest.Mocked<typeof prisma>;
    mockLogger = logger as jest.Mocked<typeof logger>;

    // Create service instance with mocked dependencies
    profileService = new ProfileService(mockPrisma, mockCacheService, mockLogger);

    // Setup default successful mock responses
    mockPrisma.profile.findUnique.mockResolvedValue(mockProfiles[0]);
    mockPrisma.profile.findMany.mockResolvedValue(mockProfiles);
    mockPrisma.profile.count.mockResolvedValue(mockProfiles.length);
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue();
    mockCacheService.delete.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    const validProfileData = {
      userId: 'test-user-id',
      headline: 'Senior Software Engineer',
      bio: 'Experienced developer',
      avatarUrl: 'https://example.com/avatar.jpg',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/test',
        github: 'https://github.com/test'
      }
    };

    it('should create a profile successfully with valid data', async () => {
      const mockCreatedProfile = { ...mockProfiles[0], ...validProfileData };
      mockPrisma.profile.create.mockResolvedValue(mockCreatedProfile);

      const result = await profileService.createProfile(validProfileData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedProfile);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining(mockCreatedProfile.id),
        mockCreatedProfile,
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Profile created successfully',
        expect.any(Object)
      );
    });

    it('should handle validation errors for invalid profile data', async () => {
      const invalidData = { ...validProfileData, headline: '' };
      
      const result = await profileService.createProfile(invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.profile.create).not.toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should handle database errors during creation', async () => {
      const dbError = new Error('Database error');
      mockPrisma.profile.create.mockRejectedValue(dbError);

      await expect(profileService.createProfile(validProfileData))
        .rejects.toThrow(dbError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create profile',
        expect.objectContaining({ error: dbError })
      );
    });
  });

  describe('getProfileById', () => {
    const profileId = mockProfiles[0].id;

    it('should return profile from cache if available', async () => {
      const cachedProfile = mockProfiles[0];
      mockCacheService.get.mockResolvedValue(cachedProfile);

      const result = await profileService.getProfileById(profileId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedProfile);
      expect(mockPrisma.profile.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch and cache profile if not in cache', async () => {
      const profile = mockProfiles[0];
      mockCacheService.get.mockResolvedValue(null);
      mockPrisma.profile.findUnique.mockResolvedValue(profile);

      const result = await profileService.getProfileById(profileId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(profile);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining(profileId),
        profile,
        expect.any(Object)
      );
    });

    it('should handle not found errors', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);

      const result = await profileService.getProfileById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('updateProfile', () => {
    const profileId = mockProfiles[0].id;
    const updateData = {
      headline: 'Updated Headline',
      bio: 'Updated Bio'
    };

    it('should update profile successfully', async () => {
      const updatedProfile = { ...mockProfiles[0], ...updateData };
      mockPrisma.profile.update.mockResolvedValue(updatedProfile);

      const result = await profileService.updateProfile(profileId, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedProfile);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining(profileId),
        updatedProfile,
        expect.any(Object)
      );
    });

    it('should handle validation errors during update', async () => {
      const invalidData = { headline: '' };
      
      const result = await profileService.updateProfile(profileId, invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.profile.update).not.toHaveBeenCalled();
    });

    it('should handle not found errors during update', async () => {
      mockPrisma.profile.update.mockRejectedValue(new Error('Record not found'));

      await expect(profileService.updateProfile('non-existent-id', updateData))
        .rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('deleteProfile', () => {
    const profileId = mockProfiles[0].id;

    it('should delete profile and clear cache successfully', async () => {
      mockPrisma.profile.delete.mockResolvedValue(mockProfiles[0]);

      const result = await profileService.deleteProfile(profileId);

      expect(result.success).toBe(true);
      expect(mockCacheService.delete).toHaveBeenCalledWith(
        expect.stringContaining(profileId)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Profile deleted successfully',
        expect.any(Object)
      );
    });

    it('should handle not found errors during deletion', async () => {
      mockPrisma.profile.delete.mockRejectedValue(new Error('Record not found'));

      await expect(profileService.deleteProfile('non-existent-id'))
        .rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle cascade deletion of related experiences', async () => {
      await profileService.deleteProfile(profileId);

      expect(mockPrisma.experience.deleteMany).toHaveBeenCalledWith({
        where: { profileId }
      });
    });
  });

  describe('getProfiles', () => {
    const defaultParams = {
      page: 1,
      pageSize: 12,
      filters: {}
    };

    it('should return paginated profiles with correct metadata', async () => {
      const result = await profileService.getProfiles(
        defaultParams.page,
        defaultParams.pageSize,
        defaultParams.filters
      );

      expect(result.success).toBe(true);
      expect(result.data.data).toEqual(mockProfiles);
      expect(result.data.page).toBe(defaultParams.page);
      expect(result.data.pageSize).toBe(defaultParams.pageSize);
      expect(result.data.total).toBe(mockProfiles.length);
    });

    it('should handle search filters correctly', async () => {
      const filters = { searchTerm: 'engineer' };
      await profileService.getProfiles(1, 12, filters);

      expect(mockPrisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { headline: { contains: filters.searchTerm, mode: 'insensitive' } },
              { bio: { contains: filters.searchTerm, mode: 'insensitive' } }
            ])
          })
        })
      );
    });

    it('should cache paginated results', async () => {
      const result = await profileService.getProfiles(1, 12);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('list:1:12'),
        result.data,
        expect.any(Object)
      );
    });
  });
});