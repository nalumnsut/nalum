const Post = require("../models/posts/post.model");
const User = require("../models/user/user.model");
const Settings = require("../models/admin/settings.model");

// Helper function to check if posts should be auto-approved
async function shouldAutoApprove() {
  try {
    const setting = await Settings.findOne({ key: "auto_post_approval" });
    // Return true if value is 1 (Auto), false otherwise (0 or not found = Manual)
    return setting?.value === 1;
  } catch (error) {
    console.error("Error checking auto approval setting:", error);
    return false; // Default to manual mode on error
  }
}

exports.createPost = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Allow admins and verified alumni to create posts
    if (user.role === "admin") {
      // Admins can always create posts - continue to post creation
    } else if (user.role !== "alumni" || !user.verified_alumni) {
      return res.status(403).json({
        success: false,
        message: "Only verified alumni can create posts",
      });
    }

    const { title, content } = req.body;
    const images = req.files ? req.files.map((file) => file.filename) : [];
    // Admin posts are always auto-approved
    const autoApprove = user.role === "admin" ? true : await shouldAutoApprove();

    const post = await Post.create({
      title,
      content,
      images,
      userId: user_id,
      status: autoApprove ? "approved" : "pending",
    });

    return res.status(201).json({
      success: true,
      data: post,
      message: "Post created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating post",
    });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email role")
      .lean();

    // Populate profile pictures
    const Profile = require("../models/user/profile.model");
    for (let post of posts) {
      const profile = await Profile.findOne({ user: post.userId._id }).select(
        "profile_picture"
      );
      post.userId.profile_picture = profile?.profile_picture || null;
    }

    const total = await Post.countDocuments({ status: "approved" });

    return res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
      message: "Posts fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching posts",
    });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Find users matching the name
    const users = await User.find({
      name: { $regex: query, $options: "i" },
    }).select("_id");

    const userIds = users.map((user) => user._id);

    // Find posts matching title OR userId in the found users
    const posts = await Post.find({
      status: "approved",
      $or: [
        { title: { $regex: query, $options: "i" } },
        { userId: { $in: userIds } },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name email role")
      .lean();

    // Populate profile pictures
    const Profile = require("../models/user/profile.model");
    for (let post of posts) {
      const profile = await Profile.findOne({ user: post.userId._id }).select(
        "profile_picture"
      );
      post.userId.profile_picture = profile?.profile_picture || null;
    }

    return res.status(200).json({
      success: true,
      data: posts,
      message: "Posts found successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error searching posts",
    });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("userId", "name email role")
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is post owner or if post is approved
    const { user_id } = req.user;
    const isOwner = post.userId._id.toString() === user_id.toString();
    if (!isOwner && post.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Post not found",
      });
    }

    // Populate profile picture
    const Profile = require("../models/user/profile.model");
    const profile = await Profile.findOne({ user: post.userId._id }).select(
      "profile_picture"
    );
    post.userId.profile_picture = profile?.profile_picture || null;

    return res.status(200).json({
      success: true,
      data: post,
      message: "Post fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching post",
    });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { user_id } = req.user;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.userId.toString() !== user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this post",
      });
    }

    const { title, content } = req.body;
    const newImages = req.files ? req.files.map((file) => file.filename) : [];

    if (title) post.title = title;
    if (content) post.content = content;
    if (newImages.length > 0) {
      // Delete old image files if they exist
      if (post.images && post.images.length > 0) {
        const fs = require('fs');
        const path = require('path');
        post.images.forEach((filename) => {
          const filePath = path.join(__dirname, "../uploads/posts", filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      post.images = newImages;
    }

    // Check if posts should be auto-approved
    const autoApprove = await shouldAutoApprove();

    // If post was rejected, reset based on approval mode and clear rejection reason for resubmission
    if (post.status === "rejected") {
      post.status = autoApprove ? "approved" : "pending";
      post.rejection_reason = null;
    }

    // If post was approved, reset based on approval mode for re-approval
    if (post.status === "approved") {
      post.status = autoApprove ? "approved" : "pending";
    }

    await post.save();

    return res.status(200).json({
      success: true,
      data: post,
      message: "Post updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating post",
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { user_id } = req.user;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.userId.toString() !== user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this post",
      });
    }

    // Delete associated image files
    if (post.images && post.images.length > 0) {
      const fs = require('fs');
      const path = require('path');
      post.images.forEach((filename) => {
        const filePath = path.join(__dirname, "../uploads/posts", filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      data: {},
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error deleting post",
    });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const { user_id } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ userId: user_id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email role")
      .lean();

    // Populate profile pictures
    const Profile = require("../models/user/profile.model");
    for (let post of posts) {
      const profile = await Profile.findOne({ user: post.userId._id }).select(
        "profile_picture"
      );
      post.userId.profile_picture = profile?.profile_picture || null;
    }

    const total = await Post.countDocuments({ userId: user_id });

    return res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
      message: "Posts fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching posts",
    });
  }
};
