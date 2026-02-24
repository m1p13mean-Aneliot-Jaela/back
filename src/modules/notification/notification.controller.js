const notificationService = require('./notification.service');
const { catchAsync } = require('../../shared/errors/custom-errors');

class NotificationController {
  // Get my notifications
  getMyNotifications = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { limit = 20, unreadOnly = false } = req.query;
    
    const notifications = await notificationService.getUserNotifications(userId, {
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });
    
    res.status(200).json({
      success: true,
      data: notifications
    });
  });

  // Get unread count
  getUnreadCount = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);
    
    res.status(200).json({
      success: true,
      data: { count }
    });
  });

  // Mark as read
  markAsRead = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await notificationService.markAsRead(id, userId);
    
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
    const userId = req.user.id;
    const result = await notificationService.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: { modified: result.modifiedCount }
    });
  });
}

module.exports = new NotificationController();
