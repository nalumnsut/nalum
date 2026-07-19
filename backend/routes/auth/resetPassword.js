const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const users = require("../../controllers/user.controller.js");
const verificationToken = require("../../controllers/verificationToken.controller.js");
const Session = require("../../models/auth/session.model.js");

router.post("/", async (req, res) => {
  try {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      return res.status(400).json({ error: true, message: "Email, token, and password are required" });
    }

    const sanitizedEmail = email.toLowerCase().trim();

    const result = await verificationToken.find(sanitizedEmail, token, "password_reset");
    if (result.error) {
      return res.status(400).json({ error: true, message: "This reset link is invalid or has expired." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: true, message: "Password must be at least 8 characters long" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userResponse = await users.update(sanitizedEmail, { password: hashedPassword });
    if (userResponse.error) {
      return res.status(500).json(userResponse);
    }

    await verificationToken.remove(sanitizedEmail, token, "password_reset");
    await Session.deleteMany({ email: sanitizedEmail });

    return res.json({ error: false, message: "Password reset successfully" });
  } catch (error) {
    console.error("[resetPassword] Error:", error.message);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

module.exports = router;