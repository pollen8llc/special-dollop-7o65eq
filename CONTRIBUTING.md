# Contributing to LinkedIn Profiles Gallery

## Introduction

Welcome to the LinkedIn Profiles Gallery project! This modern web application is built with Remix, featuring Clerk Auth integration, Railway infrastructure, PostgreSQL database, and Redis caching for optimal performance. We appreciate your interest in contributing and look forward to your contributions.

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

### Security and Data Handling

- Always handle user data with utmost care and respect privacy
- Never commit sensitive information (keys, credentials, PII)
- Report security vulnerabilities through appropriate channels
- Follow security best practices in code contributions

## Getting Started

### Prerequisites

- Node.js 18 LTS or higher
- PostgreSQL 14+
- Redis 6+
- Git
- Railway CLI
- VS Code (recommended)

### Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/your-username/linkedin-profiles-gallery.git
cd linkedin-profiles-gallery
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Initialize the database:
```bash
npx prisma db push
npx prisma generate
```

5. Start the development server:
```bash
npm run dev
```

### Environment Variables

Required environment variables:
```
# Railway Configuration
RAILWAY_TOKEN=your_railway_token
RAILWAY_PROJECT_ID=your_project_id

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/linkedin_profiles

# Redis
REDIS_URL=redis://localhost:6379

# Clerk Auth
CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

## Development Workflow

### Branch Strategy

- `main` - Production branch
- `staging` - Pre-production testing
- `dev` - Development branch
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`
- Releases: `release/v1.x.x`

### Commit Guidelines

Follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

### Pull Request Process

1. Create a feature branch from `dev`
2. Implement changes with tests
3. Update documentation
4. Submit PR with:
   - Clear description
   - Issue references
   - Test results
   - Screenshot/video (for UI changes)
5. Pass code review
6. Obtain approvals
7. Merge after CI passes

## Coding Standards

### TypeScript Guidelines

- Enable strict mode
- Use explicit types
- Avoid `any`
- Document interfaces
- Handle errors properly
- Use async/await
- Follow ESLint rules

### Testing Requirements

- Unit tests: 80% coverage minimum
- Integration tests for API endpoints
- E2E tests for critical flows
- Test naming: `describe('Component', () => {})`

### Documentation

- JSDoc for functions
- README updates for new features
- API documentation updates
- Technical specification updates

## Testing Guidelines

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Integration Tests

- Test database operations
- Verify Redis caching
- Check authentication flows
- Validate API responses

### E2E Tests

```typescript
describe('Profile Gallery', () => {
  it('should display profiles grid', () => {
    cy.visit('/');
    cy.get('[data-testid="profile-grid"]').should('be.visible');
    cy.get('[data-testid="profile-card"]').should('have.length.greaterThan', 0);
  });
});
```

## Deployment

### CI/CD Pipeline

GitHub Actions workflow:
```yaml
name: CI/CD
on:
  push:
    branches: [main, staging, dev]
  pull_request:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railway/cli-action@v2
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
```

### Environment Configuration

- Development: Local environment
- Staging: Railway staging instance
- Production: Railway production instance

### Monitoring

- Application logs
- Performance metrics
- Error tracking
- User analytics

## Security

### Security Best Practices

- Validate all inputs
- Sanitize database queries
- Implement rate limiting
- Use secure headers
- Enable CORS properly
- Keep dependencies updated

### Vulnerability Reporting

1. **DO NOT** create public issues for security vulnerabilities
2. Email security@example.com with details
3. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Support

- GitHub Issues for bug reports
- Discussions for questions
- Security email for vulnerabilities
- Project maintainers:
  - Lead Developer: lead@example.com
  - Security Team: security@example.com

Thank you for contributing to LinkedIn Profiles Gallery!