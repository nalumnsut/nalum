const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const users = require("../../controllers/user.controller.js");
const { validatePassword } = require("../../utils/passwordPolicy");
const verificationToken = require("../../controllers/verificationToken.controller.js");
const Session = require("../../models/auth/session.model.js");

router.post("/", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: true,
        message: "Token and password are required",
      });
    }

    const tokenResponse = await verificationToken.findByToken(token, "password_reset");

    if (tokenResponse.error) {
      return res.status(400).json({
        error: true,
        message: "Invalid or expired token.",
      });
    }

    const sanitizedEmail = tokenResponse.data.email;

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        error: true,
        message: passwordError,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResponse = await users.update(sanitizedEmail, {
      password: hashedPassword,
    });

    if (userResponse.error) {
      return res.status(500).json(userResponse);
    }

    const removeResponse = await verificationToken.remove(
      sanitizedEmail,
      token,
      "password_reset"
    );
    
    if (removeResponse.error) {
      console.error(
        "[resetPassword] Failed to delete token:",
        removeResponse.message
      );
    }

    await Session.deleteMany({ email: sanitizedEmail });

    return res.json({
      error: false,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("[resetPassword] Error:", error?.message ?? error);

    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

module.exports = router;