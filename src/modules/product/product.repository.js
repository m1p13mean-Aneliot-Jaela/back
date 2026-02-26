const Product = require('./product.model');
const mongoose = require('mongoose');
const Stock = require('../stock/stock.model');

// Helper to convert Decimal128 to number and ObjectId to string
function convertDecimal128(obj) {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;
  
  // Decimal128 can appear as Extended JSON ({ $numberDecimal }) or BSON type (lean() returns _bsontype: 'Decimal128')
  if (obj.$numberDecimal) return parseFloat(obj.$numberDecimal);
  if (obj._bsontype === 'Decimal128' && typeof obj.toString === 'function') {
    return parseFloat(obj.toString());
  }

  // ObjectId
  if (obj._bsontype === 'ObjectId' && typeof obj.toString === 'function') {
    return obj.toString();
  }
  
  // Fast path for arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertDecimal128(item));
  }
  
  // Process object properties
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (key === '_id' && value && typeof value === 'object') {
        // Convert _id to string
        result[key] = value.toString ? value.toString() : value;
      } else if (value && typeof value === 'object' && value.$numberDecimal) {
        // Convert Decimal128 fields directly
        result[key] = parseFloat(value.$numberDecimal);
      } else if (value && typeof value === 'object') {
        result[key] = convertDecimal128(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

class ProductRepository {
  async create(product) {
    const doc = product instanceof Product ? product : new Product(product);
    const saved = await doc.save();
    return saved._id;
  }

  async findById(id) {
    const product = await Product.findById(new mongoose.Types.ObjectId(id)).lean();
    if (!product) return null;
    
    const converted = convertDecimal128(product);
    
    // Fetch stock for this product
    const stock = await Stock.findOne({
      shop_id: product.shop_id,
      product_id: new mongoose.Types.ObjectId(id)
    }).lean();
    
    converted.stock_quantity = stock?.current_quantity || 0;
    converted.is_available = converted.stock_quantity > 0;
    
    return converted;
  }

  async findByShop(shopId, options = {}) {
    const { page = 1, limit = 20, isBanned } = options;
    const skip = (page - 1) * limit;
    
    const query = { shop_id: new mongoose.Types.ObjectId(shopId) };
    if (isBanned !== undefined) query.is_banned = isBanned;
    
    const [rawProducts, total, categories] = await Promise.all([
      Product.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
      this.getCategories(shopId)
    ]);
    
    // Get product IDs to fetch stocks (as ObjectIds)
    const productIds = rawProducts.map(p => new mongoose.Types.ObjectId(p._id));
    console.log('DEBUG: ShopId:', shopId);
    console.log('DEBUG: Product IDs count:', productIds.length);
    console.log('DEBUG: First product ID:', productIds[0]?.toString());
    
    // Fetch stocks for these products
    const stocks = await Stock.find({
      shop_id: new mongoose.Types.ObjectId(shopId),
      product_id: { $in: productIds }
    }).lean();
    
    console.log('DEBUG: Found stocks count:', stocks.length);
    console.log('DEBUG: First stock:', stocks[0]);
    console.log('DEBUG: All stocks product_ids:', stocks.map(s => ({ pid: s.product_id?.toString(), qty: s.current_quantity })));
    
    // Create a map of product_id -> stock_quantity
    const stockMap = new Map();
    stocks.forEach(stock => {
      stockMap.set(stock.product_id.toString(), stock.current_quantity);
    });
    
    // Convert Decimal128 to numbers and add stock_quantity
    const products = rawProducts.map(p => {
      const converted = convertDecimal128(p);
      converted.stock_quantity = stockMap.get(p._id.toString()) || 0;
      converted.is_available = converted.stock_quantity > 0;
      return converted;
    });
    
    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        categories
      }
    };
  }

  async update(id, updateData, historyEntry = null) {
    const updateObj = { ...updateData, updated_at: new Date() };
    const update = { $set: updateObj };

    if (historyEntry) {
      update.$push = { update_history: historyEntry };
    }

    const result = await Product.updateOne({ _id: new mongoose.Types.ObjectId(id) }, update);
    return result.modifiedCount;
  }

  async delete(id) {
    const result = await Product.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    return result.deletedCount;
  }

  async getStats(shopId) {
    const query = { shop_id: new mongoose.Types.ObjectId(shopId) };
    
    const [total, banned, withPromo] = await Promise.all([
      Product.countDocuments(query),
      Product.countDocuments({ ...query, is_banned: true }),
      Product.countDocuments({ ...query, 'current_promo.end_date': { $gte: new Date() } })
    ]);
    
    return {
      total,
      active: total - banned,
      banned,
      withPromo,
      lowStock: 0,
      outOfStock: 0
    };
  }

  async getCategories(shopId) {
    const categories = await Product.distinct('categories.name', {
      shop_id: new mongoose.Types.ObjectId(shopId),
      'categories.name': { $exists: true, $ne: null }
    });
    return categories;
  }
}

module.exports = new ProductRepository();
