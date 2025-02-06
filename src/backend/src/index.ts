/**
 * Main entry point for LinkedIn Profiles Gallery backend application
 * Implements secure, performant Express server with comprehensive monitoring
 * @version 1.0.0
 */

import express from 'express'; // ^4.18.2
import cors from 'cors'; // ^2.8.5
import helmet from 'helmet'; // ^7.0.0
import compression from 'compression'; // ^1.7.4
import expressCorrelationId from 'express-correlation-id'; // ^2.0.1
import promMiddleware from 'express-prometheus-middleware'; // ^1.2.0
import morgan from 'morgan'; // ^1.10.0
import { ENV, API, RATE_LIMIT, SECURITY } from './config/constants';
import authRouter from './api/routes/auth.route';
import profilesRouter from './api/routes/profiles.route';
import experiencesRouter from './api/routes/experiences.route';
import { createHttpLogger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './utils/prisma';
import { validateRailwayConfig } from './config/railway';
import { validateRedisConnection } from './utils/redis';

// Initialize Express application
const app = express();

/**
 * Configures comprehensive application-level middleware
 * Implements security, monitoring, and performance optimizations
 */
async function configureMiddleware(app: express.Application): Promise<void> {
  // Request correlation for tracing
  app.use(expressCorrelationId());

  // Security middleware
  app.use(cors({
    origin: SECURITY.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    credentials: true,
    maxAge: 86400 // 24 hours
  }));

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", ...SECURITY.CORS_ORIGINS]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Performance middleware
  app.use(compression({
    level: 6,
    threshold: 1024
  }));

  app.use(express.json({
    limit: '10mb'
  }));

  app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
  }));

  // Logging middleware
  app.use(createHttpLogger());
  app.use(morgan('combined'));

  // Prometheus metrics middleware
  app.use(promMiddleware({
    metricsPath: '/metrics',
    collectDefaultMetrics: true,
    requestDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 5],
    requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
    responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400]
  }));

  // Request timeout middleware
  app.use((req, res, next) => {
    res.setTimeout(API.TIMEOUT_MS, () => {
      res.status(408).json({
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'Request timeout exceeded',
          status: 408
        }
      });
    });
    next();
  });
}

/**
 * Configures API routes with versioning and comprehensive error handling
 */
function configureRoutes(app: express.Application): void {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  // API routes with versioning
  const apiRouter = express.Router();
  apiRouter.use('/auth', authRouter);
  apiRouter.use('/profiles', profilesRouter);
  apiRouter.use('/experiences', experiencesRouter);

  app.use(API.BASE_PATH, apiRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        status: 404
      }
    });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const status = err.status || 500;
    const message = ENV.IS_PRODUCTION ? 'Internal server error' : err.message;

    res.status(status).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message,
        status
      }
    });
  });
}

/**
 * Initializes and starts the Express server with graceful shutdown
 */
async function startServer(): Promise<void> {
  try {
    // Validate configurations
    validateRailwayConfig();
    await validateRedisConnection();

    // Configure middleware and routes
    await configureMiddleware(app);
    configureRoutes(app);

    // Connect to database
    await connectDatabase();

    // Start server
    const server = app.listen(API.PORT, () => {
      console.info(`Server running on port ${API.PORT} in ${ENV.NODE_ENV} mode`);
    });

    // Graceful shutdown handler
    const shutdown = async () => {
      console.info('Shutting down server...');
      
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 30s
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;