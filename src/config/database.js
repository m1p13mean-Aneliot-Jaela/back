const mongoose = require('mongoose');
const config = require('./env');
const logger = require('./logger');

class Database {
  constructor() {
    this.mongoose = mongoose;
  }

  async connect() {
    try {
      const uri = config.env === 'test' ? config.mongodb.testUri : config.mongodb.uri;
      
      await mongoose.connect(uri);

      logger.info(`MongoDB connected successfully to ${config.env} database`);

      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err}`);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

    } catch (error) {
      logger.error(`Failed to connect to MongoDB: ${error.message}`);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error(`Error disconnecting from MongoDB: ${error.message}`);
    }
  }

  async clearDatabase() {
    if (config.env !== 'test') {
      throw new Error('clearDatabase can only be used in test environment');
    }
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

module.exports = new Database();
