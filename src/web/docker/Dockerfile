# Base stage with Node.js and common dependencies
FROM node:18-alpine AS base

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./

# Install node modules
RUN npm ci --only=production

# Copy application source
COPY . .

# Development stage
FROM base AS development

# Set development environment
ENV NODE_ENV=development

# Install development dependencies
RUN npm install

# Expose development port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Builder stage for creating production assets
FROM base AS builder

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set production environment
ENV NODE_ENV=production \
    PORT=3000

# Set working directory
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public

# Expose production port
EXPOSE 3000

# Set resource limits
ENV NODE_OPTIONS="--max-old-space-size=512"

# Add labels
LABEL maintainer="LinkedIn Profiles Gallery Team" \
      description="Remix web application for LinkedIn Profiles Gallery" \
      version="1.0.0"

# Configure health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start production server
CMD ["npm", "run", "start"]