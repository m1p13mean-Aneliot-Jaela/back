const promotionService = require('./promotion.service');
const { catchAsync } = require('../../shared/errors/custom-errors');
const HTTP_STATUS = require('../../shared/constants/http-status');
const mongoose = require('mongoose');

class PromotionController {
  // Create promotion
  createPromotion = catchAsync(async (req, res) => {
    const data = {
      ...req.body,
      shop_id: req.params.shopId || req.body.shop_id,
      shop_name: req.shop?.shop_name || req.body.shop_name
    };

    const promotion = await promotionService.createPromotion(data);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Promotion créée avec succès',
      data: promotion
    });
  });

  // Get promotions by shop
  getPromotionsByShop = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const { page, limit, isActive, type, keyword } = req.query;

    const result = await promotionService.getPromotionsByShop(shopId, {
      page,
      limit,
      isActive,
      type,
      search: keyword
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  });

  // Get promotion by ID
  getPromotionById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const promotion = await promotionService.getPromotionById(id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: promotion
    });
  });

  // Update promotion
  updatePromotion = catchAsync(async (req, res) => {
    const { id } = req.params;
    const promotion = await promotionService.updatePromotion(id, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Promotion mise à jour avec succès',
      data: promotion
    });
  });

  // Delete promotion
  deletePromotion = catchAsync(async (req, res) => {
    const { id } = req.params;
    await promotionService.deletePromotion(id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Promotion supprimée avec succès'
    });
  });

  // Toggle promotion status
  toggleStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    const promotion = await promotionService.toggleStatus(id, is_active);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Promotion ${is_active ? 'activée' : 'désactivée'} avec succès`,
      data: promotion
    });
  });

  // Get promotion stats
  getPromotionStats = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const stats = await promotionService.getPromotionStats(shopId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats
    });
  });

  // Validate promo code
  validatePromoCode = catchAsync(async (req, res) => {
    const { code } = req.params;
    const { shop_id } = req.query;

    const result = await promotionService.validatePromoCode(code, shop_id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  });

  // Get applicable products for a promotion
  getPromotionProducts = catchAsync(async (req, res) => {
    const { id } = req.params;
    const promotion = await promotionService.getPromotionById(id);
    
    let productIds = [];
    if (promotion.applicable_products === 'ALL') {
      // Return empty array or all shop products depending on your needs
      productIds = 'ALL';
    } else if (Array.isArray(promotion.applicable_products)) {
      productIds = promotion.applicable_products;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: productIds
    });
  });

  // Update promotion products
  updatePromotionProducts = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { applicable_products } = req.body;

    const promotion = await promotionService.updatePromotion(id, { applicable_products });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Produits mis à jour avec succès',
      data: promotion
    });
  });

  // Apply promo code to an order (internal use)
  applyPromoCode = catchAsync(async (req, res) => {
    const { code } = req.params;
    const { shop_id, product_ids, order_amount } = req.body;

    const validation = await promotionService.validatePromoCode(code, shop_id);

    if (!validation.valid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: validation.message
      });
    }

    const { promotion } = validation;

    // Check if products are eligible
    if (product_ids && Array.isArray(product_ids)) {
      const eligibleProducts = [];
      for (const productId of product_ids) {
        const isEligible = await promotionService.isProductEligible(promotion._id, productId);
        if (isEligible) {
          eligibleProducts.push(productId);
        }
      }

      if (eligibleProducts.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Aucun produit éligible pour cette promotion'
        });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (promotion.type === 'percentage') {
      discountAmount = (order_amount * promotion.value) / 100;
    } else {
      discountAmount = promotion.value;
    }

    // Increment usage count
    await promotionService.incrementUsage(promotion._id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        promotion,
        discount_amount: discountAmount,
        final_amount: order_amount - discountAmount
      }
    });
  });

  // Get active promotions for shop products
  getActivePromotionsForProducts = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const { product_ids } = req.query;

    const productIds = product_ids ? product_ids.split(',') : [];
    const promotions = await promotionService.getActivePromotionsForProducts(shopId, productIds);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: promotions
    });
  });
}

module.exports = new PromotionController();
