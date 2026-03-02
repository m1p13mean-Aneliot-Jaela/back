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
  ...config.cors.origins, // From environment variable (can be multiple, comma-separated)
  'http://localhost:4200',
  'http://localhost:4300',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:4300'
].filter((origin, index, self) => self.indexOf(origin) === index); // Remove duplicates

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Requested-With']
}));

// Body parsing middleware - increased limit for base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Static files serving (uploads) - must be before other middleware for proper handling
const uploadsDir = process.env.RENDER ? '/tmp/uploads' : path.join(__dirname, '../../uploads');
console.log('Static files directory:', uploadsDir, 'RENDER env:', !!process.env.RENDER);
app.use('/uploads', express.static(uploadsDir));

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
const leaseContractRoutes = require('./modules/lease-contract/lease-contract.routes');
const rentPaymentRoutes = require('./modules/rent-payment/rent-payment.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const quoteRequestRoutes = require('./modules/quote-request/quote-request.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/quotes', quoteRequestRoutes);
app.use('/api', deliveryRoutes); 
app.use('/api', employeeRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/admin', shopAdminRoutes);
app.use('/api/admin', leaseContractRoutes);
app.use('/api/admin', rentPaymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop-boxes', shopBoxRoutes);
app.use('/api/shop-categories', shopCategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api', stockRoutes);
app.use('/api', promotionRoutes);
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
