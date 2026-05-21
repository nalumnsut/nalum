const User = require("../../models/user/user.model.js");
const bcrypt = require("bcrypt");
const sessions = require("../../controllers/session.controller.js");
const { logAdminActivity } = require("../../middleware/adminAuth");

// Admin login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find admin user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if admin is banned
    if (user.banned) {
      return res.status(403).json({
        success: false,
        message: "Your admin account has been suspended.",
      });
    }

    // Create session using existing session system
    const sessionData = await sessions.getOrCreate(email, user._id);

    if (sessionData.error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create session",
      });
    }

    // Log activity
    await logAdminActivity(
      email,
      "login",
      "system",
      null,
      { name: user.name, role: user.role },
      req.ip
    );

    // Extract refresh token and set it in cookie
    const { refresh_token, access_token, ...rest } = sessionData.data;
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    });

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    // Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        ...rest,
        access_token,
        admin: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during login",
    });
  }
};

// Admin logout
exports.logout = async (req, res) => {
  try {
    const { email } = req.admin;

    // You could implement session deletion here if needed
    // For now, just clear the refresh token cookie

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    // Log activity
    await logAdminActivity(email, "logout", "system", null, {}, req.ip);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during logout",
    });
  }
};

// Get current admin info
exports.getCurrentAdmin = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      admin: {
        id: req.admin.id,
        email: req.admin.email,
        name: req.admin.name,
        role: req.admin.role,
      },
    });
  } catch (error) {
    console.error("Get current admin error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred",
    });
  }
};
