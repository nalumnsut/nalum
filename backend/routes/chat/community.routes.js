const express = require('express');
const router = express.Router();
const communityController = require('../../controllers/chat/community.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);

router.get('/inbox', communityController.getInbox);
router.get('/mine', communityController.getCommunities);
router.post('/', communityController.createCommunity);
router.post('/:id/join', communityController.joinCommunity);
router.post('/:id/leave', communityController.leaveCommunity);
router.post('/:id/assign-admin', communityController.assignAdmin);
router.post('/:id/clear', communityController.clearChatHistory);
router.post('/:id/mute', communityController.muteCommunity);
router.post('/:id/unmute', communityController.unmuteCommunity);

module.exports = router;
