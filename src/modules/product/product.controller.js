const productService = require('./product.service');

class ProductController {
  async create(req, res) {
    try {
      console.log('DEBUG: Creating product with data:', JSON.stringify(req.body, null, 2));
      console.log('DEBUG: Images received:', req.body.images?.length || 0);
      
      const productId = await productService.createProduct(req.body);
      
      // Fetch the created product to return full data
      const product = await productService.getProductById(productId.toString());
      console.log('DEBUG: Product created with images:', product.images?.length || 0);
      
      res.status(201).json({ success: true, productId, data: product });
    } catch (err) {
      console.error('DEBUG: Error creating product:', err);
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
      console.log('DEBUG: Update product ID:', req.params.id);
      console.log('DEBUG: Update body:', JSON.stringify(req.body, null, 2));
      console.log('DEBUG: Images in update:', req.body.images?.length || 0);
      
      const count = await productService.updateProduct(req.params.id, req.body);
      if (count === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const product = await productService.getProductById(req.params.id);
      res.json({ success: true, message: 'Product updated successfully', data: product });
    } catch (err) {
      console.error('DEBUG: Error updating product:', err);
      res.status(500).json({ success: false, message: err.message, stack: err.stack });
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
