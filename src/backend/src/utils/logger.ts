/**
 * @fileoverview Enhanced logging utility for LinkedIn Profiles Gallery backend
 * @version 1.0.0
 * @package winston@^3.8.0
 * @package morgan@^1.10.0
 */

import winston from 'winston';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/constants';
import { isOperationalError } from './errors';

// Define log levels with audit capability for security events
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  audit: 5
};

// Fields that should be masked in logs for security
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'email',
  'ssn',
  'creditCard',
  'authorization',
  'cookie'
];

/**
 * Determines appropriate log level based on environment
 */
const getLogLevel = (): string => {
  if (ENV.IS_PRODUCTION) return 'info';
  if (ENV.IS_DEVELOPMENT) return 'debug';
  if (ENV.IS_TEST) return 'error';
  return 'info';
};

/**
 * Sanitizes sensitive data from log entries
 */
const sanitizeLogData = (data: Record<string, any>): Record<string, any> => {
  const sanitized = JSON.parse(JSON.stringify(data));

  const maskValue = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        maskValue(obj[key]);
      }
    });
  };

  maskValue(sanitized);
  return sanitized;
};

/**
 * Enhanced Winston logger with security features
 */
class Logger {
  private logger: winston.Logger;
  private correlationId: string | null = null;

  constructor() {
    const format = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    this.logger = winston.createLogger({
      levels: LOG_LEVELS,
      level: getLogLevel(),
      format,
      defaultMeta: {
        service: 'linkedin-profiles-gallery'
      },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // File transport for production
        ...(ENV.IS_PRODUCTION ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5
          })
        ] : [])
      ]
    });
  }

  /**
   * Sets correlation ID for request tracking
   */
  public setCorrelationId(id: string | null): void {
    this.correlationId = id;
  }

  /**
   * Enhanced error logging with security classification
   */
  public error(error: Error | string, metadata: Record<string, any> = {}): void {
    const errorObject = error instanceof Error ? error : new Error(error);
    const isOperational = isOperationalError(errorObject);

    this.logger.error({
      message: errorObject.message,
      stack: errorObject.stack,
      correlationId: this.correlationId,
      isOperational,
      ...sanitizeLogData(metadata)
    });
  }

  /**
   * Info level logging with sanitization
   */
  public info(message: string, metadata: Record<string, any> = {}): void {
    this.logger.info({
      message,
      correlationId: this.correlationId,
      ...sanitizeLogData(metadata)
    });
  }

  /**
   * Debug level logging for development
   */
  public debug(message: string, metadata: Record<string, any> = {}): void {
    this.logger.debug({
      message,
      correlationId: this.correlationId,
      ...sanitizeLogData(metadata)
    });
  }

  /**
   * Security audit logging with enhanced tracking
   */
  public audit(message: string, metadata: Record<string, any> = {}): void {
    this.logger.log('audit', {
      message,
      correlationId: this.correlationId,
      timestamp: new Date().toISOString(),
      ...sanitizeLogData(metadata)
    });
  }
}

/**
 * Creates HTTP request logger with security features
 */
export const createHttpLogger = () => {
  return morgan((tokens, req, res) => {
    const correlationId = uuidv4();
    logger.setCorrelationId(correlationId);

    // Skip logging health check endpoints
    if (req.url === '/health' || req.url === '/healthz') {
      return undefined;
    }

    const logData = {
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      responseTime: tokens['response-time'](req, res),
      userAgent: tokens['user-agent'](req, res),
      correlationId,
      timestamp: new Date().toISOString()
    };

    logger.info('HTTP Request', logData);
    return undefined;
  });
};

// Create singleton logger instance
const logger = new Logger();

export default logger;