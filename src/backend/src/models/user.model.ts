/**
 * @fileoverview Core user model implementation for LinkedIn Profiles Gallery
 * Provides database operations and business logic for user management
 * @version 1.0.0
 */

import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { 
  User, 
  CreateUserDto, 
  UpdateUserDto, 
  UserWithProfileId,
  ThemePreference,
  UserMetadata 
} from '../types/user.types';
import { UserRole } from '../types/auth.types';
import { 
  createValidationError, 
  createNotFoundError,
  createBadRequestError 
} from '../utils/errors';
import { ValidationError } from '../types/api.types';

/**
 * Creates a new user with validation and security measures
 * @param userData - User creation data transfer object
 * @returns Newly created user object
 */
export async function createUser(userData: CreateUserDto): Promise<User> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    throw createValidationError('Invalid email format', [{
      field: 'email',
      message: 'Invalid email format',
      value: userData.email,
      constraint: 'format'
    }]);
  }

  // Check for existing user with same email
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email }
  });

  if (existingUser) {
    throw createBadRequestError('User with this email already exists');
  }

  // Initialize default user metadata
  const defaultMetadata: UserMetadata = {
    lastLoginAt: null,
    roles: [UserRole.USER],
    preferences: {
      theme: ThemePreference.SYSTEM,
      emailNotifications: true
    }
  };

  try {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        metadata: {
          ...defaultMetadata,
          ...userData.metadata
        }
      }
    });

    logger.info('User created successfully', { userId: user.id });
    return user;
  } catch (error) {
    logger.error('Error creating user', { error, email: userData.email });
    throw error;
  }
}

/**
 * Retrieves a user by their unique identifier
 * @param userId - User's unique identifier
 * @returns User object if found, null otherwise
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      logger.info('User not found', { userId });
      return null;
    }

    return user;
  } catch (error) {
    logger.error('Error retrieving user', { error, userId });
    throw error;
  }
}

/**
 * Retrieves a user by their email address
 * @param email - User's email address
 * @returns User object if found, null otherwise
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    return user;
  } catch (error) {
    logger.error('Error retrieving user by email', { error, email });
    throw error;
  }
}

/**
 * Updates an existing user's information
 * @param userId - User's unique identifier
 * @param updateData - User update data transfer object
 * @returns Updated user object
 */
export async function updateUser(userId: string, updateData: UpdateUserDto): Promise<User> {
  // Validate user existence
  const existingUser = await getUserById(userId);
  if (!existingUser) {
    throw createNotFoundError('User not found');
  }

  // Validate update data
  const validationErrors: ValidationError[] = [];
  if (updateData.name !== undefined && updateData.name !== null && updateData.name.length < 2) {
    validationErrors.push({
      field: 'name',
      message: 'Name must be at least 2 characters long',
      value: updateData.name,
      constraint: 'minLength'
    });
  }

  if (validationErrors.length > 0) {
    throw createValidationError('Invalid update data', validationErrors);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: updateData.name,
        metadata: updateData.metadata ? {
          ...existingUser.metadata,
          ...updateData.metadata
        } : undefined
      }
    });

    logger.info('User updated successfully', { userId });
    return updatedUser;
  } catch (error) {
    logger.error('Error updating user', { error, userId });
    throw error;
  }
}

/**
 * Retrieves a user with their associated profile ID
 * @param userId - User's unique identifier
 * @returns User object with profile ID if exists
 */
export async function getUserWithProfile(userId: string): Promise<UserWithProfileId> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          select: { id: true }
        }
      }
    });

    if (!user) {
      throw createNotFoundError('User not found');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        metadata: user.metadata as UserMetadata,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      profileId: user.profile?.id || null
    };
  } catch (error) {
    logger.error('Error retrieving user with profile', { error, userId });
    throw error;
  }
}

/**
 * Updates user's last login timestamp
 * @param userId - User's unique identifier
 * @returns Updated user object
 */
export async function updateLastLogin(userId: string): Promise<User> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          lastLoginAt: new Date()
        }
      }
    });

    logger.info('User last login updated', { userId });
    return user;
  } catch (error) {
    logger.error('Error updating user last login', { error, userId });
    throw error;
  }
}