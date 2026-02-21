const shopRepository = require('./shop.repository');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../shared/errors/custom-errors');

class ShopService {
  /**
   * Create a new shop
   */
  async createShop(shopData) {
    // Create shop with pending status by default
    const shop = await shopRepository.create({
      ...shopData,
      current_status: {
        status: 'pending',
        updated_at: new Date()
      },
      created_at: new Date()
    });

    return shop;
  }

  /**
   * Get shop by ID
   */
  async getShopById(id) {
    const shop = await shopRepository.findById(id);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    return shop;
  }

  /**
   * Get all shops with filters
   */
  async getAllShops(filters = {}, options = {}) {
    return shopRepository.findAll(filters, options);
  }

  /**
   * Get shops by category
   */
  async getShopsByCategory(categoryId, filters = {}, options = {}) {
    return shopRepository.findByCategory(categoryId, filters, options);
  }

  /**
   * Get shops by status
   */
  async getShopsByStatus(status, filters = {}, options = {}) {
    const validStatuses = ['pending', 'validated', 'active', 'deactivated', 'suspended'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status: ${status}. Valid values: ${validStatuses.join(', ')}`);
    }
    return shopRepository.findByStatus(status, filters, options);
  }

  /**
   * Update shop
   */
  async updateShop(id, updateData) {
    const shop = await this.getShopById(id);

    // Prevent status change through update (use specific methods)
    if (updateData.current_status) {
      delete updateData.current_status;
    }

    const updatedShop = await shopRepository.update(id, updateData);
    return updatedShop;
  }

  /**
   * Update shop status
   */
  async updateShopStatus(id, status, reason = '') {
    const shop = await this.getShopById(id);

    const validStatuses = ['pending', 'validated', 'active', 'deactivated', 'suspended'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status: ${status}. Valid values: ${validStatuses.join(', ')}`);
    }

    const updatedShop = await shopRepository.updateStatus(id, status, reason);
    return updatedShop;
  }

  /**
   * Validate shop (pending -> validated)
   */
  async validateShop(id) {
    const shop = await this.getShopById(id);

    if (shop.current_status?.status !== 'pending') {
      throw new ValidationError(`Shop must be in pending status to be validated. Current status: ${shop.current_status?.status}`);
    }

    const validatedShop = await shopRepository.validate(id);
    return validatedShop;
  }

  /**
   * Activate shop
   */
  async activateShop(id) {
    const shop = await this.getShopById(id);

    if (shop.current_status?.status === 'active') {
      throw new ValidationError('Shop is already active');
    }

    const activatedShop = await shopRepository.activate(id);
    return activatedShop;
  }

  /**
   * Deactivate shop
   */
  async deactivateShop(id, reason = '') {
    const shop = await this.getShopById(id);

    if (shop.current_status?.status === 'deactivated') {
      throw new ValidationError('Shop is already deactivated');
    }

    if (!reason) {
      throw new ValidationError('Reason is required to deactivate a shop');
    }

    const deactivatedShop = await shopRepository.deactivate(id, reason);
    return deactivatedShop;
  }

  /**
   * Suspend shop
   */
  async suspendShop(id, reason = '') {
    const shop = await this.getShopById(id);

    if (shop.current_status?.status === 'suspended') {
      throw new ValidationError('Shop is already suspended');
    }

    if (!reason) {
      throw new ValidationError('Reason is required to suspend a shop');
    }

    const suspendedShop = await shopRepository.suspend(id, reason);
    return suspendedShop;
  }

  /**
   * Delete shop
   */
  async deleteShop(id) {
    const shop = await this.getShopById(id);
    await shopRepository.delete(id);
    return { message: 'Shop deleted successfully' };
  }

  /**
   * Add category to shop
   */
  async addCategoryToShop(shopId, categoryId, categoryName) {
    const shop = await shopRepository.addCategory(shopId, categoryId, categoryName);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    return shop;
  }

  /**
   * Remove category from shop
   */
  async removeCategoryFromShop(shopId, categoryId) {
    const shop = await shopRepository.removeCategory(shopId, categoryId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    return shop;
  }

  /**
   * Add user to shop
   */
  async addUserToShop(shopId, userId, role, firstName, lastName) {
    const validRoles = ['MANAGER_SHOP', 'STAFF'];
    if (!validRoles.includes(role)) {
      throw new ValidationError(`Invalid role: ${role}. Valid values: ${validRoles.join(', ')}`);
    }

    const shop = await shopRepository.addUser(shopId, userId, role, firstName, lastName);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    return shop;
  }

  /**
   * Remove user from shop
   */
  async removeUserFromShop(shopId, userId) {
    const shop = await shopRepository.removeUser(shopId, userId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    return shop;
  }

  /**
   * Update user role in shop
   */
  async updateUserRole(shopId, userId, newRole) {
    const validRoles = ['MANAGER_SHOP', 'STAFF'];
    if (!validRoles.includes(newRole)) {
      throw new ValidationError(`Invalid role: ${newRole}. Valid values: ${validRoles.join(', ')}`);
    }

    const shop = await shopRepository.updateUserRole(shopId, userId, newRole);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    return shop;
  }

  /**
   * Get shop statistics
   */
  async getShopStats() {
    return shopRepository.getStats();
  }

  /**
   * Search shops
   */
  async searchShops(searchTerm, filters = {}, options = {}) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new ValidationError('Search term is required');
    }

    return shopRepository.search(searchTerm, filters, options);
  }

  /**
   * Update review stats
   */
  async updateReviewStats(shopId, averageRating, totalReviews) {
    const shop = await shopRepository.updateReviewStats(shopId, averageRating, totalReviews);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    return shop;
  }
}

module.exports = new ShopService();
