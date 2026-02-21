const shopService = require('./shop.service');
const { catchAsync } = require('../../shared/errors/custom-errors');

class ShopController {
  /**
   * Create a new shop
   * POST /api/shops/admin
   */
  createShop = catchAsync(async (req, res) => {
    const shop = await shopService.createShop(req.body);

    res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      data: shop
    });
  });

  /**
   * Get all shops
   * GET /api/shops/admin
   */
  getAllShops = catchAsync(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      status,
      search
    } = req.query;

    let result;

    if (search) {
      result = await shopService.searchShops(
        search,
        { 'current_status.status': status },
        { page: parseInt(page), limit: parseInt(limit) }
      );
    } else {
      const filters = {};
      if (status) filters['current_status.status'] = status;

      result = await shopService.getAllShops(
        filters,
        { page: parseInt(page), limit: parseInt(limit) }
      );
    }

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Get shop by ID
   * GET /api/shops/admin/:id
   */
  getShopById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const shop = await shopService.getShopById(id);

    res.json({
      success: true,
      data: shop
    });
  });

  /**
   * Get shops by category
   * GET /api/shops/admin/category/:categoryId
   */
  getShopsByCategory = catchAsync(async (req, res) => {
    const { categoryId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const filters = {};
    if (status) filters['current_status.status'] = status;

    const result = await shopService.getShopsByCategory(
      categoryId,
      filters,
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Get shops by status
   * GET /api/shops/admin/status/:status
   */
  getShopsByStatus = catchAsync(async (req, res) => {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await shopService.getShopsByStatus(
      status,
      {},
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Update shop
   * PUT /api/shops/admin/:id
   */
  updateShop = catchAsync(async (req, res) => {
    const { id } = req.params;
    const shop = await shopService.updateShop(id, req.body);

    res.json({
      success: true,
      message: 'Shop updated successfully',
      data: shop
    });
  });

  /**
   * Update shop status
   * PATCH /api/shops/admin/:id/status
   */
  updateShopStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    const shop = await shopService.updateShopStatus(id, status, reason);

    res.json({
      success: true,
      message: 'Shop status updated successfully',
      data: shop
    });
  });

  /**
   * Validate shop
   * PATCH /api/shops/admin/:id/validate
   */
  validateShop = catchAsync(async (req, res) => {
    const { id } = req.params;
    const shop = await shopService.validateShop(id);

    res.json({
      success: true,
      message: 'Shop validated successfully',
      data: shop
    });
  });

  /**
   * Activate shop
   * PATCH /api/shops/admin/:id/activate
   */
  activateShop = catchAsync(async (req, res) => {
    const { id } = req.params;
    const shop = await shopService.activateShop(id);

    res.json({
      success: true,
      message: 'Shop activated successfully',
      data: shop
    });
  });

  /**
   * Deactivate shop
   * PATCH /api/shops/admin/:id/deactivate
   */
  deactivateShop = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const shop = await shopService.deactivateShop(id, reason);

    res.json({
      success: true,
      message: 'Shop deactivated successfully',
      data: shop
    });
  });

  /**
   * Suspend shop
   * PATCH /api/shops/admin/:id/suspend
   */
  suspendShop = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const shop = await shopService.suspendShop(id, reason);

    res.json({
      success: true,
      message: 'Shop suspended successfully',
      data: shop
    });
  });

  /**
   * Delete shop
   * DELETE /api/shops/admin/:id
   */
  deleteShop = catchAsync(async (req, res) => {
    const { id } = req.params;
    await shopService.deleteShop(id);

    res.json({
      success: true,
      message: 'Shop deleted successfully'
    });
  });

  /**
   * Get shop statistics
   * GET /api/shops/admin/analytics/stats
   */
  getShopStats = catchAsync(async (req, res) => {
    const stats = await shopService.getShopStats();

    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Search shops
   * GET /api/shops/admin/search
   */
  searchShops = catchAsync(async (req, res) => {
    const { q, page = 1, limit = 10, status } = req.query;

    const filters = {};
    if (status) filters['current_status.status'] = status;

    const result = await shopService.searchShops(
      q,
      filters,
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Add category to shop
   * POST /api/shops/admin/:id/categories
   */
  addCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { category_id, name } = req.body;

    const shop = await shopService.addCategoryToShop(id, category_id, name);

    res.json({
      success: true,
      message: 'Category added to shop successfully',
      data: shop
    });
  });

  /**
   * Remove category from shop
   * DELETE /api/shops/admin/:id/categories/:categoryId
   */
  removeCategory = catchAsync(async (req, res) => {
    const { id, categoryId } = req.params;

    const shop = await shopService.removeCategoryFromShop(id, categoryId);

    res.json({
      success: true,
      message: 'Category removed from shop successfully',
      data: shop
    });
  });

  /**
   * Add user to shop
   * POST /api/shops/admin/:id/users
   */
  addUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { user_id, role, first_name, last_name } = req.body;

    const shop = await shopService.addUserToShop(id, user_id, role, first_name, last_name);

    res.json({
      success: true,
      message: 'User added to shop successfully',
      data: shop
    });
  });

  /**
   * Remove user from shop
   * DELETE /api/shops/admin/:id/users/:userId
   */
  removeUser = catchAsync(async (req, res) => {
    const { id, userId } = req.params;

    const shop = await shopService.removeUserFromShop(id, userId);

    res.json({
      success: true,
      message: 'User removed from shop successfully',
      data: shop
    });
  });

  /**
   * Update user role in shop
   * PATCH /api/shops/admin/:id/users/:userId/role
   */
  updateUserRole = catchAsync(async (req, res) => {
    const { id, userId } = req.params;
    const { role } = req.body;

    const shop = await shopService.updateUserRole(id, userId, role);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: shop
    });
  });
}

module.exports = new ShopController();
