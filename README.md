# LinkedIn Profiles Gallery

[![Remix Version](https://img.shields.io/badge/remix-v1.19-blue)](https://remix.run)
[![Railway Deployment](https://img.shields.io/badge/railway-deployed-success)](https://railway.app)
[![TypeScript](https://img.shields.io/badge/typescript-4.9-blue)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A modern web platform for browsing and managing professional user profiles with real-time animations and secure authentication.

## Features

- 🎨 Interactive profile gallery with Framer Motion animations
- 🔒 Secure authentication via Clerk with LinkedIn OAuth
- 💾 PostgreSQL database with Prisma ORM
- 🚀 Railway deployment with automated CI/CD
- 🔄 Redis caching for optimal performance
- 📱 Responsive design with Tailwind CSS
- 🛡️ Enterprise-grade security implementation

## Tech Stack

### Frontend
- Remix v1.19+
- React 18+
- Framer Motion 10+
- Tailwind CSS 3+

### Backend
- Node.js 18 LTS
- PostgreSQL 14+
- Redis 6+

### Authentication
- Clerk
- LinkedIn OAuth

### Infrastructure
- Railway Platform
- Railway CDN
- Railway PostgreSQL
- Railway Redis

## Prerequisites

- Node.js 18 LTS or higher
- PostgreSQL 14+
- Redis 6+
- Railway CLI
- Git
- Clerk account
- LinkedIn Developer account

## Quick Start

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

## Architecture

The application follows a modern full-stack architecture:

- **Frontend**: Server-side rendered React application using Remix
- **API Layer**: RESTful API endpoints with comprehensive error handling
- **Authentication**: Clerk SDK with LinkedIn OAuth integration
- **Database**: PostgreSQL with Prisma ORM for type-safe queries
- **Caching**: Redis for session and query caching
- **CDN**: Railway CDN for static asset delivery

## Security

- JWT-based authentication with 24-hour expiration
- Role-based access control (RBAC)
- AES-256-GCM encryption for sensitive data
- CSRF protection and secure headers
- Rate limiting and request validation
- Comprehensive error handling and logging

## Development

### Branch Strategy
- `main` - Production branch
- `staging` - Pre-production testing
- `dev` - Development branch
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`

### Commit Guidelines
Follow Conventional Commits specification:
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Testing
- Unit tests: Jest
- Integration tests: Supertest
- E2E tests: Cypress
- Minimum 80% coverage required

## Deployment

The application is deployed on Railway with automated CI/CD:

1. Push to `dev` branch triggers development deployment
2. Merge to `staging` triggers staging deployment
3. Merge to `main` triggers production deployment

### Environment Configuration
- Development: Local environment
- Staging: Railway staging instance
- Production: Railway production instance

## API Documentation

RESTful API with standardized responses:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
}
```

### Rate Limiting
- Anonymous: 60 requests/minute
- Authenticated: 1000 requests/minute
- Admin: 5000 requests/minute

## Performance

- Server-side rendering for optimal SEO
- Redis caching for frequent queries
- CDN for static assets
- Lazy loading for gallery images
- Response compression

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines and [SECURITY.md](SECURITY.md) for security practices.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.