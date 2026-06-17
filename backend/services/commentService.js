const Comment = require("../models/posts/comment.model");
const Post = require("../models/posts/post.model");
const User = require("../models/user/user.model");
const notificationService = require("./notificationService");
const { extractMentionNames } = require("./mentionHelper");

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getPostForComments(postId) {
  const post = await Post.findById(postId).populate("userId", "name role").lean();

  if (!post) {
    throw createHttpError("Post not found", 404);
  }

  if (post.status !== "approved") {
    throw createHttpError("Comments are available only on approved posts", 403);
  }

  return post;
}

async function resolveMentionTargets(content, senderId) {
  const mentionNames = extractMentionNames(content);

  if (!mentionNames.length) {
    return [];
  }

  const mentionedUsers = await User.find({
    name: { $in: mentionNames.map((name) => new RegExp(`^${escapeRegex(name)}$`, "i")) },
    _id: { $ne: senderId },
    role: { $in: ["alumni", "student"] },
  }).select("_id name");

  return mentionedUsers.map((user) => ({
    userId: user._id,
    name: user.name,
  }));
}

async function createComment({ postId, authorId, content, parentCommentId = null }) {
  const normalizedContent = (content || "").trim();

  if (!normalizedContent) {
    throw createHttpError("Comment content is required", 400);
  }

  const [post, author] = await Promise.all([
    getPostForComments(postId),
    User.findById(authorId).select("name role").lean(),
  ]);

  if (!author) {
    throw createHttpError("Author not found", 404);
  }

  let parentComment = null;
  let rootCommentId = null;

  if (parentCommentId) {
    parentComment = await Comment.findOne({
      _id: parentCommentId,
      postId,
      status: { $ne: "deleted" },
    }).select("_id authorId parentCommentId rootCommentId status");

    if (!parentComment) {
      throw createHttpError("Parent comment not found", 404);
    }

    if (parentComment.parentCommentId) {
      throw createHttpError("Replies are limited to one level", 400);
    }

    rootCommentId = parentComment.rootCommentId || parentComment._id;
  }

  const mentions = await resolveMentionTargets(normalizedContent, authorId);

  const createdComment = await Comment.create({
    postId,
    authorId,
    content: normalizedContent,
    parentCommentId: parentComment ? parentComment._id : null,
    rootCommentId: null,
    mentions,
    status: "active",
  });

  if (rootCommentId) {
    createdComment.rootCommentId = rootCommentId;
  } else {
    createdComment.rootCommentId = createdComment._id;
  }

  await createdComment.save();

  if (rootCommentId) {
    await Comment.findByIdAndUpdate(rootCommentId, {
      $inc: { replyCount: 1 },
    });
  }

  const populatedComment = await Comment.findById(createdComment._id)
    .populate("authorId", "name role")
    .lean();

  await sendCommentNotifications({
    comment: populatedComment,
    post,
    author,
    parentComment,
    mentions,
  });

  return populatedComment;
}

async function sendCommentNotifications({ comment, post, author, parentComment, mentions }) {
  const recipients = new Map();

  if (post.userId?._id && post.userId._id.toString() !== author._id.toString()) {
    recipients.set(post.userId._id.toString(), {
      userId: post.userId._id,
      type: "post_comment",
      title: parentComment ? `New reply on your post` : `New comment on your post`,
      message: parentComment
        ? `${author.name} replied on "${post.title}"`
        : `${author.name} commented on "${post.title}"`,
    });
  }

  if (parentComment && parentComment.authorId && parentComment.authorId.toString() !== author._id.toString()) {
    recipients.set(parentComment.authorId.toString(), {
      userId: parentComment.authorId,
      type: "comment_reply",
      title: `New reply to your comment`,
      message: `${author.name} replied to your comment on "${post.title}"`,
    });
  }

  mentions.forEach((mention) => {
    const key = mention.userId.toString();
    if (key === author._id.toString()) {
      return;
    }

    recipients.set(key, {
      userId: mention.userId,
      type: "comment_mention",
      title: `You were mentioned in a comment`,
      message: `${author.name} mentioned you in a comment on "${post.title}"`,
    });
  });

  await Promise.all(
    [...recipients.values()].map((recipient) =>
      notificationService.createNotification({
        recipientId: recipient.userId,
        senderId: author._id,
        type: recipient.type,
        title: recipient.title,
        message: recipient.message,
        actionUrl: `/dashboard/posts/${post._id}`,
        relatedEntity: {
          entityType: "post",
          entityId: post._id.toString(),
        },
        priority: "medium",
        metadata: {
          postId: post._id.toString(),
          commentId: comment._id.toString(),
          parentCommentId: comment.parentCommentId ? comment.parentCommentId.toString() : null,
          authorName: author.name,
        },
      })
    )
  );
}

async function getPostCommentThread({ postId, page = 1, limit = 20 }) {
  await getPostForComments(postId);

  const skip = (page - 1) * limit;

  const topLevelComments = await Comment.find({
    postId,
    parentCommentId: null,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("authorId", "name role")
    .lean();

  const totalRootComments = await Comment.countDocuments({
    postId,
    parentCommentId: null,
  });

  const topLevelIds = topLevelComments.map((comment) => comment._id);

  const threadComments = topLevelIds.length
    ? await Comment.find({
        postId,
        rootCommentId: { $in: topLevelIds },
      })
        .sort({ createdAt: 1 })
        .populate("authorId", "name role")
        .lean()
    : [];

  return {
    comments: buildCommentTree(topLevelComments, threadComments),
    pagination: {
      current: page,
      pages: Math.max(1, Math.ceil(totalRootComments / limit)),
      total: totalRootComments,
    },
  };
}

function buildCommentTree(topLevelComments, threadComments) {
  const nodes = new Map();
  const topLevelIds = new Set(topLevelComments.map((comment) => comment._id.toString()));

  topLevelComments.forEach((comment) => {
    nodes.set(comment._id.toString(), normalizeComment(comment));
  });

  const orderedComments = [...threadComments];

  orderedComments.forEach((comment) => {
    nodes.set(comment._id.toString(), normalizeComment(comment));
  });

  orderedComments.forEach((comment) => {
    const node = nodes.get(comment._id.toString());
    const parentId = comment.parentCommentId ? comment.parentCommentId.toString() : null;

    if (parentId && nodes.has(parentId) && topLevelIds.has(parentId)) {
      nodes.get(parentId).replies.push(node);
      return;
    }
  });

  return topLevelComments.map((comment) => {
    const node = nodes.get(comment._id.toString());
    return node || normalizeComment(comment);
  });
}

function normalizeComment(comment) {
  const author = comment.authorId || {};
  return {
    ...comment,
    author: {
      _id: author._id || author.id || comment.authorId,
      name: author.name || "Unknown",
      role: author.role || null,
    },
    content: comment.status === "deleted" ? null : comment.content,
    isDeleted: comment.status === "deleted",
    replies: [],
  };
}

async function updateComment({ commentId, userId, content }) {
  const normalizedContent = (content || "").trim();

  if (!normalizedContent) {
    throw createHttpError("Comment content is required", 400);
  }

  const comment = await Comment.findById(commentId);

  if (!comment || comment.status === "deleted") {
    throw createHttpError("Comment not found", 404);
  }

  const user = await User.findById(userId).select("role").lean();
  const isAuthor = comment.authorId.toString() === userId.toString();
  const isAdmin = user?.role === "admin";

  if (!isAuthor && !isAdmin) {
    throw createHttpError("You are not authorized to edit this comment", 403);
  }

  const mentions = await resolveMentionTargets(normalizedContent, comment.authorId);

  comment.content = normalizedContent;
  comment.mentions = mentions;
  comment.editedAt = new Date();

  await comment.save();

  return Comment.findById(comment._id).populate("authorId", "name role").lean();
}

async function deleteComment({ commentId, userId }) {
  const comment = await Comment.findById(commentId);

  if (!comment || comment.status === "deleted") {
    throw createHttpError("Comment not found", 404);
  }

  const user = await User.findById(userId).select("role").lean();
  const isAuthor = comment.authorId.toString() === userId.toString();
  const isAdmin = user?.role === "admin";

  if (!isAuthor && !isAdmin) {
    throw createHttpError("You are not authorized to delete this comment", 403);
  }

  comment.status = "deleted";
  comment.deletedAt = new Date();

  await comment.save();

  return Comment.findById(comment._id).populate("authorId", "name role").lean();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  createHttpError,
  createComment,
  getPostCommentThread,
  updateComment,
  deleteComment,
};