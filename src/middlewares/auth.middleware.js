const authService = require('../modules/auth/auth.service');
const { UnauthorizedError, ForbiddenError } = require('../shared/errors/custom-errors');
const { MESSAGES } = require('../shared/constants/messages');

/**
 * Middleware to authenticate requests using JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError(MESSAGES.AUTH.TOKEN_REQUIRED);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = authService.verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      user_type: decoded.user_type,
      status: decoded.status
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to authorize requests based on user roles
 * @param {Array<string>} allowedRoles - Array of allowed user types
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED);
      }

      if (!allowedRoles.includes(req.user.user_type)) {
        throw new ForbiddenError(MESSAGES.AUTH.FORBIDDEN);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user account is active
 */
const checkActiveStatus = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED);
    }

    if (req.user.status !== 'active') {
      throw new ForbiddenError(`Account is ${req.user.status}`);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  checkActiveStatus
};
