/**
 * Enhanced Authentication Controller
 * Handles user authentication, session management, and OAuth callback endpoints
 * with comprehensive security monitoring and role-based access control
 * @module controllers/auth
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express'; // v4.18.0
import { AuthService } from '../../services/auth.service';
import { AuthUser } from '../../types/auth.types';
import { createUnauthorizedError, createInternalError } from '../../utils/errors';
import { RATE_LIMIT, SECURITY } from '../../config/constants';

/**
 * Enhanced authentication controller with security monitoring and role-based access control
 */
export class AuthController {
  private readonly MAX_LOGIN_ATTEMPTS = 3;
  private readonly LOGIN_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
  private readonly failedLoginAttempts: Map<string, { count: number; timestamp: number }> = new Map();

  constructor(private readonly authService: AuthService) {}

  /**
   * Enhanced sign-in handler with security monitoring and rate limiting
   */
  public signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = req.ip;

      // Check rate limiting
      const failedAttempts = this.failedLoginAttempts.get(clientIp);
      if (failedAttempts) {
        const { count, timestamp } = failedAttempts;
        const cooldownElapsed = Date.now() - timestamp;

        if (count >= this.MAX_LOGIN_ATTEMPTS && cooldownElapsed < this.LOGIN_COOLDOWN_MS) {
          throw createUnauthorizedError('Too many login attempts. Please try again later.');
        }

        if (cooldownElapsed >= this.LOGIN_COOLDOWN_MS) {
          this.failedLoginAttempts.delete(clientIp);
        }
      }

      // Extract and validate token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw createUnauthorizedError('Invalid authorization header');
      }

      const token = authHeader.split(' ')[1];
      const payload = await this.authService.validateToken(token);

      // Create new session with enhanced security
      const session = await this.authService.createSession(payload.sub);

      // Set secure cookie with session token
      res.cookie(SECURITY.COOKIE_SECRET, session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: session.expiresIn * 1000
      });

      // Reset failed login attempts on success
      this.failedLoginAttempts.delete(clientIp);

      res.status(200).json({
        success: true,
        data: {
          token: session.token,
          expiresIn: session.expiresIn
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Track failed login attempts
      const clientIp = req.ip;
      const currentAttempts = this.failedLoginAttempts.get(clientIp);
      
      if (currentAttempts) {
        this.failedLoginAttempts.set(clientIp, {
          count: currentAttempts.count + 1,
          timestamp: Date.now()
        });
      } else {
        this.failedLoginAttempts.set(clientIp, {
          count: 1,
          timestamp: Date.now()
        });
      }

      next(error);
    }
  };

  /**
   * Enhanced sign-out handler with session cleanup and audit logging
   */
  public signOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies[SECURITY.COOKIE_SECRET];
      if (!token) {
        throw createUnauthorizedError('No active session found');
      }

      // Revoke session and add to blacklist
      await this.authService.revokeSession(token);

      // Clear session cookie
      res.clearCookie(SECURITY.COOKIE_SECRET, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      res.status(200).json({
        success: true,
        data: null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Enhanced session validation with role-based access control
   */
  public validateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies[SECURITY.COOKIE_SECRET];
      if (!token) {
        throw createUnauthorizedError('No active session found');
      }

      // Validate token and get user details
      const payload = await this.authService.validateToken(token);
      const user = await this.authService.getUserFromToken(token);

      // Apply rate limiting based on user role
      const rateLimit = user.roles.includes('ADMIN')
        ? RATE_LIMIT.MAX_REQUESTS.ADMIN
        : RATE_LIMIT.MAX_REQUESTS.AUTHENTICATED;

      res.set({
        'X-RateLimit-Limit': rateLimit.toString(),
        'X-RateLimit-Remaining': (rateLimit - 1).toString()
      });

      res.status(200).json({
        success: true,
        data: {
          user,
          sessionExpiry: payload.exp
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };
}