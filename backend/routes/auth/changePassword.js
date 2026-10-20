const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { protect } = require("../../middleware/auth.js");
const User = require("../../models/user/user.model.js");
const { validatePassword } = require("../../utils/passwordPolicy");

router.post("/", protect, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        error: true,
        message: "New password is required",
      });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: true, message: passwordError });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    const hasPassword = !!user.password;

    if (hasPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: true, message: "Current password is required" });
      }

      const matched = await bcrypt.compare(currentPassword, user.password);
      if (!matched) {
        return res.status(401).json({
          error: true,
          message: "Current password is incorrect",
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          error: true,
          message: "New password must be different from current password",
        });
      }
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({
      error: false,
      message: hasPassword ? "Password changed successfully" : "Password set successfully",
    });
  } catch (err) {
    console.error("[changePassword] Error:", err.message);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

module.exports = router;