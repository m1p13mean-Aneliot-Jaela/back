const authService = require('./auth.service');
const { asyncHandler } = require('../../shared/utils/async-handler');
const HTTP_STATUS = require('../../shared/constants/http-status');
const MESSAGES = require('../../shared/constants/messages');
const config = require('../../config/env');

function getCookieOptions() {
  const isProduction = config.env === 'production';
  return {
    httpOnly: true,
    secure: true, // Always true for SameSite=None compatibility
    sameSite: isProduction ? 'strict' : 'none'
  };
}

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

    // Set HttpOnly cookies for tokens
    const cookieOptions = getCookieOptions();

    res.cookie('accessToken', result.tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', result.tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data without tokens
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: MESSAGES.AUTH.SIGNUP_SUCCESS,
      data: { user: result.user, accessToken: result.tokens.accessToken }
    });
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    const cookieOptions = getCookieOptions();

    // Set HttpOnly cookies for tokens
    res.cookie('accessToken', result.tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', result.tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data without tokens
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.AUTH.LOGIN_SUCCESS,
      data: { user: result.user, accessToken: result.tokens.accessToken }
    });
  });

  refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const tokens = await authService.refreshTokens(refreshToken);

    const cookieOptions = getCookieOptions();

    // Set new HttpOnly cookies
    res.cookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.AUTH.TOKEN_REFRESHED,
      data: { accessToken: tokens.accessToken }
    });
  });

  logout = asyncHandler(async (req, res) => {
    await authService.logout(req.user.id);

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.AUTH.LOGOUT_SUCCESS
    });
  });

  validateToken = asyncHandler(async (req, res) => {
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

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
