// Temporarily remove all rate limiting from auth routes

const express = require("express");
const router = express.Router();
// const { rateLimiters } = require("../../middleware/rateLimiter");

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
const changePassword = require("./changePassword");


// define routes without rate limiting

// Auth routes
router.use("/sign-in", signIn);
router.use("/sign-up", signUp);
router.use("/refresh", refresh);
router.use("/revoke-token", revokeToken);
router.use("/logout", logout);

// Email routes
router.use("/forget-password", forgetPassword);
router.use("/reset-password", resetPassword);
router.use("/send-verification-link", sendVerificationLink);
router.use("/send-otp", sendOTP);
router.use("/change-password", changePassword);

// Verification routes
router.use("/verify-account-link", verifyAccountUsingLink);
router.use("/verify-account-otp", verifyAccountUsingOTP);

module.exports = router;