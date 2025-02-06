# LinkedIn Profiles Gallery
![build](https://github.com/username/repo/actions/workflows/ci.yml/badge.svg)
![coverage](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)
![version](https://img.shields.io/github/package-json/v/username/repo)
![typescript](https://img.shields.io/badge/typescript-4.9%2B-blue)

Modern web application for interactive profile browsing built with Remix, featuring real-time animations, secure authentication, and high performance.

## Features

- Interactive profile gallery with Framer Motion animations
- Secure authentication via Clerk and LinkedIn OAuth
- High-performance profile browsing with Redis caching
- Responsive design using Tailwind CSS
- Type-safe development with TypeScript 4.9+

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0 or yarn >= 1.22.0
- Docker >= 20.10.0 and Docker Compose >= 2.0.0
- Redis >= 6.0.0 (for caching)
- PostgreSQL >= 14.0 (for development)

## Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
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

4. Start development environment:
```bash
docker-compose up -d
npm run dev
```

The application will be available at http://localhost:3000

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build       # Build production assets
npm run start       # Start production server
npm run test        # Run test suite
npm run test:watch  # Run tests in watch mode
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
npm run typecheck   # Run TypeScript type checking
```

### Technology Stack

- **Framework**: Remix v1.19.0
- **Authentication**: Clerk v4.0.0
- **Styling**: Tailwind CSS v3.3.0
- **Animations**: Framer Motion v10.0.0
- **State Management**: React Hooks
- **Form Handling**: React Hook Form v7.45.0
- **Testing**: Jest v29.0.0, Testing Library
- **E2E Testing**: Cypress v12.0.0

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- Jest for unit and integration testing
- Cypress for end-to-end testing
- TypeScript for type safety

### Performance Optimization

- Redis caching for API responses
- Image optimization with Railway CDN
- Code splitting with Remix
- Virtual scrolling for large lists
- Debounced search inputs

## Deployment

### Docker Deployment

Build and run the Docker container:

```bash
docker-compose -f docker/docker-compose.yml up --build
```

### Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

### Resource Requirements

- **Web Server**: 1 CPU, 512MB RAM
- **Redis Cache**: 256MB RAM
- **Node.js Memory**: 512MB heap size

### Environment Variables

```env
NODE_ENV=production
PORT=3000
REDIS_URL=redis://redis:6379
CLERK_PUBLISHABLE_KEY=<your-clerk-key>
CLERK_SECRET_KEY=<your-clerk-secret>
```

## Security

- TLS encryption for all connections
- Clerk authentication with MFA support
- CORS protection
- Rate limiting
- Content Security Policy
- XSS protection
- CSRF protection

## Performance Targets

- Page Load Time: < 2 seconds
- Time to Interactive: < 3 seconds
- First Contentful Paint: < 1.5 seconds
- Lighthouse Score: > 90

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@linkedinprofilesgallery.com or create an issue in the repository.