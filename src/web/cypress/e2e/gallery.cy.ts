import { profiles } from '../fixtures/profiles.json';
import { Profile } from '../../app/types/profile.types';
import { LoadingState } from '../../app/types/common.types';

// Cypress v12.0.0
describe('Gallery Page', () => {
  beforeEach(() => {
    // Intercept API requests
    cy.intercept('GET', '/api/profiles*', {
      statusCode: 200,
      body: {
        success: true,
        data: profiles,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          pageSize: 20,
          totalItems: profiles.length,
          hasNextPage: false,
          hasPreviousPage: false,
          nextPageUrl: null,
          previousPageUrl: null
        },
        timestamp: new Date().toISOString()
      }
    }).as('getProfiles');

    // Track animation metrics
    cy.intercept('POST', '/api/metrics/animation', {
      statusCode: 200,
      body: { success: true }
    }).as('trackAnimationMetrics');

    // Visit gallery page and wait for initial load
    cy.visit('/gallery');
    cy.wait('@getProfiles');
  });

  describe('Layout and Responsiveness', () => {
    it('should render navigation and filter controls', () => {
      cy.get('[data-testid=nav-bar]').should('be.visible');
      cy.get('[data-testid=filter-controls]').should('be.visible');
      cy.get('[data-testid=search-input]').should('be.visible');
    });

    it('should adapt grid layout for different viewports', () => {
      // Mobile layout
      cy.viewport(375, 667);
      cy.get('[data-testid=profile-grid]')
        .should('have.css', 'grid-template-columns')
        .and('match', /repeat\(1, minmax/);

      // Tablet layout
      cy.viewport(768, 1024);
      cy.get('[data-testid=profile-grid]')
        .should('have.css', 'grid-template-columns')
        .and('match', /repeat\(2, minmax/);

      // Desktop layout
      cy.viewport(1280, 800);
      cy.get('[data-testid=profile-grid]')
        .should('have.css', 'grid-template-columns')
        .and('match', /repeat\(3, minmax/);
    });

    it('should maintain accessibility standards', () => {
      cy.injectAxe();
      cy.checkA11y('[data-testid=profile-grid]', {
        runOnly: ['wcag2a', 'wcag2aa']
      });
    });
  });

  describe('Profile Cards', () => {
    it('should display correct profile information', () => {
      cy.get('[data-testid=profile-card]').each(($card, index) => {
        const profile = profiles[index];
        cy.wrap($card).within(() => {
          cy.get('[data-testid=profile-headline]').should('contain', profile.headline);
          if (profile.avatarUrl) {
            cy.get('[data-testid=profile-avatar]').should('have.attr', 'src', profile.avatarUrl);
          }
          if (profile.bio) {
            cy.get('[data-testid=profile-bio]').should('contain', profile.bio);
          }
        });
      });
    });

    it('should handle missing profile data gracefully', () => {
      cy.get('[data-testid=profile-card]').each(($card) => {
        cy.wrap($card).within(() => {
          cy.get('[data-testid=profile-avatar]').then($avatar => {
            if (!$avatar.attr('src')) {
              cy.get('[data-testid=avatar-placeholder]').should('be.visible');
            }
          });
          cy.get('[data-testid=profile-bio]').then($bio => {
            if (!$bio.text().trim()) {
              cy.get('[data-testid=bio-placeholder]').should('be.visible');
            }
          });
        });
      });
    });
  });

  describe('Animations', () => {
    it('should animate profile cards on initial load', () => {
      cy.get('[data-testid=profile-card]').each(($card, index) => {
        cy.wrap($card)
          .should('have.attr', 'data-animate-in', 'true')
          .and('have.css', 'opacity', '1')
          .and('have.css', 'transform')
          .and('not.contain', 'translate3d(0, 20px, 0)');
        
        // Verify staggered animation timing
        if (index > 0) {
          cy.wrap($card)
            .invoke('attr', 'style')
            .should('include', `transition-delay: ${index * 0.1}s`);
        }
      });
    });

    it('should animate profile cards on hover', () => {
      cy.get('[data-testid=profile-card]').first().as('firstCard');
      
      cy.get('@firstCard').trigger('mouseenter');
      cy.get('@firstCard')
        .should('have.css', 'transform')
        .and('contain', 'scale(1.02)');

      cy.get('@firstCard').trigger('mouseleave');
      cy.get('@firstCard')
        .should('have.css', 'transform')
        .and('contain', 'scale(1)');
    });

    it('should maintain smooth animations during scroll', () => {
      cy.window().then((win) => {
        // Monitor frame rate during scroll
        const frameRates: number[] = [];
        let lastTimestamp: number;
        
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (lastTimestamp) {
              const frameRate = 1000 / (entry.startTime - lastTimestamp);
              frameRates.push(frameRate);
            }
            lastTimestamp = entry.startTime;
          });
        });

        observer.observe({ entryTypes: ['frame'] });

        // Perform smooth scroll
        cy.get('[data-testid=profile-grid]').scrollTo('bottom', { 
          duration: 1000,
          easing: 'linear'
        });

        // Verify frame rate
        cy.wrap(null).then(() => {
          const avgFrameRate = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
          expect(avgFrameRate).to.be.at.least(30);
        });

        observer.disconnect();
      });
    });
  });

  describe('Performance', () => {
    it('should load initial profiles within performance budget', () => {
      cy.window().then((win) => {
        const perfEntries = win.performance.getEntriesByType('navigation');
        const loadTime = perfEntries[0].duration;
        expect(loadTime).to.be.below(2000); // 2 second threshold
      });
    });

    it('should maintain responsive interactions', () => {
      cy.get('[data-testid=profile-card]').each(($card) => {
        const start = performance.now();
        cy.wrap($card).trigger('mouseenter');
        const end = performance.now();
        expect(end - start).to.be.below(16); // 60fps threshold
      });
    });

    it('should implement infinite scroll efficiently', () => {
      // Mock next page of profiles
      cy.intercept('GET', '/api/profiles*', (req) => {
        const page = Number(req.query.page) || 1;
        return {
          statusCode: 200,
          body: {
            success: true,
            data: profiles,
            pagination: {
              currentPage: page,
              totalPages: 3,
              pageSize: 20,
              totalItems: 60,
              hasNextPage: page < 3,
              hasPreviousPage: page > 1,
              nextPageUrl: page < 3 ? `/api/profiles?page=${page + 1}` : null,
              previousPageUrl: page > 1 ? `/api/profiles?page=${page - 1}` : null
            }
          }
        };
      }).as('getNextProfiles');

      // Scroll to trigger loading
      cy.get('[data-testid=profile-grid]').scrollTo('bottom');
      cy.wait('@getNextProfiles');

      // Verify smooth loading
      cy.get('[data-testid=loading-indicator]').should('be.visible');
      cy.get('[data-testid=profile-card]').its('length').should('be.gt', profiles.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/profiles*', {
        statusCode: 500,
        body: {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch profiles'
          }
        }
      }).as('getProfilesError');

      cy.visit('/gallery');
      cy.wait('@getProfilesError');
      cy.get('[data-testid=error-message]').should('be.visible');
      cy.get('[data-testid=retry-button]').should('be.visible').click();
    });

    it('should handle network timeouts', () => {
      cy.intercept('GET', '/api/profiles*', {
        forceNetworkError: true
      }).as('networkError');

      cy.visit('/gallery');
      cy.get('[data-testid=network-error]').should('be.visible');
      cy.get('[data-testid=offline-message]').should('be.visible');
    });
  });
});