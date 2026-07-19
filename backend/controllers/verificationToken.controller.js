const VerificationToken = require("../models/auth/verificationToken.model.js");
const crypto = require("crypto");

// Create or update verification token
exports.create = async (email,purpose = "email_verification",expiresInMs = 1000 * 60 * 60 * 24) => {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInMs); // 24 hours
    const doc = await VerificationToken.findOneAndUpdate(
      { email: email.toLowerCase(), purpose },
      { token: token, expires_at: expiresAt },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return { error: false, data: doc };
  } catch (err) {
    return {
      error: true,
      message:
        err.message || "Some error occurred while saving the verification token.",
    };
  }
};

// Find verification token
exports.find = async (email, token, purpose = "email_verification") => {
  try {
    const data = await VerificationToken.findOne({
      email: email.toLowerCase(),
      token: token,
      purpose
    });
    if (!data) {
      return { error: true, message: "Verification token not found" };
    }
    if (data.expires_at < new Date()) {
      return { error: true, message: "Verification token expired" };
    }
    return { error: false, data: data };
  } catch (err) {
    return {
      error: true,
      message: err.message || "Error while searching for verification token",
    };
  }
};

// Remove verification token
exports.remove = async (email, token, purpose = "email_verification") => {
  try {
    await VerificationToken.deleteOne({
      email: email.toLowerCase(),
      token: token,
      purpose
    });
    return { error: false, message: "Token deleted successfully" };
  } catch (err) {
    return {
      error: true,
      message: err.message || "Error while deleting verification token",
    };
  }
};