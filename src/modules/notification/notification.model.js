const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification type
  type: {
    type: String,
    enum: [
      'ORDER_CONFIRMED',           // Commande confirmée par le shop
      'PAYMENT_REQUESTED',         // Demande de paiement
      'PAYMENT_RECEIVED',          // Paiement reçu
      'ORDER_SHIPPED',             // Commande expédiée
      'ORDER_DELIVERED',           // Commande livrée
      'ORDER_CANCELED',            // Commande annulée
      'DELIVERY_UPDATE'            // Mise à jour livraison
    ],
    required: true
  },
  
  // Related entities
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  shop_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
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
  
  // Action data (optional - for in-app navigation)
  action_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Status
  is_read: {
    type: Boolean,
    default: false
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
notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });
notificationSchema.index({ order_id: 1 });
notificationSchema.index({ type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
