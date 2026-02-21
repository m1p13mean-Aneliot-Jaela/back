const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  // Clés étrangères
  stock_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true
  },
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
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  staff_name: {
    type: String,
    trim: true
  },
  
  // Type de mouvement
  movement_type: {
    type: String,
    enum: ['IN', 'OUT', 'ADJUST'],
    required: true
  },
  
  // Quantité
  quantity: {
    type: Number,
    required: true
  },
  
  // Raison
  reason: {
    type: String,
    trim: true
  },
  
  // Date de création
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'stock_movements'
});

// Index pour recherche rapide
stockMovementSchema.index({ stock_id: 1, created_at: -1 });
stockMovementSchema.index({ shop_id: 1, created_at: -1 });
stockMovementSchema.index({ product_id: 1, created_at: -1 });
stockMovementSchema.index({ staff_id: 1 });
stockMovementSchema.index({ movement_type: 1 });
stockMovementSchema.index({ created_at: -1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

module.exports = StockMovement;
