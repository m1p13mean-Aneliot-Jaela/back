const notificationService = require('./notification.service');
const { catchAsync } = require('../../shared/errors/custom-errors');

class NotificationController {
  // Get my notifications
  getMyNotifications = catchAsync(async (req, res) => {
    // For shop users, use shop_id as recipient, otherwise use user.id
    let recipientId = req.user.id || req.user._id;
    if (req.user.user_type === 'shop' && req.user.shop_id) {
      recipientId = req.user.shop_id;
    }
    
    const { limit = 20, unreadOnly = false } = req.query;
    
    console.log('🔔 [Notifications] Getting notifications for recipient:', recipientId);
    console.log('🔔 [Notifications] User:', req.user.email, 'Type:', req.user.user_type, 'ShopId:', req.user.shop_id);

    const result = await notificationService.getNotifications(recipientId, {
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });
    
    console.log('🔔 [Notifications] Found', result.length, 'notifications');

    res.status(200).json({
      success: true,
      data: result
    });
  });

  // Get unread count
  getUnreadCount = catchAsync(async (req, res) => {
    let recipientId = req.user.id || req.user._id;
    if (req.user.user_type === 'shop' && req.user.shop_id) {
      recipientId = req.user.shop_id;
    }
    const count = await notificationService.getUnreadCount(recipientId);

    res.status(200).json({
      success: true,
      data: { count }
    });
  });

  // Mark as read
  markAsRead = catchAsync(async (req, res) => {
    const { id } = req.params;
    let recipientId = req.user.id || req.user._id;
    if (req.user.user_type === 'shop' && req.user.shop_id) {
      recipientId = req.user.shop_id;
    }

    const notification = await notificationService.markAsRead(id, recipientId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  });

  // Mark all as read
  markAllAsRead = catchAsync(async (req, res) => {
    let recipientId = req.user.id || req.user._id;
    if (req.user.user_type === 'shop' && req.user.shop_id) {
      recipientId = req.user.shop_id;
    }
    const result = await notificationService.markAllAsRead(recipientId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: { modified: result.modifiedCount }
    });
  });

  // Test endpoint to create a notification
  testCreate = catchAsync(async (req, res) => {
    console.log('🧪 [TEST] Creating test notification for user:', req.user.email);
    
    const testNotif = await notificationService.createNotification({
      recipient_id: req.user.id,
      recipient_type: 'USER',
      user_id: req.user.id,
      type: 'SYSTEM',
      title: 'Test Notification',
      message: 'This is a test notification created at ' + new Date().toISOString(),
      action_url: '/test',
      icon: 'info',
      color: 'info'
    });

    console.log('🧪 [TEST] Created notification:', testNotif._id);

    res.status(200).json({
      success: true,
      message: 'Test notification created',
      data: testNotif
    });
  });
}

module.exports = new NotificationController();
