import mongoose from 'mongoose';
import { config } from './environment';

export type DatabaseStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

let dbStatus: DatabaseStatus = 'disconnected';
let lastError: string | null = null;

// Never buffer queries in memory when MongoDB is disconnected; fail fast or use in-memory store
mongoose.set('bufferCommands', false);

export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const connectDatabase = async (): Promise<boolean> => {
  try {
    dbStatus = 'connecting';
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2000, // Timeout after 2 seconds so server starts immediately
    });
    dbStatus = 'connected';
    lastError = null;
    console.log(`[Database] MongoDB connected successfully to ${config.mongoUri}`);
    return true;
  } catch (error: any) {
    dbStatus = 'disconnected';
    lastError = error?.message || 'MongoDB connection unavailable';
    console.warn(`[Database] Notice: MongoDB is not running locally (${lastError}).`);
    console.warn(`[Database] Seamlessly activated In-Memory Store for authentication and audits.`);
    console.warn(`[Database] All registration, login, JWT and moderation features will work in development mode.`);
    console.warn(`[Database] To persist to real MongoDB, start mongod or configure MONGODB_URI in backend/.env.`);
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
    status: isDatabaseConnected() ? 'connected' : readyStateMap[currentState] || dbStatus,
    host: mongoose.connection.host || null,
    databaseName: mongoose.connection.name || null,
    inMemoryFallbackActive: !isDatabaseConnected(),
    lastError,
  };
};
