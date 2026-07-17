const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { protect } = require("../../middleware/auth.js");
const User = require("../../models/user/user.model.js");

router.post("/", protect, async (req, res) => {
  try {
    const { user_id } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: true,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: true,
        message: "New password must be at least 8 characters long",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: true,
        message: "New password must be different from current password",
      });
    }


    const user = await User.findById(user_id);
    
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    const matched = await bcrypt.compare(currentPassword, user.password);
    if (!matched) {
      return res.status(401).json({
        error: true,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ error: false, message: "Password changed successfully" });
  } 
  catch (err) {
    console.error("[changePassword] Error:", err.message);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }

});

module.exports = router;