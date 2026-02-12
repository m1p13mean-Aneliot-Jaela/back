const { validationResult } = require('express-validator');
const { ValidationError } = require('../shared/errors/custom-errors');

/**
 * Middleware to validate request based on express-validator rules
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg
    }));

    throw new ValidationError('Validation failed', errorMessages);
  }

  next();
};

module.exports = {
  validateRequest
};
