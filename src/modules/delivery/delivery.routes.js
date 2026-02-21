const express = require('express');
const router = express.Router();
const deliveryController = require('./delivery.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { checkShopOwnership } = require('../../middlewares/auth.middleware');

// Middleware to allow shop users
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

// ========== ZONES ==========

// Create zone
router.post('/shops/:shopId/zones',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  deliveryController.createZone
);

// Get zones
router.get('/shops/:shopId/zones',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  deliveryController.getZones
);

// Update zone
router.put('/zones/:zoneId',
  authenticate,
  authorizeShopUser,
  deliveryController.updateZone
);

// Delete zone
router.delete('/zones/:zoneId',
  authenticate,
  authorizeShopUser,
  deliveryController.deleteZone
);

// Calculate fee
router.post('/shops/:shopId/zones/:zoneId/calculate-fee',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  deliveryController.calculateFee
);

// ========== DELIVERIES ==========

// Create delivery for order
router.post('/shops/:shopId/orders/:orderId/delivery',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  deliveryController.createDelivery
);

// Get deliveries by shop
router.get('/shops/:shopId/deliveries',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  deliveryController.getDeliveriesByShop
);

// Get delivery stats
router.get('/shops/:shopId/deliveries/stats',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  deliveryController.getStats
);

// Get delivery by ID
router.get('/deliveries/:id',
  authenticate,
  authorizeShopUser,
  deliveryController.getDeliveryById
);

// Get delivery by order ID
router.get('/orders/:orderId/delivery',
  authenticate,
  authorizeShopUser,
  deliveryController.getDeliveryByOrderId
);

// Update status
router.patch('/deliveries/:id/status',
  authenticate,
  authorizeShopUser,
  deliveryController.updateStatus
);

// Assign driver
router.patch('/deliveries/:id/driver',
  authenticate,
  authorizeShopUser,
  deliveryController.assignDriver
);

// Update external tracking
router.patch('/deliveries/:id/tracking',
  authenticate,
  authorizeShopUser,
  deliveryController.updateExternalTracking
);

// Sync external tracking
router.post('/deliveries/:id/sync-tracking',
  authenticate,
  authorizeShopUser,
  deliveryController.syncExternalTracking
);

// Cancel delivery
router.patch('/deliveries/:id/cancel',
  authenticate,
  authorizeShopUser,
  deliveryController.cancelDelivery
);

module.exports = router;
