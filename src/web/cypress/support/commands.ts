/// <reference types="cypress" />
import { AuthUser, AuthSession } from '../../app/types/auth.types';
import { Profile, ProfileFormData } from '../../app/types/profile.types';

// cypress v12.0.0

/**
 * Type definitions to extend Cypress commands
 */
declare global {
  namespace Cypress {
    interface Chainable {
      login(options: {
        email?: string;
        password?: string;
        provider?: 'linkedin';
        oauthToken?: string;
      }): Chainable<void>;
      createProfile(
        data: ProfileFormData & { image?: string; socialLinks?: Record<string, string> }
      ): Chainable<void>;
      visitGallery(options?: {
        filter?: string;
        sort?: string;
        page?: number;
        perPage?: number;
      }): Chainable<void>;
      checkProfileCard(
        profile: Profile & { selector?: string; checkAnimations?: boolean }
      ): Chainable<void>;
    }
  }
}

/**
 * Custom command to handle user authentication
 * Supports both email/password and OAuth flows
 */
Cypress.Commands.add('login', (options) => {
  const { email, password, provider, oauthToken } = options;

  if (provider === 'linkedin' && oauthToken) {
    // Handle LinkedIn OAuth flow
    cy.intercept('POST', '/api/auth/oauth/linkedin').as('oauthLogin');
    cy.visit('/login');
    cy.get('[data-cy="linkedin-login"]').click();
    cy.window().then((win) => {
      win.postMessage({ type: 'OAUTH_TOKEN', token: oauthToken }, '*');
    });
    cy.wait('@oauthLogin');
  } else if (email && password) {
    // Handle email/password flow
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type(email);
    cy.get('[data-cy="password-input"]').type(password);
    cy.get('[data-cy="login-submit"]').click();
  }

  // Verify successful authentication
  cy.url().should('not.include', '/login');
  cy.getCookie('__session').should('exist');
});

/**
 * Custom command to create and verify a new user profile
 * Handles form submission and image upload
 */
Cypress.Commands.add('createProfile', (data) => {
  cy.visit('/profile/create');
  
  // Fill in profile form
  cy.get('[data-cy="headline-input"]').type(data.headline);
  if (data.bio) {
    cy.get('[data-cy="bio-input"]').type(data.bio);
  }

  // Handle image upload if provided
  if (data.image) {
    cy.get('[data-cy="avatar-upload"]').attachFile(data.image);
    cy.get('[data-cy="avatar-preview"]').should('be.visible');
  }

  // Add social links if provided
  if (data.socialLinks) {
    Object.entries(data.socialLinks).forEach(([platform, url]) => {
      cy.get(`[data-cy="social-${platform}-input"]`).type(url);
    });
  }

  // Submit form and verify
  cy.get('[data-cy="profile-submit"]').click();
  cy.url().should('include', '/profile/');
  cy.get('[data-cy="profile-header"]').should('contain', data.headline);
});

/**
 * Custom command to visit and interact with the profile gallery
 * Supports filtering, sorting, and pagination
 */
Cypress.Commands.add('visitGallery', (options = {}) => {
  const { filter, sort, page, perPage } = options;
  let url = '/gallery';
  const params = new URLSearchParams();

  if (filter) params.set('filter', filter);
  if (sort) params.set('sort', sort);
  if (page) params.set('page', String(page));
  if (perPage) params.set('perPage', String(perPage));

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  cy.visit(url);
  cy.get('[data-cy="profile-grid"]').should('be.visible');
  
  // Verify infinite scroll container
  cy.get('[data-cy="infinite-scroll-container"]').should('exist');

  // Wait for initial profiles to load
  cy.get('[data-cy="profile-card"]').should('have.length.at.least', 1);
});

/**
 * Custom command to verify profile card elements and interactions
 * Includes animation and responsive design checks
 */
Cypress.Commands.add('checkProfileCard', (profile) => {
  const selector = profile.selector || `[data-cy="profile-card-${profile.id}"]`;
  
  // Check basic profile card elements
  cy.get(selector).within(() => {
    cy.get('[data-cy="profile-avatar"]')
      .should('have.attr', 'src')
      .and('include', profile.avatarUrl || 'default-avatar');
    
    cy.get('[data-cy="profile-headline"]')
      .should('contain', profile.headline);

    if (profile.bio) {
      cy.get('[data-cy="profile-bio"]').should('contain', profile.bio);
    }

    // Check social links
    Object.entries(profile.socialLinks).forEach(([platform, url]) => {
      if (url) {
        cy.get(`[data-cy="social-${platform}-link"]`)
          .should('have.attr', 'href', url);
      }
    });
  });

  // Test animations if enabled
  if (profile.checkAnimations) {
    cy.get(selector)
      .trigger('mouseenter')
      .should('have.css', 'transform')
      .and('not.equal', 'none');

    cy.get(selector)
      .trigger('mouseleave')
      .should('have.css', 'transform', 'none');
  }

  // Test responsive behavior
  const breakpoints = [
    { width: 375, height: 667 }, // Mobile
    { width: 768, height: 1024 }, // Tablet
    { width: 1440, height: 900 } // Desktop
  ];

  breakpoints.forEach(({ width, height }) => {
    cy.viewport(width, height);
    cy.get(selector).should('be.visible');
  });
});