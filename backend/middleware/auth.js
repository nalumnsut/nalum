const sessions = require("../controllers/session.controller.js");
const User = require("../models/user/user.model.js");

exports.protect = async (req, res, next) => {
  let token;

  // First, try to read from httpOnly cookie
  if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }
  // Fall back to Authorization header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      err: true,
      code: 401,
      message: "Not authorized to access this route",
    });
  }

  try {
    const decoded = await sessions.validateAccessToken(token);

    if (decoded.error) {
      return res.status(401).json({
        err: true,
        code: 401,
        message: "Not authorized to access this route",
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      err: true,
      code: 401,
      message: "Not authorized to access this route",
    });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const { user_id } = req.user;

    // Find the user in the database
    const user = await User.findById(user_id);

    // Check if user exists and has admin role
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    if (user.role === "admin") {
      // User is admin, proceed to next middleware/handler
      next();
    } else {
      // User is not admin
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }
  } catch (error) {
    console.error("Error in isAdmin middleware:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while checking admin privileges",
    });
  }
};
