const productRepository = require('./product.repository');
const stockRepository = require('../stock/stock.repository');
const mongoose = require('mongoose');
const Product = require('./product.model');

class ProductService {
  async createProduct(data) {
    const product = new Product(data);
    const productId = await productRepository.create(product);
    
    // Create initial stock if provided
    if (data.initial_stock && data.initial_stock > 0) {
      await stockRepository.createOrUpdate({
        shop_id: data.shop_id,
        product_id: productId.toString(),
        product_name: data.name,
        current_quantity: data.initial_stock,
        updated_at: new Date()
      });
    }
    
    return productId;
  }

  async getProductById(id) {
    return productRepository.findById(id);
  }

  async searchProducts(filters) {
    const query = {};
    if (filters.keyword) query.$text = { $search: filters.keyword };
    if (filters.categoryId) query['categories.category_id'] = new mongoose.Types.ObjectId(filters.categoryId);
    if (filters.shopId) query.shop_id = new mongoose.Types.ObjectId(filters.shopId);
    return productRepository.find(query);
  }

  async getProductsByShop(shopId, options = {}) {
    return productRepository.findByShop(shopId, options);
  }

  async updateProduct(id, data) {
    // Simple update without history to avoid Decimal128 cast issues
    return productRepository.update(id, data);
  }

  async deleteProduct(id) {
    return productRepository.delete(id);
  }

  async getProductStats(shopId) {
    return productRepository.getStats(shopId);
  }

  async getCategories(shopId) {
    return productRepository.getCategories(shopId);
  }
}

module.exports = new ProductService();
