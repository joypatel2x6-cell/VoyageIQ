const app = require('./app');
const config = require('./config/env');
const prisma = require('./config/prisma');

const server = app.listen(config.port, () => {
  console.log(`=================================`);
  console.log(`🚀 VoyageIQ API Server running!`);
  console.log(`Environment: ${config.env}`);
  console.log(`Port:        ${config.port}`);
  console.log(`Health endpoint: http://localhost:${config.port}/api/v1/health`);
  console.log(`=================================`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n[${signal}] Shutdown signal received. Closing server and database connections...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('Database client disconnected.');
      process.exit(0);
    } catch (err) {
      console.error('Error disconnecting database:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
