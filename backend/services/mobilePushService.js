const MobilePushToken = require('../models/mobilePushToken.model');
const Session = require('../models/auth/session.model');

// Sends push notifications to the mobile app through Firebase Cloud Messaging.
// Credentials come from FIREBASE_SERVICE_ACCOUNT_JSON (the service account
// JSON, raw or base64) or GOOGLE_APPLICATION_CREDENTIALS (a path to it).
// Without either, every send is a no-op so dev machines need no Firebase setup.

const FCM_APP_NAME = 'nalum-mobile-push';

// FCM error codes meaning the token will never work again
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

// Android notification channels created by the app (see mobile plan §6.2)
const CHANNEL_BY_TYPE = {
  new_message: 'messages',
  banned: 'account',
  connection_request: 'social',
  connection_accepted: 'social',
  post_like: 'social',
  post_comment: 'social',
  comment_reply: 'social',
  comment_mention: 'social',
  post_mention: 'social',
};

let messaging; // undefined = not tried yet, null = no credentials

const parseServiceAccount = (raw) => {
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  return JSON.parse(text);
};

function getMessaging() {
  if (messaging !== undefined) return messaging;

  const { FIREBASE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS } = process.env;
  if (!FIREBASE_SERVICE_ACCOUNT_JSON && !GOOGLE_APPLICATION_CREDENTIALS) {
    messaging = null;
    return messaging;
  }

  try {
    const { initializeApp, cert, applicationDefault, getApps } = require('firebase-admin/app');
    const { getMessaging: getFirebaseMessaging } = require('firebase-admin/messaging');

    const app = getApps().find((a) => a.name === FCM_APP_NAME) || initializeApp({
      credential: FIREBASE_SERVICE_ACCOUNT_JSON
        ? cert(parseServiceAccount(FIREBASE_SERVICE_ACCOUNT_JSON))
        : applicationDefault(),
    }, FCM_APP_NAME);

    messaging = getFirebaseMessaging(app);
  } catch (error) {
    console.error('Mobile push disabled - could not initialise Firebase:', error.message);
    messaging = null;
  }
  return messaging;
}

/**
 * Build the FCM message for a notification. FCM data values must be strings.
 */
function buildMessage(notification) {
  const type = notification.type || '';
  const conversationId = notification.metadata?.conversationId
    ? String(notification.metadata.conversationId)
    : undefined;

  const data = {
    url: notification.actionUrl || '/',
    notificationId: String(notification._id),
    type,
  };
  if (conversationId) data.conversationId = conversationId;

  return {
    notification: {
      title: notification.title,
      body: notification.message,
    },
    data,
    android: {
      priority: type === 'new_message' ? 'high' : 'normal',
      ...(conversationId && { collapseKey: conversationId }),
      notification: {
        channelId: CHANNEL_BY_TYPE[type] || 'updates',
        ...(conversationId && { tag: conversationId }),
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          ...(conversationId && { 'thread-id': conversationId }),
        },
      },
    },
  };
}

/**
 * Send a notification to every mobile device the recipient is signed in on.
 * Tokens whose device no longer has a session (logout, ban, password reset,
 * revoked session) are deactivated instead of sent to.
 *
 * @returns {Promise<boolean>} true if at least one device accepted it
 */
async function sendToUser(notification) {
  try {
    const fcm = getMessaging();
    if (!fcm) return false;

    const tokens = await MobilePushToken.find({ user: notification.recipient, active: true });
    if (tokens.length === 0) return false;

    const signedInDevices = new Set(
      await Session.distinct('device_id', { user_id: notification.recipient, client_type: 'mobile' }),
    );
    const live = tokens.filter((t) => signedInDevices.has(t.device_id));
    const orphaned = tokens.filter((t) => !signedInDevices.has(t.device_id));

    if (orphaned.length > 0) {
      await MobilePushToken.updateMany({ _id: { $in: orphaned.map((t) => t._id) } }, { active: false });
    }
    if (live.length === 0) return false;

    const response = await fcm.sendEachForMulticast({
      ...buildMessage(notification),
      tokens: live.map((t) => t.token),
    });

    const dead = [];
    const delivered = [];
    response.responses.forEach((result, index) => {
      if (result.success) {
        delivered.push(live[index]._id);
      } else if (DEAD_TOKEN_CODES.has(result.error?.code)) {
        dead.push(live[index]._id);
      } else {
        console.error('   ❌ Mobile push failed:', result.error?.code, result.error?.message);
      }
    });

    await Promise.all([
      dead.length && MobilePushToken.updateMany({ _id: { $in: dead } }, { active: false }),
      delivered.length && MobilePushToken.updateMany({ _id: { $in: delivered } }, { lastUsed: new Date() }),
    ]);

    console.log(`   📱 Mobile Push Results: ${response.successCount}/${live.length} successful`);
    return response.successCount > 0;
  } catch (error) {
    console.error('   ❌ Error sending mobile push notification:', error);
    return false;
  }
}

// Test hook: forget the cached Firebase client so env changes take effect
function resetForTests() {
  messaging = undefined;
}

module.exports = {
  sendToUser,
  buildMessage,
  resetForTests,
};
