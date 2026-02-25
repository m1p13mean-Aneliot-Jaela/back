const adminService = require('./admin.service');
const { catchAsync } = require('../../shared/errors/custom-errors');
const HTTP_STATUS = require('../../shared/constants/http-status');

class AdminController {
  /**
   * Get dashboard statistics
   * GET /api/admin/dashboard/stats
   */
  getDashboardStats = catchAsync(async (req, res) => {
    const stats = await adminService.getDashboardStats();
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats
    });
  });
}

module.exports = new AdminController();
