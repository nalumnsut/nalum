const Message = require('../../models/chat/messages.model');
const Conversation = require('../../models/chat/conversations.model');
const Community = require('../../models/chat/communities.model');

// Get messages for a conversation or community
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    let target = await Conversation.findById(conversationId);
    let isCommunity = false;

    if (!target) {
      target = await Community.findById(conversationId);
      isCommunity = true;
    }

    if (!target) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (isCommunity) {
      if (!target.members.some(m => m.toString() === userId.toString()) && !target.admins.some(a => a.toString() === userId.toString())) {
        return res.status(403).json({ error: 'Not authorized to view these messages' });
      }
    } else {
      if (!target.participants.some(p => p.toString() === userId.toString())) {
        return res.status(403).json({ error: 'Not authorized to view these messages' });
      }
    }

    const skip = (page - 1) * limit;

    const query = { deleted: false };

    if (isCommunity) {
      query.community = conversationId;
      if (target.clearedAt && target.clearedAt.get(userId.toString())) {
        query.createdAt = { $gt: target.clearedAt.get(userId.toString()) };
      }
    } else {
      query.conversation = conversationId;
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      hasMore: page * limit < total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};

// Send message (HTTP endpoint, also available via WebSocket)
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { conversationId, communityId, content } = req.body;

    if ((!conversationId && !communityId) || !content) {
      return res.status(400).json({ error: 'Conversation ID or Community ID and content are required' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Message too long (max 5000 characters)' });
    }

    let conversation = null;
    let community = null;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      if (!conversation.participants.some(p => p.toString() === userId.toString())) {
        return res.status(403).json({ error: 'Not authorized to send messages in this conversation' });
      }
    } else if (communityId) {
      community = await Community.findById(communityId);
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }
      const isMember = community.members.some(m => m.toString() === userId.toString());
      const isAdmin = community.admins.some(a => a.toString() === userId.toString());
      if (!isMember && !isAdmin) {
        return res.status(403).json({ error: 'Not authorized to send messages in this community' });
      }
    }

    const messageData = {
      sender: userId,
      content: content.trim(),
      messageType: 'text'
    };

    if (conversationId) {
      messageData.conversation = conversationId;
      messageData.readBy = [{ user: userId, readAt: new Date() }];
    } else if (communityId) {
      messageData.community = communityId;
    }

    const message = new Message(messageData);
    await message.save();

    const lastMessageUpdate = {
      content: content.substring(0, 500),
      sender: userId,
      timestamp: new Date()
    };

    if (conversation) {
      conversation.lastMessage = lastMessageUpdate;
      await conversation.save();
    } else if (community) {
      community.lastMessage = lastMessageUpdate;
      await community.save();
    }

    await message.populate('sender', 'name email profilePicture');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Mark message as read
exports.markMessageRead = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.community) {
      return res.json({ message: 'Read receipts not required for community messages' });
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findById(message.conversation);
    if (!conversation || !conversation.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if already read
    const alreadyRead = message.readBy.some(r => r.user.toString() === userId);
    if (!alreadyRead) {
      message.readBy.push({ user: userId, readAt: new Date() });
      await message.save();
    }

    res.json({ message: 'Message marked as read' });

  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

// Delete message (soft delete)
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    let isAuthorized = message.sender.toString() === userId.toString();

    if (!isAuthorized && message.community) {
      const community = await Community.findById(message.community);
      if (community && community.admins.some(a => a.toString() === userId.toString())) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    message.deleted = true;
    await message.save();

    const io = req.app.get('io');
    if (io) {
      if (message.community) {
        io.to(`community:${message.community}`).emit('message:deleted', {
          messageId: message._id,
          communityId: message.community
        });
      } else if (message.conversation) {
        io.to(`conversation:${message.conversation}`).emit('message:deleted', {
          messageId: message._id,
          conversationId: message.conversation
        });
      }
    }

    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
