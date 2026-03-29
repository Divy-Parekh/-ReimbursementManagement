const prisma = require('../utils/prisma');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100, // Reasonable limit
    });
    
    return sendSuccess(res, 200, 'Notifications retrieved', { notifications });
  } catch (err) {
    next(err);
  }
};

const getRecentUnread = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });
    
    return sendSuccess(res, 200, 'Recent unread retrieved', { notifications });
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    
    return sendSuccess(res, 200, 'Unread count retrieved', { count });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return sendError(res, 404, 'Notification not found');
    if (notification.userId !== req.user.id) return sendError(res, 403, 'Unauthorized');
    
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    
    return sendSuccess(res, 200, 'Marked as read', { notification: updated });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    
    return sendSuccess(res, 200, 'All marked as read');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyNotifications,
  getRecentUnread,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
