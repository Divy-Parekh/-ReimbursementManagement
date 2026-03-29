const { sendError } = require('../utils/responseHelper');

/**
 * Restricts access to specified roles
 * @param  {...string} roles - Array of allowed roles (e.g. 'ADMIN', 'MANAGER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 403, `User role '${req.user?.role}' is not authorized to access this route.`);
    }
    next();
  };
};

module.exports = { authorize };
