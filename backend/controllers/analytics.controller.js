const PageVisit = require("../models/pageVisit.model");
const sessions = require("./session.controller");

// Record page visit (handles both unauthenticated and authenticated users)
exports.trackVisit = async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ success: false, message: "Path is required" });
    }

    let isAuthenticated = false;
    let userId = null;

    // Check auth via cookie or Bearer token if present
    let token = req.cookies?.access_token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        const decoded = await sessions.validateAccessToken(token);
        if (decoded && !decoded.error && decoded.user_id) {
          isAuthenticated = true;
          userId = decoded.user_id;
        }
      } catch (err) {
        // Token invalid/expired -> treat as unauthenticated
      }
    }

    await PageVisit.create({
      path,
      is_authenticated: isAuthenticated,
      userId,
      ip: req.ip || req.headers["x-forwarded-for"] || null,
      user_agent: req.headers["user-agent"] || null,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error recording page visit:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
