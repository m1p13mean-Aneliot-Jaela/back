const mongoose = require('mongoose');

const QuoteRequestItemSchema = new mongoose.Schema({
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  notes: { type: String, default: '' },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null }
});

const ClientAddressSchema = new mongoose.Schema({
  street: { type: String, default: '' },
  city: { type: String, default: '' }
});

const ManagerResponseItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  total: { type: Number, required: true }
});

const ManagerResponseSchema = new mongoose.Schema({
  message: { type: String, default: '' },
  calculated_total: { type: Number, default: 0 },
  items_confirmed: [ManagerResponseItemSchema],
  shipping_fee: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  discount_percent: { type: Number, default: 0 },
  promotion_code: { type: String, default: '' },
  final_total: { type: Number, default: 0 },
  valid_until: { type: Date }
});

const ClientResponseSchema = new mongoose.Schema({
  accepted: { type: Boolean, required: true },
  message: { type: String, default: '' },
  responded_at: { type: Date }
});

const QuoteRequestSchema = new mongoose.Schema({
  // Client info (can be guest or registered)
  client_name: { type: String, required: true },
  client_phone: { type: String, required: true, index: true },
  client_email: { type: String, default: '' },
  client_address: { type: ClientAddressSchema, default: () => ({}) },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  
  // Shop target
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  shop_name: { type: String, required: true },
  
  // Requested items
  requested_items: { type: [QuoteRequestItemSchema], required: true },
  
  // Confirmed items (from manager response, for order creation)
  confirmed_items: { type: [ManagerResponseItemSchema], default: [] },
  
  // Workflow status
  status: {
    type: String,
    enum: ['PENDING', 'REVIEWING', 'QUOTE_SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED', 'EXPIRED'],
    default: 'PENDING',
    index: true
  },
  
  // Manager response
  manager_response: { type: ManagerResponseSchema, default: null },
  
  // Who handled the request (manager)
  handled_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  handled_by_name: { type: String, default: '' },
  handled_at: { type: Date },
  
  // Client response
  client_response: { type: ClientResponseSchema, default: null },
  
  // Link to created order (by staff)
  converted_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  converted_by_staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assigned_staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  converted_at: { type: Date },
  
  // Dates
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  expires_at: { type: Date }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes
QuoteRequestSchema.index({ shop_id: 1, status: 1, created_at: -1 });

// Virtual for display
QuoteRequestSchema.virtual('status_label').get(function() {
  const labels = {
    'PENDING': 'En attente',
    'REVIEWING': 'En cours de traitement',
    'QUOTE_SENT': 'Devis envoyé',
    'ACCEPTED': 'Acceptée',
    'REJECTED': 'Refusée',
    'CONVERTED': 'Convertie en commande',
    'EXPIRED': 'Expirée'
  };
  return labels[this.status] || this.status;
});

// Methods
QuoteRequestSchema.methods.updateStatus = function(status, handledBy = null, handledByName = '') {
  this.status = status;
  if (handledBy) {
    this.handled_by = handledBy;
    this.handled_by_name = handledByName;
    this.handled_at = new Date();
  }
  return this.save();
};

QuoteRequestSchema.methods.addManagerResponse = function(response, handledBy, handledByName) {
  this.manager_response = response;
  this.status = 'QUOTE_SENT';
  this.handled_by = handledBy;
  this.handled_by_name = handledByName;
  this.handled_at = new Date();
  // Set expiry to 7 days from now
  this.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return this.save();
};

QuoteRequestSchema.methods.addClientResponse = function(accepted, message = '') {
  this.client_response = {
    accepted,
    message,
    responded_at: new Date()
  };
  this.status = accepted ? 'ACCEPTED' : 'REJECTED';
  return this.save();
};

QuoteRequestSchema.methods.convertToOrder = function(orderId, staffId) {
  this.converted_order_id = orderId;
  this.converted_by_staff_id = staffId;
  this.converted_at = new Date();
  this.status = 'CONVERTED';
  return this.save();
};

// Statics
QuoteRequestSchema.statics.findPendingByShop = function(shopId) {
  return this.find({ shop_id: shopId, status: { $in: ['PENDING', 'REVIEWING'] } })
    .sort({ created_at: -1 });
};

QuoteRequestSchema.statics.findByClientPhone = function(phone) {
  return this.find({ client_phone: phone })
    .sort({ created_at: -1 });
};

QuoteRequestSchema.statics.findAwaitingClientResponse = function(shopId) {
  return this.find({ 
    shop_id: shopId, 
    status: 'QUOTE_SENT',
    expires_at: { $gt: new Date() }
  }).sort({ created_at: -1 });
};

// Check if model already exists to prevent overwrite
module.exports = mongoose.models.QuoteRequest || mongoose.model('QuoteRequest', QuoteRequestSchema);
