const mongoose = require('mongoose');

// Opening time schema (simple open/close times)
const openingHoursSchema = new mongoose.Schema({
  open: { type: String, default: '08:00' },
  close: { type: String, default: '18:00' }
}, { _id: false });

const shopSchema = new mongoose.Schema({
  // Basic Info
  shop_name: { type: String, required: true },
  description: { type: String },
  logo: { type: String },
  
  // Mall location (string identifier, not GPS)
  mall_location: { type: String },
  
  // Opening time (simple open/close per day)
  opening_time: {
    monday: { type: openingHoursSchema, default: () => ({ open: '08:00', close: '18:00' }) },
    tuesday: { type: openingHoursSchema, default: () => ({ open: '08:00', close: '18:00' }) },
    wednesday: { type: openingHoursSchema, default: () => ({ open: '08:00', close: '18:00' }) },
    thursday: { type: openingHoursSchema, default: () => ({ open: '08:00', close: '18:00' }) },
    friday: { type: openingHoursSchema, default: () => ({ open: '08:00', close: '18:00' }) },
    saturday: { type: openingHoursSchema, default: () => ({ open: '08:00', close: '12:00' }) },
    sunday: { type: openingHoursSchema, default: () => ({ open: '08:00', close: '18:00' }) }
  },
  
  // Users assigned to shop (managers and staff)
  users: [{
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['MANAGER_SHOP', 'STAFF'], required: true },
    assigned_at: { type: Date, default: Date.now },
    first_name: { type: String },
    last_name: { type: String }
  }],
  
  // Current status
  current_status: {
    status: { 
      type: String, 
      enum: ['pending', 'validated', 'active', 'deactivated', 'suspended'],
      default: 'pending'
    },
    reason: { type: String },
    updated_at: { type: Date, default: Date.now }
  },
  
  // Status history
  status_history: [{
    status: { 
      type: String, 
      enum: ['pending', 'validated', 'active', 'deactivated', 'suspended']
    },
    reason: { type: String },
    updated_at: { type: Date, default: Date.now }
  }],
  
  // Categories
  categories: [{
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopCategory' },
    name: { type: String },
    assigned_at: { type: Date, default: Date.now }
  }],
  
  // Update history
  update_history: [{
    shop_name: { type: String },
    description: { type: String },
    logo: { type: String },
    mall_location: { type: String },
    opening_time: { type: Object },
    updated_at: { type: Date, default: Date.now }
  }],
  
  // Review stats
  review_stats: {
    average_rating: { type: Number, default: 0 },
    total_reviews: { type: Number, default: 0 }
  },
  
  // Metadata
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'shops',
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
shopSchema.index({ 'current_status.status': 1 });
shopSchema.index({ 'categories.category_id': 1 });
shopSchema.index({ 'users.user_id': 1 });
shopSchema.index({ mall_location: 1 });

const Shop = mongoose.models.Shop || mongoose.model('Shop', shopSchema);

module.exports = { Shop };
