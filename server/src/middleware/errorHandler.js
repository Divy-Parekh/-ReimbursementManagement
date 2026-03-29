/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for developer debugging
  console.error('\n🔴 Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Handle Joi Validation Errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      })),
    });
  }

  // Define status code based on error structure or default to 500
  const statusCode = err.statusCode || 500;
  
  // Clean message
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
