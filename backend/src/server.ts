import { createApp } from './app';
import { config } from './config/environment';
import { connectDatabase } from './config/database';

const startServer = async () => {
  const app = createApp();

  // Attempt database connection without blocking server boot
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`===============================================`);
    console.log(` AccessMap Backend Service Started`);
    console.log(` Port: ${config.port}`);
    console.log(` Environment: ${config.nodeEnv}`);
    console.log(` Health Check: http://localhost:${config.port}/api/health`);
    console.log(` Client Origin: ${config.clientOrigin}`);
    console.log(`===============================================`);
  });

  const gracefulShutdown = () => {
    console.log('[Server] Gracefully shutting down...');
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
};

startServer().catch((err) => {
  console.error('[Server] Fatal error during startup:', err);
  process.exit(1);
});

