const mongoose = require('mongoose');

const businessHoursSchema = new mongoose.Schema({
  open: { type: String, default: '08:00' },
  close: { type: String, default: '18:00' },
  closed: { type: Boolean, default: false }
}, { _id: false });

const shopProfileSchema = new mongoose.Schema({
  // Reference to the shop/user
  shop_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    unique: true,
    index: true 
  },
  
  // Basic Info
  name: { type: String, required: true },
  logo: { type: String }, // URL to logo image
  description: { type: String },
  
  // Location
  location: {
    address: { type: String },
    city: { type: String },
    postal_code: { type: String },
    country: { type: String, default: 'MG' }, // Madagascar
    latitude: { type: Number },
    longitude: { type: Number }
  },
  
  // Business Hours
  business_hours: {
    monday: { type: businessHoursSchema, default: () => ({ open: '08:00', close: '18:00', closed: false }) },
    tuesday: { type: businessHoursSchema, default: () => ({ open: '08:00', close: '18:00', closed: false }) },
    wednesday: { type: businessHoursSchema, default: () => ({ open: '08:00', close: '18:00', closed: false }) },
    thursday: { type: businessHoursSchema, default: () => ({ open: '08:00', close: '18:00', closed: false }) },
    friday: { type: businessHoursSchema, default: () => ({ open: '08:00', close: '18:00', closed: false }) },
    saturday: { type: businessHoursSchema, default: () => ({ open: '08:00', close: '12:00', closed: false }) },
    sunday: { type: businessHoursSchema, default: () => ({ open: '08:00', close: '18:00', closed: true }) }
  },
  
  // Contact Information
  contact: {
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    whatsapp: { type: String }
  },
  
  // Social Media
  social_media: {
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String },
    youtube: { type: String }
  },
  
  // Settings
  settings: {
    currency: { type: String, default: 'MGA' }, // Malagasy Ariary
    timezone: { type: String, default: 'Indian/Antananarivo' },
    language: { type: String, default: 'fr' }
  },
  
  // Status
  is_active: { type: Boolean, default: true },
  is_verified: { type: Boolean, default: false },
  
  // Metadata
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date }
}, {
  collection: 'shop_profiles',
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
shopProfileSchema.index({ 'location.city': 1 });
shopProfileSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Pre-save middleware
shopProfileSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Static method to find or create profile
shopProfileSchema.statics.findOrCreate = async function(shopId) {
  let profile = await this.findOne({ shop_id: shopId });
  if (!profile) {
    profile = new this({ shop_id: shopId, name: 'Ma Boutique' });
    await profile.save();
  }
  return profile;
};

const ShopProfile = mongoose.models.ShopProfile || mongoose.model('ShopProfile', shopProfileSchema);

module.exports = { ShopProfile };
