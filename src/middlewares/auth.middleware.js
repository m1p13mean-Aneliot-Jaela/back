const authService = require('../modules/auth/auth.service');
const employeeRepository = require('../modules/employee/employee.repository');
const { UnauthorizedError, ForbiddenError } = require('../shared/errors/custom-errors');
const MESSAGES = require('../shared/constants/messages');

/**
 * Middleware to authenticate requests using JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from cookie or header
    const token = req.cookies.accessToken || 
                  (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    
    if (!token) {
      throw new UnauthorizedError(MESSAGES.AUTH.TOKEN_REQUIRED);
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      user_type: decoded.user_type,
      status: decoded.status
    };

    // If user is a shop employee, fetch additional info (role, shop_id)
    if (req.user.user_type === 'shop') {
      const employee = await employeeRepository.findByEmail(req.user.email);
      if (employee) {
        req.user.shop_id = employee.shop_id?.toString();
        req.user.role = employee.role;
      }
    }

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

      // Handle both array format and object format { user_type: 'shop' }
      const roles = Array.isArray(allowedRoles) 
        ? allowedRoles 
        : allowedRoles.user_type 
          ? [allowedRoles.user_type]
          : [];

      if (!roles.includes(req.user.user_type)) {
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

/**
 * Middleware to check if shop manager can only manage their own shop
 * Verifies that req.user.shop_id matches the shopId in URL params
 */
const checkShopOwnership = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED);
    }

    // Admins and brands can manage any shop
    if (req.user.user_type === 'admin' || req.user.user_type === 'brand') {
      return next();
    }

    // Shop managers can only manage their own shop
    const requestedShopId = req.params.shopId;
    const userShopId = req.user.shop_id;

    if (!userShopId) {
      throw new ForbiddenError('No shop associated with your account');
    }

    if (userShopId !== requestedShopId) {
      throw new ForbiddenError('You can only manage employees in your own shop');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is MANAGER_SHOP and owns the shop
 */
const checkShopManagerRole = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED);
    }

    // Admins and brands can manage any shop
    if (req.user.user_type === 'admin' || req.user.user_type === 'brand') {
      return next();
    }

    // Must be shop user_type
    if (req.user.user_type !== 'shop') {
      throw new ForbiddenError(MESSAGES.AUTH.FORBIDDEN);
    }

    // Must be MANAGER_SHOP role (not STAFF)
    if (req.user.role !== 'MANAGER_SHOP') {
      throw new ForbiddenError('Only shop managers can manage employees');
    }

    // Must belong to this shop (from URL params)
    const requestedShopId = req.params.shopId;
    const userShopId = req.user.shop_id;

    if (!userShopId) {
      throw new ForbiddenError('No shop associated with your account');
    }

    if (userShopId !== requestedShopId) {
      throw new ForbiddenError('You can only manage employees in your own shop');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if manager owns the employee (by employee ID)
 */
const checkEmployeeOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError(MESSAGES.AUTH.UNAUTHORIZED);
    }

    // Admins and brands can manage any employee
    if (req.user.user_type === 'admin' || req.user.user_type === 'brand') {
      return next();
    }

    // Must be shop user_type
    if (req.user.user_type !== 'shop') {
      throw new ForbiddenError(MESSAGES.AUTH.FORBIDDEN);
    }

    // Must be MANAGER_SHOP role (not STAFF)
    if (req.user.role !== 'MANAGER_SHOP') {
      throw new ForbiddenError('Only shop managers can manage employees');
    }

    // Get employee ID from URL params
    const employeeId = req.params.id;
    const userShopId = req.user.shop_id;

    if (!userShopId) {
      throw new ForbiddenError('No shop associated with your account');
    }

    // Fetch employee to check their shop
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new ForbiddenError('Employee not found');
    }

    // Check if employee belongs to manager's shop
    const employeeShopId = employee.shop_id?.toString();
    if (employeeShopId !== userShopId) {
      throw new ForbiddenError('You can only manage employees in your own shop');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  checkActiveStatus,
  checkShopOwnership,
  checkShopManagerRole,
  checkEmployeeOwnership
};
