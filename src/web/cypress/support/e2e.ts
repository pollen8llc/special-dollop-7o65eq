/// <reference types="cypress" />

// Import custom commands for authentication, profile management and UI verification
import './commands';

// cypress v12.0.0

/**
 * Global Cypress configuration and setup for end-to-end testing
 * Configures test environment, network behavior, and global hooks
 */

declare global {
  namespace Cypress {
    interface Chainable {
      // Commands are defined in commands.ts
    }
  }
}

// Global beforeEach hook to set up test environment
beforeEach(() => {
  // Reset authentication and storage state
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });

  // Configure viewport for consistent testing
  cy.viewport(1280, 720);

  // Configure network request interception
  cy.intercept('/api/**', (req) => {
    // Add auth headers if they exist
    const authToken = localStorage.getItem('__session');
    if (authToken) {
      req.headers['Authorization'] = `Bearer ${authToken}`;
    }
  }).as('apiRequests');

  // Configure Clerk auth interception
  cy.intercept('POST', '**/clerk.dev/**', (req) => {
    req.headers['x-cypress-test'] = 'true';
  }).as('clerkAuth');

  // Configure LinkedIn OAuth interception
  cy.intercept('POST', '**/linkedin.com/oauth/**', (req) => {
    req.headers['x-cypress-test'] = 'true';
  }).as('linkedinOAuth');
});

// Configure Cypress globally
Cypress.config({
  // Viewport configuration for consistent testing
  viewportWidth: 1280,
  viewportHeight: 720,

  // Request/Response timeouts
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 30000,

  // Animation configuration
  animationDistanceThreshold: 5,

  // Development configuration
  watchForFileChanges: true,

  // Security configuration
  chromeWebSecurity: false,

  // Test artifacts configuration
  video: false,
  screenshotOnRunFailure: true,

  retries: {
    runMode: 2,
    openMode: 0
  }
});

// Configure global error handling
Cypress.on('uncaught:exception', (err) => {
  // Prevent test failure on uncaught exceptions from third-party scripts
  if (err.message.includes('ResizeObserver') || 
      err.message.includes('React hydration') ||
      err.message.includes('clerk.browser')) {
    return false;
  }
});

// Configure global response handling
Cypress.on('window:before:load', (win) => {
  // Stub animation functions for consistent testing
  win.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    return setTimeout(cb, 0);
  };
  
  // Configure intersection observer mock
  const observerCallback = () => {};
  win.IntersectionObserver = class IntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      this.observe = () => {};
      this.unobserve = () => {};
      this.disconnect = () => {};
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Configure global console error handling
Cypress.on('window:console', (msg) => {
  // Log console errors for debugging
  if (msg.type === 'error') {
    cy.log(`Console Error: ${msg.message}`);
  }
});

// Configure global network error handling
Cypress.on('fail', (error, runnable) => {
  // Handle common network errors
  if (error.message.includes('fetch failed') ||
      error.message.includes('network error')) {
    cy.log('Network Error Detected');
    error.message = `Network Error: ${error.message}`;
  }
  throw error;
});