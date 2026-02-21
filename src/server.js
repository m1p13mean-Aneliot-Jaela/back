const app = require('./app');
const config = require('./config/env');
const logger = require('./config/logger');
const database = require('./config/database');
const promotionService = require('./modules/promotion/promotion.service');

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

    // Schedule automatic promotion expiration (every hour)
    setInterval(async () => {
      try {
        const expiredCount = await promotionService.expireOldPromotions();
        if (expiredCount > 0) {
          logger.info(`${expiredCount} promotions auto-expirées`);
        }
      } catch (error) {
        logger.error('Erreur lors de l\'expiration automatique des promotions:', error);
      }
    }, 60 * 60 * 1000); // Every hour

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
