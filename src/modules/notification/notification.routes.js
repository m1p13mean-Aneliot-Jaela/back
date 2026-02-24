const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Get my notifications
router.get('/', notificationController.getMyNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

module.exports = router;
