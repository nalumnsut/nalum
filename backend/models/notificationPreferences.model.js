const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationPreferencesSchema = new Schema({
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },

  // Email preferences
  email: {
    connection_request: { type: Boolean, default: true },
    connection_accepted: { type: Boolean, default: true },
    post_comment: { type: Boolean, default: false },
    comment_reply: { type: Boolean, default: false },
    comment_mention: { type: Boolean, default: true },
    post_mention: { type: Boolean, default: true },
    event_reminder: { type: Boolean, default: true },
    event_invitation: { type: Boolean, default: true },
    query_response: { type: Boolean, default: true },
    giving_response: { type: Boolean, default: true },
    verification_status: { type: Boolean, default: true },
    system_announcement: { type: Boolean, default: true },
  },

  // Push notification preferences
  push: {
    connection_request: { type: Boolean, default: true },
    connection_accepted: { type: Boolean, default: true },
    new_message: { type: Boolean, default: true },
    post_comment: { type: Boolean, default: true },
    comment_reply: { type: Boolean, default: true },
    comment_mention: { type: Boolean, default: true },
    post_mention: { type: Boolean, default: true },
    event_reminder: { type: Boolean, default: true },
    event_invitation: { type: Boolean, default: true },
  },

  // In-app (can mute types)
  inApp: {
    enabled: { type: Boolean, default: true },
    mutedTypes: {
      type: [String],
      default: [],
    },
  },

  // Global settings
  doNotDisturb: {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: '22:00' },
    end: { type: String, default: '08:00' },
  },

  // Digest settings
  emailDigest: {
    enabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'never'],
      default: 'never',
    },
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model('NotificationPreferences', notificationPreferencesSchema);
