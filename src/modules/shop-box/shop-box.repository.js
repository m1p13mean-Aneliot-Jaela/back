const ShopBox = require('./shop-box.model');
const { ObjectId } = require('mongoose').Types;

class ShopBoxRepository {
  /**
   * Create a new shop box
   */
  async create(shopBoxData) {
    const shopBox = new ShopBox(shopBoxData);
    return shopBox.save();
  }

  /**
   * Find shop box by ID
   */
  async findById(id) {
    return ShopBox.findById(id);
  }

  /**
   * Find shop box by reference
   */
  async findByRef(ref) {
    return ShopBox.findOne({ ref });
  }

  /**
   * Find all shop boxes with filters and pagination
   */
  async findAll(filters = {}, options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      sort = { created_at: -1 }
    } = options;
    
    const skip = (page - 1) * limit;

    const shopBoxes = await ShopBox.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await ShopBox.countDocuments(filters);

    return {
      shopBoxes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update shop box by ID
   */
  async updateById(id, updateData) {
    return ShopBox.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete shop box by ID
   */
  async deleteById(id) {
    return ShopBox.findByIdAndDelete(id);
  }

  /**
   * Find shop boxes by status
   */
  async findByStatus(status) {
    return ShopBox.find({ 'current_status.status': status });
  }

  /**
   * Find shop boxes by shop ID  
   */
  async findByShopId(shopId) {
    return ShopBox.find({ 'current_assignment.shop_id': shopId });
  }

  /**
   * Check if reference exists
   */
  async existsByRef(ref) {
    const count = await ShopBox.countDocuments({ ref });
    return count > 0;
  }

  /**
   * Get available (free) shop boxes
   */
  async findAvailable() {
    return ShopBox.find({ 'current_status.status': 'free' });
  }

  /**
   * Assign shop to shop box
   */
  async assignShop(shopBoxId, shopId, shopName) {
    const shopBox = await ShopBox.findById(shopBoxId);
    if (!shopBox) {
      return null;
    }
    
    shopBox.assignShop(shopId, shopName);
    return shopBox.save();
  }

  /**
   * Unassign shop from shop box
   */
  async unassignShop(shopBoxId) {
    const shopBox = await ShopBox.findById(shopBoxId);
    if (!shopBox) {
      return null;
    }
    
    shopBox.unassignShop();
    return shopBox.save();
  }

  /**
   * Update status of shop box
   */
  async updateStatus(shopBoxId, newStatus) {
    const shopBox = await ShopBox.findById(shopBoxId);
    if (!shopBox) {
      return null;
    }
    
    shopBox.updateStatus(newStatus);
    return shopBox.save();
  }

  /**
   * Bulk assign shops to shop boxes
   */
  async bulkAssignShops(assignments) {
    const operations = assignments.map(({ shopBoxId, shopId, shopName }) => ({
      updateOne: {
        filter: { _id: shopBoxId },
        update: {
          $set: {
            'current_assignment.shop_id': shopId,
            'current_assignment.shop_name': shopName,
            'current_assignment.assigned_at': new Date(),
            'current_status.status': 'occupied',
            'current_status.updated_at': new Date()
          },
          $push: {
            status_history: {
              status: 'occupied',
              updated_at: new Date()
            }
          }
        }
      }
    }));

    return ShopBox.bulkWrite(operations);
  }
}

module.exports = new ShopBoxRepository();
