const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  // Clés étrangères
  shop_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  product_name: {
    type: String,
    trim: true
  },
  
  // Quantité actuelle
  current_quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // Date de mise à jour
  updated_at: {
    type: Date,
    default: Date.now
  },
  
  // Mouvements récents (intégrés comme dans setup-database.js)
  recent_movements: [{
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    staff_name: {
      type: String,
      trim: true
    },
    movement_type: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUST'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      trim: true
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'stocks'
});

// Index pour recherche rapide
stockSchema.index({ shop_id: 1, product_id: 1 }, { unique: true });
stockSchema.index({ shop_id: 1 });
stockSchema.index({ product_id: 1 });
stockSchema.index({ current_quantity: 1 });
stockSchema.index({ updated_at: -1 });

// Method to add movement
stockSchema.methods.addMovement = function(movementData) {
  this.recent_movements.push({
    staff_id: movementData.staff_id,
    staff_name: movementData.staff_name,
    movement_type: movementData.movement_type,
    quantity: movementData.quantity,
    reason: movementData.reason,
    created_at: new Date()
  });
  
  // Keep only last 20 movements
  if (this.recent_movements.length > 20) {
    this.recent_movements = this.recent_movements.slice(-20);
  }
  
  this.current_quantity = movementData.new_quantity || this.current_quantity;
  this.updated_at = new Date();
  
  return this.save();
};

// Method to update quantity
stockSchema.methods.updateQuantity = function(newQuantity, movementData) {
  this.current_quantity = newQuantity;
  this.updated_at = new Date();
  
  if (movementData) {
    this.addMovement(movementData);
  }
  
  return this.save();
};

const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;
