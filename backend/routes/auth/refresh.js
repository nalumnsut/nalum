const express = require("express");
const router = express.Router();
const sessions = require("../../controllers/session.controller.js");
const User = require("../../models/user/user.model.js");
const { refreshCookieOptions } = require("../../utils/authCookies.js");

router.post("/", async (req, res) => {
  // get cookie
  const refresh_token = req.cookies.refresh_token;

  if (!refresh_token) {
    return res.status(401).json({
      err: true,
      code: 401,
      message: "No refresh token provided",
    });
  }

  const data = await sessions.updateAccessToken(refresh_token);
  if (data.error) {
    return res.status(401).json(data);
  }

  // Fetch user data
  const user = await User.findById(data.data.user_id);
  if (!user) {
    return res.status(401).json({
      err: true,
      code: 401,
      message: "User not found",
    });
  }

  // store refresh token in httpOnly cookie only and don't expose it in the response
  const { refresh_token: new_refresh_token, ...rest } = data.data;
  
  // Set refresh token in httpOnly cookie
  res.cookie("refresh_token", new_refresh_token, refreshCookieOptions());

  const access_token = data.data.access_token;

  return res.status(200).json({
    error: false,
    data: {
      ...rest,
      access_token,
      email: user.email,
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
});

module.exports = router;
