const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const users = require("../../controllers/user.controller.js");
const { JWT_SECRET } = require("../../config/jwt.config.js");
const crypto = require("crypto");
const PasswordResetToken = require("../../models/auth/passwordResetToken.model.js");
const Session = require("../../models/auth/session.model.js");



const validatePassword = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return "Password must be at least 8 characters long";
  }
  if (!hasUppercase) {
    return "Password must contain at least one uppercase letter (A-Z)";
  }
  if (!hasLowercase) {
    return "Password must contain at least one lowercase letter (a-z)";
  }
  if (!hasDigit) {
    return "Password must contain at least one number (0-9)";
  }
  if (!hasSpecial) {
    return "Password must contain at least one special character";
  }
  return null;
};

router.post("/", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      error: true,
      message: "Token and password are required",
    });
  }

  // Verify and decode JWT
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ error: true, message: "Reset link has expired, request a new one." });
    }
    return res.status(400).json({ error: true, message: "Invalid or expired token" });
  }
  
  const { email } = decoded;
  // Strong password validation  
  const passwordError = validatePassword(password);
  if (passwordError) {

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const resetRecord = await PasswordResetToken.findOne({ email, token_hash: tokenHash });

  if (!resetRecord) {
    return res.status(400).json({
      error: true,
      message: "This reset link has already been used or is invalid.",
    });
  }

  // Basic password validation  
  if (password.length < 8) {
    return res.status(400).json({
      error: true,
      message: passwordError,
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update user password
  const userResponse = await users.update(email, { password: hashedPassword });
  if (userResponse.error) {
    return res.status(500).json(userResponse);
  }
  await PasswordResetToken.deleteOne({ _id: resetRecord._id });
  await Session.deleteMany({ email });

  return res.json({ error: false, message: "Password reset successfully" });
});

module.exports = router;
