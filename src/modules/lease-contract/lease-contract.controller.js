const leaseContractService = require('./lease-contract.service');
const { catchAsync } = require('../../shared/errors/custom-errors');
const HTTP_STATUS = require('../../shared/constants/http-status');

class LeaseContractController {
  /**
   * Get all lease contracts
   * GET /api/admin/lease-contracts
   */
  getAllLeaseContracts = catchAsync(async (req, res) => {
    const filters = {
      status: req.query.status,
      shop_id: req.query.shop_id,
      payment_frequency: req.query.payment_frequency,
      start_date_from: req.query.start_date_from,
      end_date_to: req.query.end_date_to
    };

    const contracts = await leaseContractService.getAllLeaseContracts(filters);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: contracts.length,
      data: contracts
    });
  });

  /**
   * Get lease contract by ID
   * GET /api/admin/lease-contracts/:id
   */
  getLeaseContractById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const contract = await leaseContractService.getLeaseContractById(id);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: contract
    });
  });

  /**
   * Get lease contracts by shop
   * GET /api/admin/lease-contracts/shop/:shopId
   */
  getLeaseContractsByShop = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const contracts = await leaseContractService.getLeaseContractsByShop(shopId);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: contracts.length,
      data: contracts
    });
  });

  /**
   * Create new lease contract
   * POST /api/admin/lease-contracts
   */
  createLeaseContract = catchAsync(async (req, res) => {
    const contract = await leaseContractService.createLeaseContract(req.body);
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Lease contract created successfully',
      data: contract
    });
  });

  /**
   * Update lease contract
   * PUT /api/admin/lease-contracts/:id
   */
  updateLeaseContract = catchAsync(async (req, res) => {
    const { id } = req.params;
    const contract = await leaseContractService.updateLeaseContract(id, req.body);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lease contract updated successfully',
      data: contract
    });
  });

  /**
   * Update contract status
   * PATCH /api/admin/lease-contracts/:id/status
   */
  updateContractStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    const contract = await leaseContractService.updateContractStatus(id, status, reason);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Contract status updated successfully',
      data: contract
    });
  });

  /**
   * Delete lease contract
   * DELETE /api/admin/lease-contracts/:id
   */
  deleteLeaseContract = catchAsync(async (req, res) => {
    const { id } = req.params;
    await leaseContractService.deleteLeaseContract(id);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lease contract deleted successfully'
    });
  });

  /**
   * Get expiring contracts
   * GET /api/admin/lease-contracts/expiring/:days
   */
  getExpiringContracts = catchAsync(async (req, res) => {
    const days = parseInt(req.params.days) || 30;
    const contracts = await leaseContractService.getExpiringContracts(days);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: contracts.length,
      data: contracts
    });
  });

  /**
   * Get active contracts
   * GET /api/admin/lease-contracts/active
   */
  getActiveContracts = catchAsync(async (req, res) => {
    const contracts = await leaseContractService.getActiveContracts();
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: contracts.length,
      data: contracts
    });
  });
}

module.exports = new LeaseContractController();
