const Promotion = require('./promotion.model');
const mongoose = require('mongoose');
const { NotFoundError, ValidationError } = require('../../shared/errors/custom-errors');

// Helper to convert Decimal128 in promotion objects
function convertPromotionValues(promotion) {
  if (!promotion) return promotion;
  
  // Handle array
  if (Array.isArray(promotion)) {
    return promotion.map(p => convertPromotionValues(p));
  }
  
  // Handle single object
  if (promotion.value && typeof promotion.value === 'object') {
    if (promotion.value.$numberDecimal) {
      promotion.value = parseFloat(promotion.value.$numberDecimal);
    } else if (promotion.value._bsontype === 'Decimal128') {
      promotion.value = parseFloat(promotion.value.toString());
    }
  }
  
  return promotion;
}

class PromotionService {
  // Create new promotion
  async createPromotion(data) {
    // Check if promo code already exists
    if (data.promo_code) {
      const existing = await Promotion.findOne({ 
        promo_code: data.promo_code.toUpperCase().trim() 
      });
      if (existing) {
        throw new ValidationError('Ce code promo existe déjà');
      }
    }

    // Validate dates
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    
    if (endDate <= startDate) {
      throw new ValidationError('La date de fin doit être après la date de début');
    }

    const promotion = new Promotion({
      shop_id: data.shop_id,
      shop_name: data.shop_name,
      title: data.title,
      description: data.description,
      type: data.type,
      value: data.value,
      promo_code: data.promo_code,
      start_date: startDate,
      end_date: endDate,
      conditions: data.conditions,
      usage_limit: data.usage_limit,
      applicable_products: data.applicable_products || 'ALL',
      exclusions: data.exclusions || []
    });

    await promotion.save();
    return promotion;
  }

  // Get promotions by shop with filters
  async getPromotionsByShop(shopId, options = {}) {
    const { page = 1, limit = 20, isActive, type, search } = options;
    
    const query = { shop_id: shopId };
    
    if (isActive !== undefined) {
      query.is_active = isActive === 'true' || isActive === true;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { promo_code: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [promotions, total] = await Promise.all([
      Promotion.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Promotion.countDocuments(query)
    ]);

    return {
      promotions: convertPromotionValues(promotions),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get promotion by ID
  async getPromotionById(id) {
    const promotion = await Promotion.findById(id).lean();
    if (!promotion) {
      throw new NotFoundError('Promotion non trouvée');
    }
    return convertPromotionValues(promotion);
  }

  // Update promotion
  async updatePromotion(id, data) {
    const promotion = await Promotion.findById(id);
    if (!promotion) {
      throw new NotFoundError('Promotion non trouvée');
    }

    // Check promo code uniqueness if being updated
    if (data.promo_code && data.promo_code !== promotion.promo_code) {
      const existing = await Promotion.findOne({
        promo_code: data.promo_code.toUpperCase().trim(),
        _id: { $ne: id }
      });
      if (existing) {
        throw new ValidationError('Ce code promo existe déjà');
      }
    }

    // Validate dates if being updated
    if (data.start_date || data.end_date) {
      const startDate = data.start_date ? new Date(data.start_date) : promotion.start_date;
      const endDate = data.end_date ? new Date(data.end_date) : promotion.end_date;
      
      if (endDate <= startDate) {
        throw new ValidationError('La date de fin doit être après la date de début');
      }
    }

    // Update fields
    const updatableFields = [
      'title', 'description', 'type', 'value', 'promo_code',
      'start_date', 'end_date', 'conditions', 'usage_limit',
      'is_active', 'applicable_products', 'exclusions'
    ];

    updatableFields.forEach(field => {
      if (data[field] !== undefined) {
        promotion[field] = data[field];
      }
    });

    await promotion.save();
    return promotion;
  }

  // Delete promotion
  async deletePromotion(id) {
    const result = await Promotion.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundError('Promotion non trouvée');
    }
    return { deleted: true };
  }

  // Toggle promotion status
  async toggleStatus(id, isActive) {
    const promotion = await Promotion.findById(id);
    if (!promotion) {
      throw new NotFoundError('Promotion non trouvée');
    }

    promotion.is_active = isActive;
    await promotion.save();
    return promotion;
  }

  // Get promotion stats for a shop
  async getPromotionStats(shopId) {
    const now = new Date();
    
    const [
      total,
      active,
      expired,
      scheduled,
      byType
    ] = await Promise.all([
      Promotion.countDocuments({ shop_id: shopId }),
      Promotion.countDocuments({ 
        shop_id: shopId, 
        is_active: true,
        start_date: { $lte: now },
        end_date: { $gte: now }
      }),
      Promotion.countDocuments({ 
        shop_id: shopId, 
        end_date: { $lt: now }
      }),
      Promotion.countDocuments({ 
        shop_id: shopId, 
        start_date: { $gt: now }
      }),
      Promotion.aggregate([
        { $match: { shop_id: new mongoose.Types.ObjectId(shopId) } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    const typeStats = { percentage: 0, fixed_amount: 0 };
    byType.forEach(item => {
      typeStats[item._id] = item.count;
    });

    return {
      total,
      active,
      expired,
      scheduled,
      byType: typeStats
    };
  }

  // Validate and apply promo code
  async validatePromoCode(code, shopId) {
    const promotion = await Promotion.findOne({
      promo_code: code.toUpperCase().trim(),
      shop_id: shopId,
      is_active: true
    });

    if (!promotion) {
      return { valid: false, message: 'Code promo invalide' };
    }

    const now = new Date();
    
    if (now < promotion.start_date) {
      return { valid: false, message: 'Cette promotion n\'a pas encore démarré' };
    }
    
    if (now > promotion.end_date) {
      return { valid: false, message: 'Cette promotion a expiré' };
    }
    
    if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
      return { valid: false, message: 'Cette promotion a atteint sa limite d\'utilisation' };
    }

    return { valid: true, promotion };
  }

  // Increment usage count
  async incrementUsage(id) {
    await Promotion.findByIdAndUpdate(id, {
      $inc: { usage_count: 1 }
    });
  }

  // Check if product is eligible for promotion
  async isProductEligible(promotionId, productId) {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) return false;

    // Check if in exclusions
    if (promotion.exclusions && promotion.exclusions.includes(productId)) {
      return false;
    }

    // Check applicable products
    if (promotion.applicable_products === 'ALL') {
      return true;
    }

    if (Array.isArray(promotion.applicable_products)) {
      return promotion.applicable_products.includes(productId);
    }

    return false;
  }

  // Auto-expire promotions (cron job)
  async expireOldPromotions() {
    const now = new Date();
    const result = await Promotion.updateMany(
      {
        end_date: { $lt: now },
        is_active: true
      },
      {
        $set: { is_active: false }
      }
    );
    return result.modifiedCount;
  }

  // Get active promotions for shop products with calculated prices
  async getActivePromotionsForProducts(shopId, productIds = []) {
    const now = new Date();
    
    const query = {
      shop_id: shopId,
      is_active: true,
      start_date: { $lte: now },
      end_date: { $gte: now }
    };

    // If specific products requested, filter by applicability
    if (productIds.length > 0) {
      query.$or = [
        { applicable_products: 'ALL' },
        { applicable_products: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) } }
      ];
    }

    const promotions = await Promotion.find(query).lean();
    
    return convertPromotionValues(promotions);
  }

  // Calculate promo price for a product
  calculatePromoPrice(unitPrice, promotion) {
    if (!promotion || !promotion.is_active) return null;
    
    const now = new Date();
    if (now < promotion.start_date || now > promotion.end_date) return null;
    
    let promoPrice = unitPrice;
    if (promotion.type === 'percentage') {
      promoPrice = unitPrice * (1 - promotion.value / 100);
    } else {
      promoPrice = unitPrice - promotion.value;
    }
    
    return Math.max(0, promoPrice);
  }
}

module.exports = new PromotionService();
