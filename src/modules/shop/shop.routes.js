const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const shopController = require('./shop.controller');
const productController = require('../product/product.controller');
const { authenticate, authorize, checkShopOwnership, requirePermission } = require('../../middlewares/auth.middleware');

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const shopId = req.params.shopId || req.user?.shop_id;
    const uploadDir = path.join(__dirname, '../../../../uploads/shops', shopId?.toString() || 'temp', 'logo');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware to allow shop users (similar to delivery routes)
const authorizeShopUser = (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error('Unauthorized');
    }
    if (['admin', 'brand', 'shop'].includes(req.user.user_type)) {
      return next();
    }
    throw new Error('Forbidden');
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
};

// ========== SHOP LIST ROUTES ==========

// Get all shops (for all authenticated users)
router.get('/',
  authenticate,
  authorize(['admin', 'brand', 'shop', 'buyer']),
  shopController.getAllShops
);

// ========== SHOP PROFILE ROUTES ==========

// Get my shop profile (from auth token)
router.get('/me/profile',
  authenticate,
  authorizeShopUser,
  shopController.getMyProfile
);

// Get my shop categories (from auth token)
router.get('/me/categories',
  authenticate,
  authorizeShopUser,
  shopController.getMyCategories
);

// Update my shop profile - only manager can edit
router.patch('/me/profile',
  authenticate,
  authorizeShopUser,
  requirePermission('edit_products'), // or create a specific 'edit_shop_profile' permission
  shopController.updateMyProfile
);

// Upload logo with file (multipart/form-data) - only manager
router.post('/me/profile/logo/upload',
  authenticate,
  authorizeShopUser,
  requirePermission('manage_employees'), // Using manage_employees as proxy for manager-only actions
  upload.single('logo'),
  shopController.uploadLogo
);

// Get shop profile by ID
router.get('/:shopId/profile',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  shopController.getProfile
);

// Full update (PUT)
router.put('/:shopId/profile',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  shopController.updateProfile
);

// Partial update (PATCH)
router.patch('/:shopId/profile',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  shopController.patchProfile
);

// Update logo URL
router.patch('/:shopId/profile/logo',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  shopController.updateLogo
);

// Upload logo with file for specific shop
router.post('/:shopId/profile/logo/upload',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  upload.single('logo'),
  shopController.uploadLogo
);

// Update location (with Google Maps coordinates)
router.patch('/:shopId/profile/location',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  shopController.updateLocation
);

// Update business hours
router.patch('/:shopId/profile/hours',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  shopController.updateBusinessHours
);

// Check if shop is open
router.get('/:shopId/open-status',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  shopController.checkOpenStatus
);

// Public route - Get all public/active shops
router.get('/public', shopController.getPublicShops);

// Public route - Search shops with filters
router.get('/search', shopController.searchShops);

// Public route - Get shops near location (for customers)
router.get('/nearby', shopController.getShopsNearby);

// Public route - Get public shop profile
router.get('/:shopId/public',
  shopController.getProfile
);

// Public route - Get products by shop
router.get('/:shopId/products',
  productController.getByShop.bind(productController)
);

module.exports = router;
