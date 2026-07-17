const axios = require("axios");
const { nanoid } = require("nanoid");
const VerificationCode = require("../models/verificationCode.model.js");
const User = require("../models/user/user.model.js");
const VerificationQueue = require("../models/verificationQueue.model.js");
const { sendEmail } = require("../mail/notificationMailer");

exports.getVerificationStatus = async (req, res) => {
  try {
    const { user_id } = req.user;
    
    // Find the user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    
    // Check queue for pending or rejected entry
    const queueEntry = await VerificationQueue.findOne({ user: user_id });

    // Return the verification status
    return res.status(200).json({
      success: true,
      verified_alumni: user.verified_alumni,
      pending_verification: queueEntry?.status === "pending",
      rejected_verification: queueEntry?.status === "rejected",
      rejection_reason: queueEntry?.rejection_reason || null,
    });
  } catch (error) {
    console.error("Error fetching verification status:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching verification status",
    });
  }
};

exports.verifyCode = async (req, res) => {
    try {
    let { code } = req.body;
    const { user_id } = req.user;

    // Check if code is provided
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required",
      });
    }

    // Trim whitespace from code
    code = code.trim();

    // Find the user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    
    // Only alumni can use verification codes
    if (user.role !== "alumni") {
      return res.status(403).json({
        success: false,
        message: "Verification codes are only for alumni users",
      });
    }
    
    // Check if email is verified first
    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address first before using a verification code",
      });
    }

    // Check if user is already verified
    if (user.verified_alumni) {
      return res.status(400).json({
        success: false,
        message: "User is already verified",
      });
    }

    // ==========================================
    // SPECIAL EVENT CODE: ALUMNI2025
    // Valid for Alumni Meet 2025 (December 27-31, 2025)
    // ==========================================
    const SPECIAL_CODE = "ALUMNI2025";
    const SPECIAL_CODE_EXPIRY = new Date("2025-12-31T23:59:59Z"); // Expires end of year (UTC)
    
    if (code.toUpperCase() === SPECIAL_CODE) {
      const now = new Date();
      
      if (now > SPECIAL_CODE_EXPIRY) {
        return res.status(400).json({
          success: false,
          message: "This special event code has expired",
        });
      }
      
      // Verify using special code - no database code needed
      user.verified_alumni = true;
      await user.save();
      
      // Log for audit trail
      console.log(`[ALUMNI2025] User ${user_id} verified using special event code at ${now.toISOString()}`);
      
      return res.status(200).json({
        success: true,
        message: "Alumni status verified successfully with Alumni Meet 2025 code!",
      });
    }
    // ==========================================

    // Find the verification code (normal flow)
    const verificationCode = await VerificationCode.findOne({
      code: code,
      is_used: false,
    });

    if (!verificationCode) {
      return res.status(404).json({
        success: false,
        message: "Verification code is invalid or has already been used",
      });
    }
    
    // Check if code is expired
    if (!verificationCode.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    // Mark the code as used
    verificationCode.is_used = true;
    verificationCode.used_by = user_id;
    verificationCode.used_at = new Date();
    await verificationCode.save();

    // Update user's alumni verification status
    user.verified_alumni = true;
    await user.save();

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Alumni status verified successfully",
    });
  } catch (error) {
    console.error("Error verifying alumni code:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while verifying the code",
    });
  }
};

exports.checkManualVerification = async (req, res) => {
  try {
    const { name, roll_no, batch, branch, contact_info } = req.body;
    const { user_id } = req.user;

    // Manual review goes directly to admin verification queue
    // No database checking - admin will manually verify
    
    // Clear any previous rejected entry before checking for pending
    await VerificationQueue.deleteOne({ user: user_id, status: "rejected" });

    // Check if user already has a pending request
    const existingRequest = await VerificationQueue.findOne({ user: user_id, status: "pending" });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending verification request",
      });
    }

    // Create verification queue entry
    await VerificationQueue.create({
      user: user_id,
      details_provided: {
        name,
        roll_no,
        batch,
        branch,
      },
      contact_info: contact_info || {},
    });
    
    console.log(`Added user ${user_id} to manual verification queue`);

    // Send acknowledgment email to user is disabled per request

    return res.status(200).json({
      success: true,
      message: "Verification request submitted to admin for review",
      matches: [], // No matches - goes directly to manual review
    });
  } catch (error) {
    console.error("Error submitting manual verification:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while submitting verification request",
    });
  }
};

exports.confirmManualMatch = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { roll_no } = req.body;

    // Check if roll_no is provided
    if (!roll_no) {
      return res.status(400).json({
        success: false,
        message: "Roll number of the selected match is required",
      });
    }

    // Find the user and update their verification status
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user's alumni verification status
    user.verified_alumni = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User successfully verified.",
    });
  } catch (error) {
    console.error("Error confirming manual match:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while confirming verification",
    });
  }
};

exports.getQueue = async (req, res) => {
  try {
    // Get all pending verification requests with user details
    const queue = await VerificationQueue.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      queue: queue,
    });
  } catch (error) {
    console.error("Error fetching verification queue:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the queue",
    });
  }
};

exports.approveFromQueue = async (req, res) => {
  try {
    const { userId } = req.params;

    // Update user's verification status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.verified_alumni = true;
    await user.save();

    // Remove from queue
    await VerificationQueue.deleteOne({ user: userId });

    // Send approval email
    if (user && user.email) {
      await sendEmail({
        to: user.email,
        subject: "Verification Approved",
        template: "notification",
        data: {
          title: "Verification Approved",
          name: user.name,
          message: "Congratulations! Your alumni verification request has been approved. You now have full access to the alumni network."
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "User verification approved successfully",
    });
  } catch (error) {
    console.error("Error approving verification:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while approving verification",
    });
  }
};

exports.denyFromQueue = async (req, res) => {
  try {
    const { userId } = req.params;

    // Remove from queue
    const result = await VerificationQueue.deleteOne({ user: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Verification request not found in queue",
      });
    }

    // Send rejection email
    const user = await User.findById(userId);
    if (user && user.email) {
      await sendEmail({
        to: user.email,
        subject: "Verification Request Rejected",
        template: "notification",
        data: {
          title: "Verification Request Rejected",
          name: user.name,
          message: "Unfortunately, your alumni verification request has been rejected as we couldn't verify the details provided. Please submit a new request with correct information."
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification request denied and removed from queue",
    });
  } catch (error) {
    console.error("Error denying verification:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while denying verification",
    });
  }
};
