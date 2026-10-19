const mongoose = require("mongoose");

const pageVisitSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true,
      trim: true,
    },
    is_authenticated: {
      type: Boolean,
      required: true,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    user_agent: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

pageVisitSchema.index({ is_authenticated: 1 });
pageVisitSchema.index({ createdAt: -1 });
pageVisitSchema.index({ path: 1 });

module.exports = mongoose.model("PageVisit", pageVisitSchema);
