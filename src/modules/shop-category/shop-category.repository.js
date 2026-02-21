const ShopCategory = require('./shop-category.model');

class ShopCategoryRepository {
  /**
   * Create a new category
   */
  async create(categoryData) {
    // If has parent, build ancestors array
    if (categoryData.parent_category_id) {
      const parent = await this.findById(categoryData.parent_category_id);
      if (parent) {
        categoryData.ancestors = [...(parent.ancestors || []), parent._id];
      }
    }

    const category = new ShopCategory(categoryData);
    return category.save();
  }

  /**
   * Find category by ID
   */
  async findById(id) {
    return ShopCategory.findById(id)
      .populate('parent_category_id', 'name description')
      .populate('ancestors', 'name');
  }

  /**
   * Find category by name
   */
  async findByName(name) {
    return ShopCategory.findOne({ name: new RegExp(`^${name}$`, 'i') });
  }

  /**
   * Find all categories with filters and pagination
   */
  async findAll(filters = {}, options = {}) {
    const { 
      page = 1, 
      limit = 50, 
      sort = { name: 1 }
    } = options;
    
    const skip = (page - 1) * limit;

    const categories = await ShopCategory.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('parent_category_id', 'name description');

    const total = await ShopCategory.countDocuments(filters);

    return {
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find root categories (no parent)
   */
  async findRootCategories(options = {}) {
    return this.findAll({ parent_category_id: null }, options);
  }

  /**
   * Find children of a category
   */
  async findChildren(parentId, options = {}) {
    return this.findAll({ parent_category_id: parentId }, options);
  }

  /**
   * Find descendants (all sub-categories)
   */
  async findDescendants(categoryId) {
    const categories = await ShopCategory.find({
      ancestors: categoryId
    }).populate('parent_category_id', 'name');

    return categories;
  }

  /**
   * Update category
   */
  async update(id, updateData) {
    const category = await this.findById(id);
    if (!category) return null;

    // If parent is changing, rebuild ancestors
    if (updateData.parent_category_id !== undefined) {
      if (updateData.parent_category_id) {
        const newParent = await this.findById(updateData.parent_category_id);
        if (newParent) {
          updateData.ancestors = [...(newParent.ancestors || []), newParent._id];
        }
      } else {
        updateData.ancestors = [];
      }

      // Update all descendants' ancestors
      await this.updateDescendantsAncestors(id);
    }

    Object.assign(category, updateData);
    return category.save();
  }

  /**
   * Update ancestors for all descendants when category hierarchy changes
   */
  async updateDescendantsAncestors(categoryId) {
    const descendants = await ShopCategory.find({
      ancestors: categoryId
    });

    for (const descendant of descendants) {
      const parent = await this.findById(descendant.parent_category_id);
      if (parent) {
        descendant.ancestors = [...(parent.ancestors || []), parent._id];
        await descendant.save();
      }
    }
  }

  /**
   * Delete category
   */
  async delete(id) {
    // Check if category has children
    const children = await ShopCategory.countDocuments({ parent_category_id: id });
    if (children > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    return ShopCategory.findByIdAndDelete(id);
  }

  /**
   * Check if category name exists
   */
  async existsByName(name, excludeId = null) {
    const query = { name: new RegExp(`^${name}$`, 'i') };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const category = await ShopCategory.findOne(query);
    return !!category;
  }

  /**
   * Get category tree
   */
  async getCategoryTree() {
    const categories = await ShopCategory.find({}).sort({ name: 1 });
    
    // Build tree structure
    const buildTree = (parentId = null) => {
      const children = categories.filter(cat => {
        if (parentId === null) {
          return cat.parent_category_id === null;
        }
        return cat.parent_category_id && cat.parent_category_id.toString() === parentId.toString();
      });

      return children.map(cat => ({
        ...cat.toJSON(),
        children: buildTree(cat._id)
      }));
    };

    return buildTree();
  }

  /**
   * Search categories
   */
  async search(searchTerm, options = {}) {
    const searchQuery = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    return this.findAll(searchQuery, options);
  }
}

module.exports = new ShopCategoryRepository();
