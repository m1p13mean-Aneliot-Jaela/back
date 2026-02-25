const express = require('express');
const router = express.Router();
const shopController = require('./shop.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

// ========== ADMIN SHOP ROUTES ==========

// Get all shops
router.get('/shops',
  authenticate,
  authorize(['admin']),
  shopController.getAllShops
);

// Get shop by ID
router.get('/shops/:id',
  authenticate,
  authorize(['admin']),
  shopController.getShopById
);

// Create shop
router.post('/shops',
  authenticate,
  authorize(['admin']),
  shopController.createShop
);

// Update shop
router.put('/shops/:id',
  authenticate,
  authorize(['admin']),
  shopController.updateShop
);

// Delete shop
router.delete('/shops/:id',
  authenticate,
  authorize(['admin']),
  shopController.deleteShop
);

// Update shop categories
router.patch('/shops/:id/categories',
  authenticate,
  authorize(['admin']),
  shopController.updateShopCategories
);

// Assign user to shop
router.patch('/shops/:id/users',
  authenticate,
  authorize(['admin']),
  shopController.assignUserToShop
);

module.exports = router;
