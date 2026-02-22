const shopBoxService = require('./shop-box.service');
const { catchAsync } = require('../../shared/errors/custom-errors');
const HTTP_STATUS = require('../../shared/constants/http-status');

class ShopBoxController {
  /**
   * Create a new shop box
   * POST /api/shop-boxes
   */
  createShopBox = catchAsync(async (req, res) => {
    const shopBox = await shopBoxService.createShopBox(req.body);
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Shop box created successfully',
      data: shopBox
    });
  });

  /**
   * Get all shop boxes with filters
   * GET /api/shop-boxes
   */
  getAllShopBoxes = catchAsync(async (req, res) => {
    const { status, shop_id, ref, page, limit, sort } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (shop_id) filters.shop_id = shop_id;
    if (ref) filters.ref = ref;
    
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: sort ? JSON.parse(sort) : { created_at: -1 }
    };
    
    const result = await shopBoxService.getAllShopBoxes(filters, options);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.shopBoxes,
      pagination: result.pagination
    });
  });

  /**
   * Get shop box by ID
   * GET /api/shop-boxes/:id
   */
  getShopBoxById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const shopBox = await shopBoxService.getShopBoxById(id);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: shopBox
    });
  });

  /**
   * Update shop box
   * PUT /api/shop-boxes/:id
   */
  updateShopBox = catchAsync(async (req, res) => {
    const { id } = req.params;
    const shopBox = await shopBoxService.updateShopBox(id, req.body);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Shop box updated successfully',
      data: shopBox
    });
  });

  /**
   * Delete shop box
   * DELETE /api/shop-boxes/:id
   */
  deleteShopBox = catchAsync(async (req, res) => {
    const { id } = req.params;
    await shopBoxService.deleteShopBox(id);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Shop box deleted successfully'
    });
  });

  /**
   * Update shop box status
   * PATCH /api/shop-boxes/:id/status
   */
  updateStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const shopBox = await shopBoxService.updateStatus(id, status);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Shop box status updated successfully',
      data: shopBox
    });
  });

  /**
   * Assign a shop to a shop box
   * POST /api/shop-boxes/:id/assign
   */
  assignShop = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { shop_id } = req.body;
    
    if (!shop_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'shop_id is required'
      });
    }
    
    const shopBox = await shopBoxService.assignShopToBox(id, shop_id);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Shop assigned to shop box successfully',
      data: shopBox
    });
  });

  /**
   * Bulk assign shops to shop boxes
   * POST /api/shop-boxes/bulk-assign
   * Body: { assignments: [{ shopBoxId, shopId }, ...] }
   */
  bulkAssignShops = catchAsync(async (req, res) => {
    const { assignments } = req.body;
    
    if (!assignments) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'assignments array is required'
      });
    }
    
    const result = await shopBoxService.bulkAssignShops(assignments);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Shops assigned to shop boxes successfully',
      data: result
    });
  });

  /**
   * Unassign shop from shop box
   * POST /api/shop-boxes/:id/unassign
   */
  unassignShop = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const shopBox = await shopBoxService.unassignShopFromBox(id);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Shop unassigned from shop box successfully',
      data: shopBox
    });
  });

  /**
   * Get available shop boxes
   * GET /api/shop-boxes/available
   */
  getAvailableShopBoxes = catchAsync(async (req, res) => {
    const shopBoxes = await shopBoxService.getAvailableShopBoxes();
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: shopBoxes
    });
  });

  /**
   * Get shop boxes by shop ID
   * GET /api/shop-boxes/by-shop/:shopId
   */
  getShopBoxesByShopId = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const shopBoxes = await shopBoxService.getShopBoxesByShopId(shopId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: shopBoxes
    });
  });
}

module.exports = new ShopBoxController();
