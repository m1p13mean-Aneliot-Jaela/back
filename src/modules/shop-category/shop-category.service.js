const shopCategoryRepository = require('./shop-category.repository');
const { ValidationError, NotFoundError } = require('../../shared/errors/custom-errors');

class ShopCategoryService {
  /**
   * Create a new category
   */
  async createCategory(categoryData) {
    // Check if name already exists
    const exists = await shopCategoryRepository.existsByName(categoryData.name);
    if (exists) {
      throw new ValidationError('Category name already exists');
    }

    // If parent specified, validate it exists
    if (categoryData.parent_category_id) {
      const parent = await shopCategoryRepository.findById(categoryData.parent_category_id);
      if (!parent) {
        throw new NotFoundError('Parent category not found');
      }
    }

    const category = await shopCategoryRepository.create(categoryData);
    return category;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id) {
    const category = await shopCategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  /**
   * Get all categories
   */
  async getAllCategories(filters = {}, options = {}) {
    return shopCategoryRepository.findAll(filters, options);
  }

  /**
   * Get root categories
   */
  async getRootCategories(options = {}) {
    return shopCategoryRepository.findRootCategories(options);
  }

  /**
   * Get category children
   */
  async getCategoryChildren(parentId, options = {}) {
    // Verify parent exists
    await this.getCategoryById(parentId);
    return shopCategoryRepository.findChildren(parentId, options);
  }

  /**
   * Get category descendants
   */
  async getCategoryDescendants(categoryId) {
    // Verify category exists
    await this.getCategoryById(categoryId);
    return shopCategoryRepository.findDescendants(categoryId);
  }

  /**
   * Update category
   */
  async updateCategory(id, updateData) {
    const category = await this.getCategoryById(id);

    // Check if name is being changed and already exists
    if (updateData.name && updateData.name !== category.name) {
      const exists = await shopCategoryRepository.existsByName(updateData.name, id);
      if (exists) {
        throw new ValidationError('Category name already exists');
      }
    }

    // Prevent circular parent relationship
    if (updateData.parent_category_id) {
      if (updateData.parent_category_id.toString() === id.toString()) {
        throw new ValidationError('Category cannot be its own parent');
      }

      // Check if new parent is a descendant
      const descendants = await shopCategoryRepository.findDescendants(id);
      const isDescendant = descendants.some(
        desc => desc._id.toString() === updateData.parent_category_id.toString()
      );
      if (isDescendant) {
        throw new ValidationError('Cannot set a descendant as parent');
      }

      // Verify parent exists
      const parent = await shopCategoryRepository.findById(updateData.parent_category_id);
      if (!parent) {
        throw new NotFoundError('Parent category not found');
      }
    }

    const updatedCategory = await shopCategoryRepository.update(id, updateData);
    return updatedCategory;
  }

  /**
   * Delete category
   */
  async deleteCategory(id) {
    const category = await this.getCategoryById(id);

    try {
      await shopCategoryRepository.delete(id);
      return { message: 'Category deleted successfully' };
    } catch (error) {
      if (error.message.includes('subcategories')) {
        throw new ValidationError('Cannot delete category with subcategories');
      }
      throw error;
    }
  }

  /**
   * Get category tree
   */
  async getCategoryTree() {
    return shopCategoryRepository.getCategoryTree();
  }

  /**
   * Search categories
   */
  async searchCategories(searchTerm, options = {}) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new ValidationError('Search term is required');
    }

    return shopCategoryRepository.search(searchTerm, options);
  }
}

module.exports = new ShopCategoryService();
