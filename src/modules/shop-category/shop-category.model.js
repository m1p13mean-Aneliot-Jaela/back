const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Nom de la catégorie
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },

  // Description
  description: {
    type: String,
    trim: true
  },

  // Catégorie parente (pour hiérarchie)
  parent_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopCategory',
    default: null
  },

  // Ancêtres (pour requêtes hiérarchiques rapides)
  ancestors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopCategory'
  }]
}, {
  timestamps: true,
  collection: 'shop_categories'
});

// Index pour recherche rapide
categorySchema.index({ parent_category_id: 1 });
categorySchema.index({ ancestors: 1 });
categorySchema.index({ name: 1 });

// Virtuals
categorySchema.virtual('is_root').get(function() {
  return this.parent_category_id === null;
});

// Methods
categorySchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

const ShopCategory = mongoose.model('ShopCategory', categorySchema);

module.exports = ShopCategory;
