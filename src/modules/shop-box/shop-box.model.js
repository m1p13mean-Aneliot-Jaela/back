const mongoose = require('mongoose');

const shopBoxSchema = new mongoose.Schema({
  ref: {
    type: String,
    required: [true, 'Reference is required'],
    unique: true,
    trim: true,
    index: true
  },
  
  created_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  current_status: {
    status: {
      type: String,
      enum: ['occupied', 'free', 'under_repair'],
      default: 'free'
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  
  status_history: [{
    status: {
      type: String,
      enum: ['occupied', 'free', 'under_repair']
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  current_assignment: {
    shop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    shop_name: {
      type: String
    },
    assigned_at: {
      type: Date
    }
  }
}, {
  timestamps: false,
  collection: 'shop_boxes'
});

// Indexes
shopBoxSchema.index({ 'current_status.status': 1 });
shopBoxSchema.index({ 'current_assignment.shop_id': 1 });

// Method to update status
shopBoxSchema.methods.updateStatus = function(newStatus) {
  // Add current status to history if it exists
  if (this.current_status && this.current_status.status) {
    this.status_history.push({
      status: this.current_status.status,
      updated_at: this.current_status.updated_at
    });
  }
  
  // Update current status
  this.current_status = {
    status: newStatus,
    updated_at: new Date()
  };
  
  return this;
};

// Method to assign shop
shopBoxSchema.methods.assignShop = function(shopId, shopName) {
  this.current_assignment = {
    shop_id: shopId,
    shop_name: shopName,
    assigned_at: new Date()
  };
  
  // Update status to occupied
  this.updateStatus('occupied');
  
  return this;
};

// Method to unassign shop
shopBoxSchema.methods.unassignShop = function() {
  this.current_assignment = {
    shop_id: null,
    shop_name: null,
    assigned_at: null
  };
  
  // Update status to free
  this.updateStatus('free');
  
  return this;
};

const ShopBox = mongoose.model('ShopBox', shopBoxSchema);

module.exports = ShopBox;
