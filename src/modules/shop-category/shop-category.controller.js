const shopCategoryService = require('./shop-category.service');
const { catchAsync } = require('../../shared/errors/custom-errors');

class ShopCategoryController {
  /**
   * Create a new category
   * POST /api/shop-categories/admin
   */
  createCategory = catchAsync(async (req, res) => {
    const category = await shopCategoryService.createCategory(req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  });

  /**
   * Get all categories
   * GET /api/shop-categories/admin
   */
  getAllCategories = catchAsync(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;

    const result = await shopCategoryService.getAllCategories(
      {},
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Get category by ID
   * GET /api/shop-categories/admin/:id
   */
  getCategoryById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const category = await shopCategoryService.getCategoryById(id);

    res.json({
      success: true,
      data: category
    });
  });

  /**
   * Get root categories
   * GET /api/shop-categories/admin/root
   */
  getRootCategories = catchAsync(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;

    const result = await shopCategoryService.getRootCategories(
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Get category children
   * GET /api/shop-categories/admin/:id/children
   */
  getCategoryChildren = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const result = await shopCategoryService.getCategoryChildren(
      id,
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Get category descendants
   * GET /api/shop-categories/admin/:id/descendants
   */
  getCategoryDescendants = catchAsync(async (req, res) => {
    const { id } = req.params;
    const descendants = await shopCategoryService.getCategoryDescendants(id);

    res.json({
      success: true,
      data: descendants
    });
  });

  /**
   * Get category tree
   * GET /api/shop-categories/admin/tree
   */
  getCategoryTree = catchAsync(async (req, res) => {
    const tree = await shopCategoryService.getCategoryTree();

    res.json({
      success: true,
      data: tree
    });
  });

  /**
   * Update category
   * PUT /api/shop-categories/admin/:id
   */
  updateCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const category = await shopCategoryService.updateCategory(id, req.body);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  });

  /**
   * Delete category
   * DELETE /api/shop-categories/admin/:id
   */
  deleteCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    await shopCategoryService.deleteCategory(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  });

  /**
   * Search categories
   * GET /api/shop-categories/admin/search
   */
  searchCategories = catchAsync(async (req, res) => {
    const { q, page = 1, limit = 50 } = req.query;

    const result = await shopCategoryService.searchCategories(
      q,
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json({
      success: true,
      data: result
    });
  });
}

module.exports = new ShopCategoryController();
