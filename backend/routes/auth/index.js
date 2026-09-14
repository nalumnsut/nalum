// Temporarily remove all rate limiting from auth routes

const express = require("express");
const router = express.Router();
// const { rateLimiters } = require("../../middleware/rateLimiter");
const googleAuth = require("./googleAuth.js");

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
const verifyResetToken = require("./verifyResetToken");
const changePassword = require("./changePassword");
const deleteAccount = require("./deleteAccount");


// define routes without rate limiting

// Auth routes
router.use("/sign-in", signIn);
router.use("/sign-up", signUp);
router.use("/refresh", refresh);
router.use("/google", googleAuth);
router.use("/revoke-token", revokeToken);
router.use("/logout", logout);
router.use("/change-password", changePassword);
router.use("/account", deleteAccount);

// Email routes
router.use("/forget-password", forgetPassword);
router.use("/reset-password", resetPassword);
router.use("/send-verification-link", sendVerificationLink);
router.use("/send-otp", sendOTP);

// Verification routes
router.use("/verify-account-link", verifyAccountUsingLink);
router.use("/verify-account-otp", verifyAccountUsingOTP);
router.use("/verify-reset-token", verifyResetToken);

module.exports = router;