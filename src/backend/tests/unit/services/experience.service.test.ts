/**
 * @fileoverview Unit tests for experience service layer
 * @version 1.0.0
 */

import { jest } from '@jest/globals';
import { Redis } from 'ioredis'; // ^5.3.0
import { 
  createExperience,
  getExperienceById,
  getProfileExperiences,
  updateExperience,
  deleteExperience
} from '../../../src/services/experience.service';
import {
  mockExperience,
  mockExperienceDto,
  createMockExperience,
  createMockExperienceDto,
  mockInvalidExperienceDto,
  MOCK_PROFILE_ID,
  MOCK_EXPERIENCE_ID
} from '../../fixtures/experiences.fixture';
import prisma from '../../../src/utils/prisma';
import { getRedisClient } from '../../../src/utils/redis';

// Mock Prisma and Redis clients
jest.mock('../../../src/utils/prisma', () => ({
  experience: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  $transaction: jest.fn((callback) => callback(prisma))
}));

jest.mock('../../../src/utils/redis');

let mockPrisma: jest.Mocked<typeof prisma>;
let mockRedis: jest.Mocked<Redis>;

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma = prisma as jest.Mocked<typeof prisma>;
  mockRedis = new Redis() as jest.Mocked<Redis>;
  (getRedisClient as jest.Mock).mockResolvedValue(mockRedis);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('createExperience', () => {
  it('should create a new experience successfully', async () => {
    mockPrisma.experience.create.mockResolvedValue(mockExperience);
    mockRedis.del.mockResolvedValue(1);

    const result = await createExperience(mockExperienceDto, MOCK_PROFILE_ID);

    expect(result).toEqual(mockExperience);
    expect(mockPrisma.experience.create).toHaveBeenCalledWith({
      data: {
        ...mockExperienceDto,
        profileId: MOCK_PROFILE_ID
      }
    });
    expect(mockRedis.del).toHaveBeenCalled();
  });

  it('should throw error for invalid experience data', async () => {
    await expect(
      createExperience(mockInvalidExperienceDto, MOCK_PROFILE_ID)
    ).rejects.toThrow('Missing required experience fields');
  });

  it('should handle database errors gracefully', async () => {
    mockPrisma.experience.create.mockRejectedValue(new Error('Database error'));

    await expect(
      createExperience(mockExperienceDto, MOCK_PROFILE_ID)
    ).rejects.toThrow('Database error');
  });
});

describe('getExperienceById', () => {
  it('should return experience from cache if available', async () => {
    const cachedExperience = JSON.stringify(mockExperience);
    mockRedis.get.mockResolvedValue(cachedExperience);

    const result = await getExperienceById(MOCK_EXPERIENCE_ID);

    expect(result).toEqual(mockExperience);
    expect(mockRedis.get).toHaveBeenCalledWith(expect.stringContaining(MOCK_EXPERIENCE_ID));
    expect(mockPrisma.experience.findUnique).not.toHaveBeenCalled();
  });

  it('should fetch from database and cache if not in cache', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.experience.findUnique.mockResolvedValue(mockExperience);
    mockRedis.setex.mockResolvedValue('OK');

    const result = await getExperienceById(MOCK_EXPERIENCE_ID);

    expect(result).toEqual(mockExperience);
    expect(mockPrisma.experience.findUnique).toHaveBeenCalledWith({
      where: { id: MOCK_EXPERIENCE_ID },
      include: {
        profile: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });
    expect(mockRedis.setex).toHaveBeenCalled();
  });

  it('should return null for non-existent experience', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.experience.findUnique.mockResolvedValue(null);

    const result = await getExperienceById('non-existent-id');

    expect(result).toBeNull();
  });
});

describe('getProfileExperiences', () => {
  const pagination = { page: 1, pageSize: 10, sortBy: 'startDate', sortOrder: 'desc' as const };

  it('should return paginated experiences with cache hit', async () => {
    const cachedResult = {
      experiences: [mockExperience],
      total: 1
    };
    mockRedis.get.mockResolvedValue(JSON.stringify(cachedResult));

    const result = await getProfileExperiences(MOCK_PROFILE_ID, pagination);

    expect(result).toEqual(cachedResult);
    expect(mockRedis.get).toHaveBeenCalled();
    expect(mockPrisma.experience.findMany).not.toHaveBeenCalled();
  });

  it('should fetch from database on cache miss', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.experience.findMany.mockResolvedValue([mockExperience]);
    mockPrisma.experience.count.mockResolvedValue(1);
    mockRedis.setex.mockResolvedValue('OK');

    const result = await getProfileExperiences(MOCK_PROFILE_ID, pagination);

    expect(result).toEqual({
      experiences: [mockExperience],
      total: 1
    });
    expect(mockPrisma.experience.findMany).toHaveBeenCalled();
    expect(mockRedis.setex).toHaveBeenCalled();
  });

  it('should handle empty results correctly', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.experience.findMany.mockResolvedValue([]);
    mockPrisma.experience.count.mockResolvedValue(0);

    const result = await getProfileExperiences(MOCK_PROFILE_ID, pagination);

    expect(result).toEqual({
      experiences: [],
      total: 0
    });
  });
});

describe('updateExperience', () => {
  const updateDto = { title: 'Updated Title' };

  it('should update experience successfully', async () => {
    const updatedExperience = { ...mockExperience, ...updateDto };
    mockPrisma.experience.update.mockResolvedValue(updatedExperience);
    mockRedis.del.mockResolvedValue(1);

    const result = await updateExperience(MOCK_EXPERIENCE_ID, updateDto);

    expect(result).toEqual(updatedExperience);
    expect(mockPrisma.experience.update).toHaveBeenCalledWith({
      where: { id: MOCK_EXPERIENCE_ID },
      data: updateDto,
      include: {
        profile: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });
    expect(mockRedis.del).toHaveBeenCalled();
  });

  it('should throw error for empty update data', async () => {
    await expect(
      updateExperience(MOCK_EXPERIENCE_ID, {})
    ).rejects.toThrow('No update data provided');
  });

  it('should handle non-existent experience', async () => {
    mockPrisma.experience.update.mockRejectedValue(new Error('Record not found'));

    await expect(
      updateExperience('non-existent-id', updateDto)
    ).rejects.toThrow('Record not found');
  });
});

describe('deleteExperience', () => {
  it('should delete experience successfully', async () => {
    mockPrisma.experience.findUnique.mockResolvedValue(mockExperience);
    mockPrisma.experience.delete.mockResolvedValue(mockExperience);
    mockRedis.del.mockResolvedValue(1);

    await deleteExperience(MOCK_EXPERIENCE_ID);

    expect(mockPrisma.experience.delete).toHaveBeenCalledWith({
      where: { id: MOCK_EXPERIENCE_ID }
    });
    expect(mockRedis.del).toHaveBeenCalled();
  });

  it('should throw error for non-existent experience', async () => {
    mockPrisma.experience.findUnique.mockResolvedValue(null);

    await expect(
      deleteExperience('non-existent-id')
    ).rejects.toThrow('Experience not found');
  });

  it('should handle database errors gracefully', async () => {
    mockPrisma.experience.findUnique.mockResolvedValue(mockExperience);
    mockPrisma.experience.delete.mockRejectedValue(new Error('Database error'));

    await expect(
      deleteExperience(MOCK_EXPERIENCE_ID)
    ).rejects.toThrow('Database error');
  });
});