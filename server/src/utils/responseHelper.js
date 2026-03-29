/**
 * Format a standard success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {any} data - Response payload data
 * @param {number} [count] - Optional count for lists
 * @returns {Object} JSON response
 */
const sendSuccess = (res, statusCode, message, data = null, count = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (count !== null) {
    response.count = count;
  }

  return res.status(statusCode).json(response);
};

/**
 * Format a standard error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Array} [errors] - Optional array of field errors
 * @returns {Object} JSON response
 */
const sendError = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};
