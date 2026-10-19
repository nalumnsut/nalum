const express = require("express");
const router = express.Router();
const postsController = require("../../controllers/admin/posts.controller");
const { protectAdmin } = require("../../middleware/adminAuth");
const uploadPostImage = require("../../config/postImage.multer");
const { compressionPresets } = require("../../middleware/imageCompression");
const Settings = require("../../models/admin/settings.model");

// All routes are protected (admin only)
router.get("/all", protectAdmin, postsController.getAllPosts);
router.get("/pending", protectAdmin, postsController.getPendingPosts);
router.get("/:postId", protectAdmin, postsController.getPostById);
router.put("/:postId/approve", protectAdmin, postsController.approvePost);
router.put("/:postId/reject", protectAdmin, postsController.rejectPost);
router.put(
  "/:postId",
  protectAdmin,
  uploadPostImage.array("images", 2),
  compressionPresets.postImage,
  postsController.updatePost
);
router.delete("/:postId", protectAdmin, postsController.deletePost);

// Toggle post approval mode
router.post("/settings/toggle-approval", protectAdmin, async (req, res) => {
  try {
    const { mode } = req.body;

    await Settings.findOneAndUpdate(
      { key: "auto_post_approval" },
      {
        value: mode,
        description: "Controls post approval mode: 0=Manual, 1=Auto",
        updated_by: req.admin._id,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Post approval mode updated to ${
        mode === 1 ? "Auto" : "Manual"
      }`,
      data: { mode },
    });
  } catch (error) {
    console.error("Error toggling post approval mode:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle post approval mode",
    });
  }
});

// Get post approval status
router.get("/settings/approval-status", protectAdmin, async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "auto_post_approval" });

    res.status(200).json({
      success: true,
      data: {
        mode: setting ? setting.value : 0, // Default to 0 (Manual)
      },
    });
  } catch (error) {
    console.error("Error fetching approval status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch approval status",
    });
  }
});

module.exports = router;
