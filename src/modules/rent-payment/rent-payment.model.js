const mongoose = require('mongoose');

const rentPaymentSchema = new mongoose.Schema({
  // Contract reference
  contract_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LeaseContract', 
    required: true 
  },
  
  // Shop reference
  shop_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Shop'
  },
  
  // Payment details
  amount: { 
    type: mongoose.Types.Decimal128, 
    required: true 
  },
  
  due_date: { 
    type: Date, 
    required: true 
  },
  
  method: { 
    type: String, 
    enum: ['CARD', 'PAYPAL', 'MOBILE_MONEY', 'BANK', 'CASH'],
    required: true 
  },
  
  // Transaction details
  transaction_reference: { 
    type: String 
  },
  
  gateway_information: { 
    type: mongoose.Schema.Types.Mixed 
  },
  
  // Current status
  current_status: {
    status: { 
      type: String, 
      enum: ['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    reason: { type: String },
    updated_at: { type: Date, default: Date.now }
  },
  
  // Status history
  status_history: [{
    status: { 
      type: String, 
      enum: ['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED']
    },
    reason: { type: String },
    updated_at: { type: Date, default: Date.now }
  }],
  
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'rent_payments'
});

// Indexes
rentPaymentSchema.index({ contract_id: 1, due_date: -1 });
rentPaymentSchema.index({ 'current_status.status': 1 });
rentPaymentSchema.index({ due_date: 1 });
rentPaymentSchema.index({ shop_id: 1 });

// Helper method to convert Decimal128 to number
rentPaymentSchema.methods.toJSON = function() {
  const obj = this.toObject();
  if (obj.amount) {
    obj.amount = parseFloat(obj.amount.toString());
  }
  return obj;
};

const RentPayment = mongoose.model('RentPayment', rentPaymentSchema);

module.exports = { RentPayment, rentPaymentSchema };
