const Order = require('./order.model');
const mongoose = require('mongoose');
const deliveryService = require('../delivery/delivery.service');

class OrderService {
  // Generate unique order number
  generateOrderNumber() {
    const date = new Date();
    const prefix = 'ORD';
    const timestamp = date.getFullYear().toString() +
                      String(date.getMonth() + 1).padStart(2, '0') +
                      String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${timestamp}-${random}`;
  }

  // Calculate shipping fee based on delivery zones
  async calculateShippingFee(shopId, customerAddress) {
    try {
      // Get delivery zones for the shop
      const zones = await deliveryService.getZonesByShop(shopId);
      
      if (!zones || zones.length === 0) {
        // No zones defined, return default 3000 Ar
        return 3000;
      }

      // Try to find matching zone by city/address
      const customerCity = customerAddress?.city?.toLowerCase().trim();
      const customerAddressLower = customerAddress?.street?.toLowerCase().trim();

      // Look for exact city match first
      let matchingZone = zones.find(zone => {
        const zoneCities = zone.cities?.map(city => city.toLowerCase().trim()) || [];
        return !!customerCity && zoneCities.includes(customerCity);
      });

      // If no city match, check if address contains zone name
      if (!matchingZone) {
        matchingZone = zones.find(zone => {
          const zoneName = zone.name?.toLowerCase().trim();
          return customerAddressLower?.includes(zoneName) || customerCity?.includes(zoneName);
        });
      }

      // Return zone price or default
      return matchingZone ? (matchingZone.base_fee || 0) : 3000;
    } catch (error) {
      console.error('Error calculating shipping fee:', error);
      return 3000; // Default fallback
    }
  }

  // Create new order
  async createOrder(orderData) {
    if (!orderData.shop_id) {
      throw new Error('shop_id is required to create an order');
    }

    // Calculate shipping fee automatically if not provided
    let shippingFee = orderData.shipping_fee;
    if (!shippingFee && orderData.customer?.address) {
      shippingFee = await this.calculateShippingFee(orderData.shop_id, orderData.customer.address);
    }
    shippingFee = shippingFee || 3000; // Default 3000 Ar

    // Calculate totals
    const subtotal = orderData.items.reduce(
      (sum, item) => sum + (item.unit_price * item.quantity),
      0
    );
    const total_amount = subtotal + shippingFee - (orderData.discount || 0);

    // Generate order number manually (pre-save hook may not work with validation)
    const orderNumber = this.generateOrderNumber();

    const order = new Order({
      ...orderData,
      order_number: orderNumber,
      subtotal,
      shipping_fee: shippingFee,
      total_amount,
      status_history: [{ status: orderData.status || 'PENDING', changed_at: new Date() }]
    });

    return await order.save();
  }

  // Get orders by shop with filters
  async getOrdersByShop(shopId, filters = {}) {
    const query = { shop_id: new mongoose.Types.ObjectId(shopId) };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      query.created_at = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    if (filters.search) {
      query.$or = [
        { order_number: { $regex: filters.search, $options: 'i' } },
        { 'customer.name': { $regex: filters.search, $options: 'i' } },
        { 'customer.phone': { $regex: filters.search, $options: 'i' } }
      ];
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get single order
  async getOrderById(orderId, shopId) {
    // Validate orderId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid order ID format');
    }
    
    const query = { _id: new mongoose.Types.ObjectId(orderId) };
    if (shopId) {
      if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new Error('Invalid shop ID format');
      }
      query.shop_id = new mongoose.Types.ObjectId(shopId);
    }

    const order = await Order.findOne(query).lean();
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  // Update order status
  async updateStatus(orderId, shopId, newStatus, changedBy, note) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid order ID format');
    }
    if (shopId && !mongoose.Types.ObjectId.isValid(shopId)) {
      throw new Error('Invalid shop ID format');
    }
    const validTransitions = {
      'PENDING': ['CONFIRMED', 'CANCELED'],
      'CONFIRMED': ['PAYMENT_REQUESTED', 'CANCELED'],
      'PAYMENT_REQUESTED': ['PAID', 'CANCELED'],
      'PAID': ['SHIPPED', 'CANCELED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': [],
      'CANCELED': []
    };

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      shop_id: new mongoose.Types.ObjectId(shopId)
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    if (!validTransitions[order.status].includes(newStatus)) {
      throw new Error(`Cannot transition from ${order.status} to ${newStatus}`);
    }

    // Update status
    order.status = newStatus;

    // Add to history
    order.status_history.push({
      status: newStatus,
      changed_by: changedBy,
      changed_at: new Date(),
      note
    });

    // Update delivery info if delivered
    if (newStatus === 'DELIVERED') {
      order.delivery.actual_delivery = new Date();
    }

    // Update payment if canceled
    if (newStatus === 'CANCELED') {
      order.payment.status = 'REFUNDED';
    }

    return await order.save();
  }

  // Client confirms payment (changes status from PAYMENT_REQUESTED to PAID)
  async clientConfirmPayment(orderId, clientUserId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid order ID format');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Verify order is in PAYMENT_REQUESTED status
    if (order.status !== 'PAYMENT_REQUESTED') {
      throw new Error(`Cannot confirm payment. Order status is ${order.status}, expected PAYMENT_REQUESTED`);
    }

    // Update status to PAID
    order.status = 'PAID';
    order.payment.status = 'PAID';
    order.payment.paid_at = new Date();
    
    // Add to history
    order.status_history.push({
      status: 'PAID',
      changed_at: new Date(),
      note: 'Payment confirmed by client'
    });

    return await order.save();
  }

  // Update order (limited fields)
  async updateOrder(orderId, shopId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid order ID format');
    }
    if (shopId && !mongoose.Types.ObjectId.isValid(shopId)) {
      throw new Error('Invalid shop ID format');
    }

    const allowedFields = ['customer', 'customer_note', 'internal_note', 'payment'];
    const update = {};

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        update[field] = updateData[field];
      }
    });

    const order = await Order.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(orderId),
        shop_id: shopId ? new mongoose.Types.ObjectId(shopId) : undefined
      },
      { $set: update },
      { new: true }
    );

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  // Delete order (only pending)
  async deleteOrder(orderId, shopId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid order ID format');
    }
    if (shopId && !mongoose.Types.ObjectId.isValid(shopId)) {
      throw new Error('Invalid shop ID format');
    }

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      shop_id: shopId ? new mongoose.Types.ObjectId(shopId) : undefined
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new Error('Only pending orders can be deleted');
    }

    await Order.deleteOne({ _id: order._id });
    return { deleted: true };
  }

  // Get order statistics for dashboard
  async getOrderStats(shopId, periodDays = 30) {
    return await Order.getDashboardStats(shopId, periodDays);
  }

  // Get conversion rate
  async getConversionRate(shopId, periodDays = 30) {
    return await Order.getConversionRate(shopId, periodDays);
  }

  // Get recent orders (for dashboard)
  async getRecentOrders(shopId, limit = 5) {
    return await Order.find({ shop_id: new mongoose.Types.ObjectId(shopId) })
      .sort({ created_at: -1 })
      .limit(limit)
      .select('order_number customer status total_amount created_at')
      .lean();
  }

  // Get orders by status count (for dashboard to-do)
  async getOrdersByStatus(shopId) {
    const counts = await Order.aggregate([
      { $match: { shop_id: new mongoose.Types.ObjectId(shopId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total_value: { $sum: '$total_amount' }
        }
      }
    ]);

    const result = {
      PENDING: { count: 0, total_value: 0 },
      CONFIRMED: { count: 0, total_value: 0 },
      SHIPPED: { count: 0, total_value: 0 },
      DELIVERED: { count: 0, total_value: 0 },
      CANCELED: { count: 0, total_value: 0 }
    };

    counts.forEach(c => {
      result[c._id] = { count: c.count, total_value: c.total_value };
    });

    return result;
  }

  // Export orders data
  async getOrdersForExport(shopId, filters = {}) {
    const query = { shop_id: new mongoose.Types.ObjectId(shopId) };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      query.created_at = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    return await Order.find(query)
      .sort({ created_at: -1 })
      .lean();
  }
}

module.exports = new OrderService();
