const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  // Recipient
  recipient: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Sender (who triggered the notification)
  sender: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: false,
  },

  // Notification type
  type: {
    type: String,
    enum: [
      'connection_request',
      'connection_accepted',
      'post_like',
      'post_comment',
      'comment_reply',
      'comment_mention',
      'post_mention',
      'new_message',
      'event_reminder',
      'event_update',
      'event_invitation',
      'query_response',
      'giving_response',
      'verification_status',
      'profile_update',
      'banned',
      'system_announcement'
    ],
    required: true,
    index: true,
  },

  // Content
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  
  message: {
    type: String,
    required: true,
    maxlength: 500,
  },

  // Action URL (where to navigate when clicked)
  actionUrl: {
    type: String,
    required: false,
  },

  // Related entity reference
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['post', 'event', 'message', 'query', 'giving', 'connection', 'user'],
      required: false,
    },
    entityId: {
      type: String,
      required: false,
    },
  },

  // Status
  read: {
    type: Boolean,
    default: false,
    index: true,
  },

  readAt: {
    type: Date,
    default: null,
  },

  // Delivery tracking
  deliveryStatus: {
    inApp: {
      type: Boolean,
      default: false,
    },
    push: {
      type: Boolean,
      default: false,
    },
    email: {
      type: Boolean,
      default: false,
    },
  },

  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },

  // Metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },

  // Expiry (auto-delete old notifications)
  expiresAt: {
    type: Date,
    required: false,
  },

}, {
  timestamps: true,
});

// Indexes for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for sender details
notificationSchema.virtual('senderDetails', {
  ref: 'User',
  localField: 'sender',
  foreignField: '_id',
  justOne: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
