import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum allowed requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

/**
 * Clean sliding-window in-memory rate limiter middleware.
 * Zero external dependencies, self-cleaning, and standards-compliant headers.
 */
export const createRateLimiter = (options: RateLimiterOptions) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests from this IP, please try again later.',
    keyGenerator = (req: Request) =>
      req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'unknown-client',
    skip = () => false,
  } = options;

  const hits = new Map<string, RateLimitRecord>();

  // Periodically purge stale records every 5 minutes to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
      if (record.timestamps.length === 0) {
        hits.delete(key);
      }
    }
  }, Math.max(windowMs, 60000));

  // Allow Node process to terminate without waiting for timer
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // Allow tests or whitelisted requests to bypass if specified
    if (skip(req) || process.env.DISABLE_RATE_LIMITER === 'true') {
      next();
      return;
    }

    const key = keyGenerator(req);
    const now = Date.now();
    let record = hits.get(key);

    if (!record) {
      record = { timestamps: [] };
      hits.set(key, record);
    }

    // Filter out timestamps outside window
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

    const currentCount = record.timestamps.length;
    const remaining = Math.max(0, maxRequests - currentCount - 1);
    const oldestTimestamp = record.timestamps[0] || now;
    const resetSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (currentCount >= maxRequests) {
      res.setHeader('Retry-After', resetSeconds);
      res.status(429).json({
        error: 'TooManyRequests',
        message,
        retryAfterSeconds: resetSeconds,
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
};

/**
 * Strict limiter for sensitive authentication endpoints (prevent brute-force login/register attacks)
 * 30 attempts per 15 minutes per IP
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: 'Too many authentication attempts from this IP address. Please wait 15 minutes before trying again.',
  skip: (req) => req.path === '/me' || req.method === 'GET', // only limit login/register/password actions
});

/**
 * General API limiter for public endpoints (mitigate denial-of-service)
 * 300 requests per 15 minutes per IP
 */
export const generalApiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 300,
  message: 'API rate limit exceeded. Please throttle your requests.',
  skip: (req) => req.path === '/health', // Health checks should not be blocked
});
