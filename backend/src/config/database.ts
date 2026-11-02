import mongoose from 'mongoose';
import { config } from './environment';

export type DatabaseStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

let dbStatus: DatabaseStatus = 'disconnected';
let lastError: string | null = null;

export const connectDatabase = async (): Promise<boolean> => {
  try {
    dbStatus = 'connecting';
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 3000, // Timeout after 3 seconds so server does not hang if DB is offline
    });
    dbStatus = 'connected';
    lastError = null;
    console.log(`[Database] MongoDB connected successfully to ${config.mongoUri}`);
    return true;
  } catch (error: any) {
    dbStatus = 'error';
    lastError = error?.message || 'Unknown database connection error';
    console.warn(`[Database] Warning: MongoDB connection failed: ${lastError}`);
    console.warn(`[Database] Running server with MongoDB disconnected. You can configure MONGODB_URI in .env when ready.`);
    return false;
  }
};

export const getDatabaseHealth = () => {
  const readyStateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const currentState = mongoose.connection.readyState;

  return {
    status: dbStatus === 'connected' ? 'connected' : readyStateMap[currentState] || dbStatus,
    host: mongoose.connection.host || null,
    databaseName: mongoose.connection.name || null,
    lastError,
  };
};

