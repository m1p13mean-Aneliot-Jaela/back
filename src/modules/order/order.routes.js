const express = require('express');
const router = express.Router();

const orderController = require('./order.controller');
const {
  authenticate,
  authorizeShopUser,
  checkShopOwnership
} = require('../../middlewares/auth.middleware');

// ================= DEBUG =================
console.log("orderController:", orderController);
console.log("authenticate:", authenticate);
console.log("authorizeShopUser:", authorizeShopUser);
console.log("checkShopOwnership:", checkShopOwnership);
// =========================================

// GET /api/shops/me/orders
router.get(
  '/shops/me/orders',
  authenticate,
  authorizeShopUser,
  orderController.getOrders
);

// GET /api/shops/me/orders/stats
router.get(
  '/shops/me/orders/stats',
  authenticate,
  authorizeShopUser,
  orderController.getDashboardStats
);

// GET /api/shops/me/orders/todo
router.get(
  '/shops/me/orders/todo',
  authenticate,
  authorizeShopUser,
  orderController.getTodoList
);

// GET /api/shops/me/orders/export
router.get(
  '/shops/me/orders/export',
  authenticate,
  authorizeShopUser,
  orderController.exportOrders
);

// POST /api/orders (for clients/buyers - authenticated or with customer info)
router.post(
  '/orders',
  authenticate,
  orderController.createClientOrder
);

// GET /api/orders/my (get my orders as client/buyer)
router.get(
  '/orders/my',
  authenticate,
  orderController.getMyOrders
);

// POST /api/shops/me/orders
router.post(
  '/shops/me/orders',
  authenticate,
  authorizeShopUser,
  orderController.createOrder
);

// GET /api/orders/:id
router.get(
  '/orders/:id',
  authenticate,
  orderController.getOrder
);

// PATCH /api/orders/:id
router.patch(
  '/orders/:id',
  authenticate,
  orderController.updateOrder
);

// PATCH /api/orders/:id/status
router.patch(
  '/orders/:id/status',
  authenticate,
  orderController.updateStatus
);

// POST /api/orders/:id/confirm-payment (client confirms payment)
router.post(
  '/orders/:id/confirm-payment',
  authenticate,
  orderController.confirmPayment
);

// GET /api/orders/:id/history
router.get(
  '/orders/:id/history',
  authenticate,
  orderController.getOrderHistory
);

// DELETE /api/orders/:id
router.delete(
  '/orders/:id',
  authenticate,
  orderController.deleteOrder
);

// GET /api/shops/:shopId/orders
router.get(
  '/shops/:shopId/orders',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  orderController.getOrders
);

// GET /api/shops/:shopId/orders/stats
router.get(
  '/shops/:shopId/orders/stats',
  authenticate,
  authorizeShopUser,
  checkShopOwnership,
  orderController.getDashboardStats
);

module.exports = router;