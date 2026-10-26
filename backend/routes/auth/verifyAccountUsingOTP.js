const express = require("express");
const router = express.Router();
const otpController = require("../../controllers/otp.controller.js");
const userController = require("../../controllers/user.controller.js");
const { startSession, deliverRefreshToken, isMobileClient } = require("../../utils/sessionResponse.js");

router.post("/", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: true, code: 400, message: "Email and OTP are required" });
  }

  const user = await userController.findOne(email);
  if (user.error) {
    return res.status(500).json({ error: true, code: 500, message: "Internal server error" });
  }
  if (!user.data) {
    return res.status(404).json({ error: true, code: 404, message: "User not found" });
  }
  const otpData = await otpController.find(email, otp);
  if (otpData.error) {
    return res.status(400).json({ error: true, code: 400, message: otpData.message || "Invalid OTP" });
  }

  // Mark user as verified with timestamp (also handles re-verification — resets the 180-day timer)
  const updateResponse = await userController.update(email, {
    email_verified: true,
    email_verified_at: new Date()
  });
  if (updateResponse.error) {
    return res.status(500).json({ error: true, code: 500, message: updateResponse.message || "Error verifying account" });
  }

  // Optionally, delete the OTP after successful verification
  await otpController.remove(email, otp);

  // Auto-login: create a session and return tokens so the user doesn't need to sign in manually
  const sessionData = await startSession(req, email, user.data._id);
  if (!sessionData || sessionData.error) {
    // Verification succeeded but auto-login failed (or mocked in tests)
    return res.status(200).json({ error: false, code: 200, message: "Account verified successfully" });
  }

  const { refresh_token, access_token, ...rest } = sessionData.data;

  const mobile = isMobileClient(req);

  // Set refresh token in httpOnly cookie (mobile app: in the body instead)
  const tokenFields = deliverRefreshToken(res, refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
  }, mobile);

  // Set access token in httpOnly cookie (mobile app uses the Bearer header)
  if (!mobile) {
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });
  }

  return res.status(200).json({
    error: false,
    code: 200,
    message: "Account verified successfully",
    data: {
      ...tokenFields,
      access_token,
      user: {
        id: user.data._id,
        name: user.data.name,
        email: user.data.email,
        role: user.data.role,
        email_verified: true,
        profileCompleted: user.data.profileCompleted,
        verified_alumni: user.data.verified_alumni,
      },
    },
  });
});

module.exports = router;
