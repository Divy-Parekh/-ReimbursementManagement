const { verifyToken } = require('../utils/tokenUtils');
const { sendError } = require('../utils/responseHelper');
const prisma = require('../utils/prisma');

const authenticate = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 401, 'Please authenticate to access this resource.');
  }

  try {
    const decoded = verifyToken(token);
    
    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        name: true,
      }
    });

    if (!user) {
      return sendError(res, 401, 'The user belonging to this token no longer exists.');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid or expired token. Please log in again.');
  }
};

module.exports = { authenticate };
