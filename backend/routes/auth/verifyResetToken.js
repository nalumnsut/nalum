const express = require("express");
const router = express.Router();
const verificationToken = require("../../controllers/verificationToken.controller.js");

router.get("/", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: true, message: "Token is required" });
    }

    const result = await verificationToken.findByToken(token, "password_reset");

    if (result.error) {
      return res.status(400).json({ error: true, message: "This reset link is invalid or has expired." });
    }

    return res.json({ error: false, message: "Token is valid" });
  } catch (error) {
    console.error("[verifyResetToken] Error:", error?.message ?? error);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

module.exports = router;