import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config/environment';
import apiRoutes from './routes';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app = express();

  // Ensure upload directory exists
  const uploadsDir = path.resolve(process.cwd(), 'uploads/reports');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Middleware
  app.use(
    cors({
      origin: [config.clientOrigin, 'http://localhost:4200', 'http://127.0.0.1:4200'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files serving for uploaded evidence images
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Root welcoming endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'AccessMap API',
      version: '1.0.0',
      description: 'API service for AccessMap accessibility mapping platform',
      documentation: '/api/health',
    });
  });

  // REST API routes
  app.use('/api', apiRoutes);

  // 404 & Global Error Handling
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
