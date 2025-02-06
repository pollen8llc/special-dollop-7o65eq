import { Profile } from '../../app/types/profile.types';
import { Experience } from '../../app/types/experience.types';
import { ErrorResponse, LoadingState } from '../../app/types/common.types';
import 'cypress-real-events';

// Animation timing constants
const ANIMATION_DURATION = 300;
const HOVER_ANIMATION_DURATION = 200;

// Viewport configurations for responsive testing
const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 }
};

describe('Profile Tests', () => {
  beforeEach(() => {
    // Load test fixtures
    cy.fixture('profiles.json').as('profileData');
    cy.fixture('animations.json').as('animationConfig');

    // API route interceptions
    cy.intercept('GET', '/api/profiles/*', { fixture: 'profiles.json' }).as('getProfile');
    cy.intercept('PUT', '/api/profiles/*', { fixture: 'profiles.json' }).as('updateProfile');
    cy.intercept('GET', '/api/profiles/*/experiences', { fixture: 'experiences.json' }).as('getExperiences');

    // Authentication setup
    cy.login(); // Custom command for authentication

    // Clear application state
    cy.clearLocalStorage();
    cy.clearCookies();

    // Set default viewport
    cy.viewport(viewports.desktop.width, viewports.desktop.height);
  });

  describe('Profile View', () => {
    it('should load profile data correctly', () => {
      cy.visit('/profiles/123');
      cy.wait('@getProfile');
      
      cy.get('[data-testid="profile-header"]').should('be.visible');
      cy.get('[data-testid="profile-headline"]').should('not.be.empty');
      cy.get('[data-testid="profile-bio"]').should('exist');
      cy.get('[data-testid="loading-state"]').should('not.exist');
    });

    it('should handle profile animations', () => {
      cy.visit('/profiles');
      cy.wait('@getProfile');

      cy.get('[data-testid="profile-card"]').first()
        .realHover()
        .should('have.css', 'transform')
        .and('include', 'scale(1.05)');

      // Verify animation timing
      cy.get('[data-testid="profile-card"]').first()
        .should('have.css', 'transition-duration')
        .and('eq', `${HOVER_ANIMATION_DURATION}ms`);
    });

    it('should be responsive across viewports', () => {
      Object.entries(viewports).forEach(([device, dimensions]) => {
        cy.viewport(dimensions.width, dimensions.height);
        cy.visit('/profiles');
        cy.wait('@getProfile');

        // Verify responsive layout
        if (device === 'mobile') {
          cy.get('[data-testid="profile-grid"]')
            .should('have.css', 'grid-template-columns')
            .and('match', /repeat\(1, 1fr\)/);
        } else if (device === 'tablet') {
          cy.get('[data-testid="profile-grid"]')
            .should('have.css', 'grid-template-columns')
            .and('match', /repeat\(2, 1fr\)/);
        } else {
          cy.get('[data-testid="profile-grid"]')
            .should('have.css', 'grid-template-columns')
            .and('match', /repeat\(3, 1fr\)/);
        }
      });
    });

    it('should meet accessibility requirements', () => {
      cy.visit('/profiles');
      cy.wait('@getProfile');
      cy.injectAxe();
      cy.checkA11y();
    });
  });

  describe('Profile Edit', () => {
    it('should handle profile updates correctly', () => {
      cy.visit('/profiles/123/edit');
      cy.wait('@getProfile');

      const updatedHeadline = 'Updated Senior Developer';
      cy.get('[data-testid="headline-input"]')
        .clear()
        .type(updatedHeadline);

      cy.get('[data-testid="save-profile"]').click();
      cy.wait('@updateProfile');

      cy.get('[data-testid="profile-headline"]')
        .should('contain', updatedHeadline);
    });

    it('should validate form inputs', () => {
      cy.visit('/profiles/123/edit');
      cy.wait('@getProfile');

      // Test required field validation
      cy.get('[data-testid="headline-input"]').clear();
      cy.get('[data-testid="save-profile"]').click();
      cy.get('[data-testid="headline-error"]')
        .should('be.visible')
        .and('contain', 'Headline is required');
    });

    it('should handle form submission errors', () => {
      cy.intercept('PUT', '/api/profiles/*', {
        statusCode: 400,
        body: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid profile data',
            status: 400
          }
        }
      }).as('updateError');

      cy.visit('/profiles/123/edit');
      cy.wait('@getProfile');
      cy.get('[data-testid="save-profile"]').click();
      cy.get('[data-testid="error-message"]').should('be.visible');
    });
  });

  describe('Animation Verification', () => {
    it('should execute hover animations correctly', () => {
      cy.visit('/profiles');
      cy.wait('@getProfile');

      cy.get('[data-testid="profile-card"]').first()
        .realHover()
        .should(($el) => {
          const transform = $el.css('transform');
          expect(transform).to.include('scale');
          
          const transition = $el.css('transition');
          expect(transition).to.include(`${HOVER_ANIMATION_DURATION}ms`);
        });
    });

    it('should handle transition animations', () => {
      cy.visit('/profiles');
      cy.wait('@getProfile');

      cy.get('[data-testid="profile-card"]').first().click();
      
      // Verify transition animation
      cy.get('[data-testid="profile-detail"]')
        .should('have.css', 'opacity', '1')
        .and('have.css', 'transition-duration', `${ANIMATION_DURATION}ms`);
    });

    it('should maintain animation performance', () => {
      cy.visit('/profiles');
      cy.wait('@getProfile');

      // Performance testing for animations
      cy.window().then((win) => {
        const performance = win.performance;
        cy.get('[data-testid="profile-card"]').first()
          .realHover()
          .then(() => {
            const entries = performance.getEntriesByType('animation');
            expect(entries[0].duration).to.be.lessThan(100);
          });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '/api/profiles/*', {
        forceNetworkError: true
      }).as('networkError');

      cy.visit('/profiles');
      cy.get('[data-testid="error-state"]')
        .should('be.visible')
        .and('contain', 'Unable to load profiles');
    });

    it('should handle loading states', () => {
      cy.intercept('GET', '/api/profiles/*', (req) => {
        req.delay(1000).send({ fixture: 'profiles.json' });
      }).as('delayedProfile');

      cy.visit('/profiles');
      cy.get('[data-testid="loading-skeleton"]').should('be.visible');
      cy.wait('@delayedProfile');
      cy.get('[data-testid="loading-skeleton"]').should('not.exist');
    });
  });
});