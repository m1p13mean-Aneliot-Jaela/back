const { Delivery, DeliveryZone } = require('./delivery.model');
const mongoose = require('mongoose');
const { NotFoundError, ValidationError } = require('../../shared/errors/custom-errors');

// Helper to convert Decimal128
function convertDecimal128(value) {
  if (!value) return value;
  if (typeof value === 'object' && value.$numberDecimal) {
    return parseFloat(value.$numberDecimal);
  }
  if (Array.isArray(value)) {
    return value.map(v => convertDecimal128(v));
  }
  return value;
}

class DeliveryService {
  // ========== DELIVERY ZONES ==========
  
  // Create delivery zone
  async createZone(shopId, data) {
    const zone = new DeliveryZone({
      ...data,
      shop_id: shopId,
      base_fee: data.base_fee || 0,
      free_delivery_threshold: data.free_delivery_threshold || null
    });
    await zone.save();
    return zone;
  }

  // Get zones by shop
  async getZonesByShop(shopId) {
    const zones = await DeliveryZone.find({
      shop_id: shopId
    }).sort({ name: 1 });
    return zones;
  }

  // Update zone
  async updateZone(zoneId, data) {
    const zone = await DeliveryZone.findById(zoneId);
    if (!zone) throw new NotFoundError('Zone de livraison non trouvée');
    
    Object.assign(zone, data);
    await zone.save();
    return zone;
  }

  // Delete zone
  async deleteZone(zoneId) {
    const result = await DeliveryZone.findByIdAndDelete(zoneId);
    if (!result) throw new NotFoundError('Zone de livraison non trouvée');
    return { deleted: true };
  }

  // Calculate delivery fee for an order
  async calculateDeliveryFee(shopId, zoneId, orderAmount) {
    const zone = await DeliveryZone.findById(zoneId);
    if (!zone) throw new NotFoundError('Zone non trouvée');

    const baseFee = convertDecimal128(zone.base_fee) || 0;
    const freeThreshold = convertDecimal128(zone.free_delivery_threshold);

    // Check if free delivery applies
    if (freeThreshold !== null && freeThreshold !== undefined && orderAmount >= freeThreshold) {
      return {
        fee: 0,
        free_delivery_applied: true,
        zone_name: zone.name,
        estimated_days: zone.estimated_days,
        estimated_hours: zone.estimated_hours
      };
    }

    return {
      fee: baseFee,
      free_delivery_applied: false,
      zone_name: zone.name,
      estimated_days: zone.estimated_days,
      estimated_hours: zone.estimated_hours
    };
  }

  // ========== DELIVERIES ==========

  // Create delivery for an order
  async createDelivery(shopId, orderId, data) {
    // Calculate fee
    const feeInfo = await this.calculateDeliveryFee(shopId, data.zone_id, data.order_amount || 0);
    
    // Generate tracking number
    const trackingNumber = await Delivery.generateTrackingNumber();

    const delivery = new Delivery({
      shop_id: shopId,
      order_id: orderId,
      tracking_number: trackingNumber,
      zone_id: data.zone_id,
      zone_name: feeInfo.zone_name,
      delivery_fee: feeInfo.fee,
      free_delivery_applied: feeInfo.free_delivery_applied,
      delivery_address: data.delivery_address,
      requested_date: data.requested_date,
      scheduled_date: data.scheduled_date || data.requested_date,
      instructions: data.instructions,
      leave_at_door: data.leave_at_door || false,
      signature_required: data.signature_required !== false,
      status: 'PENDING',
      status_history: [{
        status: 'PENDING',
        timestamp: new Date(),
        note: 'Livraison créée'
      }]
    });

    await delivery.save();
    return delivery;
  }

  // Get deliveries by shop
  async getDeliveriesByShop(shopId, options = {}) {
    const { page = 1, limit = 20, status, startDate, endDate } = options;
    
    const query = { shop_id: shopId };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(startDate);
      if (endDate) query.created_at.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const [deliveries, total] = await Promise.all([
      Delivery.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Delivery.countDocuments(query)
    ]);

    return {
      deliveries: deliveries.map(d => ({
        ...d,
        delivery_fee: convertDecimal128(d.delivery_fee)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get delivery by ID
  async getDeliveryById(deliveryId) {
    const delivery = await Delivery.findById(deliveryId).lean();
    if (!delivery) throw new NotFoundError('Livraison non trouvée');
    
    return {
      ...delivery,
      delivery_fee: convertDecimal128(delivery.delivery_fee)
    };
  }

  // Get delivery by order ID
  async getDeliveryByOrderId(orderId) {
    const delivery = await Delivery.findOne({ order_id: orderId }).lean();
    if (!delivery) return null;
    
    return {
      ...delivery,
      delivery_fee: convertDecimal128(delivery.delivery_fee)
    };
  }

  // Update delivery status
  async updateStatus(deliveryId, status, data = {}) {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) throw new NotFoundError('Livraison non trouvée');

    const oldStatus = delivery.status;
    delivery.status = status;
    
    // Add to history
    delivery.status_history.push({
      status,
      timestamp: new Date(),
      location: data.location,
      note: data.note,
      updated_by: data.updated_by
    });

    // Update specific fields based on status
    if (status === 'DELIVERED') {
      delivery.actual_delivery_date = new Date();
      if (data.proof_of_delivery) {
        delivery.proof_of_delivery = {
          ...data.proof_of_delivery,
          delivered_at: new Date()
        };
      }
    }

    if (data.driver) {
      delivery.driver = data.driver;
    }

    if (data.carrier) {
      delivery.carrier = { ...delivery.carrier, ...data.carrier };
    }

    await delivery.save();
    return delivery;
  }

  // Assign driver (for internal delivery)
  async assignDriver(deliveryId, driverData) {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) throw new NotFoundError('Livraison non trouvée');

    delivery.driver = driverData;
    delivery.carrier = { name: 'Internal' };
    await delivery.save();
    return delivery;
  }

  // Update external tracking info
  async updateExternalTracking(deliveryId, trackingData) {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) throw new NotFoundError('Livraison non trouvée');

    delivery.carrier = {
      ...delivery.carrier,
      name: trackingData.carrier_name,
      external_tracking_id: trackingData.tracking_id,
      api_provider: trackingData.provider
    };

    await delivery.save();
    return delivery;
  }

  // Sync external tracking data
  async syncExternalTracking(deliveryId) {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) throw new NotFoundError('Livraison non trouvée');

    const externalId = delivery.carrier?.external_tracking_id;
    const provider = delivery.carrier?.api_provider;

    if (!externalId || !provider) {
      throw new ValidationError('Aucun suivi externe configuré');
    }

    // Here you would call the external API
    // This is a placeholder for the actual implementation
    const mockCheckpoints = [
      {
        date: new Date(),
        status: 'IN_TRANSIT',
        location: 'Centre de tri',
        message: 'Colis en transit'
      }
    ];

    delivery.external_tracking_data = {
      provider,
      last_sync: new Date(),
      checkpoints: mockCheckpoints
    };

    await delivery.save();
    return delivery;
  }

  // Get delivery statistics
  async getDeliveryStats(shopId, period = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const matchStage = { 
      shop_id: new mongoose.Types.ObjectId(shopId),
      created_at: { $gte: startDate }
    };

    const [
      totalDeliveries,
      byStatus,
      avgDeliveryTime
    ] = await Promise.all([
      Delivery.countDocuments(matchStage),
      Delivery.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Delivery.aggregate([
        { 
          $match: { 
            ...matchStage, 
            status: 'DELIVERED',
            actual_delivery_date: { $exists: true },
            created_at: { $exists: true }
          } 
        },
        {
          $project: {
            deliveryTime: {
              $subtract: ['$actual_delivery_date', '$created_at']
            }
          }
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$deliveryTime' }
          }
        }
      ])
    ]);

    const statusStats = {
      PENDING: 0, CONFIRMED: 0, PREPARING: 0, READY: 0,
      PICKED_UP: 0, IN_TRANSIT: 0, OUT_FOR_DELIVERY: 0,
      DELIVERED: 0, FAILED: 0, RETURNED: 0, CANCELLED: 0
    };
    byStatus.forEach(s => statusStats[s._id] = s.count);

    return {
      total: totalDeliveries,
      byStatus: statusStats,
      avgDeliveryTimeMs: avgDeliveryTime[0]?.avgTime || 0,
      period
    };
  }

  // Cancel delivery
  async cancelDelivery(deliveryId, reason) {
    return this.updateStatus(deliveryId, 'CANCELLED', { 
      note: `Annulé: ${reason}` 
    });
  }
}

module.exports = new DeliveryService();
