const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  // Zone can be defined by city, postal codes, or coordinates
  cities: [{ type: String }],
  postal_codes: [{ type: String }],
  // Geographic boundaries (optional, for map-based zones)
  coordinates: {
    type: [{
      lat: { type: Number },
      lng: { type: Number }
    }],
    default: []
  },
  // Delivery fee for this zone
  base_fee: { type: mongoose.Schema.Types.Decimal128, default: 0 },
  free_delivery_threshold: { type: mongoose.Schema.Types.Decimal128, default: null },
  // Estimated delivery time
  estimated_days: { type: Number, default: 1 },
  estimated_hours: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date }
});

deliveryZoneSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.base_fee) {
      if (typeof ret.base_fee === 'object' && ret.base_fee.$numberDecimal) {
        ret.base_fee = parseFloat(ret.base_fee.$numberDecimal);
      } else if (typeof ret.base_fee === 'object' && ret.base_fee._bsontype === 'Decimal128' && typeof ret.base_fee.toString === 'function') {
        ret.base_fee = parseFloat(ret.base_fee.toString());
      } else if (typeof ret.base_fee === 'string') {
        ret.base_fee = parseFloat(ret.base_fee);
      }
    }

    if (ret.free_delivery_threshold) {
      if (typeof ret.free_delivery_threshold === 'object' && ret.free_delivery_threshold.$numberDecimal) {
        ret.free_delivery_threshold = parseFloat(ret.free_delivery_threshold.$numberDecimal);
      } else if (typeof ret.free_delivery_threshold === 'object' && ret.free_delivery_threshold._bsontype === 'Decimal128' && typeof ret.free_delivery_threshold.toString === 'function') {
        ret.free_delivery_threshold = parseFloat(ret.free_delivery_threshold.toString());
      } else if (typeof ret.free_delivery_threshold === 'string') {
        ret.free_delivery_threshold = parseFloat(ret.free_delivery_threshold);
      }
    }
    return ret;
  }
});

deliveryZoneSchema.set('toObject', {
  transform: function(doc, ret) {
    if (ret.base_fee) {
      if (typeof ret.base_fee === 'object' && ret.base_fee.$numberDecimal) {
        ret.base_fee = parseFloat(ret.base_fee.$numberDecimal);
      } else if (typeof ret.base_fee === 'object' && ret.base_fee._bsontype === 'Decimal128' && typeof ret.base_fee.toString === 'function') {
        ret.base_fee = parseFloat(ret.base_fee.toString());
      } else if (typeof ret.base_fee === 'string') {
        ret.base_fee = parseFloat(ret.base_fee);
      }
    }

    if (ret.free_delivery_threshold) {
      if (typeof ret.free_delivery_threshold === 'object' && ret.free_delivery_threshold.$numberDecimal) {
        ret.free_delivery_threshold = parseFloat(ret.free_delivery_threshold.$numberDecimal);
      } else if (typeof ret.free_delivery_threshold === 'object' && ret.free_delivery_threshold._bsontype === 'Decimal128' && typeof ret.free_delivery_threshold.toString === 'function') {
        ret.free_delivery_threshold = parseFloat(ret.free_delivery_threshold.toString());
      } else if (typeof ret.free_delivery_threshold === 'string') {
        ret.free_delivery_threshold = parseFloat(ret.free_delivery_threshold);
      }
    }
    return ret;
  }
});

const deliverySchema = new mongoose.Schema({
  // References
  shop_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  order_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  
  // Delivery tracking number
  tracking_number: { type: String, unique: true, sparse: true },
  
  // Carrier information
  carrier: {
    name: { type: String }, // e.g., 'Internal', 'DHL', 'FedEx'
    external_tracking_id: { type: String }, // For external carriers
    api_provider: { type: String } // e.g., 'aftership', '17track'
  },
  
  // Delivery status
  status: {
    type: String,
    enum: [
      'PENDING',        // En attente
      'CONFIRMED',      // Confirmé
      'PREPARING',      // En préparation
      'READY',          // Prêt pour expédition
      'PICKED_UP',      // Récupéré par le transporteur
      'IN_TRANSIT',     // En transit
      'OUT_FOR_DELIVERY', // En cours de livraison
      'DELIVERED',      // Livré
      'FAILED',         // Échec de livraison
      'RETURNED',       // Retourné
      'CANCELLED'       // Annulé
    ],
    default: 'PENDING'
  },
  
  // Status history
  status_history: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    location: { type: String },
    note: { type: String },
    updated_by: { type: mongoose.Schema.Types.ObjectId }
  }],
  
  // Delivery address
  delivery_address: {
    recipient_name: { type: String, required: true },
    recipient_phone: { type: String, required: true },
    address_line1: { type: String, required: true },
    address_line2: { type: String },
    city: { type: String, required: true },
    postal_code: { type: String, required: true },
    country: { type: String, default: 'MG' }, // Madagascar par défaut
    latitude: { type: Number },
    longitude: { type: Number }
  },
  
  // Zone information
  zone_id: { type: mongoose.Schema.Types.ObjectId },
  zone_name: { type: String },
  
  // Delivery fee
  delivery_fee: { type: mongoose.Schema.Types.Decimal128, required: true },
  free_delivery_applied: { type: Boolean, default: false },
  
  // Scheduling
  requested_date: { type: Date }, // Date demandée par le client
  scheduled_date: { type: Date }, // Date programmée
  estimated_delivery_date: { type: Date },
  actual_delivery_date: { type: Date },
  
  // Delivery instructions
  instructions: { type: String },
  leave_at_door: { type: Boolean, default: false },
  signature_required: { type: Boolean, default: true },
  
  // Proof of delivery
  proof_of_delivery: {
    signature_url: { type: String },
    photo_url: { type: String },
    recipient_name: { type: String },
    delivered_at: { type: Date }
  },
  
  // Driver information (for internal delivery)
  driver: {
    id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    phone: { type: String },
    vehicle_info: { type: String }
  },
  
  // Tracking updates from external API
  external_tracking_data: {
    provider: { type: String },
    last_sync: { type: Date },
    checkpoints: [{
      date: { type: Date },
      status: { type: String },
      location: { type: String },
      message: { type: String }
    }]
  },
  
  // Notes
  notes: { type: String },
  internal_notes: { type: String }, // Not visible to customer
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date }
}, {
  collection: 'deliveries',
  toJSON: {
    transform: function(doc, ret) {
      // Convert Decimal128 to number
      if (ret.delivery_fee && typeof ret.delivery_fee === 'object' && ret.delivery_fee.$numberDecimal) {
        ret.delivery_fee = parseFloat(ret.delivery_fee.$numberDecimal);
      }
      return ret;
    }
  }
});

// Indexes
deliverySchema.index({ shop_id: 1, status: 1 });
deliverySchema.index({ order_id: 1 });
deliverySchema.index({ tracking_number: 1 });
deliverySchema.index({ 'carrier.external_tracking_id': 1 });
deliverySchema.index({ status: 1, created_at: -1 });

// Pre-save middleware
deliverySchema.pre('save', function(next) {
  this.updated_at = new Date();
  
  // Add status to history if changed
  if (this.isModified('status')) {
    this.status_history.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  
  next();
});

// Static method to generate tracking number
deliverySchema.statics.generateTrackingNumber = async function() {
  const prefix = 'LIV';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${date}-${random}`;
};

const DeliveryZone = mongoose.models.DeliveryZone || mongoose.model('DeliveryZone', deliveryZoneSchema);
const Delivery = mongoose.models.Delivery || mongoose.model('Delivery', deliverySchema);

module.exports = { Delivery, DeliveryZone };
