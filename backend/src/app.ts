import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config/environment';
import apiRoutes from './routes';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: [config.clientOrigin, 'http://localhost:4200', 'http://127.0.0.1:4200'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

