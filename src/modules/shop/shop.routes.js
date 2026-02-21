const express = require('express');
const router = express.Router();
const shopController = require('./shop.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validateRequest } = require('../../middlewares/validation.middleware');
const { body, param } = require('express-validator');

// ============================================
// VALIDATION RULES
// ============================================

const createShopValidation = [
  body('shop_name').trim().notEmpty().withMessage('Shop name is required'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
  body('mall_location').optional().trim(),
  body('logo').optional().trim()
];

const updateShopValidation = [
  param('id').isMongoId().withMessage('Invalid shop ID'),
  body('shop_name').optional().trim().notEmpty().withMessage('Shop name cannot be empty'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
  body('mall_location').optional().trim(),
  body('logo').optional().trim()
];

const shopIdValidation = [
  param('id').isMongoId().withMessage('Invalid shop ID')
];

const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid shop ID'),
  body('status')
    .isIn(['pending', 'validated', 'active', 'deactivated', 'suspended'])
    .withMessage('Invalid status'),
  body('reason').optional().trim()
];

const statusReasonValidation = [
  param('id').isMongoId().withMessage('Invalid shop ID'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10 })
    .withMessage('Reason must be at least 10 characters')
];

const addCategoryValidation = [
  param('id').isMongoId().withMessage('Invalid shop ID'),
  body('category_id').isMongoId().withMessage('Valid category ID is required'),
  body('name').trim().notEmpty().withMessage('Category name is required')
];

const addUserValidation = [
  param('id').isMongoId().withMessage('Invalid shop ID'),
  body('user_id').isMongoId().withMessage('Valid user ID is required'),
  body('role').isIn(['MANAGER_SHOP', 'STAFF']).withMessage('Role must be MANAGER_SHOP or STAFF'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required')
];

const updateUserRoleValidation = [
  param('id').isMongoId().withMessage('Invalid shop ID'),
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('role').isIn(['MANAGER_SHOP', 'STAFF']).withMessage('Role must be MANAGER_SHOP or STAFF')
];

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// All routes require authentication
router.use(authenticate);

// ============================================
// ADMIN ROUTES - Shop CRUD
// ============================================

// Get shop statistics
router.get('/admin/analytics/stats',
  authorize(['admin']),
  shopController.getShopStats
);

// Search shops
router.get('/admin/search',
  authorize(['admin']),
  shopController.searchShops
);

// Get shops by category
router.get('/admin/category/:categoryId',
  authorize(['admin']),
  param('categoryId').isMongoId().withMessage('Invalid category ID'),
  validateRequest,
  shopController.getShopsByCategory
);

// Get shops by status
router.get('/admin/status/:status',
  authorize(['admin']),
  param('status')
    .isIn(['pending', 'validated', 'active', 'deactivated', 'suspended'])
    .withMessage('Invalid status'),
  validateRequest,
  shopController.getShopsByStatus
);

// Create shop
router.post('/admin',
  authorize(['admin']),
  createShopValidation,
  validateRequest,
  shopController.createShop
);

// Get all shops
router.get('/admin',
  authorize(['admin']),
  shopController.getAllShops
);

// Get shop by ID
router.get('/admin/:id',
  authorize(['admin', 'shop']),
  shopIdValidation,
  validateRequest,
  shopController.getShopById
);

// Update shop
router.put('/admin/:id',
  authorize(['admin']),
  updateShopValidation,
  validateRequest,
  shopController.updateShop
);

// Update shop status
router.patch('/admin/:id/status',
  authorize(['admin']),
  updateStatusValidation,
  validateRequest,
  shopController.updateShopStatus
);

// Validate shop (pending -> validated)
router.patch('/admin/:id/validate',
  authorize(['admin']),
  shopIdValidation,
  validateRequest,
  shopController.validateShop
);

// Activate shop
router.patch('/admin/:id/activate',
  authorize(['admin']),
  shopIdValidation,
  validateRequest,
  shopController.activateShop
);

// Deactivate shop
router.patch('/admin/:id/deactivate',
  authorize(['admin']),
  statusReasonValidation,
  validateRequest,
  shopController.deactivateShop
);

// Suspend shop
router.patch('/admin/:id/suspend',
  authorize(['admin']),
  statusReasonValidation,
  validateRequest,
  shopController.suspendShop
);

// Delete shop
router.delete('/admin/:id',
  authorize(['admin']),
  shopIdValidation,
  validateRequest,
  shopController.deleteShop
);

// ============================================
// CATEGORY MANAGEMENT
// ============================================

// Add category to shop
router.post('/admin/:id/categories',
  authorize(['admin']),
  addCategoryValidation,
  validateRequest,
  shopController.addCategory
);

// Remove category from shop
router.delete('/admin/:id/categories/:categoryId',
  authorize(['admin']),
  param('id').isMongoId().withMessage('Invalid shop ID'),
  param('categoryId').isMongoId().withMessage('Invalid category ID'),
  validateRequest,
  shopController.removeCategory
);

// ============================================
// USER MANAGEMENT
// ============================================

// Add user to shop
router.post('/admin/:id/users',
  authorize(['admin']),
  addUserValidation,
  validateRequest,
  shopController.addUser
);

// Remove user from shop
router.delete('/admin/:id/users/:userId',
  authorize(['admin']),
  param('id').isMongoId().withMessage('Invalid shop ID'),
  param('userId').isMongoId().withMessage('Invalid user ID'),
  validateRequest,
  shopController.removeUser
);

// Update user role in shop
router.patch('/admin/:id/users/:userId/role',
  authorize(['admin']),
  updateUserRoleValidation,
  validateRequest,
  shopController.updateUserRole
);

module.exports = router;
