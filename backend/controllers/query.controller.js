const Query = require('../models/query.model');
const User = require('../models/user/user.model');
const { notifyMentions } = require('../services/mentionHelper');
const { cleanupFiles, assertDeletePermission } = require('../utils/deleteHelper');
const escapeRegex = require('../utils/escapeRegex');

// Create a new query (Students & Alumni)
exports.createQuery = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { title, content } = req.body;
    const images = req.files ? req.files.map((file) => file.filename) : [];

    // Validate title and content length
    if (!title || title.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Title is required and must be 50 characters or less',
      });
    }

    if (!content || content.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Content is required and must be 500 characters or less',
      });
    }

    const query = await Query.create({
      title,
      content,
      images,
      userId: user_id,
    });

    // Fire mention notifications (non-blocking)
    const author = await User.findById(user_id).select('name').lean();
    notifyMentions({
      text: content,
      senderId: user_id,
      senderName: author?.name || 'Someone',
      contextType: 'query',
      contextTitle: title,
      actionUrl: `/dashboard/queries`,
      entityId: query._id.toString(),
    });

    return res.status(201).json({
      success: true,
      data: query,
      message: 'Query submitted successfully',
    });
  } catch (error) {
    console.error('Error creating query:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating query',
    });
  }
};

// Get user's own queries
exports.getMyQueries = async (req, res) => {
  try {
    const { user_id } = req.user;

    // Exclude soft-deleted queries
    const queries = await Query.find({ userId: user_id, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: queries,
      message: 'Queries fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching queries:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching queries',
    });
  }
};

// Get all queries (Admin only) with search and sort
exports.getAllQueries = async (req, res) => {
  try {
    const { title, content, author, sortBy } = req.query;

    // Build query object
    const queryObj = {};

    if (title) {
      queryObj.title = { $regex: escapeRegex(title), $options: 'i' };
    }

    if (content) {
      queryObj.content = { $regex: escapeRegex(content), $options: 'i' };
    }

    // If author search is provided, find matching users first
    if (author) {
      const users = await User.find({
        name: { $regex: escapeRegex(author), $options: 'i' },
      }).select('_id');

      const userIds = users.map((user) => user._id);
      queryObj.userId = { $in: userIds };
    }

    // Sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first
    if (sortBy === 'status') {
      sortOptions = { status: 1, createdAt: -1 };
    }

    // Exclude soft-deleted queries from admin view
    queryObj.isDeleted = { $ne: true };

    const queries = await Query.find(queryObj)
      .sort(sortOptions)
      .populate('userId', 'name email')
      .lean();

    return res.status(200).json({
      success: true,
      count: queries.length,
      data: queries,
      message: 'Queries fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching all queries:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching queries',
    });
  }
};

// Update query status to 'viewed' (Admin only)
exports.updateQueryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found',
      });
    }

    query.status = 'viewed';
    await query.save();

    return res.status(200).json({
      success: true,
      data: query,
      message: 'Query marked as viewed',
    });
  } catch (error) {
    console.error('Error updating query status:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating query status',
    });
  }
};

// Respond to query (Admin only)
exports.respondToQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer) {
      return res.status(400).json({
        success: false,
        message: 'Answer is required',
      });
    }

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found',
      });
    }

    query.answer = answer;
    query.status = 'responded';
    await query.save();

    return res.status(200).json({
      success: true,
      data: query,
      message: 'Response submitted successfully',
    });
  } catch (error) {
    console.error('Error responding to query:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error responding to query',
    });
  }
};

// Delete a query — owner or admin (Task 3.2)
exports.deleteQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const requestUserId = req.user?.user_id || req.user?.id || req.admin?.id;
    let userRole = req.user?.role || req.admin?.role;

    if (!userRole && requestUserId) {
      const user = await User.findById(requestUserId).select("role").lean();
      if (user) userRole = user.role;
    }

    const query = await Query.findById(id);
    if (!query || query.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Query not found',
      });
    }

    assertDeletePermission({
      ownerId: query.userId,
      requestUserId: requestUserId,
      userRole: userRole,
    });

    // Clean up associated image files from disk
    if (query.images && query.images.length > 0) {
      cleanupFiles(query.images, 'queries');
    }

    // Soft delete
    query.isDeleted = true;
    query.deletedAt = new Date();
    await query.save();

    return res.status(200).json({
      success: true,
      message: 'Query deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting query:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error deleting query',
    });
  }
};
