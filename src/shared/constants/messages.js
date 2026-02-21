const MESSAGES = {
  // Success messages
  SUCCESS: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    RETRIEVED: 'Resource retrieved successfully'
  },

  // Error messages
  ERROR: {
    INTERNAL_SERVER: 'Internal server error',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Insufficient permissions',
    VALIDATION: 'Validation error',
    DUPLICATE: 'Resource already exists'
  },

  // Auth messages
  AUTH: {
    SIGNUP_SUCCESS: 'Account created successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
    TOKEN_REQUIRED: 'Authentication token is required',
    TOKEN_REFRESHED: 'Token refreshed successfully',
    UNAUTHORIZED: 'You are not authorized to access this resource',
    FORBIDDEN: 'You do not have permission to perform this action'
  },

  // User messages
  USER: {
    NOT_FOUND: 'User not found',
    CREATED: 'User created successfully',
    UPDATED: 'User updated successfully',
    DELETED: 'User deleted successfully',
    EMAIL_EXISTS: 'Email already exists',
    PROFILE_UPDATED: 'Profile updated successfully',
    STATUS_UPDATED: 'User status updated successfully'
  },

  // Shop messages
  SHOP: {
    NOT_FOUND: 'Shop not found',
    CREATED: 'Shop created successfully',
    UPDATED: 'Shop updated successfully',
    DELETED: 'Shop deleted successfully',
    RESTORED: 'Shop restored successfully',
    VALIDATED: 'Shop validated successfully',
    ACTIVATED: 'Shop activated successfully',
    DEACTIVATED: 'Shop deactivated successfully',
    REJECTED: 'Shop rejected successfully',
    REGISTRATION_EXISTS: 'A shop with this registration number already exists',
    INVALID_CATEGORY: 'Invalid category',
    INVALID_STATUS: 'Invalid status',
    ALREADY_DELETED: 'Shop is already deleted',
    ALREADY_ACTIVE: 'Shop is already active',
    ALREADY_SUSPENDED: 'Shop is already suspended',
    ALREADY_REJECTED: 'Shop is already rejected',
    CANNOT_UPDATE_DELETED: 'Cannot update a deleted shop',
    CANNOT_VALIDATE_DELETED: 'Cannot validate a deleted shop',
    MUST_BE_PENDING: 'Shop must be in PENDING status to be validated',
    REASON_REQUIRED: 'Reason is required'
  }
};

module.exports = MESSAGES;
