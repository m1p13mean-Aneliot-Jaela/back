const userService = require('./user.service');
const { asyncHandler } = require('../../shared/utils/async-handler');
const HTTP_STATUS = require('../../shared/constants/http-status');
const MESSAGES = require('../../shared/constants/messages');

class UserController {
  getById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: user
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const { page, limit, user_type, status } = req.query;
    
    const filters = {};
    if (user_type) filters.user_type = user_type;
    if (status) filters['current_status.status'] = status;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    };

    const result = await userService.getAllUsers(filters, options);
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  });

  update = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.USER.UPDATED,
      data: user
    });
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { status, reason } = req.body;
    const user = await userService.updateUserStatus(req.params.id, status, reason);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.USER.STATUS_UPDATED,
      data: user
    });
  });

  delete = asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.USER.DELETED
    });
  });

  getStats = asyncHandler(async (req, res) => {
    const stats = await userService.getUserStats();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats
    });
  });

  getProfile = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.user.id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: user
    });
  });

  updateProfile = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.user.id, req.body);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.USER.PROFILE_UPDATED,
      data: user
    });
  });
}

module.exports = new UserController();
