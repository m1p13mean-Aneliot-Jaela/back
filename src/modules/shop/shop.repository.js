const { Shop } = require('./shop.model');

class ShopRepository {
  /**
   * Create a new shop
   */
  async create(shopData) {
    const shop = new Shop(shopData);
    return shop.save();
  }

  /**
   * Find shop by ID
   */
  async findById(id) {
    return Shop.findById(id)
      .populate('categories.category_id', 'name description');
  }

  /**
   * Find all shops with filters and pagination
   */
  async findAll(filters = {}, options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      sort = { created_at: -1 }
    } = options;
    
    const skip = (page - 1) * limit;

    const shops = await Shop.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('categories.category_id', 'name description');

    const total = await Shop.countDocuments(filters);

    return {
      shops,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find shops by category
   */
  async findByCategory(categoryId, filters = {}, options = {}) {
    return this.findAll({ ...filters, 'categories.category_id': categoryId }, options);
  }

  /**
   * Find shops by status
   */
  async findByStatus(status, filters = {}, options = {}) {
    return this.findAll({ ...filters, 'current_status.status': status }, options);
  }

  /**
   * Update shop
   */
  async update(id, updateData) {
    const shop = await this.findById(id);
    if (!shop) return null;

    // Add update history for significant fields
    const trackedFields = ['shop_name', 'description', 'logo', 'mall_location', 'opening_time'];
    const historyEntry = {};
    let hasChanges = false;

    trackedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        historyEntry[field] = updateData[field];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      historyEntry.updated_at = new Date();
      if (!shop.update_history) shop.update_history = [];
      shop.update_history.push(historyEntry);
      // Keep only last 50 history entries
      shop.update_history = shop.update_history.slice(-50);
    }

    // Update the shop
    Object.assign(shop, updateData);
    return shop.save();
  }

  /**
   * Update shop status
   */
  async updateStatus(id, status, reason = '') {
    const shop = await this.findById(id);
    if (!shop) return null;

    // Update current status
    shop.current_status = {
      status,
      reason,
      updated_at: new Date()
    };

    // Add to status history
    if (!shop.status_history) shop.status_history = [];
    shop.status_history.push({
      status,
      reason,
      updated_at: new Date()
    });

    return shop.save();
  }

  /**
   * Validate shop (change status to validated)
   */
  async validate(id) {
    return this.updateStatus(id, 'validated', 'Validated by admin');
  }

  /**
   * Activate shop
   */
  async activate(id) {
    return this.updateStatus(id, 'active', 'Activated');
  }

  /**
   * Deactivate shop
   */
  async deactivate(id, reason = '') {
    return this.updateStatus(id, 'deactivated', reason);
  }

  /**
   * Suspend shop
   */
  async suspend(id, reason = '') {
    return this.updateStatus(id, 'suspended', reason);
  }

  /**
   * Delete shop (hard delete)
   */
  async delete(id) {
    return Shop.findByIdAndDelete(id);
  }

  /**
   * Add category to shop
   */
  async addCategory(shopId, categoryId, categoryName) {
    const shop = await this.findById(shopId);
    if (!shop) return null;

    // Check if category already exists
    const exists = shop.categories.some(
      cat => cat.category_id.toString() === categoryId.toString()
    );

    if (!exists) {
      shop.categories.push({
        category_id: categoryId,
        name: categoryName,
        assigned_at: new Date()
      });
      await shop.save();
    }

    return shop;
  }

  /**
   * Remove category from shop
   */
  async removeCategory(shopId, categoryId) {
    const shop = await this.findById(shopId);
    if (!shop) return null;

    shop.categories = shop.categories.filter(
      cat => cat.category_id.toString() !== categoryId.toString()
    );

    await shop.save();
    return shop;
  }

  /**
   * Add user to shop
   */
  async addUser(shopId, userId, role, firstName, lastName) {
    const shop = await this.findById(shopId);
    if (!shop) return null;

    // Check if user already exists
    const exists = shop.users.some(
      user => user.user_id.toString() === userId.toString()
    );

    if (!exists) {
      shop.users.push({
        user_id: userId,
        role,
        first_name: firstName,
        last_name: lastName,
        assigned_at: new Date()
      });
      await shop.save();
    }

    return shop;
  }

  /**
   * Remove user from shop
   */
  async removeUser(shopId, userId) {
    const shop = await this.findById(shopId);
    if (!shop) return null;

    shop.users = shop.users.filter(
      user => user.user_id.toString() !== userId.toString()
    );

    await shop.save();
    return shop;
  }

  /**
   * Update user role in shop
   */
  async updateUserRole(shopId, userId, newRole) {
    const shop = await this.findById(shopId);
    if (!shop) return null;

    const user = shop.users.find(
      user => user.user_id.toString() === userId.toString()
    );

    if (user) {
      user.role = newRole;
      await shop.save();
    }

    return shop;
  }

  /**
   * Get statistics
   */
  async getStats() {
    const [statusStats, total] = await Promise.all([
      Shop.aggregate([
        { $group: { _id: '$current_status.status', count: { $sum: 1 } } }
      ]),
      Shop.countDocuments({})
    ]);

    return {
      total,
      by_status: statusStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }

  /**
   * Search shops
   */
  async search(searchTerm, filters = {}, options = {}) {
    const searchQuery = {
      ...filters,
      $or: [
        { shop_name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    return this.findAll(searchQuery, options);
  }

  /**
   * Update review stats
   */
  async updateReviewStats(shopId, averageRating, totalReviews) {
    return Shop.findByIdAndUpdate(
      shopId,
      {
        review_stats: {
          average_rating: averageRating,
          total_reviews: totalReviews
        }
      },
      { new: true }
    );
  }
}

module.exports = new ShopRepository();
