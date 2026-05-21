const sessions = require("../controllers/session.controller.js");
const User = require("../models/user/user.model.js");
const AdminActivity = require("../models/admin/adminActivity.model");

// Middleware to protect admin routes
exports.protectAdmin = async (req, res, next) => {
  try {
    console.log("[AdminAuth] protectAdmin middleware called");
    console.log("[AdminAuth] Request URL:", req.originalUrl);
    console.log("[AdminAuth] Request method:", req.method);
    
    let token;

    // First, try to read from httpOnly cookie
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
      console.log("[AdminAuth] Token found in access_token cookie");
    }
    // Fall back to Authorization header
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log("[AdminAuth] Token found in Authorization header");
    }

    if (!token) {
      console.log("[AdminAuth] No token found in request");
      return res.status(401).json({
        success: false,
        message: "Not authorized. Admin login required.",
      });
    }

    console.log("[AdminAuth] Validating token...");
    // Validate token using existing session system
    const decoded = await sessions.validateAccessToken(token);
    console.log("[AdminAuth] Token validation result:", decoded.error ? "Failed" : "Success");

    if (decoded.error) {
      console.log("[AdminAuth] Token validation error:", decoded.error);
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid. Please login again.",
      });
    }

    console.log("[AdminAuth] Finding user with ID:", decoded.user_id);
    // Find user and check if admin
    const user = await User.findById(decoded.user_id);
    if (!user) {
      console.log("[AdminAuth] User not found");
      return res.status(401).json({
        success: false,
        message: "Admin not found.",
      });
    }

    console.log("[AdminAuth] User found:", user.email, "Role:", user.role);
    if (user.role !== "admin") {
      console.log("[AdminAuth] User is not an admin");
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    console.log("[AdminAuth] Admin authentication successful");
    // Attach admin info to request
    req.admin = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Also attach to req.user for compatibility
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid token.",
    });
  }
};

// Log admin activity
exports.logAdminActivity = async (
  adminEmail,
  action,
  targetType = "system",
  targetId = null,
  details = {},
  ipAddress = null
) => {
  try {
    await AdminActivity.create({
      admin_username: adminEmail, // We'll use email instead of username
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: ipAddress,
    });
  } catch (error) {
    console.error("Error logging admin activity:", error);
  }
};
