const stockService = require('./stock.service');

class StockController {
  // Get stock by product ID
  async getByProductId(req, res, next) {
    try {
      const { productId } = req.params;
      const result = await stockService.getStockByProductId(productId);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get all stocks by shop
  async getByShop(req, res, next) {
    try {
      const { shopId } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        lowStock: req.query.lowStock === 'true',
        outOfStock: req.query.outOfStock === 'true'
      };

      const result = await stockService.getStocksByShop(shopId, options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get all stocks by shop (without pagination)
  async getAllByShop(req, res, next) {
    try {
      const { shopId } = req.params;
      const result = await stockService.getStocksByShop(shopId, { limit: 1000 }); // Get all
      
      // Return array directly for frontend compatibility
      if (result.success && result.data && result.data.stocks) {
        res.json(result.data.stocks);
      } else if (result.success && Array.isArray(result.data)) {
        res.json(result.data);
      } else {
        res.json([]);
      }
    } catch (error) {
      next(error);
    }
  }

  // Add stock (IN movement)
  async addStock(req, res, next) {
    try {
      const { shopId, productId } = req.params;
      const { quantity, reason } = req.body;
      
      const staffId = req.user ? req.user._id : null;
      const staffName = req.user ? `${req.user.first_name} ${req.user.last_name}` : 'Unknown';

      const result = await stockService.addStock(
        shopId,
        productId,
        quantity,
        staffId,
        staffName,
        reason
      );
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Remove stock (OUT movement)
  async removeStock(req, res, next) {
    try {
      const { shopId, productId } = req.params;
      const { quantity, reason } = req.body;
      
      const staffId = req.user ? req.user._id : null;
      const staffName = req.user ? `${req.user.first_name} ${req.user.last_name}` : 'Unknown';

      const result = await stockService.removeStock(
        shopId,
        productId,
        quantity,
        staffId,
        staffName,
        reason
      );
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Update stock quantity (adjustment)
  async updateStock(req, res, next) {
    try {
      const { shopId, productId } = req.params;
      const { new_quantity, reason } = req.body;
      
      const staffId = req.user ? req.user._id : null;
      const staffName = req.user ? `${req.user.first_name} ${req.user.last_name}` : 'Unknown';

      const result = await stockService.updateStock(
        shopId,
        productId,
        new_quantity,
        {
          staff_id: staffId,
          staff_name: staffName,
          movement_type: 'ADJUST',
          quantity: new_quantity,
          reason: reason || 'Ajustement inventaire'
        }
      );
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get stock stats
  async getStats(req, res, next) {
    try {
      const { shopId } = req.params;
      const result = await stockService.getStockStats(shopId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get stock alerts
  async getAlerts(req, res, next) {
    try {
      const { shopId } = req.params;
      const result = await stockService.getStockAlerts(shopId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get stock movements by product ID
  async getMovements(req, res, next) {
    try {
      const { productId } = req.params;
      const result = await stockService.getStockMovements(productId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StockController();
