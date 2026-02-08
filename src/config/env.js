require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || 'localhost',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/m1p13mean',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/m1p13mean_test'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

module.exports = config;
