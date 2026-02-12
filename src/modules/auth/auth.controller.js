const authService = require('./auth.service');
const { asyncHandler } = require('../../shared/utils/async-handler');
const HTTP_STATUS = require('../../shared/constants/http-status');
const MESSAGES = require('../../shared/constants/messages');

class AuthController {
  signup = asyncHandler(async (req, res) => {
    const { email, password, first_name, last_name, phone } = req.body;

    const result = await authService.signup({
      email,
      password,
      first_name,
      last_name,
      phone
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: MESSAGES.AUTH.SIGNUP_SUCCESS,
      data: result
    });
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.AUTH.LOGIN_SUCCESS,
      data: result
    });
  });

  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshTokens(refreshToken);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.AUTH.TOKEN_REFRESHED,
      data: tokens
    });
  });

  logout = asyncHandler(async (req, res) => {
    await authService.logout(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.AUTH.LOGOUT_SUCCESS
    });
  });

  validateToken = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.AUTH.TOKEN_REQUIRED
      });
    }

    const user = await authService.validateToken(token);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: user
    });
  });
}

module.exports = new AuthController();
