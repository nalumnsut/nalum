const express = require('express');
const router = express.Router();

// Import all chat routes
const connectionRoutes = require('./connection.routes');
const conversationRoutes = require('./conversation.routes');
const messageRoutes = require('./message.routes');
const searchRoutes = require('./search.routes');
const communityRoutes = require('./community.routes');

// Mount routes
router.use('/connections', connectionRoutes);
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);
router.use('/search', searchRoutes);
router.use('/communities', communityRoutes);

module.exports = router;
