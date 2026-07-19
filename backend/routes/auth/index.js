const express = require("express");
const router = express.Router();
const { rateLimiters } = require("../../middleware/rateLimiter");

const signIn = require("./signIn");
const signUp = require("./signUp");
const refresh = require("./refresh");
const revokeToken = require("./revokeToken");
const logout = require("./logout");
const forgetPassword = require("./forgetPassword");
const resetPassword = require("./resetPassword");
const sendVerificationLink = require("./sendVerificationLink");
const sendOTP = require("./sendOTP");
const verifyAccountUsingLink = require("./verifyAccountUsingLink");
const verifyAccountUsingOTP = require("./verifyAccountUsingOTP");

// Auth routes
router.use("/sign-in", rateLimiters.auth, signIn);
router.use("/sign-up", rateLimiters.auth, signUp);
router.use("/refresh", refresh);
router.use("/revoke-token", revokeToken);
router.use("/logout", logout);

// Email routes — "email" preset is stricter (3/15min) since each hit costs a real send
router.use("/forget-password", rateLimiters.email, forgetPassword);
router.use("/reset-password", resetPassword);
router.use("/send-verification-link", rateLimiters.email, sendVerificationLink);
router.use("/send-otp", rateLimiters.email, sendOTP);

// Verification routes — "auth" preset (5/15min) resists brute-forcing the 6-digit code
router.use("/verify-account-link", verifyAccountUsingLink);
router.use("/verify-account-otp", rateLimiters.auth, verifyAccountUsingOTP);

module.exports = router;