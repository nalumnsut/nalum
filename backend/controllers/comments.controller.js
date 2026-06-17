const commentService = require("../services/commentService");

exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const data = await commentService.getPostCommentThread({
      postId,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data,
      message: "Comments fetched successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error fetching comments",
    });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId = null } = req.body;

    const comment = await commentService.createComment({
      postId,
      authorId: req.user.user_id,
      content,
      parentCommentId,
    });

    return res.status(201).json({
      success: true,
      data: comment,
      message: "Comment created successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error creating comment",
    });
  }
};

exports.createReply = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;

    const parentComment = await require("../models/posts/comment.model").findOne({
      _id: commentId,
      postId,
      status: { $ne: "deleted" },
    }).select("_id parentCommentId").lean();

    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: "Parent comment not found",
      });
    }

    if (parentComment.parentCommentId) {
      return res.status(400).json({
        success: false,
        message: "Replies are limited to one level",
      });
    }

    const comment = await commentService.createComment({
      postId,
      authorId: req.user.user_id,
      content,
      parentCommentId: commentId,
    });

    return res.status(201).json({
      success: true,
      data: comment,
      message: "Reply created successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error creating reply",
    });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await commentService.updateComment({
      commentId,
      userId: req.user.user_id,
      content,
    });

    return res.status(200).json({
      success: true,
      data: comment,
      message: "Comment updated successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error updating comment",
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await commentService.deleteComment({
      commentId,
      userId: req.user.user_id,
    });

    return res.status(200).json({
      success: true,
      data: comment,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error deleting comment",
    });
  }
};