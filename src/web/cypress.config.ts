import { defineConfig } from 'cypress'; // ^12.0.0
import { setupNodeEvents } from './cypress/support/e2e';

export default defineConfig({
  // End-to-end testing configuration
  e2e: {
    // Base URL for the application under test
    baseUrl: 'http://localhost:3000',

    // Support file containing global configuration and custom commands
    supportFile: 'cypress/support/e2e.ts',

    // Pattern for test files
    specPattern: 'cypress/e2e/**/*.cy.ts',

    // Viewport configuration for consistent testing
    viewportWidth: 1280,
    viewportHeight: 720,

    // Timeouts for various operations
    defaultCommandTimeout: 10000, // Default timeout for most commands
    requestTimeout: 10000, // Timeout for network requests
    responseTimeout: 30000, // Timeout for network responses
    pageLoadTimeout: 30000, // Timeout for page loads

    // Animation configuration
    animationDistanceThreshold: 5, // Threshold for animation-based waiting

    // Development configuration
    watchForFileChanges: true, // Auto-reload on file changes

    // Security configuration
    chromeWebSecurity: false, // Disable web security for testing OAuth flows

    // Test artifacts configuration
    video: false, // Disable video recording for better performance
    screenshotOnRunFailure: true, // Capture screenshots on test failures

    // Retry configuration
    retries: {
      runMode: 2, // Retry failed tests twice in CI
      openMode: 0 // No retries in interactive mode
    },

    // Environment variables
    env: {
      apiUrl: 'http://localhost:3001',
      coverage: false
    },

    // Node event setup from support file
    setupNodeEvents
  },

  // Component testing configuration
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    supportFile: false
  }
});