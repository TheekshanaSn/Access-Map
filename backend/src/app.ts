import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config/environment';
import apiRoutes from './routes';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';
import { securityHeaders } from './middleware/securityHeaders';
import { generalApiRateLimiter } from './middleware/rateLimiter';

export const createApp = (): Application => {
  const app = express();

  // Disable fingerprinting header
  app.disable('x-powered-by');

  // Hardened HTTP security headers
  app.use(securityHeaders);

  // Ensure upload directory exists
  const uploadsDir = path.resolve(process.cwd(), 'uploads/reports');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Cross-Origin Resource Sharing (CORS) with origin validation
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!requestOrigin) return callback(null, true);
        if (config.allowedOrigins.includes(requestOrigin) || !config.isProduction) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked request from origin: ${requestOrigin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
      maxAge: 86400, // 24 hours preflight cache
    })
  );

  app.use(cookieParser());
  // JSON payload parser with size limit to prevent buffer exhaustion attacks
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Static files serving for uploaded evidence images
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Root welcoming endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'AccessMap API',
      version: '1.0.0',
      description: 'API service for AccessMap accessibility mapping platform',
      documentation: '/api/health',
      environment: config.nodeEnv,
      status: 'operational',
    });
  });

  // Apply general API rate limiting to all /api endpoints
  app.use('/api', generalApiRateLimiter);

  // REST API routes
  app.use('/api', apiRoutes);

  // 404 & Global Error Handling
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
