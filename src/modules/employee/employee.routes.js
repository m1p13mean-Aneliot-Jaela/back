const express = require('express');
const router = express.Router();
const employeeController = require('./employee.controller');
const { authenticate, authorize, checkShopManagerRole, checkEmployeeOwnership } = require('../../middlewares/auth.middleware');
const { validateRequest } = require('../../middlewares/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation rules
const createEmployeeValidation = [
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('shop_id').optional().isMongoId().withMessage('Invalid shop ID'),
  body('role').optional().isIn(['MANAGER_SHOP', 'STAFF']).withMessage('Role must be MANAGER_SHOP or STAFF'),
  body('phone').optional().trim()
];

const updateEmployeeValidation = [
  param('id').isMongoId().withMessage('Invalid employee ID'),
  body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['MANAGER_SHOP', 'STAFF']).withMessage('Role must be MANAGER_SHOP or STAFF'),
  body('phone').optional().trim(),
  body('active').optional().isBoolean().withMessage('Active must be a boolean')
];

const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid employee ID'),
  body('active').isBoolean().withMessage('Active status is required')
];

const shopIdValidation = [
  param('shopId').isMongoId().withMessage('Invalid shop ID')
];

// All routes require authentication
router.use(authenticate);

// ============================================
// EMPLOYEE CRUD ROUTES
// ============================================

// Create employee (for a specific shop) - only shop managers (MANAGER_SHOP) can create
router.post('/shops/:shopId/employees',
  shopIdValidation,
  createEmployeeValidation,
  validateRequest,
  authorize(['admin', 'brand', 'shop']),  // 'shop' user_type can access
  checkShopManagerRole,  // Verify it's MANAGER_SHOP role, not STAFF
  employeeController.createEmployee
);

// Get all employees by shop
router.get('/shops/:shopId/employees',
  shopIdValidation,
  validateRequest,
  authorize(['admin', 'brand', 'shop']),  // shop user_type (both MANAGER_SHOP and STAFF)
  employeeController.getEmployeesByShop
);

// Get employee stats by shop
router.get('/shops/:shopId/employees/stats',
  shopIdValidation,
  validateRequest,
  authorize(['admin', 'brand', 'shop']),
  checkShopManagerRole,
  employeeController.getEmployeeStats
);

// ============================================
// SINGLE EMPLOYEE ROUTES
// ============================================

// Get employee by ID
router.get('/employees/:id',
  param('id').isMongoId().withMessage('Invalid employee ID'),
  validateRequest,
  authorize(['admin', 'brand', 'shop']),  // shop user_type (both MANAGER_SHOP and STAFF can view)
  employeeController.getEmployeeById
);

// Update employee
router.put('/employees/:id',
  updateEmployeeValidation,
  validateRequest,
  authorize(['admin', 'brand', 'shop']),
  checkEmployeeOwnership,  // Check employee belongs to manager's shop
  employeeController.updateEmployee
);

// Update employee status (activate/deactivate)
router.patch('/employees/:id/status',
  updateStatusValidation,
  validateRequest,
  authorize(['admin', 'brand', 'shop']),
  checkEmployeeOwnership,  // Check employee belongs to manager's shop
  employeeController.updateStatus
);

// Delete employee
router.delete('/employees/:id',
  param('id').isMongoId().withMessage('Invalid employee ID'),
  validateRequest,
  authorize(['admin', 'brand', 'shop']),
  checkEmployeeOwnership,  // Check employee belongs to manager's shop
  employeeController.deleteEmployee
);

// ============================================
// PERMISSIONS ROUTES
// ============================================

// Get employee permissions
router.get('/employees/:id/permissions',
  param('id').isMongoId().withMessage('Invalid employee ID'),
  validateRequest,
  authorize(['admin', 'brand', 'shop']),  // shop user_type (both MANAGER_SHOP and STAFF)
  employeeController.getEmployeePermissions
);

// Check specific permission
router.get('/employees/:id/permissions/:permission',
  param('id').isMongoId().withMessage('Invalid employee ID'),
  param('permission').notEmpty().withMessage('Permission is required'),
  validateRequest,
  authorize(['admin', 'brand', 'shop']),  // shop user_type (both MANAGER_SHOP and STAFF)
  employeeController.checkPermission
);

module.exports = router;
