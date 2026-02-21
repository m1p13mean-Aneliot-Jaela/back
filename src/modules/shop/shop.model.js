const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  // Nom de la boutique
  shop_name: {
    type: String,
    required: true,
    trim: true
  },

  // Description
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },

  // Logo
  logo: {
    type: String,
    trim: true
  },

  // Localisation dans le mall
  mall_location: {
    type: String,
    trim: true
  },

  // Horaires d'ouverture
  opening_time: {
    monday: { 
      open: { type: String },
      close: { type: String }
    },
    tuesday: { 
      open: { type: String },
      close: { type: String }
    },
    wednesday: { 
      open: { type: String },
      close: { type: String }
    },
    thursday: { 
      open: { type: String },
      close: { type: String }
    },
    friday: { 
      open: { type: String },
      close: { type: String }
    },
    saturday: { 
      open: { type: String },
      close: { type: String }
    },
    sunday: { 
      open: { type: String },
      close: { type: String }
    }
  },

  // Date de création
  created_at: {
    type: Date,
    default: Date.now
  },

  // Utilisateurs assignés à la boutique
  users: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['MANAGER_SHOP', 'STAFF'],
      required: true
    },
    assigned_at: {
      type: Date,
      default: Date.now
    },
    first_name: {
      type: String,
      trim: true
    },
    last_name: {
      type: String,
      trim: true
    }
  }],

  // Statut actuel
  current_status: {
    status: {
      type: String,
      enum: ['pending', 'validated', 'active', 'deactivated', 'suspended'],
      default: 'pending'
    },
    reason: {
      type: String,
      trim: true
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },

  // Historique des statuts
  status_history: [{
    status: {
      type: String,
      enum: ['pending', 'validated', 'active', 'deactivated', 'suspended']
    },
    reason: {
      type: String,
      trim: true
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  }],

  // Catégories
  categories: [{
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShopCategory'
    },
    name: {
      type: String,
      trim: true
    },
    assigned_at: {
      type: Date,
      default: Date.now
    }
  }],

  // Historique des modifications
  update_history: [{
    shop_name: String,
    description: String,
    logo: String,
    mall_location: String,
    opening_time: mongoose.Schema.Types.Mixed,
    updated_at: {
      type: Date,
      default: Date.now
    }
  }],

  // Statistiques de reviews
  review_stats: {
    average_rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    total_reviews: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true,
  collection: 'shops'
});

// Index pour recherche rapide
shopSchema.index({ 'current_status.status': 1 });
shopSchema.index({ 'categories.category_id': 1 });
shopSchema.index({ 'users.user_id': 1 });
shopSchema.index({ mall_location: 1 });
shopSchema.index({ shop_name: 1 });
shopSchema.index({ createdAt: -1 });

// Index composé pour les requêtes courantes
shopSchema.index({ 'categories.category_id': 1, 'current_status.status': 1 });

// Virtuals
shopSchema.virtual('is_active').get(function() {
  return this.current_status?.status === 'active';
});

// Ne pas retourner certains champs sensibles dans les réponses JSON par défaut
shopSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
