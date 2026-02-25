const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get comprehensive dashboard statistics
 * @access  Admin
 */
router.get('/dashboard/stats',
  authenticate,
  authorize(['admin']),
  adminController.getDashboardStats
);

module.exports = router;
