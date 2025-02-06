/**
 * @fileoverview Test fixtures for user entities providing mock user data for unit and integration tests
 * @version 1.0.0
 * @package @faker-js/faker@^8.0.0
 */

import { faker } from '@faker-js/faker';
import { User, UserMetadata, ThemePreference } from '../../src/types/user.types';
import { UserRole } from '../../src/types/auth.types';

/**
 * Creates a single mock user with randomized but realistic data for testing
 * @param overrides - Optional partial User object to override default generated values
 * @returns Complete mock user object with all required fields
 */
export const createMockUser = (overrides: Partial<User> = {}): User => {
  const now = new Date();
  const defaultUser: User = {
    id: faker.string.uuid(),
    email: faker.internet.email().toLowerCase(),
    name: faker.person.fullName(),
    metadata: {
      lastLoginAt: faker.date.recent(),
      roles: [UserRole.USER],
      preferences: {
        theme: ThemePreference.SYSTEM,
        emailNotifications: true
      }
    },
    createdAt: faker.date.past(),
    updatedAt: now,
    ...overrides
  };

  return defaultUser;
};

/**
 * Generates an array of mock users with unique data for bulk testing scenarios
 * @param count - Number of mock users to generate
 * @returns Array of unique mock user objects
 */
export const createMockUsers = (count: number): User[] => {
  return Array.from({ length: count }, () => createMockUser());
};

/**
 * Pre-generated mock users with different roles for common test cases
 */
export const mockUsers = {
  regularUser: createMockUser({
    id: 'test-user-1',
    email: 'user@example.com',
    name: 'Test User',
    metadata: {
      lastLoginAt: new Date('2023-01-01T00:00:00Z'),
      roles: [UserRole.USER],
      preferences: {
        theme: ThemePreference.LIGHT,
        emailNotifications: true
      }
    },
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  }),

  adminUser: createMockUser({
    id: 'test-admin-1',
    email: 'admin@example.com',
    name: 'Test Admin',
    metadata: {
      lastLoginAt: new Date('2023-01-01T00:00:00Z'),
      roles: [UserRole.ADMIN],
      preferences: {
        theme: ThemePreference.DARK,
        emailNotifications: true
      }
    },
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  }),

  moderatorUser: createMockUser({
    id: 'test-moderator-1',
    email: 'moderator@example.com',
    name: 'Test Moderator',
    metadata: {
      lastLoginAt: new Date('2023-01-01T00:00:00Z'),
      roles: [UserRole.MODERATOR],
      preferences: {
        theme: ThemePreference.SYSTEM,
        emailNotifications: false
      }
    },
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  }),

  userWithoutName: createMockUser({
    id: 'test-user-2',
    email: 'noname@example.com',
    name: null,
    metadata: {
      lastLoginAt: null,
      roles: [UserRole.USER],
      preferences: {
        theme: ThemePreference.LIGHT,
        emailNotifications: false
      }
    },
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  })
};

/**
 * Common test scenarios requiring multiple users
 */
export const mockUserScenarios = {
  multipleUsers: createMockUsers(3),
  usersWithDifferentRoles: [
    mockUsers.regularUser,
    mockUsers.adminUser,
    mockUsers.moderatorUser
  ],
  usersWithSameRole: createMockUsers(3).map(user => ({
    ...user,
    metadata: { ...user.metadata, roles: [UserRole.USER] }
  }))
};