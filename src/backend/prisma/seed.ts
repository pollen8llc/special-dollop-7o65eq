/**
 * @fileoverview Database seeding script for LinkedIn Profiles Gallery
 * Implements enterprise-grade seeding with validation, error handling, and logging
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client'; // ^4.0.0
import { z } from 'zod'; // ^3.20.0
import prisma from '../src/utils/prisma';
import logger from '../utils/logger';

// Constants for seeding configuration
const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

// Sample data validation schemas
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  metadata: z.record(z.unknown())
});

const ProfileSchema = z.object({
  headline: z.string().min(5).max(200),
  bio: z.string().min(10).max(1000),
  avatarUrl: z.string().url(),
  socialLinks: z.record(z.string().url())
});

const ExperienceSchema = z.object({
  title: z.string().min(2).max(100),
  company: z.string().min(2).max(100),
  startDate: z.date(),
  endDate: z.date().nullable(),
  description: z.string().min(10).max(2000)
});

// Sample seed data
const SAMPLE_USERS = [
  {
    email: 'john.doe@example.com',
    name: 'John Doe',
    metadata: { location: 'San Francisco, CA' }
  },
  {
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    metadata: { location: 'New York, NY' }
  }
];

const SAMPLE_PROFILES = [
  {
    headline: 'Senior Software Engineer',
    bio: 'Passionate about building scalable web applications',
    avatarUrl: 'https://example.com/avatars/john.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe'
    }
  },
  {
    headline: 'Product Designer',
    bio: 'Creating user-centered digital experiences',
    avatarUrl: 'https://example.com/avatars/jane.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/janesmith',
      dribbble: 'https://dribbble.com/janesmith'
    }
  }
];

const SAMPLE_EXPERIENCES = [
  {
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    startDate: new Date('2020-01-01'),
    endDate: null,
    description: 'Leading development of cloud-native applications'
  },
  {
    title: 'Software Engineer',
    company: 'Startup Inc',
    startDate: new Date('2018-01-01'),
    endDate: new Date('2019-12-31'),
    description: 'Developed full-stack web applications using React and Node.js'
  }
];

/**
 * Validates seed data against schema requirements
 */
async function validateSeedData<T>(data: T[], schema: z.ZodSchema): Promise<boolean> {
  try {
    for (const item of data) {
      await schema.parseAsync(item);
    }
    return true;
  } catch (error) {
    logger.error('Seed data validation failed', { error });
    return false;
  }
}

/**
 * Seeds users table with retry mechanism and batch processing
 */
async function seedUsers(): Promise<void> {
  logger.info('Starting user seeding');
  
  if (!(await validateSeedData(SAMPLE_USERS, UserSchema))) {
    throw new Error('User seed data validation failed');
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Soft delete existing users
      await tx.user.updateMany({
        where: { deletedAt: null },
        data: { deletedAt: new Date() }
      });

      // Process users in batches
      for (let i = 0; i < SAMPLE_USERS.length; i += BATCH_SIZE) {
        const batch = SAMPLE_USERS.slice(i, i + BATCH_SIZE);
        let retries = 0;

        while (retries < MAX_RETRIES) {
          try {
            await tx.user.createMany({
              data: batch.map(user => ({
                ...user,
                createdAt: new Date(),
                updatedAt: new Date()
              }))
            });
            break;
          } catch (error) {
            retries++;
            logger.error(`User batch creation failed (attempt ${retries})`, { error });
            if (retries === MAX_RETRIES) throw error;
          }
        }
      }
    });

    logger.info('User seeding completed successfully');
  } catch (error) {
    logger.error('User seeding failed', { error });
    throw error;
  }
}

/**
 * Seeds profiles table with referential integrity
 */
async function seedProfiles(): Promise<void> {
  logger.info('Starting profile seeding');

  if (!(await validateSeedData(SAMPLE_PROFILES, ProfileSchema))) {
    throw new Error('Profile seed data validation failed');
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Soft delete existing profiles
      await tx.profile.updateMany({
        where: { deletedAt: null },
        data: { deletedAt: new Date() }
      });

      // Get users for association
      const users = await tx.user.findMany({
        where: { deletedAt: null },
        take: SAMPLE_PROFILES.length
      });

      // Create profiles with user associations
      for (let i = 0; i < SAMPLE_PROFILES.length; i++) {
        if (users[i]) {
          await tx.profile.create({
            data: {
              ...SAMPLE_PROFILES[i],
              userId: users[i].id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }
    });

    logger.info('Profile seeding completed successfully');
  } catch (error) {
    logger.error('Profile seeding failed', { error });
    throw error;
  }
}

/**
 * Seeds experiences table with proper error handling
 */
async function seedExperiences(): Promise<void> {
  logger.info('Starting experience seeding');

  if (!(await validateSeedData(SAMPLE_EXPERIENCES, ExperienceSchema))) {
    throw new Error('Experience seed data validation failed');
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Soft delete existing experiences
      await tx.experience.updateMany({
        where: { deletedAt: null },
        data: { deletedAt: new Date() }
      });

      // Get profiles for association
      const profiles = await tx.profile.findMany({
        where: { deletedAt: null }
      });

      // Create experiences with profile associations
      for (const profile of profiles) {
        for (const experience of SAMPLE_EXPERIENCES) {
          await tx.experience.create({
            data: {
              ...experience,
              profileId: profile.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }
    });

    logger.info('Experience seeding completed successfully');
  } catch (error) {
    logger.error('Experience seeding failed', { error });
    throw error;
  }
}

/**
 * Main seeding function with comprehensive error handling
 */
export async function main(): Promise<void> {
  const startTime = Date.now();
  logger.info('Starting database seeding');

  try {
    await seedUsers();
    await seedProfiles();
    await seedExperiences();

    const duration = Date.now() - startTime;
    logger.info('Database seeding completed successfully', { duration });
  } catch (error) {
    logger.error('Database seeding failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute seeding if run directly
if (require.main === module) {
  main()
    .catch((error) => {
      logger.error('Seeding script failed', { error });
      process.exit(1);
    });
}