const express = require('express');
const router = express.Router();
const leaseContractController = require('./lease-contract.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

/**
 * @route   GET /api/admin/lease-contracts
 * @desc    Get all lease contracts with optional filters
 * @access  Admin
 * @query   status, shop_id, payment_frequency, start_date_from, end_date_to
 */
router.get('/lease-contracts',
  authenticate,
  authorize(['admin']),
  leaseContractController.getAllLeaseContracts
);

/**
 * @route   GET /api/admin/lease-contracts/active
 * @desc    Get all active contracts
 * @access  Admin
 */
router.get('/lease-contracts/active',
  authenticate,
  authorize(['admin']),
  leaseContractController.getActiveContracts
);

/**
 * @route   GET /api/admin/lease-contracts/expiring/:days
 * @desc    Get contracts expiring within specified days (default 30)
 * @access  Admin
 */
router.get('/lease-contracts/expiring/:days?',
  authenticate,
  authorize(['admin']),
  leaseContractController.getExpiringContracts
);

/**
 * @route   GET /api/admin/lease-contracts/shop/:shopId
 * @desc    Get all lease contracts for a specific shop
 * @access  Admin
 */
router.get('/lease-contracts/shop/:shopId',
  authenticate,
  authorize(['admin']),
  leaseContractController.getLeaseContractsByShop
);

/**
 * @route   GET /api/admin/lease-contracts/:id
 * @desc    Get lease contract by ID
 * @access  Admin
 */
router.get('/lease-contracts/:id',
  authenticate,
  authorize(['admin']),
  leaseContractController.getLeaseContractById
);

/**
 * @route   POST /api/admin/lease-contracts
 * @desc    Create new lease contract
 * @access  Admin
 * @body    { shop_id, start_date, end_date, rent_amount, payment_frequency, special_conditions, status, status_reason }
 */
router.post('/lease-contracts',
  authenticate,
  authorize(['admin']),
  leaseContractController.createLeaseContract
);

/**
 * @route   PUT /api/admin/lease-contracts/:id
 * @desc    Update lease contract
 * @access  Admin
 * @body    { start_date, end_date, rent_amount, payment_frequency, special_conditions }
 */
router.put('/lease-contracts/:id',
  authenticate,
  authorize(['admin']),
  leaseContractController.updateLeaseContract
);

/**
 * @route   PATCH /api/admin/lease-contracts/:id/status
 * @desc    Update contract status
 * @access  Admin
 * @body    { status, reason }
 */
router.patch('/lease-contracts/:id/status',
  authenticate,
  authorize(['admin']),
  leaseContractController.updateContractStatus
);

/**
 * @route   DELETE /api/admin/lease-contracts/:id
 * @desc    Delete lease contract
 * @access  Admin
 */
router.delete('/lease-contracts/:id',
  authenticate,
  authorize(['admin']),
  leaseContractController.deleteLeaseContract
);

module.exports = router;
