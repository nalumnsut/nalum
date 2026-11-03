const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  clearConversationNotifications,
  clearPostNotifications,
  subscribePush,
  unsubscribePush,
  registerMobilePush,
  unregisterMobilePush,
  getPreferences,
  updatePreferences,
  getVapidPublicKey,
} = require('../controllers/notification.controller');

// Notification CRUD
router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/:notificationId/read', protect, markAsRead);
router.patch('/mark-all-read', protect, markAllAsRead);
router.delete('/', protect, clearAllNotifications);        // Task 3.4: bulk clear
router.delete('/conversation/:conversationId', protect, clearConversationNotifications);
router.delete('/post/:postId', protect, clearPostNotifications);
router.delete('/:notificationId', protect, deleteNotification);

// Push subscriptions
router.post('/push/subscribe', protect, subscribePush);
router.post('/push/unsubscribe', protect, unsubscribePush);
router.get('/push/vapid-public-key', getVapidPublicKey);
router.post('/push/mobile/register', protect, registerMobilePush);
router.post('/push/mobile/unregister', protect, unregisterMobilePush);

// Preferences
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
