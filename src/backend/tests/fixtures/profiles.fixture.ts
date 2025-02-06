import { faker } from '@faker-js/faker'; // ^8.0.0
import { Profile } from '../../src/types/profile.types';
import { Experience } from '../../src/types/experience.types';

/**
 * Creates a mock experience entry with realistic professional data
 * @param profileId - The ID of the profile this experience belongs to
 * @returns A mock Experience object
 */
export const createMockExperience = (profileId: string): Experience => {
  // Generate dates ensuring logical progression
  const startDate = faker.date.past({ years: 10 });
  const hasEndDate = faker.datatype.boolean({ probability: 0.8 });
  const endDate = hasEndDate ? faker.date.between({ from: startDate, to: new Date() }) : null;

  return {
    id: faker.string.uuid(),
    profileId,
    title: faker.person.jobTitle(),
    company: faker.company.name(),
    startDate,
    endDate,
    description: faker.lorem.paragraphs({ min: 2, max: 4 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent()
  };
};

/**
 * Creates a mock profile with comprehensive professional details
 * @param userId - The ID of the user who owns this profile
 * @returns A mock Profile object
 */
export const createMockProfile = (userId: string): Profile => {
  // Generate professional headline combining role and industry
  const role = faker.person.jobTitle();
  const industry = faker.company.buzzNoun();
  const headline = `${role} | ${industry} Professional`;

  // Generate 1-4 experiences with logical date progression
  const numExperiences = faker.number.int({ min: 1, max: 4 });
  const experiences = Array.from({ length: numExperiences }, () => 
    createMockExperience(faker.string.uuid())
  ).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  return {
    id: faker.string.uuid(),
    userId,
    headline,
    bio: faker.lorem.paragraphs({ min: 2, max: 4 }),
    avatarUrl: faker.image.avatar(),
    socialLinks: {
      linkedin: `https://linkedin.com/in/${faker.internet.userName()}`,
      github: `https://github.com/${faker.internet.userName()}`,
      website: faker.internet.url()
    },
    experiences,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent()
  };
};

/**
 * Array of 10 diverse mock profiles for testing
 * Each profile has realistic professional data and multiple experiences
 */
const mockProfiles: Profile[] = Array.from(
  { length: 10 },
  () => createMockProfile(faker.string.uuid())
);

export default mockProfiles;