import type { Config } from '@jest/types';

/**
 * Jest configuration for LinkedIn Profiles Gallery frontend testing
 * @version jest@29.5.0
 * @version ts-jest@29.1.0
 * @version @testing-library/jest-dom@5.16.5
 */
const config: Config.InitialOptions = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Use jsdom environment for DOM testing
  testEnvironment: 'jsdom',

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Module name mapping for path aliases and CSS modules
  moduleNameMapper: {
    // Map root alias to app directory
    '^~/(.*)$': '<rootDir>/app/$1',
    // Mock CSS modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // TypeScript file transformation
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },

  // Test file patterns
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Files to collect coverage from
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    // Exclude entry points and route files
    '!app/entry.client.tsx',
    '!app/entry.server.tsx',
    '!app/root.tsx',
    '!app/routes/**/*.tsx',
    // Exclude type declaration files
    '!**/*.d.ts',
    // Exclude node_modules
    '!**/node_modules/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Paths to ignore during testing
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/public/build/',
  ],

  // Paths to ignore during watch mode
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/public/build/',
  ],

  // Verbose output for detailed test results
  verbose: true,

  // Clear mock calls between every test
  clearMocks: true,

  // Automatically clear mock calls and instances between every test
  resetMocks: true,

  // Automatically restore mock state between every test
  restoreMocks: true,

  // Maximum number of concurrent workers
  maxWorkers: '50%',

  // Detect open handles (timeouts, intervals) preventing Jest from exiting
  detectOpenHandles: true,

  // Force coverage collection from ignored files using a array of glob patterns
  forceCoverageMatch: [],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
};

export default config;