import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { UserRole } from '../models/user.model';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Generate a signed JWT token
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

/**
 * Set secure HttpOnly cookie for session/token management
 */
export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(config.cookieName, token, {
    httpOnly: true, // Prevents XSS script access
    secure: config.isProduction, // HTTPS only in production
    sameSite: config.isProduction ? 'strict' : 'lax', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  });
};

/**
 * Clear the auth cookie on logout
 */
export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    path: '/',
  });
};

/**
 * Extract token from Authorization Bearer header OR HttpOnly cookie
 */
export const extractToken = (req: Request): string | null => {
  // 1. Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. HttpOnly Cookie
  if (req.cookies && req.cookies[config.cookieName]) {
    return req.cookies[config.cookieName];
  }

  return null;
};

/**
 * Enforce authentication on protected endpoints
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is required to access this resource',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Your session has expired. Please log in again.',
      });
      return;
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or malformed authentication token',
    });
  }
};

/**
 * Optional authentication: populates req.user if a valid token is provided,
 * but allows public requests without token to proceed
 */
export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch {
      // Ignored for optional auth
    }
  }
  next();
};

/**
 * Role-Based Access Control Guard
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Forbidden: requires one of the following roles: [${allowedRoles.join(', ')}]`,
        currentRole: req.user.role,
      });
      return;
    }

    next();
  };
};

/**
 * Convenience guards
 */
export const requireModeratorOrAdmin = requireRole('moderator', 'admin');
export const requireAdmin = requireRole('admin');
