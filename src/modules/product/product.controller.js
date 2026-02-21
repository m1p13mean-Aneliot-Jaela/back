const productService = require('./product.service');

class ProductController {
  async create(req, res) {
    try {
      const productId = await productService.createProduct(req.body);
      res.status(201).json({ success: true, productId });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.json({ success: true, data: product });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async search(req, res) {
    try {
      const products = await productService.searchProducts(req.query);
      res.json({ success: true, products });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getByShop(req, res) {
    try {
      const { shopId } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        isBanned: req.query.isBanned === 'true' ? true : req.query.isBanned === 'false' ? false : undefined
      };
      const result = await productService.getProductsByShop(shopId, options);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async update(req, res) {
    try {
      const count = await productService.updateProduct(req.params.id, req.body);
      if (count === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const product = await productService.getProductById(req.params.id);
      res.json({ success: true, message: 'Product updated successfully', data: product });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const count = await productService.deleteProduct(req.params.id);
      if (count === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getStats(req, res) {
    try {
      const { shopId } = req.params;
      const stats = await productService.getProductStats(shopId);
      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCategories(req, res) {
    try {
      const { shopId } = req.params;
      const categories = await productService.getCategories(shopId);
      res.json({ success: true, data: categories });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}


module.exports = new ProductController();
