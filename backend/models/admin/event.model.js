const mongoose = require("mongoose");
const { Schema } = mongoose;

const EventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    event_date: {
      type: Date,
      required: true,
    },
    event_time: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    event_type: {
      type: String,
      enum: ["workshop", "seminar", "conference", "meetup", "webinar", "other"],
      default: "other",
    },
    image_url: {
      type: String,
      default: "",
    },
    gallery: {
      type: [String],
      default: [],
    },
    recap: {
      type: String,
      default: "",
      trim: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creator_name: {
      type: String,
      required: true,
    },
    creator_email: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewed_by: {
      type: String, // admin username
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
    rejection_reason: {
      type: String,
      default: null,
    },
    max_participants: {
      type: Number,
      default: null,
    },
    registration_link: {
      type: String,
      default: "",
    },
    contact_info: {
      phone: {
        type: String,
        default: "",
      },
      email: {
        type: String,
        default: "",
      },
      website: {
        type: String,
        default: "",
      },
    },
    likes: {
      type: Number,
      default: 0,
    },
    liked_by: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
EventSchema.index({ status: 1, event_date: -1 });
EventSchema.index({ created_by: 1 });
EventSchema.index({ is_active: 1, status: 1 });
EventSchema.index({ likes: -1 }); // For sorting by most liked

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;