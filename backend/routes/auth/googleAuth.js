const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const router = express.Router();

const User = require("../../models/user/user.model.js"); // To create new users
const users = require("../../controllers/user.controller.js"); // To find existing users
const sessions = require("../../controllers/session.controller.js"); // To generate tokens

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/", async (req, res) => {
  try {
    const { credential, role } = req.body; // This is the JWT token Google gives our frontend

    if (!credential) {
      return res.status(401).json({ error: true, message: "Google token not provided" });
    }

    // 1. VERIFY THE TOKEN WITH GOOGLE
    // This ensures no one is faking the token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    // 'sub' is Google's unique permanent ID for the user
    const { email, name, sub: googleId } = payload;

    // 2. CHECK IF USER ALREADY EXISTS
    let userResponse = await users.findOne(email);
    let user = userResponse.data;

    // 3. IF NEW USER, CREATE THEM
    if (!user) {
      if (!role) {
        return res.status(400).json({ error: true, message: "Please select your role before signing up." });
      }

      // Block admin signup - admins can only be created via scripts
      if (role === "admin") {
        return res.status(403).json({
          error: true,
          message: "Admin accounts cannot be created via signup. Contact system administrator."
        });
      }

      if ((role === "student" || role === "faculty") && !email.endsWith('@nsut.ac.in')) {
        return res.status(400).json({ error: true, message: "Students and Faculty must use an @nsut.ac.in email address." });
      }

      user = new User({
        name: name,
        email: email,
        googleId: googleId,
        authProvider: 'google',
        role: role,
        email_verified: true, // We trust Google, so it's already verified
        email_verified_at: new Date(),
      });

      await user.save();
    } else {
      // IF THEY EXISTED (Account Linking!)
      // Link their Google ID to their existing local account if it's missing
      if (!user.googleId) {
        await User.findByIdAndUpdate(user._id, { googleId: googleId });
      }
    }

    // Check if banned
    if (user.banned) {
      return res.status(403).json({ error: true, message: "Your account is banned." });
    }

    // 4. CREATE SESSION AND RESPOND (Exact same logic as your signIn.js)
    const sessionData = await sessions.getOrCreate(email, user._id);
    if (sessionData.error) return res.status(500).json(sessionData);

    const { refresh_token, ...rest } = sessionData.data;

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      path: "/",
      maxAge: 3650 * 24 * 60 * 60 * 1000 // 10 years stay logged in
    };

    res.cookie("refresh_token", refresh_token, cookieOptions);

    return res.status(200).json({
      error: false,
      data: {
        ...rest,
        access_token: sessionData.data.access_token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          email_verified: user.email_verified,
          profileCompleted: user.profileCompleted,
          verified_alumni: user.verified_alumni,
        },
      },
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({ error: true, message: "Authentication failed" });
  }
});

module.exports = router;
