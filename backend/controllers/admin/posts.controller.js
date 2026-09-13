const Post = require("../../models/posts/post.model");
const User = require("../../models/user/user.model");
const { logAdminActivity } = require("../../middleware/adminAuth");
const { notifyMentions } = require("../../services/mentionHelper");
const { cascadeDeletePost } = require("../../utils/cascadeDelete");
const { cleanupFiles } = require("../../utils/deleteHelper");
const {
  normalizeTags,
  normalizeImageList,
  normalizeVisibility,
} = require("../../utils/postHelpers");

// Get all posts (with filters)
exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const posts = await Post.find(query)
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching posts",
    });
  }
};

// Get pending posts
exports.getPendingPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({ status: "pending" })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ status: "pending" });

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching pending posts:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching pending posts",
    });
  }
};

// Approve post
exports.approvePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { notes } = req.body || {};

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending posts can be approved",
      });
    }

    // Update post status
    post.status = "approved";
    post.reviewed_by = req.admin.email;
    post.reviewed_at = new Date();
    await post.save();

    // Now that the post is live and viewable, notify any mentioned users
    const author = await User.findById(post.userId).select("name").lean();
    notifyMentions({
      text: post.content,
      senderId: post.userId.toString(),
      senderName: author?.name || "Someone",
      contextType: "post",
      contextTitle: post.title,
      actionUrl: `/dashboard/posts/${post._id}`,
      entityId: post._id.toString(),
    });

    // Log activity
    await logAdminActivity(
      req.admin.email,
      "approve_post",
      "post",
      postId,
      {
        post_title: post.title,
        created_by: post.userId,
        notes: notes || "",
      },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: "Post approved successfully",
      data: post,
    });
  } catch (error) {
    console.error("Error approving post:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while approving post",
    });
  }
};

// Reject post
exports.rejectPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending posts can be rejected",
      });
    }

    // Update post status
    post.status = "rejected";
    post.reviewed_by = req.admin.email;
    post.reviewed_at = new Date();
    post.rejection_reason = reason;
    await post.save();

    // Log activity
    await logAdminActivity(
      req.admin.email,
      "reject_post",
      "post",
      postId,
      {
        post_title: post.title,
        created_by: post.userId,
        reason,
      },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: "Post rejected successfully",
      data: post,
    });
  } catch (error) {
    console.error("Error rejecting post:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while rejecting post",
    });
  }
};

// Get post by ID
exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId).populate(
      "userId",
      "name email role"
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching post",
    });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    await cascadeDeletePost(post);
    await Post.findByIdAndDelete(postId);

    // Log activity
    await logAdminActivity(
      req.admin.email,
      "delete_post",
      "post",
      postId,
      {
        post_title: post.title,
      },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting post",
    });
  }
};

// Update post (admin can update any field)
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const { title, content, status } = req.body;

    // Update fields
    if (title) post.title = title;
    if (content) post.content = content;
    if (status) post.status = status;
    if (req.body.tags !== undefined) post.tags = normalizeTags(req.body.tags);
    if (req.body.visibility !== undefined) {
      post.visibility = normalizeVisibility(req.body.visibility);
    }

    // `existing_images` lists the already-uploaded files the editor still
    // shows. Anything removed is deleted from disk; new uploads are appended.
    // Omitting the field keeps the legacy behaviour: uploads replace everything.
    const newImages = req.files ? req.files.map((file) => file.filename) : [];
    const keptImages =
      req.body.existing_images !== undefined
        ? normalizeImageList(req.body.existing_images).filter((filename) =>
            post.images.includes(filename)
          )
        : newImages.length > 0
          ? []
          : post.images;

    const removed = post.images.filter((filename) => !keptImages.includes(filename));
    if (removed.length > 0) {
      cleanupFiles(removed, "posts");
    }

    post.images = [...keptImages, ...newImages].slice(0, 2);

    await post.save();

    // Log activity
    await logAdminActivity(
      req.admin.email,
      "update_post",
      "post",
      postId,
      {
        post_title: post.title,
        changes: req.body,
      },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating post",
    });
  }
};
