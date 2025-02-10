# Stage 1: Builder
FROM node:23-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY prisma ./prisma/

# Install build dependencies
RUN apk add --no-cache python3 make g++ \
    && npm ci

# Copy source code and configuration files
COPY . .

# Generate Prisma client and build TypeScript code
RUN npm run prisma:generate \
    && npm run build \
    && npm prune --production

# Stage 2: Production
FROM node:23-alpine

# Set working directory
WORKDIR /app

# Create non-root user and group
RUN addgroup -S nodejs && adduser -S -G nodejs nodejs

# Install runtime dependencies
RUN apk add --no-cache curl

# Copy built artifacts and dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Set secure permissions
RUN chmod -R 550 /app/dist \
    && chmod -R 550 /app/node_modules \
    && chmod 550 /app/package*.json \
    && chmod -R 550 /app/prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose application port
EXPOSE 3000

# Switch to non-root user
USER nodejs

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set resource limits
ENV NODE_OPTIONS="--max-old-space-size=512"

# Start the application
CMD ["node", "dist/index.js"]