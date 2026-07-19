const express = require("express");
const router = express.Router();
const users = require("../../controllers/user.controller.js");
const mailer = require("../../mail/transporter.js");
const verificationToken = require("../../controllers/verificationToken.controller.js");

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: true, message: "Email is required" });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: true, message: "Invalid email format" });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const data = await users.findOne(sanitizedEmail);

    if (data.error || !data.data) {
      if (process.env.DEBUG_MAIL === "true") {
        console.log(`[DEBUG] User not found for email: ${sanitizedEmail} - Email not sent`);
      }
      return res.json({ error: false, message: "If this email exists, a reset link has been sent." });
    }

    // Plain random token, 5 min expiry, "password_reset" purpose — no JWT needed
    const { data: tokenDoc } = await verificationToken.create(sanitizedEmail, "password_reset", 1000 * 60 * 5);

    const frontendUrl = process.env.FRONTEND_URL || "https://alumni.nsut.ac.in";
    const verificationLink = `${frontendUrl}/reset-password?email=${sanitizedEmail}&token=${tokenDoc.token}`;

    const shouldLogLink = process.env.NODE_ENV === "development" || process.env.DEBUG_MAIL === "true";
    if (shouldLogLink) {
      console.log("\n========== PASSWORD RESET LINK ==========");
      console.log(`Email: ${sanitizedEmail}`);
      console.log(`Token: ${tokenDoc.token}`);
      console.log(`Link: ${verificationLink}`);
      console.log(`Expires: 5 minutes`);
      console.log("=========================================\n");
      console.log(`[DEBUG] Email sending SKIPPED for ${sanitizedEmail} (DEBUG_MAIL=true)`);
      return res.json({ error: false, message: "If this email exists, a reset link has been sent." });
    }

    await mailer.sendMail(
      sanitizedEmail,
      "Reset Your Password - NSUT AlumniNet",
      `Click to reset your password: ${verificationLink}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password for your NSUT AlumniNet account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #2196F3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 5 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `
    );

    return res.json({ error: false, message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    console.error("[forgetPassword] Error:", error.message);
    return res.json({ error: false, message: "If this email exists, a reset link has been sent." });
  }
});

module.exports = router;