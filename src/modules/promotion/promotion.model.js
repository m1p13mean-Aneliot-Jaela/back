const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  shop_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    index: true 
  },
  shop_name: { type: String },
  
  // Basic info
  title: { type: String, required: true },
  description: { type: String },
  
  // Discount type and value
  type: { 
    type: String, 
    enum: ['percentage', 'fixed_amount'], 
    required: true 
  },
  value: { 
    type: mongoose.Schema.Types.Decimal128, 
    required: true 
  },
  
  // Promo code (optional)
  promo_code: { 
    type: String, 
    sparse: true,
    uppercase: true
  },
  
  // Validity period
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  
  // Usage conditions
  conditions: { type: String },
  usage_limit: { type: Number },
  usage_count: { type: Number, default: 0 },
  
  // Status
  is_active: { type: Boolean, default: true },
  
  // Product applicability
  applicable_products: {
    type: mongoose.Schema.Types.Mixed,
    default: 'ALL'  // 'ALL' or array of product ObjectIds
  },
  exclusions: [{ 
    type: mongoose.Schema.Types.ObjectId 
  }], // Products excluded from the promotion
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date }
});

// Indexes
promotionSchema.index({ shop_id: 1, is_active: 1 });
promotionSchema.index({ promo_code: 1 }, { unique: true, sparse: true });
promotionSchema.index({ start_date: 1, end_date: 1 });
promotionSchema.index({ end_date: 1 });

// Virtual field for checking if promotion is currently valid
promotionSchema.virtual('is_currently_valid').get(function() {
  const now = new Date();
  return this.is_active && 
         now >= this.start_date && 
         now <= this.end_date &&
         (!this.usage_limit || this.usage_count < this.usage_limit);
});

// Pre-save middleware
promotionSchema.pre('save', function(next) {
  this.updated_at = new Date();
  if (this.promo_code) {
    this.promo_code = this.promo_code.toUpperCase().trim();
  }
  next();
});

// Transform for JSON
promotionSchema.set('toJSON', {
  transform: function(doc, ret) {
    // Convert Decimal128 to number
    if (ret.value && typeof ret.value === 'object' && ret.value.$numberDecimal) {
      ret.value = parseFloat(ret.value.$numberDecimal);
    }
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema);
