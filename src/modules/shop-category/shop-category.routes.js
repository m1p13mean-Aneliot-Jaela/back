const express = require('express');
const router = express.Router();
const shopCategoryController = require('./shop-category.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validateRequest } = require('../../middlewares/validation.middleware');
const { body, param } = require('express-validator');

// ============================================
// PUBLIC ROUTES - No authentication required
// ============================================

// Get all categories (public)
router.get('/',
  shopCategoryController.getAllCategories
);

// ============================================
// VALIDATION RULES
// ============================================

const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('parent_category_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID')
];

const updateCategoryValidation = [
  param('id').isMongoId().withMessage('Invalid category ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('parent_category_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID')
];

const categoryIdValidation = [
  param('id').isMongoId().withMessage('Invalid category ID')
];

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// All routes require authentication
router.use(authenticate);

// ============================================
// ADMIN ROUTES - Category CRUD
// ============================================

// Get category tree
router.get('/admin/tree',
  authorize(['admin']),
  shopCategoryController.getCategoryTree
);

// Get root categories
router.get('/admin/root',
  authorize(['admin']),
  shopCategoryController.getRootCategories
);

// Search categories
router.get('/admin/search',
  authorize(['admin']),
  shopCategoryController.searchCategories
);

// Create category
router.post('/admin',
  authorize(['admin']),
  createCategoryValidation,
  validateRequest,
  shopCategoryController.createCategory
);

// Get all categories
router.get('/admin',
  authorize(['admin']),
  shopCategoryController.getAllCategories
);

// Get category by ID
router.get('/admin/:id',
  authorize(['admin']),
  categoryIdValidation,
  validateRequest,
  shopCategoryController.getCategoryById
);

// Get category children
router.get('/admin/:id/children',
  authorize(['admin']),
  categoryIdValidation,
  validateRequest,
  shopCategoryController.getCategoryChildren
);

// Get category descendants
router.get('/admin/:id/descendants',
  authorize(['admin']),
  categoryIdValidation,
  validateRequest,
  shopCategoryController.getCategoryDescendants
);

// Update category
router.put('/admin/:id',
  authorize(['admin']),
  updateCategoryValidation,
  validateRequest,
  shopCategoryController.updateCategory
);

// Delete category
router.delete('/admin/:id',
  authorize(['admin']),
  categoryIdValidation,
  validateRequest,
  shopCategoryController.deleteCategory
);

module.exports = router;
