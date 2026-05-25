const Message = require('../../models/chat/messages.model');
const Conversation = require('../../models/chat/conversations.model');
const Connection = require('../../models/chat/connections.model');
const Community = require('../../models/chat/communities.model');
const redisClient = require('../../config/redis');
const notificationService = require('../../services/notificationService');
const User = require('../../models/user/user.model');

async function handleSendMessage(io, socket, data) {
  try {
    const { conversationId, communityId, content, tempId } = data;
    const userId = socket.userId;

    // Validate content
    if (!content || !content.trim()) {
      return socket.emit('message:error', { error: 'Message content is required' });
    }

    if (content.length > 5000) {
      return socket.emit('message:error', { error: 'Message too long (max 5000 characters)' });
    }

    // Rate limiting check (skip if Redis not available)
    if (redisClient && redisClient.isOpen) {
      try {
        const rateKey = `ratelimit:message:${userId}`;
        const messageCount = await redisClient.incr(rateKey);

        if (messageCount === 1) {
          await redisClient.expire(rateKey, 60);
        }

        if (messageCount > 50) {
          return socket.emit('message:error', { error: 'Rate limit exceeded. Please wait.' });
        }
      } catch (error) {
        console.warn('Rate limit check failed:', error.message);
      }
    }

    // Verify conversation exists and user is participant
    let conversation = null;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return socket.emit('message:error', { error: 'Conversation not found' });
      }

      if (!conversation.participants.some(p => p.toString() === userId.toString())) {
        return socket.emit('message:error', { error: 'Not authorized for this conversation' });
      }

      // Check for blocking
      const participantIds = conversation.participants.map(p => p.toString());
      const otherUserId = participantIds.find(id => id !== userId.toString());

      if (otherUserId) {
        const connection = await Connection.findOne({
          $or: [
            { requester: userId, recipient: otherUserId },
            { requester: otherUserId, recipient: userId }
          ]
        });

        if (connection && connection.status === 'blocked') {
          return socket.emit('message:error', { error: 'You cannot send messages to this user' });
        }
      }
    } else if (communityId) {
      const community = await Community.findById(communityId);
      if (!community) {
        return socket.emit('message:error', { error: 'Community not found' });
      }

      const isMember = community.members.some(m => m.toString() === userId.toString());
      const isAdmin = community.admins.some(a => a.toString() === userId.toString());

      if (!isMember && !isAdmin) {
        return socket.emit('message:error', { error: 'Not authorized for this community' });
      }
    } else {
      return socket.emit('message:error', { error: 'Conversation or Community ID is required' });
    }

    // Create message
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

    // Update conversation last message
    if (conversationId && conversation) {
      conversation.lastMessage = {
        content: content.substring(0, 500),
        sender: userId,
        timestamp: new Date()
      };
      await conversation.save();
    } else if (communityId) {
      const community = await Community.findById(communityId);
      if (community) {
        community.lastMessage = {
          content: content.substring(0, 500),
          sender: userId,
          timestamp: new Date()
        };
        await community.save();
      }
    }

    // Update Redis recent conversations cache
    if (redisClient && redisClient.isOpen && conversationId) {
      try {
        const timestamp = Date.now();
        for (const participantId of conversation.participants) {
          await redisClient.zAdd(`recent:chats:${participantId}`, {
            score: timestamp,
            value: conversationId.toString()
          });
        }

        // Increment unread count for other participants
        for (const participantId of conversation.participants) {
          if (participantId.toString() !== userId) {
            await redisClient.hIncrBy(`unread:${participantId}`, conversationId.toString(), 1);
          }
        }
      } catch (error) {
        console.warn('Redis cache update failed:', error.message);
      }
    }

    // Populate message for response
    await message.populate('sender', 'name email profilePicture');

    if (conversationId && conversation) {
      // Notify all participants via their personal rooms (for chat list updates)
      for (const participantId of conversation.participants) {
        io.to(`user:${participantId}`).emit('conversation:update', {
          conversationId,
          lastMessage: message,
          unreadCount: participantId.toString() === userId ? 0 : 1 // Simple increment hint, client should handle
        });
      }

      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit('message:new', {
        conversationId,
        message: message
      });

      // Emit to sender
      socket.emit('message:sent', {
        conversationId,
        message: message,
        tempId
      });

      // Create notification for new message
      try {
        const sender = await User.findById(userId).select('name');
        const recipientId = conversation.participants.find(p => p.toString() !== userId.toString());
        if (recipientId) {
          await notificationService.createNotification({
            recipientId: recipientId.toString(),
            senderId: userId,
            type: 'new_message',
            title: 'New Message',
            message: `${sender.name}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
            actionUrl: `/dashboard/chat?conversation=${conversationId}`,
            priority: 'high',
            relatedEntity: {
              entityType: 'message',
              entityId: message._id.toString(),
            },
            metadata: {
              senderId: userId,
              senderName: sender.name,
              conversationId: conversationId.toString(),
              messageId: message._id.toString(),
              messagePreview: content.substring(0, 100)
            }
          });
        }
      } catch (notifError) {
        console.error('Error creating message notification:', notifError);
        // Don't fail the message send if notification fails
      }
    } else if (communityId) {
      io.to(`community:${communityId}`).emit('message:new', {
        communityId,
        message: message
      });

      socket.emit('message:sent', {
        communityId,
        message: message,
        tempId
      });
    }

  } catch (error) {
    console.error('Send message error:', error);
    socket.emit('message:error', { error: 'Failed to send message' });
  }
}

async function handleMessageRead(io, socket, data) {
  try {
    const { conversationId, communityId, messageId } = data;
    const userId = socket.userId;

    if (communityId) return;

    // Verify conversation access
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.some(p => p.toString() === userId)) {
      return;
    }

    if (messageId) {
      // Mark specific message as read
      const message = await Message.findById(messageId);
      if (message && message.conversation.toString() === conversationId) {
        const alreadyRead = message.readBy.some(r => r.user.toString() === userId);
        if (!alreadyRead) {
          message.readBy.push({ user: userId, readAt: new Date() });
          await message.save();
        }
      }
    } else {
      // Mark all messages in conversation as read
      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: userId },
          'readBy.user': { $ne: userId }
        },
        {
          $push: { readBy: { user: userId, readAt: new Date() } }
        }
      );
    }

    // Update last read timestamp
    conversation.lastReadBy.set(userId, new Date());
    await conversation.save();

    // Clear unread count in Redis
    if (redisClient && redisClient.isOpen) {
      try {
        await redisClient.hDel(`unread:${userId}`, conversationId.toString());
      } catch (error) {
        console.warn('Redis update failed:', error.message);
      }
    }

    // Notify other participants
    io.to(`conversation:${conversationId}`).emit('message:read', {
      conversationId,
      userId,
      messageId
    });

  } catch (error) {
    console.error('Message read error:', error);
  }
}

async function handleMessageDeleted(io, socket, data) {
  try {
    const { messageId, conversationId, communityId } = data;
    const userId = socket.userId;

    // Verify ownership or admin status (optional but recommended)
    const message = await Message.findById(messageId);
    if (!message) return;

    const isSender = message.sender.toString() === userId.toString();
    
    // Check if community admin
    const community = message.community ? await Community.findById(message.community) : null;
    const isAdmin = community ? community.admins.some(a => a.toString() === userId.toString()) : false;

    if (!isSender && !isAdmin) {
      // Only sender or admin can delete
      return;
    }

    // Get conversation to find recipient
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      const recipientId = conversation.participants.find(p => p.toString() !== userId.toString());
      
      // Delete related notification for this specific message
      if (recipientId) {
        const Notification = require('../../models/notification.model');
        const deletedNotif = await Notification.findOneAndDelete({
          recipient: recipientId,
          sender: userId,
          type: 'new_message',
          'metadata.messageId': messageId.toString()
        });

        // If notification was deleted, notify the recipient to remove it from their UI
        if (deletedNotif) {
          io.to(`user:${recipientId}`).emit('notification:removed', {
            notificationId: deletedNotif._id.toString()
          });

          // Find the previous unread message in this conversation (if any)
          const previousMessage = await Message.findOne({
            conversation: conversationId,
            sender: userId,
            _id: { $ne: messageId }, // Exclude the deleted message
            createdAt: { $lt: message.createdAt }, // Messages sent before the deleted one
            'readBy.user': { $ne: recipientId } // Only messages not read by the recipient
          })
          .sort({ createdAt: -1 }) // Most recent first
          .limit(1);

          // If there's a previous unread message, create a notification for it
          if (previousMessage) {
            const sender = await User.findById(userId).select('name');
            const newNotification = await notificationService.createNotification({
              recipientId: recipientId.toString(),
              senderId: userId,
              type: 'new_message',
              title: 'New Message',
              message: `${sender.name}: ${previousMessage.content.substring(0, 100)}${previousMessage.content.length > 100 ? '...' : ''}`,
              actionUrl: `/dashboard/chat?conversation=${conversationId}`,
              priority: 'high',
              relatedEntity: {
                entityType: 'message',
                entityId: previousMessage._id.toString(),
              },
              metadata: {
                senderId: userId,
                senderName: sender.name,
                conversationId: conversationId.toString(),
                messageId: previousMessage._id.toString(),
                messagePreview: previousMessage.content.substring(0, 100)
              }
            });
          }
        }
      }
    }

    // Perform deletion (or soft delete)
    await Message.deleteOne({ _id: messageId });

    if (communityId || message.community) {
      const targetCommunity = communityId || message.community;
      io.to(`community:${targetCommunity}`).emit('message:deleted', {
        messageId,
        communityId: targetCommunity
      });
    } else {
      // Notify conversation participants
      io.to(`conversation:${conversationId}`).emit('message:deleted', {
        messageId,
        conversationId
      });
    }

  } catch (error) {
    console.error('Message delete error:', error);
  }
}

module.exports = {
  handleSendMessage,
  handleMessageRead,
  handleMessageDeleted
};
