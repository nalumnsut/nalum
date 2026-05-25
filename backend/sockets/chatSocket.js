const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis.config');
const { createAdapter } = require('@socket.io/redis-adapter');
const messageHandlers = require('./handlers/messageHandlers');
const typingHandlers = require('./handlers/typingHandlers');
const Community = require('../models/chat/communities.model');

async function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Setup Redis adapter for horizontal scaling (optional - degrades gracefully)
  try {
    const redisClient = getRedisClient();

    if (redisClient && redisClient.isOpen) {
      const pubClient = redisClient.duplicate();
      const subClient = redisClient.duplicate();

      await pubClient.connect();
      await subClient.connect();

      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.io Redis adapter configured');
    } else {
      console.warn('Redis not available, running without adapter (single instance only)');
    }
  } catch (error) {
    console.warn('Failed to setup Redis adapter, continuing without it:', error.message);
  }

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // The JWT token contains user_id, not id
      socket.userId = decoded.user_id;
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${userId}`);

    try {
      const currentRedisClient = getRedisClient();

      // Mark user as online (skip if Redis not available)
      if (currentRedisClient && currentRedisClient.isOpen) {
        try {
          await currentRedisClient.setEx(`user:online:${userId}`, 30, Date.now().toString());
        } catch (error) {
          console.warn('Redis online status update failed:', error.message);
        }
      }

      // Join user to their personal room
      socket.join(`user:${userId}`);

      // Auto-join all community rooms for real-time sidebar updates
      try {
        const userCommunities = await Community.find({
          members: userId,
          isArchived: false,
        }).select('_id');
        userCommunities.forEach((c) => socket.join(`community:${c._id}`));
      } catch (err) {
        console.warn('Failed to auto-join community rooms:', err.message);
      }

      // Broadcast online status to connections
      socket.broadcast.emit('user:online', { userId });

      // Periodically update online status (heartbeat)
      const heartbeat = setInterval(async () => {
        if (currentRedisClient && currentRedisClient.isOpen) {
          try {
            await currentRedisClient.setEx(`user:online:${userId}`, 30, Date.now().toString());
          } catch (error) {
            console.warn('Heartbeat error:', error.message);
          }
        }
      }, 15000); // Every 15 seconds

      // Join conversation rooms
      socket.on('conversation:join', (conversationId) => {
        socket.join(`conversation:${conversationId}`);
      });

      socket.on('conversation:leave', (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
      });

      // Handle incoming messages
      socket.on('message:send', async (data) => {
        await messageHandlers.handleSendMessage(io, socket, data);
      });

      // Typing indicators
      socket.on('typing:start', async (data) => {
        await typingHandlers.handleTypingStart(socket, data);
      });

      socket.on('typing:stop', async (data) => {
        await typingHandlers.handleTypingStop(socket, data);
      });

      // Message read receipt
      socket.on('message:read', async (data, callback) => {
        await messageHandlers.handleMessageRead(io, socket, data);
        if (typeof callback === 'function') {
          callback({ success: true });
        }
      });

      // Message deletion
      socket.on('message:delete', async (data) => {
        await messageHandlers.handleMessageDeleted(io, socket, data);
      });

      // Disconnect
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${userId}`);
        clearInterval(heartbeat);
        const currentRedisClient = getRedisClient();

        if (currentRedisClient && currentRedisClient.isOpen) {
          try {
            await currentRedisClient.del(`user:online:${userId}`);
          } catch (error) {
            console.warn('Redis cleanup error:', error.message);
          }
        }
        socket.broadcast.emit('user:offline', { userId });
      });
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  });

  return io;
}

module.exports = { initializeSocket };
