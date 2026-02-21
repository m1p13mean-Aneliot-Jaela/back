const deliveryService = require('./delivery.service');
const { catchAsync } = require('../../shared/errors/custom-errors');
const HTTP_STATUS = require('../../shared/constants/http-status');

class DeliveryController {
  // ========== ZONES ==========

  // Create zone
  createZone = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const zone = await deliveryService.createZone(shopId, req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Zone de livraison créée avec succès',
      data: zone
    });
  });

  // Get zones
  getZones = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const zones = await deliveryService.getZonesByShop(shopId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: zones
    });
  });

  // Update zone
  updateZone = catchAsync(async (req, res) => {
    const { zoneId } = req.params;
    const zone = await deliveryService.updateZone(zoneId, req.body);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Zone mise à jour avec succès',
      data: zone
    });
  });

  // Delete zone
  deleteZone = catchAsync(async (req, res) => {
    const { zoneId } = req.params;
    await deliveryService.deleteZone(zoneId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Zone supprimée avec succès'
    });
  });

  // Calculate fee
  calculateFee = catchAsync(async (req, res) => {
    const { shopId, zoneId } = req.params;
    const { order_amount } = req.body;
    const feeInfo = await deliveryService.calculateDeliveryFee(shopId, zoneId, order_amount || 0);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: feeInfo
    });
  });

  // ========== DELIVERIES ==========

  // Create delivery
  createDelivery = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const { orderId } = req.params;
    const delivery = await deliveryService.createDelivery(shopId, orderId, req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Livraison créée avec succès',
      data: delivery
    });
  });

  // Get deliveries by shop
  getDeliveriesByShop = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const { page, limit, status, startDate, endDate } = req.query;
    const result = await deliveryService.getDeliveriesByShop(shopId, {
      page,
      limit,
      status,
      startDate,
      endDate
    });
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  });

  // Get delivery by ID
  getDeliveryById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const delivery = await deliveryService.getDeliveryById(id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: delivery
    });
  });

  // Get delivery by order ID
  getDeliveryByOrderId = catchAsync(async (req, res) => {
    const { orderId } = req.params;
    const delivery = await deliveryService.getDeliveryByOrderId(orderId);
    if (!delivery) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Aucune livraison trouvée pour cette commande'
      });
    }
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: delivery
    });
  });

  // Update status
  updateStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, note, location, driver } = req.body;
    const updatedBy = req.user?._id;
    
    const delivery = await deliveryService.updateStatus(id, status, {
      note,
      location,
      driver,
      updated_by: updatedBy
    });
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Statut mis à jour: ${status}`,
      data: delivery
    });
  });

  // Assign driver
  assignDriver = catchAsync(async (req, res) => {
    const { id } = req.params;
    const driverData = req.body;
    const delivery = await deliveryService.assignDriver(id, driverData);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Chauffeur assigné avec succès',
      data: delivery
    });
  });

  // Update external tracking
  updateExternalTracking = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { carrier_name, tracking_id, provider } = req.body;
    const delivery = await deliveryService.updateExternalTracking(id, {
      carrier_name,
      tracking_id,
      provider
    });
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Informations de suivi mises à jour',
      data: delivery
    });
  });

  // Sync external tracking
  syncExternalTracking = catchAsync(async (req, res) => {
    const { id } = req.params;
    const delivery = await deliveryService.syncExternalTracking(id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Suivi synchronisé avec succès',
      data: delivery
    });
  });

  // Get stats
  getStats = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const { period } = req.query;
    const stats = await deliveryService.getDeliveryStats(shopId, parseInt(period) || 30);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats
    });
  });

  // Cancel delivery
  cancelDelivery = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const delivery = await deliveryService.cancelDelivery(id, reason);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Livraison annulée',
      data: delivery
    });
  });
}

module.exports = new DeliveryController();
