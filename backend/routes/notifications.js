const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearConversationNotifications,
  subscribePush,
  unsubscribePush,
  getPreferences,
  updatePreferences,
  getVapidPublicKey,
} = require('../controllers/notification.controller');

// Notification CRUD
router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/:notificationId/read', protect, markAsRead);
router.patch('/mark-all-read', protect, markAllAsRead);
router.delete('/conversation/:conversationId', protect, clearConversationNotifications);
router.delete('/:notificationId', protect, deleteNotification);

// Push subscriptions
router.post('/push/subscribe', protect, subscribePush);
router.post('/push/unsubscribe', protect, unsubscribePush);
router.get('/push/vapid-public-key', getVapidPublicKey);

// Preferences
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
