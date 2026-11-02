import { Request, Response } from 'express';
import { getDatabaseHealth } from '../config/database';
import { config } from '../config/environment';

export const getHealth = (req: Request, res: Response): void => {
  const dbHealth = getDatabaseHealth();
  const uptime = process.uptime();

  const responsePayload = {
    status: 'healthy',
    service: 'AccessMap REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(uptime),
    environment: config.nodeEnv,
    database: dbHealth,
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      memoryUsageMb: {
        rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
        heapUsed: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      },
    },
  };

  res.status(200).json(responsePayload);
};

