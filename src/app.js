const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config/env');
const logger = require('./config/logger');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Cookie parsing middleware
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
  config.cors.origin,
  'http://localhost:4200',
  'http://localhost:4300',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:4300'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Static files serving (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

// API routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const employeeRoutes = require('./modules/employee/employee.routes');
const shopRoutes = require('./modules/shop/shop.routes');
const shopAdminRoutes = require('./modules/shop/shop.admin.routes');
const shopBoxRoutes = require('./modules/shop-box/shop-box.routes');
const shopCategoryRoutes = require('./modules/shop-category/shop-category.routes');
const productRoutes = require('./modules/product/product.routes');
const stockRoutes = require('./modules/stock/stock.routes');
const promotionRoutes = require('./modules/promotion/promotion.routes');
const deliveryRoutes = require('./modules/delivery/delivery.routes');
const orderRoutes = require('./modules/order/order.routes');
const notificationRoutes = require('./modules/notification/notification.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', employeeRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/admin', shopAdminRoutes);
app.use('/api/shop-boxes', shopBoxRoutes);
app.use('/api/shop-categories', shopCategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api', stockRoutes);
app.use('/api', promotionRoutes);
app.use('/api', deliveryRoutes);
app.use('/api', orderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

module.exports = app;
