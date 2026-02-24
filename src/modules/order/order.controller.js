const { catchAsync } = require('../../shared/errors/custom-errors');
const HTTP_STATUS = require('../../shared/constants/http-status');
const orderService = require('./order.service');
const notificationService = require('../notification/notification.service');
const { Shop } = require('../shop/shop.model');

// Create controller object with methods wrapped in catchAsync
const orderController = {
  // Create new order
  createOrder: catchAsync(async (req, res) => {
    const shopId = req.user?.shop_id || req.params.shopId;
    const orderData = {
      ...req.body,
      shop_id: shopId
    };

    const order = await orderService.createOrder(orderData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Commande créée avec succès',
      data: order
    });
  }),

  // Get all orders for shop
  getOrders: catchAsync(async (req, res) => {
    const shopId = req.user?.shop_id || req.params.shopId;
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await orderService.getOrdersByShop(shopId, filters);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  }),

  // Get single order
  getOrder: catchAsync(async (req, res) => {
    const { id } = req.params;
    const shopId = req.user?.shop_id;

    const order = await orderService.getOrderById(id, shopId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: order
    });
  }),

  // Update order status with notifications
  updateStatus: catchAsync(async (req, res) => {
    const { id } = req.params;
    const shopId = req.user?.shop_id;
    const { status, note } = req.body;
    const changedBy = req.user?.id;

    const order = await orderService.updateStatus(id, shopId, status, changedBy, note);

    // Get shop info for notifications
    const shop = await Shop.findById(shopId);
    const shopName = shop?.shop_name || 'Boutique';

    // Send notifications based on new status
    try {
      if (status === 'CONFIRMED') {
        // TODO: Get customer user ID from order and notify
        // await notificationService.notifyOrderConfirmed(customerId, order, shopName);
      } else if (status === 'PAYMENT_REQUESTED') {
        // TODO: Get customer user ID from order and notify
        // await notificationService.notifyPaymentRequest(customerId, order, shopName);
      } else if (status === 'SHIPPED') {
        // TODO: Get customer user ID from order and notify
        // await notificationService.notifyOrderShipped(customerId, order, order.delivery?.tracking_number);
      } else if (status === 'DELIVERED') {
        // TODO: Get customer user ID from order and notify
        // await notificationService.notifyOrderDelivered(customerId, order);
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Statut mis à jour',
      data: order
    });
  }),

  // Update order
  updateOrder: catchAsync(async (req, res) => {
    const { id } = req.params;
    const shopId = req.user?.shop_id;

    const order = await orderService.updateOrder(id, shopId, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Commande mise à jour',
      data: order
    });
  }),

  // Client confirms payment (changes PAYMENT_REQUESTED → PAID)
  confirmPayment: catchAsync(async (req, res) => {
    const { id } = req.params;
    const clientUserId = req.user?.id;

    const order = await orderService.clientConfirmPayment(id, clientUserId);

    // Notify shop that payment is received
    try {
      const shop = await Shop.findById(order.shop_id);
      if (shop && shop.users) {
        const shopUserIds = shop.users.map(u => u.user_id.toString());
        await notificationService.notifyPaymentReceived(shopUserIds, order);
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Paiement confirmé avec succès',
      data: order
    });
  }),

  // Delete order
  deleteOrder: catchAsync(async (req, res) => {
    const { id } = req.params;
    const shopId = req.user?.shop_id;

    await orderService.deleteOrder(id, shopId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Commande supprimée'
    });
  }),

  // Get order history/status changes
  getOrderHistory: catchAsync(async (req, res) => {
    const { id } = req.params;
    const shopId = req.user?.shop_id;

    const order = await orderService.getOrderById(id, shopId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: order.status_history
    });
  }),

  // Get dashboard stats
  getDashboardStats: catchAsync(async (req, res) => {
    const shopId = req.user?.shop_id || req.params.shopId;
    const period = parseInt(req.query.period) || 30;

    const stats = await orderService.getOrderStats(shopId, period);
    const conversion = await orderService.getConversionRate(shopId, period);
    const byStatus = await orderService.getOrdersByStatus(shopId);
    const recent = await orderService.getRecentOrders(shopId, 5);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...stats,
        conversion_rate: conversion,
        orders_by_status_detailed: byStatus,
        recent_orders: recent
      }
    });
  }),

  // Export orders (Excel/CSV)
  exportOrders: catchAsync(async (req, res) => {
    const shopId = req.user?.shop_id || req.params.shopId;
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const orders = await orderService.getOrdersForExport(shopId, filters);

    // Format for export
    const formatted = orders.map(o => ({
      'Numéro': o.order_number,
      'Date': o.created_at.toISOString(),
      'Client': o.customer.name,
      'Téléphone': o.customer.phone,
      'Statut': o.status,
      'Produits': o.items.map(i => `${i.product_name} (x${i.quantity})`).join(', '),
      'Sous-total': o.subtotal,
      'Frais livraison': o.shipping_fee,
      'Remise': o.discount,
      'Total': o.total_amount,
      'Paiement': o.payment.method,
      'Statut paiement': o.payment.status
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: formatted
    });
  }),

  // Get orders to-do (pending tasks)
  getTodoList: catchAsync(async (req, res) => {
    const shopId = req.user?.shop_id;

    const [
      pendingOrders,
      confirmedOrders,
      shippedOrders
    ] = await Promise.all([
      orderService.getOrdersByShop(shopId, { status: 'PENDING', limit: 10 }),
      orderService.getOrdersByShop(shopId, { status: 'CONFIRMED', limit: 10 }),
      orderService.getOrdersByShop(shopId, { status: 'SHIPPED', limit: 10 })
    ]);

    const todo = [
      ...pendingOrders.orders.map(o => ({
        type: 'ORDER_PENDING',
        priority: 'high',
        title: `Nouvelle commande ${o.order_number}`,
        description: `${o.customer.name} - ${o.total_amount.toLocaleString()} Ar`,
        order_id: o._id,
        created_at: o.created_at
      })),
      ...confirmedOrders.orders.map(o => ({
        type: 'ORDER_TO_SHIP',
        priority: 'medium',
        title: `À expédier: ${o.order_number}`,
        description: `${o.customer.name} - ${o.items.length} article(s)`,
        order_id: o._id,
        created_at: o.created_at
      })),
      ...shippedOrders.orders.map(o => ({
        type: 'ORDER_IN_TRANSIT',
        priority: 'low',
        title: `En livraison: ${o.order_number}`,
        description: `Tracking: ${o.delivery?.tracking_number || 'N/A'}`,
        order_id: o._id,
        created_at: o.created_at
      }))
    ];

    // Sort by priority and date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    todo.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: todo.slice(0, 20)
    });
  })
};

module.exports = orderController;
