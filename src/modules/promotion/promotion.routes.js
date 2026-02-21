const express = require('express');
const router = express.Router();
const promotionController = require('./promotion.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { checkShopOwnership } = require('../../middlewares/auth.middleware');

// Middleware to allow shop users (MANAGER_SHOP or STAFF)
const authorizeShopUser = (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error('Unauthorized');
    }
    // Allow admin, brand, or shop user_type
    if (['admin', 'brand', 'shop'].includes(req.user.user_type)) {
      return next();
    }
    throw new Error('Forbidden');
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
};

// Shop-scoped routes
router.get('/shops/:shopId/promotions', 
  authenticate, 
  authorizeShopUser,
  checkShopOwnership,
  promotionController.getPromotionsByShop
);

router.post('/shops/:shopId/promotions',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  promotionController.createPromotion
);

router.get('/shops/:shopId/promotions/stats',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  promotionController.getPromotionStats
);

// Individual promotion routes
router.post('/promotions',
  authenticate,
  authorizeShopUser,
  promotionController.createPromotion
);

router.get('/promotions/:id',
  authenticate,
  authorizeShopUser,
  promotionController.getPromotionById
);

router.put('/promotions/:id',
  authenticate,
  authorizeShopUser,
  promotionController.updatePromotion
);

router.delete('/promotions/:id',
  authenticate,
  authorizeShopUser,
  promotionController.deletePromotion
);

router.patch('/promotions/:id/status',
  authenticate,
  authorizeShopUser,
  promotionController.toggleStatus
);

router.get('/promotions/:id/products',
  authenticate,
  authorizeShopUser,
  promotionController.getPromotionProducts
);

router.put('/promotions/:id/products',
  authenticate,
  authorizeShopUser,
  promotionController.updatePromotionProducts
);

// Validate promo code (public or shop-scoped)
router.get('/promotions/validate/:code',
  authenticate,
  authorizeShopUser,
  promotionController.validatePromoCode
);

// Apply promo code to order
router.post('/promotions/apply/:code',
  authenticate,
  authorizeShopUser,
  promotionController.applyPromoCode
);

router.get('/shops/:shopId/promotions/active',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  promotionController.getActivePromotionsForProducts
);

module.exports = router;
