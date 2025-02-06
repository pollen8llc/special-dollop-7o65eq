# LinkedIn Profiles Gallery Backend

Enterprise-grade backend service for the LinkedIn Profiles Gallery application, providing secure profile management and data handling capabilities.

## Prerequisites

- Node.js >= 18.0.0 LTS
- Docker >= 20.10.0
- Docker Compose >= 2.0.0
- PostgreSQL 14+
- Redis 6+
- Railway CLI (for deployment)

## Quick Start

```bash
# Clone and install dependencies
git clone <repository_url>
cd linkedin-profiles-gallery/backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development environment
npm run dev
```

## Environment Variables

```bash
# Required Configuration
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
REDIS_URL=rediss://user:password@host:6379
CLERK_API_KEY=clerk_api_key_xxx
PORT=3000
NODE_ENV=development
```

## Development Scripts

```bash
# Development server with hot reload
npm run dev

# Build production bundle
npm run build

# Run production server
npm run start

# Testing
npm run test            # Run test suite
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report

# Code quality
npm run lint          # Run ESLint
npm run lint:fix      # Fix linting issues
npm run format        # Format code

# Database management
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Database GUI
npm run seed            # Seed database

# Docker operations
npm run docker:build    # Build container
npm run docker:run      # Run with Docker Compose
```

## Docker Development Environment

The application uses Docker Compose for local development with the following services:

- API Server (Node.js)
- PostgreSQL 14
- Redis 6

```bash
# Start development environment
docker-compose -f docker/docker-compose.yml up --build

# Stop and remove containers
docker-compose -f docker/docker-compose.yml down
```

## Project Structure

```
src/
├── api/          # API routes and controllers
├── config/       # Configuration management
├── middleware/   # Express middleware
├── models/       # Data models and types
├── services/     # Business logic
├── utils/        # Utility functions
└── index.ts      # Application entry point
```

## API Documentation

### Authentication

All routes except `/health` require authentication via Clerk. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Rate Limiting

- Anonymous: 60 requests/minute
- Authenticated: 1000 requests/minute
- Admin: 5000 requests/minute

### Endpoints

Detailed API documentation available at `/api-docs` when running in development mode.

## Database Management

The application uses Prisma ORM with PostgreSQL. Schema is defined in `prisma/schema.prisma`.

```bash
# Apply migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed database
npm run seed
```

## Railway Deployment

```bash
# Login to Railway
railway login

# Link project
railway link

# Deploy application
railway up
```

### Production Configuration

1. Configure environment variables in Railway dashboard
2. Enable automatic deployments from main branch
3. Configure custom domain and SSL
4. Set up monitoring and alerts

## Security Guidelines

1. Keep dependencies updated
2. Enable security headers via Helmet
3. Implement rate limiting
4. Use CORS restrictions
5. Enable audit logging
6. Regular security scanning

## Monitoring and Logging

- Application metrics via Prometheus
- Error tracking with Winston
- Request logging with Morgan
- Performance monitoring with Railway metrics

## Backup Procedures

1. Automated daily database backups
2. Transaction log archiving
3. Weekly configuration backups
4. On-demand data exports

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

Private - All rights reserved

## Support

Contact system administrators for support and access management.