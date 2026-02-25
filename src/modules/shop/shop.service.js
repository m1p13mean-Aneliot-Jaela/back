const { Shop } = require('./shop.model');
const { NotFoundError, ValidationError } = require('../../shared/errors/custom-errors');

class ShopService {
  // ====== ADMIN METHODS ======

  // Get all shops (for admin)
  async getAllShops(filters = {}) {
    const query = {};
    
    // Build query from filters
    if (filters.status) {
      query['current_status.status'] = filters.status;
    }
    if (filters.mall_location) {
      query.mall_location = new RegExp(filters.mall_location, 'i');
    }
    if (filters.category_id) {
      query['categories.category_id'] = filters.category_id;
    }
    
    const shops = await Shop.find(query)
      .populate('categories.category_id', 'name')
      .populate('users.user_id', 'first_name last_name email')
      .sort({ created_at: -1 })
      .lean();
    
    return shops;
  }

  // Get shop by ID (admin)
  async getShopById(id) {
    const shop = await Shop.findById(id)
      .populate('categories.category_id', 'name')
      .populate('users.user_id', 'first_name last_name email');
    
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    return shop;
  }

  // Alias for getShopById (used by controller)
  async getProfile(id) {
    return this.getShopById(id);
  }

  // Create shop (admin)
  async createShop(data) {
    const ShopCategory = require('../shop-category/shop-category.model');
    
    // Prepare shop data
    const shopData = {
      shop_name: data.shop_name,
      description: data.description,
      logo: data.logo,
      mall_location: data.mall_location,
      opening_time: data.opening_time || {
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '08:00', close: '12:00' },
        sunday: { open: '08:00', close: '18:00' }
      },
      current_status: {
        status: data.current_status?.status || 'pending',
        updated_at: new Date()
      },
      categories: [],
      users: []
    };

    // Fetch and add categories if provided
    if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
      // Fetch category details from database
      const categoryDocs = await ShopCategory.find({ _id: { $in: data.categories } }).lean();
      
      // Map category IDs to include names
      shopData.categories = data.categories.map(catId => {
        const categoryDoc = categoryDocs.find(c => c._id.toString() === catId.toString());
        return {
          category_id: catId,
          name: categoryDoc ? categoryDoc.name : '',
          assigned_at: new Date()
        };
      });
    }
    
    const shop = new Shop(shopData);
    await shop.save();
    
    // Populate categories before returning
    await shop.populate('categories.category_id', 'name');
    
    return shop;
  }

  // Update shop (admin)
  async updateShop(id, data) {
    const ShopCategory = require('../shop-category/shop-category.model');
    
    const shop = await Shop.findById(id);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Add to update history
    const historyEntry = {
      shop_name: shop.shop_name,
      description: shop.description,
      logo: shop.logo,
      mall_location: shop.mall_location,
      opening_time: shop.opening_time,
      updated_at: new Date()
    };
    shop.update_history.push(historyEntry);

    // Update basic fields
    if (data.shop_name) shop.shop_name = data.shop_name;
    if (data.description !== undefined) shop.description = data.description;
    if (data.logo !== undefined) shop.logo = data.logo;
    if (data.mall_location !== undefined) shop.mall_location = data.mall_location;
    if (data.opening_time) shop.opening_time = data.opening_time;

    // Update categories if provided
    if (data.categories && Array.isArray(data.categories)) {
      // Fetch category details from database
      const categoryDocs = await ShopCategory.find({ _id: { $in: data.categories } }).lean();
      
      // Map category IDs to include names
      shop.categories = data.categories.map(catId => {
        const categoryDoc = categoryDocs.find(c => c._id.toString() === catId.toString());
        return {
          category_id: catId,
          name: categoryDoc ? categoryDoc.name : '',
          assigned_at: new Date()
        };
      });
    }

    // Update status if provided
    if (data.current_status) {
      // Add to status history if status is changing
      if (shop.current_status.status !== data.current_status.status) {
        shop.status_history.push({
          status: shop.current_status.status,
          reason: shop.current_status.reason,
          updated_at: shop.current_status.updated_at
        });
      }
      
      // Update current status
      shop.current_status = {
        status: data.current_status.status,
        reason: data.current_status.reason || '',
        updated_at: new Date()
      };
    }

    await shop.save();
    await shop.populate('categories.category_id', 'name');
    
    return shop;
  }

  // Update shop status (admin)
  async updateShopStatus(id, status, reason = '') {
    const shop = await Shop.findById(id);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Add to status history
    shop.status_history.push({
      status: shop.current_status.status,
      reason: shop.current_status.reason,
      updated_at: shop.current_status.updated_at
    });

    // Update current status
    shop.current_status = {
      status,
      reason,
      updated_at: new Date()
    };

    await shop.save();
    return shop;
  }

  // Delete shop (admin)
  async deleteShop(id) {
    const shop = await Shop.findByIdAndDelete(id);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }
    return shop;
  }

  // Assign user to shop (admin)
  async assignUserToShop(shopId, userId, role, userData = {}) {
    const shop = await Shop.findById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Check if user already assigned
    const existingUser = shop.users.find(u => u.user_id.toString() === userId.toString());
    if (existingUser) {
      throw new ValidationError('User already assigned to this shop');
    }

    // Add user
    shop.users.push({
      user_id: userId,
      role,
      assigned_at: new Date(),
      first_name: userData.first_name,
      last_name: userData.last_name
    });

    await shop.save();
    return shop;
  }

  // Remove user from shop (admin)
  async removeUserFromShop(shopId, userId) {
    const shop = await Shop.findById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    shop.users = shop.users.filter(u => u.user_id.toString() !== userId.toString());
    await shop.save();
    return shop;
  }

  // Update shop categories (admin)
  async updateShopCategories(shopId, categoryIds) {
    const ShopCategory = require('../shop-category/shop-category.model');
    
    const shop = await Shop.findById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Validate and fetch category details
    const categoryDocs = await ShopCategory.find({ _id: { $in: categoryIds } }).lean();
    
    // Map category IDs to include names
    shop.categories = categoryIds.map(catId => {
      const categoryDoc = categoryDocs.find(c => c._id.toString() === catId.toString());
      return {
        category_id: catId,
        name: categoryDoc ? categoryDoc.name : '',
        assigned_at: new Date()
      };
    });

    await shop.save();
    await shop.populate('categories.category_id', 'name');
    
    return shop;
  }

  // Assign user to shop (admin)
  async assignUserToShop(shopId, userId, role = 'owner') {
    const User = require('../user/user.model');
    
    const shop = await Shop.findById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user is already assigned
    const existingUserIndex = shop.users.findIndex(u => u.user_id.toString() === userId.toString());
    if (existingUserIndex !== -1) {
      // Update role if user exists
      shop.users[existingUserIndex].role = role;
      shop.users[existingUserIndex].assigned_at = new Date();
    } else {
      // Add new user
      shop.users.push({
        user_id: userId,
        role: role,
        assigned_at: new Date(),
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
    }

    await shop.save();
    await shop.populate('users.user_id', 'first_name last_name email');
    
    return shop;
  }
}

module.exports = new ShopService();
