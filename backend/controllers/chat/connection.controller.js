const Connection = require("../../models/chat/connections.model");
const User = require("../../models/user/user.model");
const Profile = require("../../models/user/profile.model");
const notificationService = require("../../services/notificationService");
const Notification = require("../../models/notification.model");
require("dotenv").config();
// Send connection request
exports.sendConnectionRequest = async (req, res) => {
  try {
    const requesterId = req.user.user_id;
    const { recipientId, requestMessage } = req.body;
    if (process.NODE_ENV !== "production") {
      console.log(requesterId, recipientId, requestMessage);
    }
    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    if (requesterId === recipientId) {
      return res.status(400).json({ error: "Cannot connect with yourself" });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if consumers already exist
    let connection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (connection) {
      if (connection.status !== "pending" && connection.status !== "rejected" && connection.status !== "cancelled") {
        return res.status(400).json({
          error: "Connection already exists",
          status: connection.status,
        });
      }
      // Reuse the existing document — always save so the status reset reaches the DB
      connection.status = "pending";
      connection.requester = requesterId;
      connection.recipient = recipientId;
      if (requestMessage) {
        connection.requestMessage = requestMessage;
      }
      await connection.save();
    } else {
      // Create connection request
      connection = new Connection({
        requester: requesterId,
        recipient: recipientId,
        requestMessage: requestMessage || null,
        status: "pending",
      });
      await connection.save();
    }
    await connection.populate(
      ["requester", "recipient"],
      "name email profilePicture"
    );

    // Create a conversation for this request
    const Conversation = require("../../models/chat/conversations.model");
    const Message = require("../../models/chat/messages.model");

    const participants = [requesterId.toString(), recipientId.toString()].sort();

    let conversation = await Conversation.findOne({
      participants: { $all: participants, $size: 2 }
    });

    if (!conversation) {
      conversation = new Conversation({ participants });
      await conversation.save();
    }

    // If there is a request message, save it as a chat message
    let message;
    if (requestMessage) {
      message = new Message({
        conversation: conversation._id,
        sender: requesterId,
        content: requestMessage,
        readBy: [{ user: requesterId, readAt: new Date() }]
      });
      await message.save();

      conversation.lastMessage = {
        content: requestMessage,
        sender: requesterId,
        timestamp: new Date()
      };
      await conversation.save();
    }

    // Emit socket event for real-time notification
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${recipientId}`).emit("connection_request", connection);
      // Also emit message event so it shows up in chat list immediately
      if (message) {
        // Re-fetch message with population for socket
        const fullMessage = await Message.findById(message._id).populate("sender", "name email profilePicture");

        io.to(`user:${recipientId}`).emit("new_message", fullMessage);

        // Emit conversation update for unread count
        io.to(`user:${recipientId}`).emit("conversation:update", {
          conversationId: conversation._id,
          lastMessage: fullMessage
        });
      }
    }

    // Create notification for connection request
    try {
      const requester = await User.findById(requesterId).select('name role');
      await notificationService.createNotification({
        recipientId: recipientId,
        senderId: requesterId,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${requester.name} sent you a connection request`,
        actionUrl: `/dashboard/chat/${conversation._id}${message ? `?messageId=${message._id}` : ''}`,
        metadata: {
          requesterId: requesterId,
          requesterName: requester.name,
          requesterRole: requester.role,
          connectionId: connection._id,
          conversationId: conversation._id.toString(),
          messageId: message?._id.toString() || null
        }
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      message: "Connection request sent successfully",
      connection,
    });
  } catch (error) {
    console.error("Send connection request error:", error);
    res.status(500).json({ error: "Failed to send connection request" });
  }
};

async function clearConnectionWorkflowNotifications(io, connection, conversationId = null) {
  const participantIds = [connection.requester, connection.recipient];
  const query = {
    $or: [
      { type: 'connection_request', 'metadata.connectionId': connection._id },
      { type: 'connection_request', 'metadata.connectionId': connection._id.toString() },
      ...(conversationId ? [
        { type: 'new_message', 'metadata.conversationId': conversationId.toString() },
        { 'relatedEntity.entityType': 'message', recipient: { $in: participantIds }, sender: { $in: participantIds } }
      ] : [])
    ]
  };

  const notifications = await Notification.find(query).select('_id recipient');
  if (notifications.length === 0) return;

  await Notification.deleteMany({ _id: { $in: notifications.map(item => item._id) } });
  if (!io) return;

  for (const notification of notifications) {
    io.to(`user:${notification.recipient}`).emit('notification:removed', {
      notificationId: notification._id.toString()
    });
  }

  for (const participantId of participantIds) {
    const count = await notificationService.getUnreadCount(participantId);
    io.to(`user:${participantId}`).emit('notification:badge', { count });
  }
}
// Respond to connection request (accept/reject)
exports.respondToConnection = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { connectionId, action } = req.body;

    if (!connectionId || !action) {
      return res
        .status(400)
        .json({ error: "Connection ID and action are required" });
    }

    if (!["accept", "reject", "block"].includes(action)) {
      return res
        .status(400)
        .json({ error: 'Invalid action. Use "accept" or "reject or Block"' });
    }

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({ error: "Connection request not found" });
    }

    // Verify user is the recipient
    if (connection.recipient.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to respond to this request" });
    }

    if (connection.status !== "pending") {
      const requestedStatus = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "blocked";
      if (connection.status === requestedStatus) {
        await connection.populate(["requester", "recipient"], "name email profilePicture");
        return res.json({
          message: `Connection request already ${requestedStatus}`,
          connection,
          alreadyProcessed: true,
        });
      }
      return res.status(409).json({
        error: `Connection request is already ${connection.status}`,
        status: connection.status,
      });
    }

    // Update connection status
    if (action === "accept") {
      connection.status = "accepted";
      connection.respondedAt = new Date();
      await connection.save();
      await clearConnectionWorkflowNotifications(req.app.get("io"), connection);

      const Conversation = require("../../models/chat/conversations.model");
      const conversation = await Conversation.findOne({
        participants: { $all: [connection.requester, connection.recipient], $size: 2 },
      });

      // Create notification for connection acceptance
      try {
        const accepter = await User.findById(userId).select('name');
        await notificationService.createNotification({
          recipientId: connection.requester.toString(),
          senderId: userId,
          type: 'connection_accepted',
          title: 'Connection Accepted',
          message: `${accepter.name} accepted your connection request`,
          actionUrl: conversation ? `/dashboard/chat/${conversation._id}` : '/dashboard/connections',
          metadata: {
            accepterId: userId,
            accepterName: accepter.name,
            connectionId: connection._id,
            conversationId: conversation?._id.toString() || null
          }
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the request if notification fails
      }
    } else if (action === "reject") {
      connection.status = "rejected";
      connection.respondedAt = new Date();
      await connection.save();

      // Delete the conversation and messages for both users
      const Conversation = require("../../models/chat/conversations.model");
      const Message = require("../../models/chat/messages.model");

      const conversation = await Conversation.findOne({
        participants: { $all: [connection.requester, connection.recipient] }
      });

      const io = req.app.get("io");
      await clearConnectionWorkflowNotifications(io, connection, conversation?._id);

      if (conversation) {
        await Message.deleteMany({ conversation: conversation._id });
        await Conversation.findByIdAndDelete(conversation._id);
        io?.to(`user:${connection.requester}`).emit("conversation:removed", { conversationId: conversation._id.toString() });
        io?.to(`user:${connection.recipient}`).emit("conversation:removed", { conversationId: conversation._id.toString() });
      }
    } else if (action === "block") {
      connection.status = "blocked";
      connection.blockedBy = userId;
      connection.respondedAt = new Date();
      await connection.save();
    }

    await connection.populate(
      ["requester", "recipient"],
      "name email profilePicture"
    );

    res.json({
      message: `Connection request ${action}ed successfully`,
      connection,
    });
  } catch (error) {
    console.error("Respond to connection error:", error);
    res.status(500).json({ error: "Failed to respond to connection request" });
  }
};

// Get all connections (accepted and pending)
exports.getConnections = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      $or: [{ requester: userId }, { recipient: userId }],
    };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const connections = await Connection.find(query)
      .populate("requester", "name email profilePicture")
      .populate("recipient", "name email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Connection.countDocuments(query);

    res.json({
      success: true,
      data: connections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get connections error:", error);
    res.status(500).json({ error: "Failed to retrieve connections" });
  }
};

// Get pending connection requests (received)
exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const pendingRequests = await Connection.find({
      recipient: userId,
      status: "pending",
    })
      .populate("requester", "name email profilePicture role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingRequests,
    });
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(500).json({ error: "Failed to retrieve pending requests" });
  }
};

// Get sent connection requests (outgoing)
exports.getSentRequests = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const sentRequests = await Connection.find({
      requester: userId,
      status: "pending",
    })
      .populate("recipient", "name email role")
      .sort({ createdAt: -1 });

    // Fetch profile data for each recipient
    const requestsWithProfiles = await Promise.all(
      sentRequests.map(async (request) => {
        try {
          const profile = await Profile.findOne({
            user: request.recipient._id,
          }).select("batch branch campus profile_picture");

          return {
            ...request.toObject(),
            recipientProfile: profile || null,
          };
        } catch (error) {
          console.error(
            `Failed to fetch profile for user ${request.recipient._id}:`,
            error
          );
          return {
            ...request.toObject(),
            recipientProfile: null,
          };
        }
      })
    );

    res.json({
      success: true,
      data: requestsWithProfiles,
    });
  } catch (error) {
    console.error("Get sent requests error:", error);
    res.status(500).json({ error: "Failed to retrieve sent requests" });
  }
};

// Cancel sent connection request
exports.cancelConnectionRequest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { recipientId } = req.params;

    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    // Resolve the workflow before deleting it so all derived data can be
    // removed and both authenticated browser sessions can be notified.
    const connection = await Connection.findOne({
      requester: userId,
      recipient: recipientId,
      status: "pending",
    });

    if (!connection) {
      return res.status(404).json({
        error: "Request not found or already processed",
      });
    }

    const Conversation = require("../../models/chat/conversations.model");
    const Message = require("../../models/chat/messages.model");
    const conversation = await Conversation.findOne({
      participants: { $all: [connection.requester, connection.recipient], $size: 2 },
    });
    const io = req.app.get("io");

    await clearConnectionWorkflowNotifications(io, connection, conversation?._id);

    if (conversation) {
      await Message.deleteMany({ conversation: conversation._id });
      await Conversation.findByIdAndDelete(conversation._id);
    }
    await Connection.findByIdAndDelete(connection._id);

    const payload = {
      connectionId: connection._id.toString(),
      conversationId: conversation?._id.toString() || null,
      requesterId: connection.requester.toString(),
      recipientId: connection.recipient.toString(),
    };

    for (const participantId of [connection.requester, connection.recipient]) {
      io?.to(`user:${participantId}`).emit("connection:cancelled", payload);
      if (conversation) {
        io?.to(`user:${participantId}`).emit("conversation:removed", payload);
      }
    }

    res.json({ message: "Connection request cancelled", ...payload });
  } catch (error) {
    console.error("Cancel connection request error:", error);
    res.status(500).json({ error: "Failed to cancel connection request" });
  }
};

// Remove connection
exports.removeConnection = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { connectionId } = req.params;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }

    // Verify user is part of the connection
    if (
      connection.requester.toString() !== userId.toString() &&
      connection.recipient.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to remove this connection" });
    }

    await Connection.findByIdAndDelete(connectionId);

    res.json({ message: "Connection removed successfully" });
  } catch (error) {
    console.error("Remove connection error:", error);
    res.status(500).json({ error: "Failed to remove connection" });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { connectionId } = req.params;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }

    // Verify user is part of the connection
    if (
      connection.requester.toString() !== userId.toString() &&
      connection.recipient.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to block this connection" });
    }

    connection.status = "blocked";
    connection.blockedBy = userId;
    connection.respondedAt = new Date();
    await connection.save();

    res.json({ message: "User blocked successfully", connection });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { userId: targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: "Target User ID is required" });
    }

    // Find connection that is blocked
    const connection = await Connection.findOne({
      $or: [
        { requester: userId, recipient: targetUserId, status: 'blocked' },
        { requester: targetUserId, recipient: userId, status: 'blocked' }
      ]
    });

    if (!connection) {
      return res.status(404).json({ error: "Blocked connection not found" });
    }

    // Verify current user is the one who blocked
    if (connection.blockedBy && connection.blockedBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You cannot unblock this user (they blocked you)" });
    }

    // Delete the connection entirely upon unblocking (clean slate)
    await Connection.findByIdAndDelete(connection._id);

    res.json({ message: "User unblocked successfully" });

  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ error: "Failed to unblock user" });
  }
};

// Block user by User ID (for chat window)
exports.blockUserByUserId = async (req, res) => {
  try {
    const requesterId = req.user.user_id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find connection
    const connection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: userId },
        { requester: userId, recipient: requesterId },
      ],
    });

    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }

    connection.status = "blocked";
    connection.blockedBy = requesterId;
    connection.respondedAt = new Date();
    await connection.save();

    res.json({ message: "User blocked successfully", connection });
  } catch (error) {
    console.error("Block user by ID error:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
};
