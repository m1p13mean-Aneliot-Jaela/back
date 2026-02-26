const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient - can be a user OR a shop
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  recipient_type: {
    type: String,
    enum: ['USER', 'SHOP'],
    required: true,
    default: 'USER'
  },

  // Legacy support - kept for compatibility
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },

  // Notification type - extended for all scenarios
  type: {
    type: String,
    enum: [
      // Order notifications
      'ORDER_NEW',                 // New order received (for shop)
      'ORDER_CONFIRMED',           // Order confirmed
      'ORDER_PAYMENT_REQUESTED',   // Payment requested
      'ORDER_PAID',                // Order paid
      'ORDER_SHIPPED',             // Order shipped
      'ORDER_DELIVERED',           // Order delivered
      'ORDER_CANCELED',            // Order canceled
      'ORDER_REFUNDED',            // Order refunded

      // Payment notifications
      'PAYMENT_RECEIVED',          // Payment received confirmation
      'PAYMENT_FAILED',            // Payment failed
      'PAYMENT_PENDING',           // Payment pending reminder

      // Shop notifications
      'STOCK_LOW',                 // Low stock alert
      'STOCK_OUT',                 // Out of stock alert
      'REVIEW_NEW',                // New review received

      // Client notifications
      'PROMOTION_NEW',             // New promotion
      'PROMOTION_EXPIRING',        // Promotion expiring soon
      'WISHLIST_PRICE_DROP',       // Price drop on wishlist item

      // System notifications
      'SYSTEM',                    // System message
      'WELCOME',                   // Welcome message
      'ACCOUNT_VERIFIED',          // Account verification
      'PASSWORD_CHANGED',          // Password changed
      'DELIVERY_UPDATE'            // Delivery update
    ],
    required: true
  },

  // Content
  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  // Related entities - now optional for non-order notifications
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },

  shop_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },

  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },

  // Action data for navigation
  action_data: {
    url: { type: String },
    icon: { type: String, default: 'notifications' },
    color: { type: String, default: 'info' },
    priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH'], default: 'NORMAL' }
  },

  // Status
  is_read: {
    type: Boolean,
    default: false,
    index: true
  },

  read_at: {
    type: Date
  },

  // Timestamps
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'notifications',
  timestamps: false
});

// Indexes
notificationSchema.index({ recipient_id: 1, is_read: 1, created_at: -1 });
notificationSchema.index({ recipient_id: 1, created_at: -1 });
notificationSchema.index({ shop_id: 1, is_read: 1, created_at: -1 });
notificationSchema.index({ type: 1, created_at: -1 });
notificationSchema.index({ order_id: 1 });

// Instance methods
notificationSchema.methods.markAsRead = async function() {
  this.is_read = true;
  this.read_at = new Date();
  return await this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = async function(recipientId) {
  return await this.countDocuments({ recipient_id: recipientId, is_read: false });
};

notificationSchema.statics.getRecent = async function(recipientId, limit = 20) {
  return await this.find({ recipient_id: recipientId })
    .sort({ created_at: -1 })
    .limit(limit);
};

notificationSchema.statics.markAllAsRead = async function(recipientId) {
  return await this.updateMany(
    { recipient_id: recipientId, is_read: false },
    { $set: { is_read: true, read_at: new Date() } }
  );
};

// Pre-save middleware for backward compatibility
notificationSchema.pre('save', function(next) {
  if (this.user_id && !this.recipient_id) {
    this.recipient_id = this.user_id;
    this.recipient_type = 'USER';
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
