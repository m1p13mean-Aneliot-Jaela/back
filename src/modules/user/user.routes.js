const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validateRequest } = require('../../middlewares/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation rules
const createUserValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('user_type').isIn(['admin', 'shop', 'buyer']).withMessage('Invalid user type'),
  body('phone').optional().trim()
];

const assignToShopValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('shop_id').isMongoId().withMessage('Shop ID is required and must be valid'),
  body('role').isIn(['MANAGER_SHOP', 'STAFF']).withMessage('Role must be either MANAGER_SHOP or STAFF')
];

const updateUserValidation = [
  body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().trim(),
  body('profile_photo').optional().isURL().withMessage('Invalid profile photo URL')
];

const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('status').isIn(['active', 'suspended', 'blocked']).withMessage('Invalid status'),
  body('reason').optional().trim()
];

// Public routes - none for users

// Protected routes - require authentication
router.use(authenticate);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', updateUserValidation, validateRequest, userController.updateProfile);

// Admin only routes
router.get('/stats', authorize(['admin']), userController.getStats);
router.post('/', authorize(['admin']), createUserValidation, validateRequest, userController.create);
router.get('/', authorize(['admin']), userController.getAll);
router.get('/:id', authorize(['admin']), param('id').isMongoId(), validateRequest, userController.getById);
router.put('/:id', authorize(['admin']), param('id').isMongoId(), updateUserValidation, validateRequest, userController.update);
router.put('/:id/status', authorize(['admin']), updateStatusValidation, validateRequest, userController.updateStatus);
router.put('/:id/shop', authorize(['admin']), assignToShopValidation, validateRequest, userController.assignToShop);
router.delete('/:id', authorize(['admin']), param('id').isMongoId(), validateRequest, userController.delete);

module.exports = router;
