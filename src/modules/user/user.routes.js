const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { validateRequest } = require('../../middlewares/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation rules
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
router.get('/', authorize(['admin']), userController.getAll);
router.get('/:id', authorize(['admin']), param('id').isMongoId(), validateRequest, userController.getById);
router.put('/:id', authorize(['admin']), param('id').isMongoId(), updateUserValidation, validateRequest, userController.update);
router.put('/:id/status', authorize(['admin']), updateStatusValidation, validateRequest, userController.updateStatus);
router.delete('/:id', authorize(['admin']), param('id').isMongoId(), validateRequest, userController.delete);

module.exports = router;
