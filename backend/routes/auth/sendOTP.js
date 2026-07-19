const express = require("express");
const router = express.Router();
const otpController = require("../../controllers/otp.controller.js");
const mailer = require("../../mail/transporter.js");
const user = require("../../controllers/user.controller.js");
router.post("/", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: true,
      code: 400,
      message: "Email is required",
    });
  }

  // Make sure this email actually belongs to a registered account before
  // generating a code and sending an email for it.
  const existingUser = await user.findOne(email);
  if (existingUser.error) {
    return res.status(500).json({
      error: true,
      code: 500,
      message: "Internal server error",
    });
  }
  if (!existingUser.data) {
    return res.status(404).json({
      error: true,
      code: 404,
      message: "No account found for this email",
    });
  }

  const otpData = await otpController.create(email);
  if (otpData.error) {
    return res.status(500).json({
      error: true,
      code: 500,
      message: otpData.message || "Internal server error",
    });
  }
  if (process.env.NODE_ENV === 'development') {
    console.log(`OTP for ${email}: ${otpData.data.otp}`);
    return res.status(200).json({
      error: false,
      message: 'OTP sent successfully (logged to console in development)',
      code: 200,
    });
  }
  return mailer
    .sendMail(
      email,
      "Your Alumni Portal Access Code",
      `
Welcome back to Alumni Connect!

Your verification code is: ${otpData.data.otp}

This code will expire in 5 minutes for your security.

If you didn't request this code, please ignore this email.

Best regards,
Alumni Relations Team
    `.trim(),
      `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
    <div style="border-bottom: 2px solid #1a5276; padding-bottom: 10px;">
        <h2 style="color: #1a5276; margin: 0;">Alumni Connect Portal</h2>
    </div>
    
    <div style="padding: 20px 0;">
        <p>Hello Alumni,</p>
        
        <p>We received a request to access your alumni account. Use the verification code below:</p>
        
        <div style="background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; text-align: center; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0; color: #1a5276; font-size: 24px; letter-spacing: 2px;">
                ${otpData.data.otp}
            </h3>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            <strong>This code expires in 5 minutes</strong> for your security.
        </p>
        
        <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
            If you didn't request this code, please disregard this email.<br>
            For assistance, contact alumni-support@nsut.ac.in
        </p>
    </div>
    
    <div style="border-top: 1px solid #eee; padding-top: 15px; color: #999; font-size: 12px;">
        <p>Best regards,<br>Alumni Relations Team<br>NSUT</p>
    </div>
</div>
    `
    )
    .then((mailResponse) => {
      if (mailResponse.error) {
        return res.status(500).json({
          error: true,
          code: 500,
          message:
            "We encountered an issue sending your verification email. Please try again.",
        });
      }
      return res.status(200).json({
        error: false,
        message: "Verification code sent successfully to your registered email",
        code: 200,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: true,
        code: 500,
        message: "Unable to send verification email. Please try again later.",
      });
    });
});

module.exports = router;