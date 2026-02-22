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
    const shopId = req.user?.shop_id;
    if (!shopId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Shop ID non trouvé'
      });
    }
    const profile = await shopService.getProfile(shopId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: profile
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
}

module.exports = new ShopController();
