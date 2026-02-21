const Stock = require('./stock.model');

class StockRepository {
  // Create or update stock
  async createOrUpdate(stockData) {
    const { shop_id, product_id } = stockData;
    
    // Try to find existing stock
    let stock = await Stock.findOne({ shop_id, product_id });
    
    if (stock) {
      // Update existing
      stock.current_quantity = stockData.current_quantity || stock.current_quantity;
      stock.product_name = stockData.product_name || stock.product_name;
      stock.updated_at = new Date();
      return await stock.save();
    } else {
      // Create new
      stock = new Stock(stockData);
      return await stock.save();
    }
  }

  // Find by ID
  async findById(id) {
    return await Stock.findById(id);
  }

  // Find by shop and product
  async findByShopAndProduct(shopId, productId) {
    return await Stock.findOne({ shop_id: shopId, product_id: productId });
  }

  // Get all stocks by shop
  async findByShop(shopId, options = {}) {
    const { page = 1, limit = 20, lowStock = false, outOfStock = false } = options;

    const query = { shop_id: shopId };
    
    if (lowStock) {
      query.current_quantity = { $gt: 0, $lte: 5 }; // Assuming default alert threshold
    }
    if (outOfStock) {
      query.current_quantity = 0;
    }

    const stocks = await Stock.find(query)
      .sort({ updated_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Stock.countDocuments(query);

    return {
      stocks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get stock by product ID
  async getStockByProductId(productId) {
    return await Stock.findOne({ product_id: productId });
  }

  // Add movement to stock
  async addMovement(shopId, productId, movementData) {
    const stock = await Stock.findOne({ shop_id: shopId, product_id: productId });
    if (!stock) return null;

    await stock.addMovement(movementData);
    return stock;
  }

  // Update quantity
  async updateQuantity(shopId, productId, newQuantity, movementData) {
    const stock = await Stock.findOne({ shop_id: shopId, product_id: productId });
    if (!stock) return null;

    await stock.updateQuantity(newQuantity, movementData);
    return stock;
  }

  // Get stock stats by shop
  async getStats(shopId) {
    const total = await Stock.countDocuments({ shop_id: shopId });
    const lowStock = await Stock.countDocuments({
      shop_id: shopId,
      current_quantity: { $gt: 0, $lte: 5 }
    });
    const outOfStock = await Stock.countDocuments({
      shop_id: shopId,
      current_quantity: 0
    });

    return {
      total,
      lowStock,
      outOfStock,
      inStock: total - lowStock - outOfStock
    };
  }

  // Get stock alerts (low or out of stock)
  async getAlerts(shopId) {
    return await Stock.find({
      shop_id: shopId,
      $or: [
        { current_quantity: 0 },
        { current_quantity: { $gt: 0, $lte: 5 } }
      ]
    }).sort({ current_quantity: 1 });
  }

  // Delete stock
  async delete(id) {
    return await Stock.findByIdAndDelete(id);
  }

  // Delete by product ID (when product is deleted)
  async deleteByProductId(productId) {
    return await Stock.deleteOne({ product_id: productId });
  }
}

module.exports = new StockRepository();
