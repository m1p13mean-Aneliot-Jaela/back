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
    REGISTER_SUCCESS: 'Registration successful',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token'
  },

  // User messages
  USER: {
    NOT_FOUND: 'User not found',
    CREATED: 'User created successfully',
    UPDATED: 'User updated successfully',
    DELETED: 'User deleted successfully',
    EMAIL_EXISTS: 'Email already exists'
  }
};

module.exports = MESSAGES;
