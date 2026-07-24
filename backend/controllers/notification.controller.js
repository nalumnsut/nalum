const notificationService = require('../services/notificationService');
const PushSubscription = require('../models/pushSubscription.model');
const NotificationPreferences = require('../models/notificationPreferences.model');

/**
 * Get user notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

/**
 * Get unread count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
    });
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { notificationId } = req.params;

    const notification = await notificationService.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;
    await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
    });
  }
};

/**
 * Clear all chat notifications associated with a visited conversation.
 */
exports.clearConversationNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;
    const Conversation = require('../models/chat/conversations.model');

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    }).select('_id');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const result = await notificationService.clearConversationNotifications(userId, conversationId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error?.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid conversation ID' });
    }
    console.error('Error clearing conversation notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear conversation notifications',
    });
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { notificationId } = req.params;

    const notification = await notificationService.deleteNotification(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
    });
  }
};

/**
 * Subscribe to push notifications
 */
exports.subscribePush = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { endpoint, keys, deviceInfo } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data',
      });
    }

    // Use findOneAndUpdate with upsert to avoid race conditions
    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: userId,
        endpoint,
        keys,
        deviceInfo,
        active: true,
        lastUsed: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Push subscription saved',
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save push subscription',
    });
  }
};

/**
 * Unsubscribe from push notifications
 */
exports.unsubscribePush = async (req, res) => {
  try {
    const { endpoint } = req.body;

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { active: false }
    );

    res.status(200).json({
      success: true,
      message: 'Push subscription removed',
    });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove push subscription',
    });
  }
};

/**
 * Get notification preferences
 */
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const preferences = await notificationService.getUserPreferences(userId);

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
    });
  }
};

/**
 * Update notification preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const updates = req.body;

    const preferences = await NotificationPreferences.findOneAndUpdate(
      { user: userId },
      updates,
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
    });
  }
};

/**
 * Get VAPID public key (for frontend)
 */
exports.getVapidPublicKey = async (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || null;
  
  console.log('\n🔑 VAPID PUBLIC KEY REQUEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Key exists:', !!publicKey);
  if (publicKey) {
    console.log('Key length:', publicKey.length);
    console.log('Key (first 50):', publicKey.substring(0, 50) + '...');
    console.log('Key (last 50):', '...' + publicKey.substring(publicKey.length - 50));
  } else {
    console.log('⚠️ WARNING: VAPID_PUBLIC_KEY not set in environment!');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  res.status(200).json({
    success: true,
    publicKey: publicKey,
  });
};
