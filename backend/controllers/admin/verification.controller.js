const VerificationQueue = require("../../models/verificationQueue.model");
const User = require("../../models/user/user.model");
const { logAdminActivity } = require("../../middleware/adminAuth");
const mailService = require("../../mail/mailService");
const { invalidateAlumniMapCache } = require("../../config/cacheKeys");

// Get all pending verifications
exports.getVerificationQueue = async (req, res) => {
  try {
    console.log("[VerificationController] getVerificationQueue called");
    console.log("[VerificationController] Query params:", req.query);
    console.log("[VerificationController] Admin user:", req.user?.email);
    
    const { page = 1, limit = 10, status = "pending" } = req.query;

    const queue = await VerificationQueue.find({ status: "pending" })
      .populate("user", "name email role createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    console.log("[VerificationController] Found queue items:", queue.length);
    console.log("[VerificationController] Queue data:", JSON.stringify(queue, null, 2));

    const total = await VerificationQueue.countDocuments({ status: "pending" });
    console.log("[VerificationController] Total queue items:", total);

    res.status(200).json({
      success: true,
      data: queue,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[VerificationController] Error fetching verification queue:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching verification queue",
    });
  }
};

// Approve verification
exports.approveVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const notes = req.body?.notes || "";

    // Find the verification request
    const verificationRequest = await VerificationQueue.findOne({
      user: userId,
    });

    if (!verificationRequest) {
      return res.status(404).json({
        success: false,
        message: "Verification request not found",
      });
    }

    // Find and update the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user's alumni verification status
    user.verified_alumni = true;
    await user.save();

    // Newly verified alumni are eligible for the map — invalidate so they show
    // up without waiting for the 1h cache TTL.
    await invalidateAlumniMapCache();

    // Remove from queue
    await VerificationQueue.findByIdAndDelete(verificationRequest._id);

    // Log activity
    await logAdminActivity(
      req.admin.email,
      "approve_verification",
      "user",
      userId,
      {
        user_name: user.name,
        user_email: user.email,
        notes: notes,
      },
      req.ip
    );

    // Notify the alumnus that they've been verified
    const shouldSkipEmail = process.env.NODE_ENV === "development" || process.env.DEBUG_MAIL === "true";
    
    if (shouldSkipEmail) {
      console.log(`[DEBUG] Email sending SKIPPED for ${user.email} (DEBUG_MAIL=true)`);
      console.log(`[DEBUG] Subject: Your Alumni Account Has Been Verified`);
    } else {
      const emailResult = await mailService.send({
        to: user.email,
        subject: "Your Alumni Account Has Been Verified",
        template: "notification",
        data: {
          title: "Alumni Verification Approved",
          name: user.name,
          message:
            "Great news! Your alumni account has been verified by our team. You now have full access to the NSUT Alumni Network.",
          actionUrl: process.env.FRONTEND_URL || "",
        },
      });

      if (emailResult.error) {
        console.error("Failed to send verification approval email to:", user.email, emailResult.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Verification approved successfully",
    });
  } catch (error) {
    console.error("Error approving verification:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while approving verification",
    });
  }
};

// Reject verification
exports.rejectVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    // Find the verification request
    const verificationRequest = await VerificationQueue.findOne({
      user: userId,
    });

    if (!verificationRequest) {
      return res.status(404).json({
        success: false,
        message: "Verification request not found",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    verificationRequest.status = "rejected";
    verificationRequest.rejection_reason = reason;
    await verificationRequest.save();
    
    // Log activity
    await logAdminActivity(
      req.admin.email,
      "reject_verification",
      "user",
      userId,
      {
        user_name: user.name,
        user_email: user.email,
        reason,
      },
      req.ip
    );

    // Send email notification to user about rejection
    const shouldSkipEmail = process.env.NODE_ENV === "development" || process.env.DEBUG_MAIL === "true";
    
    if (shouldSkipEmail) {
      console.log(`[DEBUG] Email sending SKIPPED for ${user.email} (DEBUG_MAIL=true)`);
      console.log(`[DEBUG] Subject: Update on your Alumni Account Verification`);
    } else {
      const emailResult = await mailService.send({
        to: user.email,
        subject: "Update on your Alumni Account Verification",
        template: "notification",
        data: {
          title: "Alumni Verification Update",
          name: user.name,
          message: `Your alumni account verification was not approved at this time. Reason: ${reason}`,
          actionUrl: process.env.FRONTEND_URL || "",
        },
      });

      if (emailResult.error) {
        console.error("Failed to send verification rejection email to:", user.email, emailResult.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Verification rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting verification:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while rejecting verification",
    });
  }
};

// Get verification statistics
exports.getVerificationStats = async (req, res) => {
  try {
    const totalPending = await VerificationQueue.countDocuments({ status: "pending" });
    const totalVerified = await User.countDocuments({ verified_alumni: true });
    const totalUnverified = await User.countDocuments({
      role: "alumni",
      verified_alumni: false,
    });

    res.status(200).json({
      success: true,
      stats: {
        pending: totalPending,
        verified: totalVerified,
        unverified: totalUnverified,
      },
    });
  } catch (error) {
    console.error("Error fetching verification stats:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching statistics",
    });
  }
};

// Search alumni database (for admin use) via PostgreSQL
exports.searchAlumniDatabase = async (req, res) => {
  try {
    const { name, roll_no, batch, branch } = req.body;

    const { pool } = require("../../config/postgres.js");

    // Build dynamic query based on provided filters
    const whereParts = [];
    const values = [];

    if (roll_no && roll_no.trim() !== "") {
      whereParts.push(`roll_no = $${values.length + 1}`);
      values.push(roll_no.trim());
    } else {
      if (name && name.trim() !== "") {
        whereParts.push(`full_name ILIKE $${values.length + 1}`);
        values.push(`%${name.trim()}%`);
      }
      if (batch && batch.trim() !== "") {
        whereParts.push(`passing_year = $${values.length + 1}`);
        values.push(batch.trim());
      }
      if (branch && branch.trim() !== "") {
        whereParts.push(`branch = $${values.length + 1}`);
        values.push(branch.trim());
      }
    }

    if (whereParts.length === 0) {
      return res.status(200).json({ success: true, matches: [] });
    }

    const sql = `SELECT full_name as name, roll_no, passing_year as batch, branch FROM alumni ${
      whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : ""
    } LIMIT 50`;

    const result = await pool.query(sql, values);

    res.status(200).json({
      success: true,
      matches: result.rows || [],
    });
  } catch (error) {
    console.error("Error searching alumni database:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching the database",
    });
  }
};

// Get all alumni from database (for admin use)
exports.getAllAlumni = async (req, res) => {
  try {
    const { pool } = require("../../config/postgres.js");
    const { limit = 100, offset = 0 } = req.query;

    const sql = `SELECT full_name as name, roll_no, passing_year as batch, branch 
                 FROM alumni 
                 ORDER BY passing_year DESC, full_name ASC 
                 LIMIT $1 OFFSET $2`;

    const countSql = `SELECT COUNT(*) as total FROM alumni`;

    const [result, countResult] = await Promise.all([
      pool.query(sql, [parseInt(limit), parseInt(offset)]),
      pool.query(countSql),
    ]);

    res.status(200).json({
      success: true,
      matches: result.rows || [],
      total: parseInt(countResult.rows[0]?.total || 0),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Error fetching all alumni:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching alumni records",
    });
  }
};
