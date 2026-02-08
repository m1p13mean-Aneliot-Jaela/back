const app = require('./app');
const config = require('./config/env');
const logger = require('./config/logger');
const database = require('./config/database');

async function startServer() {
  try {
    // Connect to database (optional)
    try {
      await database.connect();
    } catch (dbError) {
      logger.warn('MongoDB connection failed, continuing without database');
      logger.warn(dbError.message);
    }

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on http://${config.host}:${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        await database.disconnect();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();
