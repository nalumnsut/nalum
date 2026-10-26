const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const sessionSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			validate: {
				validator: (v) => /^\S+@\S+\.\S+$/.test(v),
				message: "Invalid email format",
			},
		},
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		refresh_token: {
			type: String,
			default: uuidv4,
			required: true,
			unique: true,
		},
		refresh_token_expires_at: {
			type: Date,
			required: true,
			default: () => new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000), // 10 years
			expires: 0, // auto-delete when expired
		},
		previous_refresh_token: {
			type: String,
		},
		consumed_at: {
			type: Date,
		},
		// Mobile app sessions are one per device; web sessions (and existing
		// documents without this field) keep the one-per-email behaviour.
		client_type: {
			type: String,
			enum: ["web", "mobile"],
		},
		device_id: {
			type: String,
		},
		device_name: {
			type: String,
		},
		platform: {
			type: String,
		},
		app_version: {
			type: String,
		},
		last_used_at: {
			type: Date,
		},
	},
	{ timestamps: true }
);

sessionSchema.index({ email: 1, client_type: 1 });
sessionSchema.index({ user_id: 1, client_type: 1, device_id: 1 });

module.exports = mongoose.model("Session", sessionSchema);