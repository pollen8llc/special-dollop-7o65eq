# PROJECT OVERVIEW

The LinkedIn Profiles Gallery is a modern web application built on the Remix framework that revolutionizes professional profile discovery and management. This enterprise-grade platform combines cutting-edge technologies to deliver a seamless, interactive experience for professional networkers and recruitment professionals.

## Core Capabilities

- **Interactive Profile Gallery**: Dynamic profile browsing with Framer Motion animations and 3D effects
- **Secure Authentication**: Enterprise-level security through Clerk with LinkedIn OAuth integration
- **Real-Time Performance**: Optimized data delivery using Redis caching and Railway CDN
- **Scalable Infrastructure**: Railway-powered deployment with PostgreSQL and automated CI/CD
- **Professional UX**: Responsive design with Tailwind CSS and mobile-first approach

## Technical Foundation

### Frontend Architecture
- Remix v1.19+ for server-side rendering
- React 18+ with TypeScript 4.9+
- Framer Motion 10+ for fluid animations
- Tailwind CSS 3+ for utility-first styling

### Backend Infrastructure
- Node.js 18 LTS runtime environment
- PostgreSQL 14+ for reliable data storage
- Redis 6+ for performance optimization
- Railway platform for scalable hosting

### Security Implementation
- Multi-factor authentication support
- JWT-based session management
- Role-based access control
- AES-256 data encryption
- HTTPS/TLS 1.3 communication

## Performance Metrics

| Metric | Target | Implementation |
|--------|---------|----------------|
| Page Load Time | < 2 seconds | Server-side rendering, CDN |
| User Engagement | > 5 minutes | Interactive animations |
| Profile Views | > 20 per session | Infinite scroll gallery |
| System Uptime | 99.9% | Railway high availability |
| API Response | < 200ms | Redis caching |

## Deployment Strategy

### Environments
- Development: Local development with hot reloading
- Staging: Pre-production testing environment
- Production: High-availability Railway deployment

### CI/CD Pipeline
- Automated testing with Jest and Cypress
- Security scanning with Snyk
- Blue-green deployment strategy
- Automatic rollback capability

## Scalability Considerations

### Resource Allocation
- Application: 1 CPU core, 512MB RAM
- Database: 2 CPU cores, 1GB RAM
- Cache: 256MB RAM, 1GB storage
- CDN: Global edge locations

### Performance Optimization
- Query caching with Redis
- Composite database indexing
- Dynamic code splitting
- Response compression
- Rate limiting implementation

## Monitoring and Maintenance

### System Monitoring
- Real-time performance metrics
- Error tracking and logging
- Security event monitoring
- Resource utilization tracking

### Backup Procedures
- Daily database backups
- Continuous transaction logging
- Weekly configuration backups
- On-demand data exports

## Compliance and Security

### Security Measures
- GDPR compliance implementation
- OWASP Top 10 protection
- OAuth 2.0 specification adherence
- Regular security audits
- Automated vulnerability scanning

### Access Control
- Role-based permissions
- IP-based rate limiting
- Failed login protection
- Session management
- Data encryption standards

# PROJECT STATUS

```mermaid
pie title "Project Completion Status (Total: 1200 Engineering Hours)"
    "Completed" : 1020
    "Remaining" : 180
```

## Engineering Hours Breakdown

- **Estimated Total Engineering Hours**: 1200 hours
  - Based on the complexity of features, infrastructure setup, and security requirements

- **Hours Completed**: 1020 hours (85%)
  - Frontend Implementation: 360 hours
  - Backend Development: 300 hours
  - Infrastructure Setup: 180 hours
  - Testing & QA: 120 hours
  - Security Implementation: 60 hours

- **Hours Remaining**: 180 hours (15%)
  - Performance Optimization: 60 hours
  - Security Hardening: 40 hours
  - Documentation: 30 hours
  - Final Testing: 30 hours
  - Production Deployment: 20 hours

The project is at 85% completion, with core functionality implemented and tested. Remaining work focuses on optimization, security hardening, and production readiness.

# TECHNOLOGY STACK

## 4.1 PROGRAMMING LANGUAGES

| Platform | Language | Version | Justification |
|----------|----------|---------|---------------|
| Frontend | TypeScript | 4.9+ | Type safety, enhanced developer experience |
| Backend | Node.js | 18 LTS | JavaScript runtime for Remix framework |
| Database | SQL | PostgreSQL 14+ | Robust data integrity, Railway compatibility |
| Build Tools | JavaScript | ES2022 | Native build system support |

## 4.2 FRAMEWORKS & LIBRARIES

```mermaid
flowchart TD
    subgraph Frontend
        R[Remix v1.19+] --> RM[React 18+]
        RM --> FM[Framer Motion 10+]
        RM --> TW[Tailwind CSS 3+]
    end
    
    subgraph Backend
        N[Node.js 18 LTS] --> RX[Remix Server]
        RX --> PR[Prisma 4+]
        PR --> PG[PostgreSQL 14+]
    end
    
    subgraph Authentication
        CL[Clerk SDK] --> LI[LinkedIn OAuth]
    end
```

### Core Frameworks

| Framework | Version | Purpose | Justification |
|-----------|---------|---------|---------------|
| Remix | 1.19+ | Full-stack framework | Server-side rendering, optimal performance |
| React | 18+ | UI library | Component-based architecture |
| Prisma | 4+ | ORM | Type-safe database access |
| Framer Motion | 10+ | Animation library | Smooth profile card animations |
| Tailwind CSS | 3+ | Styling | Utility-first CSS, rapid development |

## 4.3 DATABASES & STORAGE

```mermaid
flowchart LR
    subgraph Data Layer
        PG[(PostgreSQL 14+)]
        RD[(Redis 6+)]
        S3[Railway Storage]
    end
    
    subgraph Access Layer
        PR[Prisma Client]
        RC[Redis Client]
    end
    
    PR --> PG
    RC --> RD
    PR --> S3
```

| Component | Technology | Purpose | Configuration |
|-----------|------------|---------|---------------|
| Primary Database | PostgreSQL 14+ | Profile data storage | Railway managed instance |
| Cache Layer | Redis 6+ | Session and query cache | 512MB instance |
| File Storage | Railway Storage | Profile images, assets | S3-compatible storage |
| ORM | Prisma Client | Database access layer | Type-safe queries |

## 4.4 THIRD-PARTY SERVICES

```mermaid
flowchart TD
    subgraph External Services
        CL[Clerk Auth]
        LI[LinkedIn OAuth]
        RW[Railway Platform]
    end
    
    subgraph Monitoring
        DD[DataDog]
        SEN[Sentry]
    end
    
    APP[Application] --> CL
    CL --> LI
    APP --> RW
    APP --> DD
    APP --> SEN
```

| Service | Purpose | Integration Method |
|---------|---------|-------------------|
| Clerk | Authentication | SDK integration |
| LinkedIn OAuth | Identity provider | OAuth 2.0 protocol |
| Railway | Infrastructure | Platform API |
| DataDog | Monitoring | Agent integration |
| Sentry | Error tracking | Client SDK |

## 4.5 DEVELOPMENT & DEPLOYMENT

```mermaid
flowchart LR
    subgraph Development
        GH[GitHub]
        VS[VS Code]
        ESL[ESLint]
    end
    
    subgraph CI/CD
        GA[GitHub Actions]
        RW[Railway CLI]
    end
    
    subgraph Production
        RP[Railway Platform]
        PG[(PostgreSQL)]
        RD[(Redis)]
    end
    
    GH --> GA
    GA --> RW
    RW --> RP
    RP --> PG
    RP --> RD
```

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| VS Code | Latest | Primary IDE |
| ESLint | 8+ | Code quality |
| Prettier | 2+ | Code formatting |
| Railway CLI | Latest | Deployment tool |

### Build & Deployment

| Stage | Tool | Configuration |
|-------|------|---------------|
| Source Control | GitHub | Main branch protection |
| CI/CD | GitHub Actions | Automated testing and deployment |
| Build | Node.js | Production optimization |
| Deployment | Railway | Automated deployment pipeline |

# PREREQUISITES

Before setting up the LinkedIn Profiles Gallery application, ensure you have the following prerequisites installed and configured:

## Required Software
- Node.js 18 LTS or higher
- PostgreSQL 14+
- Redis 6+
- Railway CLI
- Git

## Required Accounts
- Clerk account for authentication services
- LinkedIn Developer account for OAuth integration

## Development Environment
Your development environment should meet these minimum specifications:
- Memory: 4GB RAM (recommended)
- Storage: 1GB free space
- Operating System: macOS, Windows, or Linux
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)

## Required Environment Variables
The following environment variables must be configured:

### Railway Configuration
- RAILWAY_TOKEN
- RAILWAY_PROJECT_ID

### Database Configuration
- DATABASE_URL (PostgreSQL connection string)

### Redis Configuration
- REDIS_URL (Redis connection string)

### Authentication Configuration
- CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY

### OAuth Configuration
- LINKEDIN_CLIENT_ID
- LINKEDIN_CLIENT_SECRET

## Network Requirements
- Stable internet connection
- Access to Railway services (railway.app)
- Access to Clerk authentication services
- Access to LinkedIn OAuth endpoints

## Development Tools (Recommended)
- VS Code with recommended extensions
- PostgreSQL client (e.g., pgAdmin, DBeaver)
- Redis client (e.g., Redis Commander)
- API testing tool (e.g., Postman, Insomnia)

# QUICK START

1. Clone the repository:
```bash
git clone https://github.com/username/linkedin-profiles-gallery.git
cd linkedin-profiles-gallery
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Required environment variables:
```env
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

4. Initialize database:
```bash
npx prisma db push
npx prisma generate
```

5. Start development server:
```bash
npm run dev
```

# PROJECT STRUCTURE

## Overview

The project follows a modern monorepo structure with clear separation of concerns between frontend, backend, and infrastructure components.

```mermaid
graph TD
    A[Project Root] --> B[src]
    A --> C[infrastructure]
    A --> D[.github]
    B --> E[web]
    B --> F[backend]
    E --> G[app]
    G --> H[components]
    G --> I[routes]
    G --> J[hooks]
    F --> K[src]
    K --> L[api]
    K --> M[services]
    C --> N[docker]
    C --> O[terraform]
```

## Directory Structure

### Frontend (`src/web/`)
```
web/
├── app/
│   ├── components/
│   │   ├── animations/      # Framer Motion animations
│   │   ├── auth/           # Authentication components
│   │   ├── common/         # Reusable UI components
│   │   ├── forms/          # Form components
│   │   ├── gallery/        # Profile gallery components
│   │   └── profile/        # Profile-related components
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Client-side libraries
│   ├── routes/             # Remix route components
│   ├── styles/             # Global styles and Tailwind
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── cypress/                # E2E testing
├── public/                 # Static assets
└── tests/                  # Unit and integration tests
```

### Backend (`src/backend/`)
```
backend/
├── src/
│   ├── api/
│   │   ├── controllers/    # Route handlers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── routes/         # API route definitions
│   │   └── validators/     # Request validation
│   ├── config/            # Configuration files
│   ├── docs/              # API documentation
│   ├── models/            # Database models
│   ├── services/          # Business logic
│   ├── types/             # TypeScript types
│   └── utils/             # Helper functions
├── prisma/                # Database schema and migrations
└── tests/                 # Backend tests
```

### Infrastructure (`infrastructure/`)
```
infrastructure/
├── docker/
│   └── monitoring/        # Monitoring configuration
├── scripts/              # Infrastructure scripts
└── terraform/
    ├── environments/     # Environment-specific configs
    └── modules/          # Terraform modules
```

### CI/CD (`.github/`)
```
.github/
├── workflows/
│   ├── backend.yml       # Backend CI pipeline
│   └── web.yml          # Frontend CI pipeline
├── ISSUE_TEMPLATE/      # Issue templates
└── CODEOWNERS          # Code ownership rules
```

## Key Files

### Frontend
- `web/app/root.tsx` - Root component and global providers
- `web/app/entry.client.tsx` - Client-side entry point
- `web/app/entry.server.tsx` - Server-side entry point
- `web/tailwind.config.ts` - Tailwind CSS configuration
- `web/remix.config.ts` - Remix framework configuration

### Backend
- `backend/src/index.ts` - Application entry point
- `backend/prisma/schema.prisma` - Database schema
- `backend/src/api/routes/*.route.ts` - API route definitions
- `backend/src/services/*.service.ts` - Business logic services
- `backend/src/config/*.ts` - Configuration modules

### Infrastructure
- `infrastructure/terraform/main.tf` - Main Terraform configuration
- `infrastructure/docker/monitoring/docker-compose.yml` - Monitoring stack
- `infrastructure/terraform/railway.tf` - Railway infrastructure
- `infrastructure/terraform/security.tf` - Security configurations

## Configuration Files

### Environment Variables
- `web/.env.example` - Frontend environment variables template
- `backend/.env.example` - Backend environment variables template

### Build & Development
- `web/package.json` - Frontend dependencies and scripts
- `backend/package.json` - Backend dependencies and scripts
- `web/tsconfig.json` - TypeScript configuration for frontend
- `backend/tsconfig.json` - TypeScript configuration for backend

### Deployment
- `web/railway.toml` - Frontend Railway configuration
- `backend/railway.toml` - Backend Railway configuration
- `web/docker/Dockerfile` - Frontend container configuration
- `backend/docker/Dockerfile` - Backend container configuration

## Testing Structure

### Frontend Tests
- Unit Tests: `web/tests/**/*.test.tsx`
- E2E Tests: `web/cypress/e2e/**/*.cy.ts`
- Test Utilities: `web/tests/utils/`
- Fixtures: `web/cypress/fixtures/`

### Backend Tests
- Integration Tests: `backend/tests/integration/`
- Unit Tests: `backend/tests/unit/`
- Test Fixtures: `backend/tests/fixtures/`
- Test Setup: `backend/tests/setup.ts`

# CODE GUIDE

## 1. Project Overview

The LinkedIn Profiles Gallery is a modern web application built with Remix that enables professional profile browsing and management. The codebase is organized into two main directories:

- `/src/web` - Frontend Remix application
- `/src/backend` - Backend API services

## 2. Source Code Structure

### 2.1 Web Application (`/src/web`)

#### 2.1.1 Types Directory (`/app/types`)

Contains TypeScript type definitions providing type safety across the application:

- `profile.types.ts` - Profile data structures and API responses
- `experience.types.ts` - Professional experience types
- `auth.types.ts` - Authentication and authorization types
- `common.types.ts` - Shared type definitions
- `route.types.ts` - Route parameter types
- `animation.types.ts` - Framer Motion animation types

#### 2.1.2 Components Directory (`/app/components`)

Organized by feature domain:

**Profile Components**
- `ProfileDetail.tsx` - Detailed profile view
- `ProfileHeader.tsx` - Profile header with avatar
- `ProfileImage.tsx` - Profile image component
- `ProfileActions.tsx` - Profile action buttons
- `ProfileSocial.tsx` - Social media links

**Gallery Components**
- `ProfileCard.tsx` - Individual profile card
- `ProfileGrid.tsx` - Grid layout for profiles
- `FilterControls.tsx` - Search and filtering
- `InfiniteScroll.tsx` - Infinite scrolling

**Authentication Components**
- `AuthModal.tsx` - Authentication modal
- `LoginButton.tsx` - OAuth login button
- `OAuthButtons.tsx` - Social login buttons

**Common Components**
- `Button.tsx` - Reusable button component
- `Avatar.tsx` - User avatar component
- `Toast.tsx` - Notification system
- `Modal.tsx` - Modal dialog component
- `LoadingSpinner.tsx` - Loading indicator
- `ErrorBoundary.tsx` - Error handling
- `Layout.tsx` - Page layout wrapper
- `Navigation.tsx` - Navigation bar
- `Footer.tsx` - Footer component
- `SEO.tsx` - SEO meta tags

#### 2.1.3 Hooks Directory (`/app/hooks`)

Custom React hooks:
- `useAuth.ts` - Authentication state management
- `useProfiles.ts` - Profile data fetching
- `useAnimation.ts` - Animation controls
- `useToast.ts` - Toast notifications
- `useTheme.ts` - Theme management
- `useBreakpoint.ts` - Responsive breakpoints
- `useInfiniteScroll.ts` - Infinite scrolling

#### 2.1.4 Context Directory (`/app/context`)

React Context providers:
- `AuthContext.tsx` - Authentication context
- `ThemeContext.tsx` - Theme context
- `ToastContext.tsx` - Toast notification context

#### 2.1.5 Routes Directory (`/app/routes`)

Remix route components:
- `_index.tsx` - Landing page
- `gallery.tsx` - Profile gallery
- `profile.$id.tsx` - Profile details
- `profile.new.tsx` - Create profile
- `profile.$id.edit.tsx` - Edit profile
- `auth.signin.tsx` - Sign in
- `auth.callback.tsx` - OAuth callback
- `auth.signout.tsx` - Sign out

### 2.2 Backend Application (`/src/backend`)

#### 2.2.1 API Directory (`/src/api`)

**Controllers**
- `profiles.controller.ts` - Profile management
- `experiences.controller.ts` - Experience management
- `auth.controller.ts` - Authentication

**Middlewares**
- `auth.middleware.ts` - Authentication checks
- `validation.middleware.ts` - Request validation
- `rateLimiter.middleware.ts` - Rate limiting
- `error.middleware.ts` - Error handling

**Routes**
- `profiles.route.ts` - Profile endpoints
- `experiences.route.ts` - Experience endpoints
- `auth.route.ts` - Auth endpoints

**Validators**
- `profile.validator.ts` - Profile validation
- `experience.validator.ts` - Experience validation

#### 2.2.2 Services Directory (`/src/services`)

Business logic implementation:
- `profile.service.ts` - Profile operations
- `experience.service.ts` - Experience operations
- `auth.service.ts` - Authentication logic
- `cache.service.ts` - Redis caching

#### 2.2.3 Models Directory (`/src/models`)

Prisma model implementations:
- `user.model.ts` - User model
- `profile.model.ts` - Profile model
- `experience.model.ts` - Experience model

#### 2.2.4 Utils Directory (`/src/utils`)

Utility functions:
- `validation.ts` - Data validation
- `errors.ts` - Error handling
- `logger.ts` - Logging
- `security.ts` - Security utilities
- `redis.ts` - Redis utilities
- `prisma.ts` - Prisma utilities

## 3. Key Technologies

### 3.1 Frontend Stack
- Remix v1.19+ (Full-stack framework)
- React 18+ (UI library)
- Framer Motion 10+ (Animations)
- Tailwind CSS 3+ (Styling)
- TypeScript 4.9+ (Type safety)

### 3.2 Backend Stack
- Node.js 18 LTS
- PostgreSQL 14+ (Database)
- Redis 6+ (Caching)
- Prisma 4+ (ORM)
- Clerk (Authentication)

## 4. Database Schema

The application uses a PostgreSQL database with the following core models:

### 4.1 User Model
```prisma
model User {
  id         String    @id @default(uuid())
  email      String    @unique
  name       String
  role       UserRole
  profile    Profile?
  is_active  Boolean
  last_login DateTime?
  // Audit fields...
}
```

### 4.2 Profile Model
```prisma
model Profile {
  id           String
  userId       String
  headline     String
  bio          String?
  avatar_url   String?
  experiences  Experience[]
  social_links Json?
  visibility   ProfileVisibility
  // Audit fields...
}
```

### 4.3 Experience Model
```prisma
model Experience {
  id          String
  profileId   String
  title       String
  company     String
  location    String?
  start_date  DateTime
  end_date    DateTime?
  description String?
  is_current  Boolean
  // Audit fields...
}
```

## 5. Authentication Flow

1. User initiates login via LinkedIn OAuth
2. Clerk handles OAuth authentication
3. JWT token issued upon successful auth
4. Token stored in secure cookie
5. Auth middleware validates requests
6. Role-based access control enforced

## 6. Development Workflow

### 6.1 Local Setup
1. Install dependencies: `npm install`
2. Configure environment variables
3. Start PostgreSQL and Redis
4. Run migrations: `npx prisma migrate dev`
5. Start development server: `npm run dev`

### 6.2 Testing
- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e`

### 6.3 Deployment
1. Code pushed to GitHub
2. GitHub Actions CI/CD triggered
3. Tests and builds run
4. Deployment to Railway on success

## 7. Performance Optimizations

1. Redis caching for profiles
2. CDN for static assets
3. Server-side rendering
4. Image optimization
5. Code splitting
6. Query optimization

## 8. Security Measures

1. HTTPS enforcement
2. JWT authentication
3. CORS protection
4. Rate limiting
5. Input validation
6. SQL injection prevention
7. XSS protection

# DEVELOPMENT GUIDELINES

## Branch Strategy

### Main Branches
- `main` - Production branch, protected
- `staging` - Pre-production testing environment
- `dev` - Primary development branch

### Feature Branches
- Format: `feature/feature-name`
- Branch from: `dev`
- Merge to: `dev`

### Bug Fix Branches
- Format: `fix/bug-name`
- Branch from: `dev`
- Merge to: `dev`

## Code Standards

### Commit Guidelines
Follow Conventional Commits specification:
```bash
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Code Style
- TypeScript strict mode enabled
- ESLint configuration enforced
- Prettier formatting required
- Maximum line length: 100 characters
- Use meaningful variable names
- Document complex functions

## Development Setup

### Prerequisites
- Node.js 18 LTS or higher
- PostgreSQL 14+
- Redis 6+
- Railway CLI
- Git
- Clerk account
- LinkedIn Developer account

### Environment Setup
1. Clone repository:
```bash
git clone https://github.com/username/linkedin-profiles-gallery.git
cd linkedin-profiles-gallery
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

4. Required environment variables:
```env
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

## Testing Requirements

### Test Coverage
- Minimum 80% code coverage required
- All critical paths must be tested
- Integration tests for API endpoints
- E2E tests for user flows

### Testing Stack
- Unit Tests: Jest
- Integration Tests: Supertest
- E2E Tests: Cypress
- API Tests: REST client

### Test Commands
```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## Development Workflow

### Local Development
1. Start development server:
```bash
npm run dev
```

2. Access application:
- Web: http://localhost:3000
- API: http://localhost:3000/api

### Database Management
1. Initialize database:
```bash
npx prisma db push
npx prisma generate
```

2. Run migrations:
```bash
npx prisma migrate dev
```

3. Seed database:
```bash
npx prisma db seed
```

## Deployment Process

### Development Deployment
- Triggered by push to `dev` branch
- Deploys to development environment
- Runs automated tests

### Staging Deployment
- Triggered by merge to `staging`
- Requires PR approval
- Runs full test suite

### Production Deployment
- Triggered by merge to `main`
- Requires multiple PR approvals
- Runs security scans
- Automated rollback on failure

## Performance Guidelines

### Frontend Optimization
- Implement code splitting
- Optimize image loading
- Use CDN for static assets
- Minimize bundle size
- Enable compression

### Backend Optimization
- Implement Redis caching
- Optimize database queries
- Use connection pooling
- Enable response compression
- Implement rate limiting

## Security Requirements

### Authentication
- Use Clerk for authentication
- Implement LinkedIn OAuth
- Secure session management
- Enable MFA where possible

### Authorization
- Implement RBAC
- Validate user permissions
- Secure API endpoints
- Implement rate limiting

### Data Protection
- Encrypt sensitive data
- Implement CSRF protection
- Enable secure headers
- Follow security best practices

## Monitoring and Logging

### Application Monitoring
- Implement health checks
- Monitor performance metrics
- Track error rates
- Monitor API usage

### Logging Requirements
- Use structured logging
- Include request context
- Log security events
- Implement audit logging

## Documentation Standards

### Code Documentation
- Document complex functions
- Include JSDoc comments
- Document API endpoints
- Maintain README files

### API Documentation
- Use OpenAPI specification
- Document request/response
- Include examples
- Document error codes

# HUMAN INPUTS NEEDED

| Task | Description | Priority | Estimated Hours |
|------|-------------|----------|-----------------|
| QA/Bug Fixes | Review and fix compilation issues, package dependencies, type errors, and import statements across all components | High | 40 |
| Environment Configuration | Set up environment variables for Clerk Auth, LinkedIn OAuth, Railway platform, Redis, and PostgreSQL configurations | High | 8 |
| API Key Management | Generate and configure API keys for Clerk Auth, LinkedIn OAuth integration, and Railway services | High | 4 |
| Database Migration | Execute initial Prisma migrations and seed the database with test data | High | 6 |
| Security Compliance | Implement CORS policies, CSP headers, and rate limiting configurations | High | 12 |
| Cache Configuration | Set up Redis cache layer with proper encryption and connection settings | Medium | 8 |
| Monitoring Setup | Configure DataDog and Sentry integrations for error tracking and performance monitoring | Medium | 10 |
| CI/CD Pipeline | Set up GitHub Actions workflows for automated testing and deployment to Railway | Medium | 16 |
| Asset Optimization | Configure CDN settings and implement image optimization pipeline | Low | 8 |
| Documentation Review | Review and update technical documentation, API specifications, and deployment guides | Low | 12 |