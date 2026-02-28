const shopService = require('./shop.service');
const { catchAsync } = require('../../shared/errors/custom-errors');
const HTTP_STATUS = require('../../shared/constants/http-status');

class ShopController {
  // Get shop profile
  getProfile = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const profile = await shopService.getProfile(shopId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: profile
    });
  });

  // Get my shop profile (from auth token)
  getMyProfile = catchAsync(async (req, res) => {
    // Try multiple possible user ID fields from JWT token
    const userId = req.user?._id || req.user?.userId || req.user?.id || req.user?.sub;
    
    if (!userId) {
      console.log('User object:', req.user); // Debug log
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'User ID non trouvé dans le token'
      });
    }
    
    // Find shop where user is assigned
    const profile = await shopService.getProfileByUserId(userId);
    if (!profile) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Aucune boutique assignée à cet utilisateur'
      });
    }
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: profile
    });
  });

  // Get my shop categories (from auth token)
  getMyCategories = catchAsync(async (req, res) => {
    const shopId = req.user?.shop_id;
    
    if (!shopId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Shop ID non trouvé'
      });
    }
    
    const categories = await shopService.getCategories(shopId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { categories }
    });
  });

  // Update shop profile (PUT - full update)
  updateProfile = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const profile = await shopService.updateProfile(shopId, req.body);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: profile
    });
  });

  // Patch shop profile (PATCH - partial update)
  patchProfile = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const profile = await shopService.patchProfile(shopId, req.body);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: profile
    });
  });

  // Update my profile
  updateMyProfile = catchAsync(async (req, res) => {
    const shopId = req.user?.shop_id;
    if (!shopId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Shop ID non trouvé'
      });
    }
    const profile = await shopService.patchProfile(shopId, req.body);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: profile
    });
  });

  // Update logo
  updateLogo = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const { logo_url } = req.body;
    
    if (!logo_url) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'URL du logo requise'
      });
    }

    const profile = await shopService.updateLogo(shopId, logo_url);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logo mis à jour',
      data: profile
    });
  });

  // Update location (with Google Maps coordinates)
  updateLocation = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const locationData = req.body;
    
    // Validate coordinates if provided
    if (locationData.latitude !== undefined || locationData.longitude !== undefined) {
      const lat = parseFloat(locationData.latitude);
      const lng = parseFloat(locationData.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Coordonnées invalides'
        });
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Coordonnées hors limites'
        });
      }
      
      locationData.latitude = lat;
      locationData.longitude = lng;
    }

    const profile = await shopService.updateLocation(shopId, locationData);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Localisation mise à jour',
      data: profile
    });
  });

  // Update business hours
  updateBusinessHours = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const hoursData = req.body;
    const profile = await shopService.updateBusinessHours(shopId, hoursData);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Horaires mis à jour',
      data: profile
    });
  });

  // Check if shop is currently open
  checkOpenStatus = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const status = await shopService.isShopOpen(shopId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: status
    });
  });

  // Get shops near location (public endpoint for customers)
  getShopsNearby = catchAsync(async (req, res) => {
    const { lat, lng, distance = 10000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    const shops = await shopService.getShopsNearLocation(
      parseFloat(lat),
      parseFloat(lng),
      parseInt(distance)
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: shops
    });
  });

  // Upload logo (with file)
  uploadLogo = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    
    // Assuming file is handled by multer middleware
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    // Build full file URL with backend host
    const protocol = req.protocol;
    const host = req.get('host');
    const logoUrl = `${protocol}://${host}/uploads/shops/${shopId}/logo/${req.file.filename}`;
    
    const profile = await shopService.updateLogo(shopId, logoUrl);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logo uploadé avec succès',
      data: { logo_url: logoUrl, profile }
    });
  });

  // ====== ADMIN METHODS ======

  // Get all shops (admin)
  getAllShops = catchAsync(async (req, res) => {
    const shops = await shopService.getAllShops();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: shops
    });
  });

  // Get public shops (no auth required)
  getPublicShops = catchAsync(async (req, res) => {
    const shops = await shopService.getPublicShops();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: shops
    });
  });

  // Search shops with filters (public endpoint)
  searchShops = catchAsync(async (req, res) => {
    const filters = {
      search: req.query.search,
      category_id: req.query.category_id,
      location: req.query.location,
      limit: req.query.limit,
      skip: req.query.skip
    };
    
    const shops = await shopService.searchShops(filters);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: shops
    });
  });

  // Get shop by ID (admin)
  getShopById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const shop = await shopService.getShopById(id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: shop
    });
  });

  // Create shop (admin)
  createShop = catchAsync(async (req, res) => {
    const shop = await shopService.createShop(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Shop created successfully',
      data: shop
    });
  });

  // Update shop (admin)
  updateShop = catchAsync(async (req, res) => {
    const { id } = req.params;
    const shop = await shopService.updateShop(id, req.body);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Shop updated successfully',
      data: shop
    });
  });

  // Delete shop (admin)
  deleteShop = catchAsync(async (req, res) => {
    const { id } = req.params;
    await shopService.deleteShop(id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Shop deleted successfully'
    });
  });

  // Update shop categories (admin)
  updateShopCategories = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Categories must be an array of category IDs'
      });
    }

    const shop = await shopService.updateShopCategories(id, categories);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Shop categories updated successfully',
      data: shop
    });
  });

  // Assign user to shop (admin)
  assignUserToShop = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { user_id, role = 'owner' } = req.body;

    if (!user_id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const shop = await shopService.assignUserToShop(id, user_id, role);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User assigned to shop successfully',
      data: shop
    });
  });
}

module.exports = new ShopController();
