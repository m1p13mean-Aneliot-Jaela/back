const express = require('express');
const router = express.Router();
const stockController = require('./stock.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

// Stock routes (collection séparée)
router.get('/shops/:shopId/stocks',
  authenticate,
  authorize({ user_type: 'shop' }),
  stockController.getByShop
);

// Get all stocks without pagination (for stock management page)
router.get('/shops/:shopId/stocks/all',
  authenticate,
  authorize({ user_type: 'shop' }),
  stockController.getAllByShop
);

router.get('/shops/:shopId/stocks/alerts',
  authenticate,
  authorize({ user_type: 'shop' }),
  stockController.getAlerts
);

router.get('/shops/:shopId/stocks/stats',
  authenticate,
  authorize({ user_type: 'shop' }),
  stockController.getStats
);

router.get('/products/:productId/stock',
  authenticate,
  authorize({ user_type: 'shop' }),
  stockController.getByProductId
);

router.post('/shops/:shopId/products/:productId/stock/add',
  authenticate,
  authorize({ user_type: 'shop' }),
  stockController.addStock
);

router.post('/shops/:shopId/products/:productId/stock/remove',
  authenticate,
  authorize({ user_type: 'shop' }),
  stockController.removeStock
);

router.put('/shops/:shopId/products/:productId/stock',
  authenticate,
  authorize({ user_type: 'shop' }),
  stockController.updateStock
);

// Get stock movements by product ID
router.get('/products/:productId/stock/movements',
  authenticate,
  authorize({ user_type: 'shop' }),
  stockController.getMovements
);

module.exports = router;
