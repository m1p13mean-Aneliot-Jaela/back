const Notification = require('./notification.model');

class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(data) {
    const notification = new Notification({
      user_id: data.user_id,
      type: data.type,
      order_id: data.order_id,
      shop_id: data.shop_id,
      title: data.title,
      message: data.message,
      action_data: data.action_data || {},
      created_at: new Date()
    });
    
    return await notification.save();
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, options = {}) {
    const { limit = 20, unreadOnly = false } = options;
    
    const query = { user_id: userId };
    if (unreadOnly) {
      query.is_read = false;
    }
    
    return await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('order_id', 'order_number total_amount')
      .populate('shop_id', 'shop_name')
      .lean();
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, user_id: userId },
      { is_read: true, read_at: new Date() },
      { new: true }
    );
  }

  /**
   * Mark all as read for a user
   */
  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { user_id: userId, is_read: false },
      { is_read: true, read_at: new Date() }
    );
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    return await Notification.countDocuments({
      user_id: userId,
      is_read: false
    });
  }

  // ===== ORDER NOTIFICATIONS =====

  /**
   * Notify client that order is confirmed
   */
  async notifyOrderConfirmed(userId, order, shopName) {
    return await this.createNotification({
      user_id: userId,
      type: 'ORDER_CONFIRMED',
      order_id: order._id,
      shop_id: order.shop_id,
      title: 'Commande confirmée',
      message: `Votre commande ${order.order_number} de ${shopName} a été confirmée.`,
      action_data: { order_id: order._id, order_number: order.order_number }
    });
  }

  /**
   * Notify client to pay
   */
  async notifyPaymentRequest(userId, order, shopName) {
    return await this.createNotification({
      user_id: userId,
      type: 'PAYMENT_REQUESTED',
      order_id: order._id,
      shop_id: order.shop_id,
      title: 'Paiement requis',
      message: `Veuillez payer ${order.total_amount.toLocaleString()} Ar pour votre commande ${order.order_number}.`,
      action_data: { 
        order_id: order._id, 
        order_number: order.order_number,
        amount: order.total_amount,
        action: 'confirm_payment'
      }
    });
  }

  /**
   * Notify shop that client paid
   */
  async notifyPaymentReceived(shopUserIds, order) {
    const notifications = [];
    
    for (const userId of shopUserIds) {
      const notif = await this.createNotification({
        user_id: userId,
        type: 'PAYMENT_RECEIVED',
        order_id: order._id,
        shop_id: order.shop_id,
        title: 'Paiement reçu',
        message: `Le client a confirmé le paiement de ${order.total_amount.toLocaleString()} Ar pour la commande ${order.order_number}.`,
        action_data: { order_id: order._id, order_number: order.order_number }
      });
      notifications.push(notif);
    }
    
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
      user_id: userId,
      type: 'ORDER_SHIPPED',
      order_id: order._id,
      shop_id: order.shop_id,
      title: 'Commande expédiée',
      message,
      action_data: { 
        order_id: order._id, 
        order_number: order.order_number,
        tracking_number: trackingNumber
      }
    });
  }

  /**
   * Notify client that order is delivered
   */
  async notifyOrderDelivered(userId, order) {
    return await this.createNotification({
      user_id: userId,
      type: 'ORDER_DELIVERED',
      order_id: order._id,
      shop_id: order.shop_id,
      title: 'Commande livrée',
      message: `Votre commande ${order.order_number} a été livrée. Merci pour votre confiance !`,
      action_data: { order_id: order._id, order_number: order.order_number }
    });
  }

  /**
   * Notify order canceled
   */
  async notifyOrderCanceled(userId, order, canceledBy, reason) {
    return await this.createNotification({
      user_id: userId,
      type: 'ORDER_CANCELED',
      order_id: order._id,
      shop_id: order.shop_id,
      title: 'Commande annulée',
      message: `La commande ${order.order_number} a été annulée par ${canceledBy}. ${reason || ''}`,
      action_data: { order_id: order._id, order_number: order.order_number }
    });
  }
}

module.exports = new NotificationService();
