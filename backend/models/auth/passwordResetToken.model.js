const mongoose = require("mongoose");

const passwordResetTokenSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    token_hash: {
      type: String,
      required: true,
      unique: true,
    },
    expires_at: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 1000 * 60 * 5), // 5 minutes — matches JWT expiry
      expires: 0, // TTL index — Mongo auto-deletes once expired
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PasswordResetToken", passwordResetTokenSchema);