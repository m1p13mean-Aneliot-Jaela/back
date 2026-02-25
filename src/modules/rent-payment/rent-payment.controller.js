const rentPaymentService = require('./rent-payment.service');
const { catchAsync } = require('../../shared/errors/custom-errors');
const HTTP_STATUS = require('../../shared/constants/http-status');

class RentPaymentController {
  /**
   * Get all rent payments
   * GET /api/admin/rent-payments
   */
  getAllRentPayments = catchAsync(async (req, res) => {
    const filters = {
      status: req.query.status,
      contract_id: req.query.contract_id,
      shop_id: req.query.shop_id,
      method: req.query.method,
      due_date_from: req.query.due_date_from,
      due_date_to: req.query.due_date_to
    };

    const payments = await rentPaymentService.getAllRentPayments(filters);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: payments.length,
      data: payments
    });
  });

  /**
   * Get rent payment by ID
   * GET /api/admin/rent-payments/:id
   */
  getRentPaymentById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const payment = await rentPaymentService.getRentPaymentById(id);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: payment
    });
  });

  /**
   * Get rent payments by contract
   * GET /api/admin/rent-payments/contract/:contractId
   */
  getRentPaymentsByContract = catchAsync(async (req, res) => {
    const { contractId } = req.params;
    const payments = await rentPaymentService.getRentPaymentsByContract(contractId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: payments.length,
      data: payments
    });
  });

  /**
   * Get rent payments by shop
   * GET /api/admin/rent-payments/shop/:shopId
   */
  getRentPaymentsByShop = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const payments = await rentPaymentService.getRentPaymentsByShop(shopId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: payments.length,
      data: payments
    });
  });

  /**
   * Create new rent payment
   * POST /api/admin/rent-payments
   */
  createRentPayment = catchAsync(async (req, res) => {
    const payment = await rentPaymentService.createRentPayment(req.body);
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Rent payment created successfully',
      data: payment
    });
  });

  /**
   * Update rent payment
   * PUT /api/admin/rent-payments/:id
   */
  updateRentPayment = catchAsync(async (req, res) => {
    const { id } = req.params;
    const payment = await rentPaymentService.updateRentPayment(id, req.body);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Rent payment updated successfully',
      data: payment
    });
  });

  /**
   * Update payment status
   * PATCH /api/admin/rent-payments/:id/status
   */
  updatePaymentStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    const payment = await rentPaymentService.updatePaymentStatus(id, status, reason);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment
    });
  });

  /**
   * Delete rent payment
   * DELETE /api/admin/rent-payments/:id
   */
  deleteRentPayment = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await rentPaymentService.deleteRentPayment(id);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message
    });
  });

  /**
   * Get pending payments
   * GET /api/admin/rent-payments/pending
   */
  getPendingPayments = catchAsync(async (req, res) => {
    const payments = await rentPaymentService.getPendingPayments();
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: payments.length,
      data: payments
    });
  });

  /**
   * Get overdue payments
   * GET /api/admin/rent-payments/overdue
   */
  getOverduePayments = catchAsync(async (req, res) => {
    const payments = await rentPaymentService.getOverduePayments();
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: payments.length,
      data: payments
    });
  });

  /**
   * Get upcoming payments
   * GET /api/admin/rent-payments/upcoming/:days?
   */
  getUpcomingPayments = catchAsync(async (req, res) => {
    const days = parseInt(req.params.days) || 30;
    const payments = await rentPaymentService.getUpcomingPayments(days);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: payments.length,
      data: payments
    });
  });

  /**
   * Get payment statistics
   * GET /api/admin/rent-payments/statistics
   */
  getPaymentStatistics = catchAsync(async (req, res) => {
    const filters = {
      shop_id: req.query.shop_id,
      contract_id: req.query.contract_id
    };
    
    const statistics = await rentPaymentService.getPaymentStatistics(filters);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: statistics
    });
  });
}

module.exports = new RentPaymentController();
