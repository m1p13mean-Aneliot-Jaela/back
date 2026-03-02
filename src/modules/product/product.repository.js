const Product = require('./product.model');
const mongoose = require('mongoose');
const Stock = require('../stock/stock.model');
const Promotion = require('../promotion/promotion.model');

// Helper to convert Decimal128 to number and ObjectId to string
function convertDecimal128(obj) {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;

  // Preserve Date instances
  if (obj instanceof Date) return obj;
  
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
      } else if (value instanceof Date) {
        result[key] = value;
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
    const { page = 1, limit = 20, isBanned, search, minPrice, maxPrice, category, sortBy = 'newest' } = options;
    const skip = (page - 1) * limit;
    
    const query = { shop_id: new mongoose.Types.ObjectId(shopId) };
    if (isBanned !== undefined) query.is_banned = isBanned;
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Price range filter (on unit_price or promo_price if active)
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceQuery = {};
      if (minPrice !== undefined) priceQuery.$gte = minPrice;
      if (maxPrice !== undefined) priceQuery.$lte = maxPrice;
      query.unit_price = priceQuery;
    }
    
    // Category filter - categories is an array of objects with category_id and name
    if (category) {
      // Check if category looks like an ObjectId (24 hex chars)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
      
      if (isObjectId) {
        // Search by category_id
        query['categories.category_id'] = new mongoose.Types.ObjectId(category);
      } else {
        // Search by name (case-insensitive)
        query['categories.name'] = { $regex: category, $options: 'i' };
      }
    }
    
    // Build sort
    let sortOption = { created_at: -1 };
    switch (sortBy) {
      case 'price_asc':
        sortOption = { unit_price: 1 };
        break;
      case 'price_desc':
        sortOption = { unit_price: -1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'promo':
        // Promo is computed at runtime from the Promotion collection, so we can't sort in Mongo by current_promo
        sortOption = { created_at: -1 };
        break;
      default: // newest
        sortOption = { created_at: -1 };
    }
    
    const [rawProducts, total, categories] = await Promise.all([
      Product.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
      this.getCategories(shopId)
    ]);
    
    // Get product IDs to fetch stocks (as ObjectIds)
    const productIds = rawProducts.map(p => new mongoose.Types.ObjectId(p._id));
    
    // Fetch stocks for these products
    const stocks = await Stock.find({
      shop_id: new mongoose.Types.ObjectId(shopId),
      product_id: { $in: productIds }
    }).lean();
    
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

    const now = new Date();
    const rawPromotions = await Promotion.find({
      shop_id: new mongoose.Types.ObjectId(shopId),
      is_active: true,
      start_date: { $lte: now },
      end_date: { $gte: now }
    }).lean();
    const promotions = convertDecimal128(rawPromotions);

    if (Array.isArray(promotions) && promotions.length > 0) {
      for (const product of products) {
        const productId = product?._id?.toString?.() ?? String(product?._id);
        let bestPromo = null;
        let bestPromoPrice = null;

        for (const promo of promotions) {
          if (!promo) continue;

          const exclusions = Array.isArray(promo.exclusions) ? promo.exclusions.map(e => e?.toString?.() ?? String(e)) : [];
          if (productId && exclusions.includes(productId)) continue;

          const applicable = promo.applicable_products;
          const isApplicableToAll = applicable === 'ALL';
          const isApplicableToProduct = Array.isArray(applicable)
            ? applicable.map(a => a?.toString?.() ?? String(a)).includes(productId)
            : false;
          if (!isApplicableToAll && !isApplicableToProduct) continue;

          const unitPrice = typeof product.unit_price === 'number' ? product.unit_price : parseFloat(product.unit_price);
          if (!Number.isFinite(unitPrice)) continue;
          const value = typeof promo.value === 'number' ? promo.value : parseFloat(promo.value);
          if (!Number.isFinite(value)) continue;

          let promoPrice = unitPrice;
          if (promo.type === 'percentage') {
            promoPrice = unitPrice * (1 - value / 100);
          } else if (promo.type === 'fixed_amount') {
            promoPrice = unitPrice - value;
          }
          promoPrice = Math.max(0, promoPrice);

          if (bestPromoPrice === null || promoPrice < bestPromoPrice) {
            bestPromoPrice = promoPrice;
            bestPromo = promo;
          }
        }

        if (bestPromo && bestPromoPrice !== null) {
          product.current_promo = {
            promo_price: bestPromoPrice,
            start_date: bestPromo.start_date,
            end_date: bestPromo.end_date,
            created_at: bestPromo.created_at
          };
        }
      }
    }

    if (sortBy === 'promo') {
      products.sort((a, b) => {
        const aHas = a && a.current_promo ? 1 : 0;
        const bHas = b && b.current_promo ? 1 : 0;
        if (aHas !== bHas) return bHas - aHas;
        const aCreated = a && a.created_at ? new Date(a.created_at).getTime() : 0;
        const bCreated = b && b.created_at ? new Date(b.created_at).getTime() : 0;
        return bCreated - aCreated;
      });
    }
    
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