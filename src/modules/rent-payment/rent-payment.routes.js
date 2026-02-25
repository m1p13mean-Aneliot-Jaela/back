const express = require('express');
const router = express.Router();
const rentPaymentController = require('./rent-payment.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

/**
 * @route   GET /api/admin/rent-payments/statistics
 * @desc    Get payment statistics
 * @access  Admin
 */
router.get('/rent-payments/statistics',
  authenticate,
  authorize(['admin']),
  rentPaymentController.getPaymentStatistics
);

/**
 * @route   GET /api/admin/rent-payments/pending
 * @desc    Get all pending payments
 * @access  Admin
 */
router.get('/rent-payments/pending',
  authenticate,
  authorize(['admin']),
  rentPaymentController.getPendingPayments
);

/**
 * @route   GET /api/admin/rent-payments/overdue
 * @desc    Get all overdue payments
 * @access  Admin
 */
router.get('/rent-payments/overdue',
  authenticate,
  authorize(['admin']),
  rentPaymentController.getOverduePayments
);

/**
 * @route   GET /api/admin/rent-payments/upcoming/:days?
 * @desc    Get upcoming payments within specified days (default 30)
 * @access  Admin
 */
router.get('/rent-payments/upcoming/:days?',
  authenticate,
  authorize(['admin']),
  rentPaymentController.getUpcomingPayments
);

/**
 * @route   GET /api/admin/rent-payments/contract/:contractId
 * @desc    Get all rent payments for a specific contract
 * @access  Admin
 */
router.get('/rent-payments/contract/:contractId',
  authenticate,
  authorize(['admin']),
  rentPaymentController.getRentPaymentsByContract
);

/**
 * @route   GET /api/admin/rent-payments/shop/:shopId
 * @desc    Get all rent payments for a specific shop
 * @access  Admin
 */
router.get('/rent-payments/shop/:shopId',
  authenticate,
  authorize(['admin']),
  rentPaymentController.getRentPaymentsByShop
);

/**
 * @route   GET /api/admin/rent-payments/:id
 * @desc    Get rent payment by ID
 * @access  Admin
 */
router.get('/rent-payments/:id',
  authenticate,
  authorize(['admin']),
  rentPaymentController.getRentPaymentById
);

/**
 * @route   GET /api/admin/rent-payments
 * @desc    Get all rent payments with optional filters
 * @access  Admin
 * @query   status, contract_id, shop_id, method, due_date_from, due_date_to
 */
router.get('/rent-payments',
  authenticate,
  authorize(['admin']),
  rentPaymentController.getAllRentPayments
);

/**
 * @route   POST /api/admin/rent-payments
 * @desc    Create new rent payment
 * @access  Admin
 */
router.post('/rent-payments',
  authenticate,
  authorize(['admin']),
  rentPaymentController.createRentPayment
);

/**
 * @route   PUT /api/admin/rent-payments/:id
 * @desc    Update rent payment
 * @access  Admin
 */
router.put('/rent-payments/:id',
  authenticate,
  authorize(['admin']),
  rentPaymentController.updateRentPayment
);

/**
 * @route   PATCH /api/admin/rent-payments/:id/status
 * @desc    Update payment status
 * @access  Admin
 */
router.patch('/rent-payments/:id/status',
  authenticate,
  authorize(['admin']),
  rentPaymentController.updatePaymentStatus
);

/**
 * @route   DELETE /api/admin/rent-payments/:id
 * @desc    Delete rent payment (only pending payments)
 * @access  Admin
 */
router.delete('/rent-payments/:id',
  authenticate,
  authorize(['admin']),
  rentPaymentController.deleteRentPayment
);

module.exports = router;
