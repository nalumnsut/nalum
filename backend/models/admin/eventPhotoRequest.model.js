const mongoose = require("mongoose");
const { Schema } = mongoose;

// An alumni-submitted photo awaiting admin review before it appears in an
// event's public gallery. Approving moves the file into the public
// event-images folder and appends its URL to Event.gallery; rejecting
// deletes the pending file. Nothing here is ever shown publicly on its own.
const EventPhotoRequestSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    // Path to the file while it's pending, e.g.
    // "/uploads/event-photo-requests/<generated-filename>".
    pending_image_url: {
      type: String,
      required: true,
      match: /^\/uploads\/event-photo-requests\/photo-request-[0-9]+-[0-9]+\.(jpg|jpeg|png|gif|webp)$/,
    },
    submitted_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submitted_by_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    submitted_by_email: {
      type: String,
      required: true,
      trim: true,
      maxlength: 254,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewed_by: {
      type: String, // admin email
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
    rejection_reason: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

EventPhotoRequestSchema.index({ status: 1, createdAt: -1 });
EventPhotoRequestSchema.index({ event: 1, submitted_by: 1, status: 1 });

module.exports = mongoose.model("EventPhotoRequest", EventPhotoRequestSchema);
