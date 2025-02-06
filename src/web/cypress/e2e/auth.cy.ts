import { AuthUser, AuthSession, OAuthProvider, UserRole, AuthError } from '../../app/types/auth.types';

/**
 * End-to-end tests for authentication flows in the LinkedIn Profiles Gallery application
 * @version 1.0.0
 */
describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    // Clear previous state
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.intercept('POST', '/api/auth/**').as('authRequests');
    cy.visit('/');
  });

  describe('OAuth Authentication Flow', () => {
    it('should successfully authenticate with LinkedIn', () => {
      // Mock LinkedIn OAuth response
      cy.intercept('GET', '/api/auth/linkedin/callback*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              imageUrl: 'https://example.com/avatar.jpg',
              roles: [UserRole.USER],
              lastLoginAt: new Date().toISOString(),
              metadata: {}
            },
            token: 'mock-jwt-token',
            expiresIn: 3600,
            refreshToken: 'mock-refresh-token',
            version: '1.0.0'
          },
          timestamp: new Date().toISOString()
        }
      }).as('oauthCallback');

      // Start authentication flow
      cy.get('[data-cy="login-button"]').click();
      cy.get('[data-cy="auth-modal"]').should('be.visible');
      cy.get('[data-cy="linkedin-auth-button"]').click();

      // Verify authentication success
      cy.wait('@oauthCallback').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.response?.body.success).to.be.true;
      });

      // Verify JWT storage and security
      cy.getCookie('auth_session').should('exist')
        .and('have.property', 'secure', true)
        .and('have.property', 'httpOnly', true)
        .and('have.property', 'sameSite', 'strict');

      // Verify successful redirect
      cy.url().should('include', '/gallery');
      cy.get('[data-cy="user-profile"]').should('be.visible');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', () => {
      cy.visit('/gallery');
      cy.url().should('include', '/login');
      cy.get('[data-cy="auth-modal"]').should('be.visible');
    });

    it('should enforce role-based access control', () => {
      // Mock admin user authentication
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            user: {
              id: 'admin-user-id',
              roles: [UserRole.ADMIN],
              // ... other user properties
            },
            // ... other session properties
          }
        }
      }).as('sessionCheck');

      // Test admin route access
      cy.visit('/admin/dashboard');
      cy.url().should('include', '/admin/dashboard');
    });
  });

  describe('Authentication Errors', () => {
    it('should handle network failures gracefully', () => {
      cy.intercept('GET', '/api/auth/linkedin/callback*', {
        statusCode: 500,
        body: {
          success: false,
          error: {
            code: 'AUTH_NETWORK_ERROR',
            message: 'Authentication service unavailable',
            status: 500,
            timestamp: new Date().toISOString(),
            details: {}
          }
        }
      }).as('networkError');

      cy.get('[data-cy="login-button"]').click();
      cy.get('[data-cy="linkedin-auth-button"]').click();

      cy.wait('@networkError');
      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .and('contain', 'Authentication service unavailable');
    });

    it('should handle rate limiting', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 429,
        body: {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            status: 429,
            timestamp: new Date().toISOString(),
            details: { retryAfter: 60 }
          }
        }
      }).as('rateLimitError');

      // Attempt multiple logins
      for (let i = 0; i < 5; i++) {
        cy.get('[data-cy="login-button"]').click();
      }

      cy.wait('@rateLimitError');
      cy.get('[data-cy="error-message"]')
        .should('be.visible')
        .and('contain', 'Too many requests');
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout and clear session', () => {
      // Setup authenticated session
      cy.window().then((window) => {
        window.localStorage.setItem('auth_state', 'authenticated');
      });

      // Perform logout
      cy.get('[data-cy="user-menu"]').click();
      cy.get('[data-cy="logout-button"]').click();

      // Verify session cleanup
      cy.getCookie('auth_session').should('not.exist');
      cy.window().then((window) => {
        expect(window.localStorage.getItem('auth_state')).to.be.null;
      });

      // Verify redirect
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Session Management', () => {
    it('should handle session expiration', () => {
      // Mock expired session
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 401,
        body: {
          success: false,
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Session has expired',
            status: 401,
            timestamp: new Date().toISOString(),
            details: {}
          }
        }
      }).as('sessionExpired');

      cy.visit('/gallery');
      cy.wait('@sessionExpired');
      cy.url().should('include', '/login');
    });

    it('should refresh token automatically', () => {
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'new-mock-token',
            expiresIn: 3600
          }
        }
      }).as('tokenRefresh');

      // Trigger token refresh
      cy.visit('/gallery');
      cy.wait('@tokenRefresh');
      cy.getCookie('auth_session').should('exist');
    });
  });
});