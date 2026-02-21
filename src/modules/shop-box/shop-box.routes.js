const express = require('express');
const router = express.Router();
const shopBoxController = require('./shop-box.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

/**
 * Public routes (no authentication required)
 */

// Get all shop boxes (with filters)
router.get('/', shopBoxController.getAllShopBoxes);

// Get available shop boxes
router.get('/available', shopBoxController.getAvailableShopBoxes);

// Get shop boxes by shop ID
router.get('/by-shop/:shopId', shopBoxController.getShopBoxesByShopId);

// Get shop box by ID
router.get('/:id', shopBoxController.getShopBoxById);

/**
 * Protected routes (authentication required)
 */

// Admin only routes
router.use(authenticate);
router.use(authorize(['admin']));

// Create shop box
router.post('/', shopBoxController.createShopBox);

// Bulk assign shops to shop boxes
router.post('/bulk-assign', shopBoxController.bulkAssignShops);

// Update shop box
router.put('/:id', shopBoxController.updateShopBox);

// Delete shop box
router.delete('/:id', shopBoxController.deleteShopBox);

// Update shop box status
router.patch('/:id/status', shopBoxController.updateStatus);

// Assign shop to shop box
router.post('/:id/assign', shopBoxController.assignShop);

// Unassign shop from shop box
router.post('/:id/unassign', shopBoxController.unassignShop);

module.exports = router;
