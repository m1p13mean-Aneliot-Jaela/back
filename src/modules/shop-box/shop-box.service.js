const shopBoxRepository = require('./shop-box.repository');
const userRepository = require('../user/user.repository');
const shopRepository = require('../shop/shop.repository');
const { NotFoundError, ValidationError, ConflictError } = require('../../shared/errors/custom-errors');
const { ObjectId } = require('mongoose').Types;

class ShopBoxService {
  /**
   * Create a new shop box
   */
  async createShopBox(data) {
    // Check if reference already exists
    const existingBox = await shopBoxRepository.findByRef(data.ref);
    if (existingBox) {
      throw new ConflictError(`Shop box with reference ${data.ref} already exists`);
    }

    const shopBoxData = {
      ref: data.ref,
      created_at: new Date(),
      current_status: {
        status: data.status || 'free',
        updated_at: new Date()
      },
      status_history: []
    };

    return shopBoxRepository.create(shopBoxData);
  }

  /**
   * Get shop box by ID
   */
  async getShopBoxById(id) {
    if (!ObjectId.isValid(id)) {
      throw new ValidationError('Invalid shop box ID');
    }

    const shopBox = await shopBoxRepository.findById(id);
    if (!shopBox) {
      throw new NotFoundError('Shop box not found');
    }

    return shopBox;
  }

  /**
   * Get all shop boxes with filters
   */
  async getAllShopBoxes(filters = {}, options = {}) {
    const queryFilters = {};

    // Filter by status
    if (filters.status) {
      queryFilters['current_status.status'] = filters.status;
    }

    // Filter by shop ID
    if (filters.shop_id) {
      queryFilters['current_assignment.shop_id'] = filters.shop_id;
    }

    // Filter by reference
    if (filters.ref) {
      queryFilters.ref = { $regex: filters.ref, $options: 'i' };
    }

    return shopBoxRepository.findAll(queryFilters, options);
  }

  /**
   * Update shop box
   */
  async updateShopBox(id, updateData) {
    if (!ObjectId.isValid(id)) {
      throw new ValidationError('Invalid shop box ID');
    }

    const shopBox = await shopBoxRepository.findById(id);
    if (!shopBox) {
      throw new NotFoundError('Shop box not found');
    }

    // Check if updating reference and if it conflicts
    if (updateData.ref && updateData.ref !== shopBox.ref) {
      const existingBox = await shopBoxRepository.findByRef(updateData.ref);
      if (existingBox) {
        throw new ConflictError(`Shop box with reference ${updateData.ref} already exists`);
      }
    }

    // Prepare update data
    const update = {};
    if (updateData.ref) update.ref = updateData.ref;

    return shopBoxRepository.updateById(id, update);
  }

  /**
   * Delete shop box
   */
  async deleteShopBox(id) {
    if (!ObjectId.isValid(id)) {
      throw new ValidationError('Invalid shop box ID');
    }

    const shopBox = await shopBoxRepository.findById(id);
    if (!shopBox) {
      throw new NotFoundError('Shop box not found');
    }

    // Check if shop box is currently assigned
    if (shopBox.current_assignment && shopBox.current_assignment.shop_id) {
      throw new ConflictError('Cannot delete shop box that is currently assigned to a shop');
    }

    return shopBoxRepository.deleteById(id);
  }

  /**
   * Update shop box status
   */
  async updateStatus(id, newStatus) {
    if (!ObjectId.isValid(id)) {
      throw new ValidationError('Invalid shop box ID');
    }

    if (!['occupied', 'free', 'under_repair'].includes(newStatus)) {
      throw new ValidationError('Invalid status. Must be: occupied, free, or under_repair');
    }

    const shopBox = await shopBoxRepository.findById(id);
    if (!shopBox) {
      throw new NotFoundError('Shop box not found');
    }

    return shopBoxRepository.updateStatus(id, newStatus);
  }

  /**
   * Assign a shop to a shop box
   */
  async assignShopToBox(shopBoxId, shopId) {
    if (!ObjectId.isValid(shopBoxId)) {
      throw new ValidationError('Invalid shop box ID');
    }

    if (!ObjectId.isValid(shopId)) {
      throw new ValidationError('Invalid shop ID');
    }

    // Check if shop box exists
    const shopBox = await shopBoxRepository.findById(shopBoxId);
    if (!shopBox) {
      throw new NotFoundError('Shop box not found');
    }

    // Check if shop box is available
    if (shopBox.current_status.status !== 'free') {
      throw new ConflictError('Shop box is not available for assignment');
    }

    // Check if shop exists
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Get shop name
    const shopName = shop.shop_name;

    return shopBoxRepository.assignShop(shopBoxId, shopId, shopName);
  }

  /**
   * Assign multiple shops to shop boxes (bulk assignment)
   */
  async bulkAssignShops(assignments) {
    if (!Array.isArray(assignments) || assignments.length === 0) {
      throw new ValidationError('Assignments must be a non-empty array');
    }

    // Validate all assignments first
    const validatedAssignments = [];
    for (const assignment of assignments) {
      const { shopBoxId, shopId } = assignment;

      if (!ObjectId.isValid(shopBoxId)) {
        throw new ValidationError(`Invalid shop box ID: ${shopBoxId}`);
      }

      if (!ObjectId.isValid(shopId)) {
        throw new ValidationError(`Invalid shop ID: ${shopId}`);
      }

      // Check if shop box exists and is available
      const shopBox = await shopBoxRepository.findById(shopBoxId);
      if (!shopBox) {
        throw new NotFoundError(`Shop box not found: ${shopBoxId}`);
      }

      if (shopBox.current_status.status !== 'free') {
        throw new ConflictError(`Shop box ${shopBox.ref} is not available for assignment`);
      }

      // Check if shop exists
      const shop = await shopRepository.findById(shopId);
      if (!shop) {
        throw new NotFoundError(`Shop not found: ${shopId}`);
      }

      const shopName = shop.shop_name;
      validatedAssignments.push({ shopBoxId, shopId, shopName });
    }

    // Perform bulk assignment
    const result = await shopBoxRepository.bulkAssignShops(validatedAssignments);

    return {
      success: true,
      modified: result.modifiedCount,
      assignments: validatedAssignments.length
    };
  }

  /**
   * Unassign shop from shop box
   */
  async unassignShopFromBox(shopBoxId) {
    if (!ObjectId.isValid(shopBoxId)) {
      throw new ValidationError('Invalid shop box ID');
    }

    const shopBox = await shopBoxRepository.findById(shopBoxId);
    if (!shopBox) {
      throw new NotFoundError('Shop box not found');
    }

    if (!shopBox.current_assignment || !shopBox.current_assignment.shop_id) {
      throw new ConflictError('Shop box is not currently assigned to any shop');
    }

    return shopBoxRepository.unassignShop(shopBoxId);
  }

  /**
   * Get available shop boxes
   */
  async getAvailableShopBoxes() {
    return shopBoxRepository.findAvailable();
  }

  /**
   * Get shop boxes by shop ID
   */
  async getShopBoxesByShopId(shopId) {
    if (!ObjectId.isValid(shopId)) {
      throw new ValidationError('Invalid shop ID');
    }

    return shopBoxRepository.findByShopId(shopId);
  }
}

module.exports = new ShopBoxService();
