const mongoose = require('mongoose');
const { Schema } = mongoose;

const communitySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String
  },
  type: {
    type: String,
    enum: ['location', 'batch'],
    required: true
  },
  value: {
    type: String,
    required: true
  },
  admins: [{
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User'
  }],
  members: [{
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User'
  }],
  mutedBy: [{
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User'
  }],
  clearedAt: {
    type: Map,
    of: Date,
    default: {}
  },
  lastMessage: {
    content: {
      type: String,
      maxlength: 500,
    },
    sender: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
    }
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

communitySchema.index({ type: 1, value: 1 });
communitySchema.index({ 'lastMessage.timestamp': -1 });

module.exports = mongoose.model('Community', communitySchema);
