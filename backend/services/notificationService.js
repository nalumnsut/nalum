const Notification = require('../models/notification.model');
const NotificationPreferences = require('../models/notificationPreferences.model');
const PushSubscription = require('../models/pushSubscription.model');
const webPush = require('web-push');
const { sendEmail } = require('../mail/notificationMailer');

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    `mailto:${process.env.MAIL_FROM_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

class NotificationService {
  
  /**
   * Create and send a notification
   */
  async createNotification({
    recipientId,
    senderId = null,
    type,
    title,
    message,
    actionUrl = null,
    relatedEntity = null,
    priority = 'medium',
    metadata = {},
  }) {
    try {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📬 NOTIFICATION CREATION STARTED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Type:', type);
      console.log('Recipient ID:', recipientId);
      console.log('Sender ID:', senderId || 'System');
      console.log('Title:', title);
      console.log('Message:', message);
      console.log('Priority:', priority);
      console.log('Action URL:', actionUrl);
      console.log('Metadata:', JSON.stringify(metadata, null, 2));
      
      // Check user preferences
      const preferences = await this.getUserPreferences(recipientId);
      console.log('📋 User Preferences Retrieved:', {
        pushEnabled: preferences.push[type] !== false,
        emailEnabled: preferences.email[type] === true,
        mutedTypes: preferences.inApp.mutedTypes,
        dndEnabled: preferences.doNotDisturb.enabled
      });
      
      // Check if type is muted
      if (preferences.inApp.mutedTypes.includes(type)) {
        console.log('🔇 NOTIFICATION MUTED - Type is in muted list');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return null;
      }

      // Check Do Not Disturb
      if (this.isDoNotDisturbActive(preferences)) {
        console.log('🌙 DND ACTIVE - Notification queued but may be delayed');
      }

      // For message notifications, update existing one from same conversation instead of creating duplicate
      let notification;
      if (type === 'new_message' && metadata.conversationId) {
        console.log('🔍 Checking for existing message notification from this conversation...');
        const existingNotification = await Notification.findOne({
          recipient: recipientId,
          type: 'new_message',
          'metadata.conversationId': metadata.conversationId,
          read: false, // Only update unread notifications
        }).sort({ createdAt: -1 }); // Get the most recent one

        if (existingNotification) {
          console.log('♻️  Found existing notification, updating instead of creating new');
          console.log('   Existing ID:', existingNotification._id);
          
          // Update the existing notification with new message
          existingNotification.message = message;
          existingNotification.metadata = metadata;
          existingNotification.createdAt = new Date(); // Update timestamp to move to top
          existingNotification.priority = priority;
          await existingNotification.save();
          notification = existingNotification;
          console.log('✅ Notification Updated - ID:', notification._id);
        } else {
          console.log('   No existing unread notification found, creating new one');
          notification = await Notification.create({
            recipient: recipientId,
            sender: senderId,
            type,
            title,
            message,
            actionUrl,
            relatedEntity,
            priority,
            metadata,
            expiresAt: this.getExpiryDate(type),
          });
          console.log('✅ Notification Document Created - ID:', notification._id);
        }
      } else {
        // For non-message notifications, always create new
        notification = await Notification.create({
          recipient: recipientId,
          sender: senderId,
          type,
          title,
          message,
          actionUrl,
          relatedEntity,
          priority,
          metadata,
          expiresAt: this.getExpiryDate(type),
        });
        console.log('✅ Notification Document Created - ID:', notification._id);
      }

      // Send via different channels
      const deliveryStatus = {};

      // 1. In-app (always send if not muted)
      console.log('\n📱 Sending In-App Notification...');
      deliveryStatus.inApp = await this.sendInApp(notification);
      console.log('In-App Status:', deliveryStatus.inApp ? '✅ Sent' : '❌ Failed');

      // 2. Push notification (if user has it enabled)
      if (preferences.push[type] !== false) {
        console.log('\n🔔 Sending Push Notification...');
        deliveryStatus.push = await this.sendPushNotification(notification);
        console.log('Push Status:', deliveryStatus.push ? '✅ Sent' : '❌ Failed');
      } else {
        console.log('\n🔕 Push Notification Skipped - Disabled in preferences');
        deliveryStatus.push = false;
      }

      // 3. Email notification (if user has it enabled)
      if (preferences.email[type] === true) {
        console.log('\n📧 Sending Email Notification...');
        deliveryStatus.email = await this.sendEmailNotification(notification);
        console.log('Email Status:', deliveryStatus.email ? '✅ Sent' : '❌ Failed');
      } else {
        console.log('\n📭 Email Notification Skipped - Disabled in preferences');
        deliveryStatus.email = false;
      }

      // Update delivery status
      await Notification.findByIdAndUpdate(notification._id, {
        deliveryStatus,
      });

      console.log('\n📊 DELIVERY SUMMARY:', deliveryStatus);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return notification;

    } catch (error) {
      console.error('❌ ERROR CREATING NOTIFICATION:', error);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      throw error;
    }
  }

  /**
   * Send in-app notification via Socket.io
   */
  async sendInApp(notification) {
    try {
      const io = global.io;
      
      if (!io) {
        console.warn('Socket.io not available');
        return false;
      }

      // Populate sender details for display
      await notification.populate('sender', 'name profilePicture');

      // Emit to user's room
      io.to(`user:${notification.recipient}`).emit('notification', {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        sender: notification.sender,
        actionUrl: notification.actionUrl,
        priority: notification.priority,
        createdAt: notification.createdAt,
      });

      // Also update badge count
      const unreadCount = await this.getUnreadCount(notification.recipient);
      io.to(`user:${notification.recipient}`).emit('notification:badge', {
        count: unreadCount,
      });

      return true;
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return false;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(notification) {
    try {
      console.log('   🔍 Looking for active push subscriptions...');
      const subscriptions = await PushSubscription.find({
        user: notification.recipient,
        active: true,
      });

      console.log(`   📊 Found ${subscriptions.length} active subscription(s)`);

      if (subscriptions.length === 0) {
        console.log('   ⚠️  No active push subscriptions found');
        return false;
      }

      subscriptions.forEach((sub, index) => {
        console.log(`   Subscription ${index + 1}:`, {
          browser: sub.deviceInfo?.browser,
          os: sub.deviceInfo?.os,
          endpoint: sub.endpoint.substring(0, 50) + '...',
          createdAt: sub.createdAt
        });
      });

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          url: notification.actionUrl || '/',
          notificationId: notification._id,
        },
      });

      console.log('   📦 Push Payload:', payload);

      const pushPromises = subscriptions.map(async (subscription, index) => {
        try {
          console.log(`   📤 Sending to subscription ${index + 1}...`);
          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
              },
            },
            payload
          );

          // Update last used
          subscription.lastUsed = new Date();
          await subscription.save();

          console.log(`   ✅ Subscription ${index + 1} - Sent successfully`);
          return true;
        } catch (error) {
          // If subscription is expired/invalid, deactivate it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`   ⚠️  Subscription ${index + 1} - Expired/Invalid (${error.statusCode}), deactivating...`);
            subscription.active = false;
            await subscription.save();
          } else {
            console.error(`   ❌ Subscription ${index + 1} - Failed:`, error.message);
          }
          return false;
        }
      });

      const results = await Promise.allSettled(pushPromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      
      console.log(`   📊 Push Results: ${successCount}/${subscriptions.length} successful`);
      
      return results.some(r => r.status === 'fulfilled' && r.value === true);

    } catch (error) {
      console.error('   ❌ Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(notification) {
    try {
      const User = require('./user/user.model');
      const user = await User.findById(notification.recipient, 'email name');

      if (!user || !user.email) {
        return false;
      }

      await sendEmail({
        to: user.email,
        subject: notification.title,
        template: 'notification',
        data: {
          name: user.name,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl
            ? `${process.env.FRONTEND_URL}${notification.actionUrl}`
            : process.env.FRONTEND_URL,
        },
      });

      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  /**
   * Get user's notification preferences
   */
  async getUserPreferences(userId) {
    let preferences = await NotificationPreferences.findOne({ user: userId });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await NotificationPreferences.create({ user: userId });
    }

    return preferences;
  }

  /**
   * Check if Do Not Disturb is active
   */
  isDoNotDisturbActive(preferences) {
    if (!preferences.doNotDisturb.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = preferences.doNotDisturb.start;
    const end = preferences.doNotDisturb.end;

    // Handle overnight DND (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }

    return currentTime >= start && currentTime <= end;
  }

  /**
   * Get expiry date based on notification type
   */
  getExpiryDate(type) {
    const expiryDays = {
      connection_request: 30,
      connection_accepted: 7,
      post_like: 7,
      post_comment: 14,
      new_message: 30,
      event_reminder: 1,
      system_announcement: 90,
    };

    const days = expiryDays[type] || 30;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    return await Notification.countDocuments({
      recipient: userId,
      read: false,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    // Update badge count
    if (notification) {
      const unreadCount = await this.getUnreadCount(userId);
      const io = global.io;
      if (io) {
        io.to(`user:${userId}`).emit('notification:badge', {
          count: unreadCount,
        });
      }
    }

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true, readAt: new Date() }
    );

    // Update badge count
    const io = global.io;
    if (io) {
      io.to(`user:${userId}`).emit('notification:badge', { count: 0 });
    }

    return true;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    return await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
    const query = { recipient: userId };
    
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}

module.exports = new NotificationService();
