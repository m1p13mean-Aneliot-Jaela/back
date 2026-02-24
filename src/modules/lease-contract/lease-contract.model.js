const mongoose = require('mongoose');

const leaseContractSchema = new mongoose.Schema({
  // Basic Info
  shop_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Shop', 
    required: true 
  },
  shop_name: { type: String },
  
  // Contract dates
  start_date: { 
    type: Date, 
    required: true 
  },
  end_date: { 
    type: Date, 
    required: true 
  },
  
  // Financial info
  rent_amount: { 
    type: mongoose.Types.Decimal128, 
    required: true 
  },
  payment_frequency: { 
    type: String, 
    enum: ['monthly', 'quarterly'], 
    required: true 
  },
  
  // Additional info
  special_conditions: { type: String },
  
  // Current status
  current_status: {
    status: { 
      type: String, 
      enum: ['active', 'expired', 'terminated', 'signed'],
      default: 'signed'
    },
    reason: { type: String },
    updated_at: { type: Date, default: Date.now }
  },
  
  // Status history
  status_history: [{
    status: { 
      type: String, 
      enum: ['active', 'expired', 'terminated', 'signed']
    },
    reason: { type: String },
    updated_at: { type: Date, default: Date.now }
  }],
  
  // Update history
  update_history: [{
    start_date: { type: Date },
    end_date: { type: Date },
    rent_amount: { type: mongoose.Types.Decimal128 },
    payment_frequency: { type: String, enum: ['monthly', 'quarterly'] },
    special_conditions: { type: String },
    updated_at: { type: Date, default: Date.now }
  }],
  
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'lease_contracts'
});

// Indexes
leaseContractSchema.index({ shop_id: 1 });
leaseContractSchema.index({ 'current_status.status': 1 });
leaseContractSchema.index({ end_date: 1 });

// Helper method to convert Decimal128 to number
leaseContractSchema.methods.toJSON = function() {
  const obj = this.toObject();
  if (obj.rent_amount) {
    obj.rent_amount = parseFloat(obj.rent_amount.toString());
  }
  if (obj.update_history) {
    obj.update_history = obj.update_history.map(item => ({
      ...item,
      rent_amount: item.rent_amount ? parseFloat(item.rent_amount.toString()) : undefined
    }));
  }
  return obj;
};

const LeaseContract = mongoose.model('LeaseContract', leaseContractSchema);

module.exports = { LeaseContract, leaseContractSchema };
