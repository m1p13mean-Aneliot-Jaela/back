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
  }
};

module.exports = MESSAGES;
