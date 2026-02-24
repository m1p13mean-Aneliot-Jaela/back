const mongoose = require('mongoose');

// Order item schema
const OrderItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit_price: { type: Number, required: true, min: 0 },
  total_price: { type: Number, required: true, min: 0 }
});

// Status history entry
const StatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'PAYMENT_REQUESTED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'],
    required: true
  },
  changed_at: { type: Date, default: Date.now },
  changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String }
});

// Order schema
const OrderSchema = new mongoose.Schema({
  // Shop reference
  shop_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true
  },

  // Order number (auto-generated)
  order_number: {
    type: String,
    required: true,
    unique: true
  },

  // Customer info
  customer: {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    address: {
      street: { type: String },
      city: { type: String },
      postal_code: { type: String }
    }
  },

  // Order items
  items: [OrderItemSchema],

  // Financials
  subtotal: { type: Number, required: true, min: 0 },
  shipping_fee: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total_amount: { type: Number, required: true, min: 0 },

  // Status workflow
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'PAYMENT_REQUESTED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'],
    default: 'PENDING',
    index: true
  },

  // Status history
  status_history: [StatusHistorySchema],

  // Delivery
  delivery: {
    delivery_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
    tracking_number: { type: String },
    estimated_delivery: { type: Date },
    actual_delivery: { type: Date }
  },

  // Payment
  payment: {
    method: {
      type: String,
      enum: ['CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER'],
      default: 'CASH'
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    paid_at: { type: Date }
  },

  // Notes
  customer_note: { type: String },
  internal_note: { type: String },

  // Timestamps
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now }
});

// Indexes for queries
OrderSchema.index({ shop_id: 1, created_at: -1 });
OrderSchema.index({ shop_id: 1, status: 1 });
OrderSchema.index({ order_number: 1 });

// Pre-save middleware to update timestamps
OrderSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Generate order number
OrderSchema.pre('save', async function(next) {
  if (!this.order_number) {
    const date = new Date();
    const prefix = 'ORD';
    const timestamp = date.getFullYear().toString() +
                      String(date.getMonth() + 1).padStart(2, '0') +
                      String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.order_number = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

// Add status history on status change
OrderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.status_history.push({
      status: this.status,
      changed_at: new Date()
    });
  }
  next();
});

// Virtual for item count
OrderSchema.virtual('item_count').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Static method for dashboard stats
OrderSchema.statics.getDashboardStats = async function(shopId, periodDays = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const matchStage = {
    shop_id: new mongoose.Types.ObjectId(shopId),
    created_at: { $gte: startDate }
  };

  const [
    totalRevenue,
    ordersCount,
    ordersByStatus,
    topProducts,
    monthlySales
  ] = await Promise.all([
    // Total revenue
    this.aggregate([
      { $match: { ...matchStage, status: { $ne: 'CANCELED' } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]),

    // Orders count
    this.countDocuments(matchStage),

    // Orders by status
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // Top products
    this.aggregate([
      { $match: { ...matchStage, status: { $ne: 'CANCELED' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product_id',
          name: { $first: '$items.product_name' },
          total_quantity: { $sum: '$items.quantity' },
          total_revenue: { $sum: '$items.total_price' }
        }
      },
      { $sort: { total_quantity: -1 } },
      { $limit: 5 }
    ]),

    // Monthly sales for graph (last 12 months)
    this.aggregate([
      {
        $match: {
          shop_id: new mongoose.Types.ObjectId(shopId),
          status: { $ne: 'CANCELED' },
          created_at: {
            $gte: new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' }
          },
          revenue: { $sum: '$total_amount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  const statusMap = { PENDING: 0, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELED: 0 };
  ordersByStatus.forEach(s => statusMap[s._id] = s.count);

  return {
    period: periodDays,
    revenue: totalRevenue[0]?.total || 0,
    orders_count: ordersCount,
    orders_by_status: statusMap,
    top_products: topProducts,
    monthly_sales: monthlySales.map(m => ({
      month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
      revenue: m.revenue,
      orders: m.orders
    }))
  };
};

// Static for conversion rate (requires tracking views - simplified)
OrderSchema.statics.getConversionRate = async function(shopId, periodDays = 30) {
  // Placeholder - in real app you'd compare orders to shop visits
  // For now, return based on order completion rate
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const [completed, total] = await Promise.all([
    this.countDocuments({
      shop_id: new mongoose.Types.ObjectId(shopId),
      status: 'DELIVERED',
      created_at: { $gte: startDate }
    }),
    this.countDocuments({
      shop_id: new mongoose.Types.ObjectId(shopId),
      created_at: { $gte: startDate }
    })
  ]);

  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
