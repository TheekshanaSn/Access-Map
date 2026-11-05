import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Parse allowed CORS origins: supports comma-separated string or single origin
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:4200';
const allowedOrigins = rawAllowedOrigins
  .split(',')
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

// Default development secret
const DEFAULT_DEV_JWT_SECRET = 'accessmap_development_super_secret_jwt_key_2026_change_in_production';
const jwtSecret = process.env.JWT_SECRET || DEFAULT_DEV_JWT_SECRET;

// Security check in production
if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_DEV_JWT_SECRET) {
    console.error('[CRITICAL SECURITY WARNING] JWT_SECRET must be explicitly set to a strong random key in production!');
  } else if (process.env.JWT_SECRET.length < 32) {
    console.warn('[SECURITY WARNING] JWT_SECRET should be at least 32 characters long for cryptographic safety.');
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
  allowedOrigins: isProduction
    ? [...new Set([...allowedOrigins, 'capacitor://localhost', 'https://localhost', 'http://localhost'])]
    : [...new Set([...allowedOrigins, 'http://localhost:4200', 'http://127.0.0.1:4200', 'capacitor://localhost', 'http://localhost', 'https://localhost'])],
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/accessmap',
  isProduction,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: 'access_token',
};
