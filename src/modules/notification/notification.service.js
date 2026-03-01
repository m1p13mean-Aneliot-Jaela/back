const Notification = require('./notification.model');
const mongoose = require('mongoose');

class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(data) {
    console.log('🔔 [NotificationService] Creating notification:', {
      recipient_id: data.recipient_id || data.user_id,
      recipient_type: data.recipient_type || 'USER',
      type: data.type,
      title: data.title
    });

    // Create notification exactly like Order model does it
    const notification = new Notification({
      recipient_id: data.recipient_id || data.user_id,
      recipient_type: data.recipient_type || 'USER',
      user_id: data.user_id || data.recipient_id,
      type: data.type,
      order_id: data.order_id || null,
      shop_id: data.shop_id || null,
      product_id: data.product_id || null,
      title: data.title,
      message: data.message,
      action_data: {
        url: data.action_url || (data.action_data?.url),
        icon: data.icon || (data.action_data?.icon) || 'notifications',
        color: data.color || (data.action_data?.color) || 'info',
        priority: data.priority || (data.action_data?.priority) || 'NORMAL'
      }
    });

    const saved = await notification.save();
    console.log('✅ [NotificationService] Notification saved:', {
      id: saved._id,
      recipient_id: saved.recipient_id,
      recipient_type: saved.recipient_type
    });
    return saved;
  }

  /**
   * Get notifications for a recipient (user or shop)
   */
  async getNotifications(recipientId, options = {}) {
    const { limit = 20, unreadOnly = false } = options;

    // Convert to ObjectId like Order service does
    const query = { 
      recipient_id: mongoose.Types.ObjectId.isValid(recipientId) 
        ? new mongoose.Types.ObjectId(recipientId) 
        : recipientId 
    };
    
    if (unreadOnly) {
      query.is_read = false;
    }

    console.log('🔔 [NotificationService] Querying with:', {
      recipient_id: query.recipient_id.toString(),
      unreadOnly
    });

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('order_id', 'order_number total_amount')
      .populate('shop_id', 'shop_name')
      .populate('product_id', 'name')
      .lean();

    console.log('🔔 [NotificationService] Found', notifications.length, 'notifications');

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, recipientId) {
    const query = {
      _id: notificationId,
      recipient_id: mongoose.Types.ObjectId.isValid(recipientId) 
        ? new mongoose.Types.ObjectId(recipientId) 
        : recipientId
    };

    return await Notification.findOneAndUpdate(
      query,
      { is_read: true, read_at: new Date() },
      { new: true }
    );
  }

  /**
   * Mark all as read for a recipient
   */
  async markAllAsRead(recipientId) {
    const query = {
      recipient_id: mongoose.Types.ObjectId.isValid(recipientId) 
        ? new mongoose.Types.ObjectId(recipientId) 
        : recipientId,
      is_read: false
    };

    return await Notification.updateMany(
      query,
      { is_read: true, read_at: new Date() }
    );
  }

  /**
   * Get unread count
   */
  async getUnreadCount(recipientId) {
    const query = {
      recipient_id: mongoose.Types.ObjectId.isValid(recipientId) 
        ? new mongoose.Types.ObjectId(recipientId) 
        : recipientId,
      is_read: false
    };

    return await Notification.countDocuments(query);
  }

  // ===== ORDER NOTIFICATIONS =====

  /**
   * Notify client that order is confirmed
   */
  async notifyOrderConfirmed(userId, order, shopName) {
    return await this.createNotification({
      recipient_id: userId,
      recipient_type: 'USER',
      user_id: userId,
      type: 'ORDER_CONFIRMED',
      order_id: order._id,
      shop_id: order.shop_id,
      title: 'Commande confirmée',
      message: `Votre commande ${order.order_number} de ${shopName} a été confirmée.`,
      action_url: `/client/orders/${order._id}`,
      icon: 'check_circle',
      color: 'success'
    });
  }

  /**
   * Notify client to pay
   */
  async notifyPaymentRequest(userId, order, shopName) {
    return await this.createNotification({
      recipient_id: userId,
      recipient_type: 'USER',
      user_id: userId,
      type: 'PAYMENT_REQUESTED',
      order_id: order._id,
      shop_id: order.shop_id,
      title: 'Paiement requis',
      message: `Veuillez payer ${order.total_amount.toLocaleString()} Ar pour votre commande ${order.order_number}.`,
      action_url: `/client/orders/${order._id}`,
      icon: 'payment',
      color: 'warning',
      priority: 'HIGH'
    });
  }

  /**
   * Notify shop about new order
   */
  async notifyShopNewOrder(shopId, order) {
    return await this.createNotification({
      recipient_id: shopId,
      recipient_type: 'SHOP',
      type: 'ORDER_NEW',
      order_id: order._id,
      shop_id: shopId,
      title: 'Nouvelle commande reçue !',
      message: `Commande #${order.order_number} de ${order.customer?.name || 'un client'} pour ${order.total_amount?.toLocaleString()} Ar`,
      action_url: `/boutique/orders/${order._id}`,
      icon: 'shopping_cart',
      color: 'success',
      priority: 'HIGH'
    });
  }

  /**
   * Notify shop that client paid
   */
  async notifyPaymentReceived(shopUserIds, order) {
    const notifications = [];

    for (const userId of shopUserIds) {
      const notif = await this.createNotification({
        recipient_id: userId,
        recipient_type: 'USER',
        user_id: userId,
        type: 'PAYMENT_RECEIVED',
        order_id: order._id,
        shop_id: order.shop_id,
        title: 'Paiement reçu',
        message: `Le client a confirmé le paiement de ${order.total_amount.toLocaleString()} Ar pour la commande ${order.order_number}.`,
        action_url: `/boutique/orders/${order._id}`,
        icon: 'paid',
        color: 'success'
      });
      notifications.push(notif);
    }

    // Also notify the shop itself
    await this.createNotification({
      recipient_id: order.shop_id,
      recipient_type: 'SHOP',
      type: 'PAYMENT_RECEIVED',
      order_id: order._id,
      shop_id: order.shop_id,
      title: 'Paiement reçu',
      message: `Le client a confirmé le paiement de ${order.total_amount.toLocaleString()} Ar pour la commande ${order.order_number}.`,
      action_url: `/boutique/orders/${order._id}`,
      icon: 'paid',
      color: 'success'
    });

    return notifications;
  }

  /**
   * Notify client that order is shipped
   */
  async notifyOrderShipped(userId, order, trackingNumber) {
    const message = trackingNumber
      ? `Votre commande ${order.order_number} a été expédiée. N° de suivi: ${trackingNumber}`
      : `Votre commande ${order.order_number} a été expédiée.`;

    return await this.createNotification({
      recipient_id: userId,
      recipient_type: 'USER',
      user_id: userId,
      type: 'ORDER_SHIPPED',
      order_id: order._id,
      shop_id: order.shop_id,
      title: 'Commande expédiée',
      message,
      action_url: `/client/orders/${order._id}`,
      icon: 'local_shipping',
      color: 'info'
    });
  }

  /**
   * Notify client that order is delivered
   */
  async notifyOrderDelivered(userId, order) {
    return await this.createNotification({
      recipient_id: userId,
      recipient_type: 'USER',
      user_id: userId,
      type: 'ORDER_DELIVERED',
      order_id: order._id,
      shop_id: order.shop_id,
      title: 'Commande livrée',
      message: `Votre commande ${order.order_number} a été livrée. Merci pour votre confiance !`,
      action_url: `/client/orders/${order._id}`,
      icon: 'home',
      color: 'success'
    });
  }

  /**
   * Notify order canceled
   */
  async notifyOrderCanceled(userId, order, canceledBy, reason) {
    return await this.createNotification({
      recipient_id: userId,
      recipient_type: 'USER',
      user_id: userId,
      type: 'ORDER_CANCELED',
      order_id: order._id,
      shop_id: order.shop_id,
      title: 'Commande annulée',
      message: `La commande ${order.order_number} a été annulée par ${canceledBy}. ${reason || ''}`,
      action_url: `/client/orders/${order._id}`,
      icon: 'cancel',
      color: 'error'
    });
  }

  /**
   * Notify shop about low stock
   */
  async notifyShopLowStock(shopId, product, currentQty) {
    return await this.createNotification({
      recipient_id: shopId,
      recipient_type: 'SHOP',
      type: 'STOCK_LOW',
      shop_id: shopId,
      product_id: product._id,
      title: 'Stock faible',
      message: `Le produit "${product.name}" n'a plus que ${currentQty} unités en stock`,
      action_url: `/boutique/stock`,
      icon: 'warning',
      color: 'warning',
      priority: 'HIGH'
    });
  }

  /**
   * Notify clients about new promotion
   */
  async notifyClientsNewPromotion(userIds, promotion, shopId, shopName) {
    const results = [];
    for (const userId of userIds) {
      const result = await this.createNotification({
        recipient_id: userId,
        recipient_type: 'USER',
        user_id: userId,
        type: 'PROMOTION_NEW',
        shop_id: shopId,
        title: `Nouvelle promotion chez ${shopName} !`,
        message: `${promotion.title} - ${promotion.discount_percentage || promotion.discount_amount}% de réduction`,
        action_url: `/client/shops/${shopId}`,
        icon: 'campaign',
        color: 'success'
      });
      results.push(result);
    }
    return results;
  }

  /**
   * Notify shop about new review
   */
  async notifyShopNewReview(shopId, review, product) {
    return await this.createNotification({
      recipient_id: shopId,
      recipient_type: 'SHOP',
      type: 'REVIEW_NEW',
      shop_id: shopId,
      product_id: product._id,
      title: 'Nouvel avis reçu',
      message: `${review.rating}★ - "${review.comment?.substring(0, 50)}..." sur ${product.name}`,
      action_url: `/boutique/reviews`,
      icon: 'star',
      color: 'info'
    });
  }

  /**
   * Notify client about stock alert for wishlist item
   */
  async notifyClientStockAlert(userId, product, shopId) {
    return await this.createNotification({
      recipient_id: userId,
      recipient_type: 'USER',
      user_id: userId,
      type: 'WISHLIST_PRICE_DROP',
      shop_id: shopId,
      product_id: product._id,
      title: 'Baisse de prix !',
      message: `"${product.name}" est maintenant à ${product.price?.toLocaleString()} Ar`,
      action_url: `/client/products/${product._id}`,
      icon: 'trending_down',
      color: 'success'
    });
  }
}

module.exports = new NotificationService();
