const express = require("express");
const router = express.Router();

const users = require("../../controllers/user.controller.js");
const verificationTokens = require("../../controllers/verificationToken.controller.js");

router.get("/", async (req, res) => {
  // 1. Validate presence of email and token in query
  if (!req.query.email || !req.query.token) {
    return res.status(400).json({
      error: true,
      code: 400,
      message: "Email and token are required",
    });
  }

  const { email, token } = req.query;

  // 2. Find the verification token
  let tokenResponse = await verificationTokens.find(email, token, "email_verification");

  // For debugging purposes
  console.log("Token Response:", tokenResponse);

  // 3. Handle token not found or expired
  if (tokenResponse.error) {
    // Use 404 for not found, 400 for expired for better semantics
    const statusCode = tokenResponse.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json(tokenResponse);
  }

  // 4. If token is valid, update the user to be verified
  let userResponse = await users.update(email, { email_verified: true });

  if (userResponse.error) {
    return res.status(500).json(userResponse);
  }

  // 5. Delete the token so it can't be reused
  await verificationTokens.remove(email, token, "email_verification");

  // 6. Return success response
  return res.status(200).json({
    error: false,
    message: "Email verified successfully",
  });
});

module.exports = router;
