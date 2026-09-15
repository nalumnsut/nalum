const Post = require("../models/posts/post.model");
const Comment = require("../models/posts/comment.model");
const User = require("../models/user/user.model");
const Profile = require("../models/user/profile.model");
const Settings = require("../models/admin/settings.model");
const { notifyMentions, extractSpecialMentionGroups } = require("../services/mentionHelper");
const { queueAdminPostBroadcast } = require("../queues/emailQueue");
const notificationService = require("../services/notificationService");
const { assertDeletePermission } = require("../utils/deleteHelper");
const { cascadeDeletePost } = require("../utils/cascadeDelete");
const {
  normalizeTags,
  normalizeImageList,
  normalizeVisibility,
  visibilityFilter,
  isVisibleTo,
} = require("../utils/postHelpers");

const PIN_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Decorates lean post documents with the author's public profile fields and a
// live comment count — both are needed by every list the dashboard renders,
// and doing it in bulk avoids the per-post query this used to run.
async function attachPostMeta(posts) {
  if (!posts.length) return posts;

  const authorIds = posts.map((post) => post.userId?._id).filter(Boolean);
  const postIds = posts.map((post) => post._id);

  const [profiles, commentCounts] = await Promise.all([
    Profile.find({ user: { $in: authorIds } })
      .select("user profile_picture batch current_role current_company")
      .lean(),
    Comment.aggregate([
      { $match: { postId: { $in: postIds }, status: "active" } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]),
  ]);
 
  const profileByUser = new Map(
    profiles.map((profile) => [profile.user.toString(), profile])
  );
  const countByPost = new Map(
    commentCounts.map((entry) => [entry._id.toString(), entry.count])
  );

  for (const post of posts) {
    const profile = post.userId?._id
      ? profileByUser.get(post.userId._id.toString())
      : null;

    if (post.userId) {
      post.userId.profile_picture = profile?.profile_picture || null;
      post.userId.batch = profile?.batch || null;
      post.userId.current_role = profile?.current_role || null;
      post.userId.current_company = profile?.current_company || null;
    }

    post.commentCount = countByPost.get(post._id.toString()) || 0;
  }

  return posts;
}

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

    // Allow admins, verified alumni, and faculty to create posts
    if (user.role === "admin") {
      // Admins can always create posts - continue to post creation
    } else if (!["alumni", "faculty"].includes(user.role) || (user.role === "alumni" && !user.verified_alumni)) {
      return res.status(403).json({
        success: false,
        message: "Only verified alumni and faculty can create posts",
      });
    }

    const { title, content } = req.body;
    const tags = normalizeTags(req.body.tags);
    const images = req.files ? req.files.map((file) => file.filename) : [];
    // Admin posts are always auto-approved
    const autoApprove = user.role === "admin" ? true : await shouldAutoApprove();
    const pinnedUntil =
      user.role === "admin" ? new Date(Date.now() + PIN_DURATION_MS) : null;
    let visibility = normalizeVisibility(req.body.visibility);
    if (visibility === "students" && user.role !== "admin") visibility = "everyone";

    const post = await Post.create({
      title,
      content,
      tags,
      images,
      userId: user_id,
      status: autoApprove ? "approved" : "pending",
      pinned_until: pinnedUntil,
      visibility,
    });

    // Only notify mentions immediately when the post is already approved.
    // For pending posts, notifications are sent when an admin approves.
    if (autoApprove) {
      notifyMentions({
        text: content,
        senderId: user_id,
        senderName: user.name,
        contextType: "post",
        contextTitle: title,
        actionUrl: `/dashboard/posts/${post._id}`,
        entityId: post._id.toString(),
      });

      // If post is created by an admin and auto-approved, queue email broadcast
      if (user.role === "admin") {
        try {
          const recipientGroups = extractSpecialMentionGroups(content);
          if (recipientGroups.length) await queueAdminPostBroadcast(post, user, recipientGroups);
          console.log(`[Post Create] Queued email broadcast for admin post ${post._id}`);
        } catch (error) {
          console.error(`[Post Create] Failed to queue email broadcast:`, error);
          // Don't fail the request if email queueing fails
        }
      }
    }

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

    const filter = { status: "approved", ...visibilityFilter(req.user.role) };
    if (req.query.tag) {
      filter.tags = new RegExp(`^${escapeRegex(req.query.tag)}$`, "i");
    }

    const now = new Date();
    const posts = await Post.aggregate([
      { $match: filter },
      {
        $addFields: {
          isPinned: {
            $and: [
              { $ne: ["$pinned_until", null] },
              { $gt: ["$pinned_until", now] },
            ],
          },
        },
      },
      { $sort: { isPinned: -1, pinned_until: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: User.collection.name,
          localField: "userId",
          foreignField: "_id",
          as: "userId",
        },
      },
      { $unwind: "$userId" },
      {
        $project: {
          title: 1,
          content: 1,
          tags: 1,
          images: 1,
          status: 1,
          rejection_reason: 1,
          report_count: 1,
          view_count: 1,
          likes: 1,
          pinned_until: 1,
          visibility: 1,
          createdAt: 1,
          updatedAt: 1,
          "userId._id": 1,
          "userId.name": 1,
          "userId.email": 1,
          "userId.role": 1,
        },
      },
    ]);

    await attachPostMeta(posts);

    const total = await Post.countDocuments(filter);

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

    // Find posts matching title, tag, or userId in the found users
    const posts = await Post.find({
      status: "approved",
      $and: [
        visibilityFilter(req.user.role),
        {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { tags: { $regex: query, $options: "i" } },
            { userId: { $in: userIds } },
          ],
        },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name email role")
      .lean();

    await attachPostMeta(posts);

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

    // Check if user is post owner, admin, or if post is approved and visible to their role
    const { user_id } = req.user;
    const isOwner = post.userId._id.toString() === user_id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      if (post.status !== "approved" || !isVisibleTo(post, req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Post not found",
        });
      }
    }

    // The detail page renders an "About the author" card, so it needs more of
    // the author's profile than the list endpoints do.
    const profile = await Profile.findOne({ user: post.userId._id })
      .select("profile_picture batch branch current_role current_company bio")
      .lean();

    post.userId.profile_picture = profile?.profile_picture || null;
    post.userId.batch = profile?.batch || null;
    post.userId.branch = profile?.branch || null;
    post.userId.current_role = profile?.current_role || null;
    post.userId.current_company = profile?.current_company || null;
    post.userId.bio = profile?.bio || null;

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
    // Absent means "leave alone"; an empty list means "clear the tags".
    if (req.body.tags !== undefined) post.tags = normalizeTags(req.body.tags);
    if (req.body.visibility !== undefined) {
      const nextVisibility = normalizeVisibility(req.body.visibility);
      post.visibility =
        nextVisibility === "students" && req.user.role !== "admin"
          ? "everyone"
          : nextVisibility;
    }
    // `existing_images` lists the already-uploaded files the editor still shows.
    // Anything the author removed is deleted from disk; new uploads are appended.
    // Omitting the field keeps the legacy behaviour: uploads replace everything.
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
      const fs = require("fs");
      const path = require("path");
      removed.forEach((filename) => {
        const filePath = path.join(__dirname, "../uploads/posts", filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    post.images = [...keptImages, ...newImages].slice(0, 2);

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

    // Only notify mentions immediately for auto-approved edits.
    // Pending posts will trigger notifications on admin approval.
    if (post.status === "approved") {
      const author = await User.findById(user_id).select("name").lean();
      notifyMentions({
        text: post.content,
        senderId: user_id,
        senderName: author?.name || "Someone",
        contextType: "post",
        contextTitle: post.title,
        actionUrl: `/dashboard/posts/${post._id}`,
        entityId: post._id.toString(),
      });
    }

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

    assertDeletePermission({
      ownerId: post.userId,
      requestUserId: user_id,
      userRole: req.user.role,
    });

    await cascadeDeletePost(post);
    await Post.findByIdAndDelete(post._id);

    return res.status(200).json({
      success: true,
      data: {},
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
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

    await attachPostMeta(posts);

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

exports.recordView = async (req, res) => {
  try {
    const { id } = req.params;
    const { session_id } = req.user;

    const updated = await Post.findOneAndUpdate(
      { _id: id, viewed_by: { $ne: session_id } },
      { $inc: { view_count: 1 }, $addToSet: { viewed_by: session_id } },
      { new: true }
    ).select("view_count");

    if (!updated) {
      // Either the post doesn't exist, or this user already viewed it —
      // fetch the current count either way so the response shape stays consistent.
      const existing = await Post.findById(id).select("view_count");
      if (!existing) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      return res.json({ success: true, view_count: existing.view_count });
    }

    return res.json({ success: true, view_count: updated.view_count });
  } catch (error) {
    console.error("Error recording post view:", error);
    return res.status(500).json({ success: false, message: "Error recording view" });
  }
};

exports.getPopularTags = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);

    const tags = await Post.aggregate([
      { $match: { status: "approved", tags: { $ne: [] } } },
      { $unwind: "$tags" },
      { $group: { _id: { $toLower: "$tags" }, count: { $sum: 1 }, label: { $first: "$tags" } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: limit },
    ]);

    return res.status(200).json({
      success: true,
      data: tags.map((tag) => ({ tag: tag.label, count: tag.count })),
      message: "Tags fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching tags",
    });
  }
};

exports.recordViewsBatch = async (req, res) => {
  try {
    const { postIds } = req.body;
    const { session_id } = req.user;

    if (Array.isArray(postIds) && postIds.length > 0) {
      await Post.updateMany(
        { _id: { $in: postIds }, viewed_by: { $ne: session_id } },
        { $inc: { view_count: 1 }, $addToSet: { viewed_by: session_id } }
      );
    }
    return res.status(200).json({
      success: true,
      count: postIds?.length || 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error recording views",
    });
  }
};

// "Similar posts" on the detail page: same tags first, topped up with recent
// approved posts so the card is never empty on an untagged post.
exports.getSimilarPosts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 3, 10);
    const post = await Post.findById(req.params.id).select("tags").lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const exclude = [post._id];
    let similar = [];

    if (post.tags?.length) {
      similar = await Post.find({
        _id: { $nin: exclude },
        status: "approved",
        tags: { $in: post.tags.map((tag) => new RegExp(`^${escapeRegex(tag)}$`, "i")) },
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("userId", "name email role")
        .lean();
    }

    if (similar.length < limit) {
      const fill = await Post.find({
        _id: { $nin: [...exclude, ...similar.map((item) => item._id)] },
        status: "approved",
      })
        .sort({ createdAt: -1 })
        .limit(limit - similar.length)
        .populate("userId", "name email role")
        .lean();

      similar = [...similar, ...fill];
    }

    await attachPostMeta(similar);

    return res.status(200).json({
      success: true,
      data: similar,
      message: "Similar posts fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching similar posts",
    });
  }
};

exports.toggleLikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.user_id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const alreadyLiked = post.likes.some(id => id.toString() === userId.toString());

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);

      // Notify the post author if someone else liked their post
      if (post.userId.toString() !== userId.toString()) {
        const liker = await User.findById(userId).select("name");
        notificationService.createNotification({
          type: "post_like",
          recipientId: post.userId,
          senderId: userId,
          title: "New Like on your Post",
          message: `${liker ? liker.name : "Someone"} liked your post.`,
          actionUrl: `/dashboard/posts/${post._id}`,
          relatedEntity: { entityType: "post", entityId: post._id },
        }).catch(err => console.error("Error creating post like notification:", err));
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likes: post.likes,
      message: !alreadyLiked ? "Post liked successfully" : "Post unliked successfully",
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle like",
    });
  }
};
