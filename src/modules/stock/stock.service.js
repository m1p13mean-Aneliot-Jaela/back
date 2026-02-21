const stockRepository = require('./stock.repository');

class StockService {
  // Initialize stock for a new product
  async initializeStock(shopId, productId, productName, initialQuantity = 0) {
    try {
      const stock = await stockRepository.createOrUpdate({
        shop_id: shopId,
        product_id: productId,
        product_name: productName,
        current_quantity: initialQuantity,
        updated_at: new Date()
      });
      
      return {
        success: true,
        message: 'Stock initialisé avec succès',
        data: stock
      };
    } catch (error) {
      throw error;
    }
  }

  // Get stock by product ID
  async getStockByProductId(productId) {
    const stock = await stockRepository.getStockByProductId(productId);
    if (!stock) {
      return {
        success: false,
        message: 'Stock non trouvé pour ce produit'
      };
    }
    return {
      success: true,
      data: stock
    };
  }

  // Get all stocks by shop
  async getStocksByShop(shopId, options = {}) {
    const result = await stockRepository.findByShop(shopId, options);
    return {
      success: true,
      data: result
    };
  }

  // Update stock quantity
  async updateStock(shopId, productId, newQuantity, movementData) {
    try {
      const stock = await stockRepository.updateQuantity(shopId, productId, newQuantity, {
        staff_id: movementData.staff_id,
        staff_name: movementData.staff_name,
        movement_type: movementData.movement_type || 'ADJUST',
        quantity: movementData.quantity,
        reason: movementData.reason,
        new_quantity: newQuantity
      });
      
      if (!stock) {
        return {
          success: false,
          message: 'Stock non trouvé'
        };
      }
      
      return {
        success: true,
        message: 'Stock mis à jour avec succès',
        data: stock
      };
    } catch (error) {
      throw error;
    }
  }

  // Add stock (IN movement)
  async addStock(shopId, productId, quantity, staffId, staffName, reason) {
    const existingStock = await stockRepository.findByShopAndProduct(shopId, productId);
    const currentQty = existingStock ? existingStock.current_quantity : 0;
    const newQuantity = currentQty + quantity;
    
    return await this.updateStock(shopId, productId, newQuantity, {
      staff_id: staffId,
      staff_name: staffName,
      movement_type: 'IN',
      quantity: quantity,
      reason: reason || 'Entrée de stock'
    });
  }

  // Remove stock (OUT movement)
  async removeStock(shopId, productId, quantity, staffId, staffName, reason) {
    const existingStock = await stockRepository.findByShopAndProduct(shopId, productId);
    if (!existingStock) {
      return {
        success: false,
        message: 'Stock non trouvé'
      };
    }
    
    if (existingStock.current_quantity < quantity) {
      return {
        success: false,
        message: 'Quantité insuffisante en stock',
        error: 'INSUFFICIENT_STOCK'
      };
    }
    
    const newQuantity = existingStock.current_quantity - quantity;
    
    return await this.updateStock(shopId, productId, newQuantity, {
      staff_id: staffId,
      staff_name: staffName,
      movement_type: 'OUT',
      quantity: quantity,
      reason: reason || 'Sortie de stock'
    });
  }

  // Get stock stats
  async getStockStats(shopId) {
    const stats = await stockRepository.getStats(shopId);
    return {
      success: true,
      data: stats
    };
  }

  // Get stock alerts
  async getStockAlerts(shopId) {
    const alerts = await stockRepository.getAlerts(shopId);
    const formattedAlerts = alerts.map(s => ({
      stockId: s._id,
      productId: s.product_id,
      productName: s.product_name,
      currentStock: s.current_quantity,
      status: s.current_quantity === 0 ? 'out' : 'low'
    }));
    
    return {
      success: true,
      data: formattedAlerts
    };
  }

  // Delete stock (when product is deleted)
  async deleteStockByProductId(productId) {
    const result = await stockRepository.deleteByProductId(productId);
    return {
      success: true,
      message: 'Stock supprimé avec succès',
      data: result
    };
  }

  // Get stock movements by product ID
  async getStockMovements(productId) {
    const StockMovement = require('./stock-movement.model');
    const movements = await StockMovement.find({ product_id: productId })
      .sort({ created_at: -1 })
      .limit(50);
    
    return {
      success: true,
      data: movements
    };
  }
}

module.exports = new StockService();
