const Product = require('./product.model');
const mongoose = require('mongoose');

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
    return product ? convertDecimal128(product) : null;
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
    
    // Convert Decimal128 to numbers
    const products = rawProducts.map(p => convertDecimal128(p));
    
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
