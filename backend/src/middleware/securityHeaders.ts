import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';

/**
 * Hardened HTTP security headers middleware.
 * Follows OWASP Secure Headers recommendations without third-party runtime dependencies.
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking protection: only allow same origin to frame
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Legacy cross-site scripting filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Privacy protection for HTTP referrers
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enforce HTTPS HSTS only in production environments
  if (config.isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Feature policy for privacy & sensor access
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), payment=()');

  // Content Security Policy for API payloads
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  next();
};
