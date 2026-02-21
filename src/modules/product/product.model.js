const mongoose = require('mongoose');

// Helper to convert Decimal128 to number
function convertDecimal128(value) {
  if (value && typeof value === 'object' && value.$numberDecimal) {
    return parseFloat(value.$numberDecimal);
  }
  return value;
}

const productSchema = new mongoose.Schema({
   shop_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
   shop_name: { type: String },
   sku: { type: String, required: true },
   name: { type: String, required: true },
   description: { type: String },
   unit_price: { type: mongoose.Schema.Types.Decimal128, required: true, index: true },
   cost_price: { type: mongoose.Schema.Types.Decimal128 },
   tags: { type: [String], default: [] },
   image_url: { type: String },
   images: {
     type: [
       {
         image_url: { type: String },
         created_at: { type: Date, default: Date.now }
       }
     ],
     default: []
   },
   categories: {
     type: [
       {
         category_id: { type: mongoose.Schema.Types.ObjectId, index: true },
         name: { type: String },
         assigned_at: { type: Date, default: Date.now }
       }
     ],
     default: []
   },
   variants: {
     type: [
       {
         variant_name: { type: String },
         unit_price: { type: mongoose.Schema.Types.Decimal128 },
         cost_price: { type: mongoose.Schema.Types.Decimal128 },
         sku: { type: String },
         attributes: { type: Object },
         images: { type: [String], default: [] }
       }
     ],
     default: []
   },
   current_promo: {
     type: {
       promo_price: { type: mongoose.Schema.Types.Decimal128 },
       start_date: { type: Date },
       end_date: { type: Date },
       created_at: { type: Date }
     }
   },
   promo_history: {
     type: [
       {
         promo_price: { type: mongoose.Schema.Types.Decimal128 },
         start_date: { type: Date },
         end_date: { type: Date },
         created_at: { type: Date }
       }
     ],
     default: []
   },
   is_banned: { type: Boolean, default: false, index: true },
   is_featured: { type: Boolean, default: false, index: true },
   ban_info: {
     type: {
       reason: { type: String },
       created_at: { type: Date }
     }
   },
   current_status: {
     type: {
       status: { type: String, enum: ['DRAFT', 'PENDING', 'ACTIVE', 'REJECTED'], default: 'DRAFT' },
       reason: { type: String },
       updated_at: { type: Date, default: Date.now }
     },
     default: () => ({ status: 'DRAFT', updated_at: new Date() })
   },
   status_history: {
     type: [
       {
         status: { type: String, enum: ['DRAFT', 'PENDING', 'ACTIVE', 'REJECTED'] },
         reason: { type: String },
         updated_at: { type: Date }
       }
     ],
     default: []
   },
   reports: {
     type: [
       {
         cause: { type: String },
         created_at: { type: Date }
       }
     ],
     default: []
   },
   update_history: {
     type: [
       {
         name: { type: String },
         description: { type: String },
         unit_price: { type: mongoose.Schema.Types.Decimal128 },
         cost_price: { type: mongoose.Schema.Types.Decimal128 },
         image_url: { type: String },
         updated_at: { type: Date }
       }
     ],
     default: []
   },
   created_at: { type: Date, default: Date.now, required: true },
   updated_at: { type: Date }
 }, { 
   collection: 'products',
   toJSON: { 
     transform: function(doc, ret) {
       // Convert Decimal128 to number
       if (ret.unit_price && typeof ret.unit_price === 'object' && ret.unit_price.$numberDecimal) {
         ret.unit_price = parseFloat(ret.unit_price.$numberDecimal);
       }
       if (ret.cost_price && typeof ret.cost_price === 'object' && ret.cost_price.$numberDecimal) {
         ret.cost_price = parseFloat(ret.cost_price.$numberDecimal);
       }
       // Also convert in nested arrays
       if (ret.variants) {
         ret.variants = ret.variants.map(v => {
           if (v.unit_price && typeof v.unit_price === 'object' && v.unit_price.$numberDecimal) {
             v.unit_price = parseFloat(v.unit_price.$numberDecimal);
           }
           if (v.cost_price && typeof v.cost_price === 'object' && v.cost_price.$numberDecimal) {
             v.cost_price = parseFloat(v.cost_price.$numberDecimal);
           }
           return v;
         });
       }
       return ret;
     }
   },
   toObject: {
     transform: function(doc, ret) {
       if (ret.unit_price && typeof ret.unit_price === 'object' && ret.unit_price.$numberDecimal) {
         ret.unit_price = parseFloat(ret.unit_price.$numberDecimal);
       }
       if (ret.cost_price && typeof ret.cost_price === 'object' && ret.cost_price.$numberDecimal) {
         ret.cost_price = parseFloat(ret.cost_price.$numberDecimal);
       }
       return ret;
     }
   }
 });

 productSchema.index({ name: 'text', description: 'text' });
 productSchema.index({ shop_id: 1 });
 productSchema.index({ 'categories.category_id': 1 });
 productSchema.index({ is_banned: 1 });
 productSchema.index({ 'current_promo.end_date': 1 });
 productSchema.index({ unit_price: 1 });

 module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
