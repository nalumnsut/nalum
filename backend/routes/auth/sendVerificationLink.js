const express = require("express");
const router = express.Router();
const verificationTokens = require("../../controllers/verificationToken.controller.js");
const mailer = require("../../mail/transporter.js");
const users = require("../../controllers/user.controller.js");


router.post("/" , async (req , res) => {
  try {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: true, message: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: true, message: "Invalid email format" });
    }

    // Sanitize email
    const sanitizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const userData = await users.findOne(sanitizedEmail);
    
    // Always return success to prevent email enumeration, but don't send email if user doesn't exist
    if (userData.error || !userData.data) {
      if (process.env.DEBUG_MAIL === "true") {
        console.log(`[DEBUG] User not found for email: ${sanitizedEmail} - Email not sent`);
      }
      return res.status(200).json({
        error: false,
        message: "Verification link sent to email."
      });
    }

    // ? Create verification token
  const tokenResponse = await verificationTokens.create(sanitizedEmail);

  if (tokenResponse.error) {
    return res.status(500).json(tokenResponse);
  }

  const frontendUrl = process.env.FRONTEND_URL || "https://alumni.nsut.ac.in";
  const verificationLink = `${frontendUrl}/verify-account?email=${encodeURIComponent(sanitizedEmail)}&token=${tokenResponse.data.token}`;

  // Log verification link for testing (always log when DEBUG_MAIL is enabled)
  const shouldLogLink = process.env.NODE_ENV === "development" || process.env.DEBUG_MAIL === "true";
  if (shouldLogLink) {
    console.log("\n========== VERIFICATION LINK ==========");
    console.log(`Email: ${sanitizedEmail}`);
    console.log(`Token: ${tokenResponse.data.token}`);
    console.log(`Link: ${verificationLink}`);
    console.log(`Expires: ${new Date(tokenResponse.data.expires_at).toLocaleString()}`);
    console.log("========================================\n");
  }

  // Skip sending email in debug mode to save email quota
  if (shouldLogLink) {
    console.log(`[DEBUG] Email sending SKIPPED for ${sanitizedEmail} (DEBUG_MAIL=true)`);;
    return res.status(200).json({
      error: false,
      message: "Verification link sent to email."
    });
  }

  const mailResponse = await mailer.sendMail(
    sanitizedEmail,
    "Verify Your Account - NSUT AlumniNet",
    `Click the following link to verify your account: ${verificationLink}`,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Account</h2>
        <p>Thank you for registering with NSUT AlumniNet. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Account</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationLink}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
      </div>
    `
  );

  return res
    .status(mailResponse.error ? 500 : 200)
    .json(
      mailResponse.error
        ? mailResponse
        : { error: false, message: "Verification link sent to email." }
    );
  } catch (error) {
    console.error("[sendVerificationLink] Error:", error.message);
    // Don't expose internal errors to client
    return res.status(500).json({
      error: true,
      message: "An error occurred while processing your request. Please try again."
    });
  }
});

module.exports = router;