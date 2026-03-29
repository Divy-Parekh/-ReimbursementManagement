const express = require('express');
const {
  getMyNotifications,
  getRecentUnread,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/', getMyNotifications);
router.get('/recent', getRecentUnread);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
