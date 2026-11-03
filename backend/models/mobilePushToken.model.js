const mongoose = require('mongoose');
const { Schema } = mongoose;

// FCM registration tokens for the mobile app (one per installed app).
// Web browsers use PushSubscription instead.
const mobilePushTokenSchema = new Schema({
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  token: {
    type: String,
    required: true,
    unique: true,
  },

  platform: {
    type: String,
    enum: ['ios', 'android'],
    required: true,
  },

  // Matches Session.device_id, so pushes stop when the device's session ends
  device_id: {
    type: String,
    required: true,
  },

  app_version: String,

  // Status
  active: {
    type: Boolean,
    default: true,
  },

  lastUsed: {
    type: Date,
    default: Date.now,
  },

}, {
  timestamps: true,
});

mobilePushTokenSchema.index({ user: 1, device_id: 1 });
// Index for cleanup
mobilePushTokenSchema.index({ active: 1, lastUsed: 1 });

module.exports = mongoose.model('MobilePushToken', mobilePushTokenSchema);
