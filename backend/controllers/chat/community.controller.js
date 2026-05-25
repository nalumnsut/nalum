const mongoose = require("mongoose");
const Community = require("../../models/chat/communities.model");
const Conversation = require("../../models/chat/conversations.model");
const Profile = require("../../models/user/profile.model");

const createCommunity = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, description, avatar, type, value } = req.body;

    if (!name || !type || !value) {
      return res
        .status(400)
        .json({ error: "Name, type, and value are required" });
    }

    if (!["location", "batch"].includes(type)) {
      return res.status(400).json({ error: "Type must be location or batch" });
    }

    // Only admins (site-level) can create communities
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can create communities" });
    }

    const community = new Community({
      name,
      description: description || "",
      avatar: avatar || "",
      type,
      value,
      admins: [userId],
      members: [userId],
    });

    await community.save();

    res.status(201).json({ success: true, data: community });
  } catch (error) {
    console.error("Create community error:", error);
    res.status(500).json({ error: "Failed to create community" });
  }
};

const getCommunities = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const communities = await Community.find({
      members: userId,
      isArchived: false,
    }).sort({ "lastMessage.timestamp": -1 });

    res.json({ success: true, data: communities });
  } catch (error) {
    console.error("Get communities error:", error);
    res.status(500).json({ error: "Failed to retrieve communities" });
  }
};

const joinCommunity = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community || community.isArchived) {
      return res.status(404).json({ error: "Community not found" });
    }

    // Check if already a member
    if (community.members.some((m) => m.toString() === userId.toString())) {
      return res
        .status(400)
        .json({ error: "Already a member of this community" });
    }

    // Only alumni and admins can join communities
    if (req.user.role === "student") {
      return res
        .status(403)
        .json({ error: "Only alumni and admins can join communities" });
    }

    // Verify user profile matches the community criteria
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res
        .status(403)
        .json({ error: "Profile not found. Complete your profile to join." });
    }

    if (community.type === "batch") {
      if (!profile.batch || profile.batch.toString() !== community.value) {
        return res
          .status(403)
          .json({ error: "Your batch year does not match this community" });
      }
    } else if (community.type === "location") {
      const city = profile.location?.city?.toLowerCase() || "";
      const country = profile.location?.country?.toLowerCase() || "";
      const communityValue = community.value.toLowerCase();
      if (city !== communityValue && country !== communityValue) {
        return res
          .status(403)
          .json({ error: "Your location does not match this community" });
      }
    }

    community.members.push(userId);
    await community.save();

    // Auto-join community socket room
    const io = req.app.get("io");
    if (io) {
      const sockets = await io.in(`user:${userId}`).fetchSockets();
      sockets.forEach((s) => s.join(`community:${id}`));
    }

    res.json({ success: true, message: "Joined community successfully" });
  } catch (error) {
    console.error("Join community error:", error);
    res.status(500).json({ error: "Failed to join community" });
  }
};

const leaveCommunity = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const isMember = community.members.some(
      (m) => m.toString() === userId.toString(),
    );
    if (!isMember) {
      return res
        .status(400)
        .json({ error: "You are not a member of this community" });
    }

    const isAdmin = community.admins.some(
      (a) => a.toString() === userId.toString(),
    );
    const isLastAdmin = isAdmin && community.admins.length === 1;

    if (isLastAdmin && community.members.length > 1) {
      return res.status(400).json({
        error: "You are the only admin. Assign a new admin before leaving.",
      });
    }

    community.members = community.members.filter(
      (m) => m.toString() !== userId.toString(),
    );
    if (isAdmin) {
      community.admins = community.admins.filter(
        (a) => a.toString() !== userId.toString(),
      );
    }

    // If no members left, archive the community
    if (community.members.length === 0) {
      community.isArchived = true;
    }

    await community.save();

    // Leave socket room
    const io = req.app.get("io");
    if (io) {
      const sockets = await io.in(`user:${userId}`).fetchSockets();
      sockets.forEach((s) => s.leave(`community:${id}`));
    }

    res.json({ success: true, message: "Left community successfully" });
  } catch (error) {
    console.error("Leave community error:", error);
    res.status(500).json({ error: "Failed to leave community" });
  }
};

const assignAdmin = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ error: "Member ID is required" });
    }

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const isAdmin = community.admins.some(
      (a) => a.toString() === userId.toString(),
    );
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "Only admins can assign new admins" });
    }

    const isMember = community.members.some(
      (m) => m.toString() === memberId.toString(),
    );
    if (!isMember) {
      return res
        .status(400)
        .json({ error: "Target user is not a member of this community" });
    }

    const alreadyAdmin = community.admins.some(
      (a) => a.toString() === memberId.toString(),
    );
    if (alreadyAdmin) {
      return res.status(400).json({ error: "User is already an admin" });
    }

    community.admins.push(memberId);
    await community.save();

    res.json({ success: true, message: "Admin assigned successfully" });
  } catch (error) {
    console.error("Assign admin error:", error);
    res.status(500).json({ error: "Failed to assign admin" });
  }
};

const clearChatHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const isMember = community.members.some(
      (m) => m.toString() === userId.toString(),
    );
    if (!isMember) {
      return res.status(403).json({ error: "Not a member of this community" });
    }

    community.clearedAt.set(userId.toString(), new Date());
    await community.save();

    res.json({ success: true, message: "Chat history cleared" });
  } catch (error) {
    console.error("Clear chat error:", error);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
};

const muteCommunity = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const alreadyMuted = community.mutedBy.some(
      (m) => m.toString() === userId.toString(),
    );
    if (!alreadyMuted) {
      community.mutedBy.push(userId);
      await community.save();
    }

    res.json({ success: true, message: "Community notifications muted" });
  } catch (error) {
    console.error("Mute community error:", error);
    res.status(500).json({ error: "Failed to mute community" });
  }
};

const unmuteCommunity = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    community.mutedBy = community.mutedBy.filter(
      (m) => m.toString() !== userId.toString(),
    );
    await community.save();

    res.json({ success: true, message: "Community notifications unmuted" });
  } catch (error) {
    console.error("Unmute community error:", error);
    res.status(500).json({ error: "Failed to unmute community" });
  }
};

const getInbox = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;

    // Aggregate Conversations and Communities into a unified inbox
    const inbox = await Conversation.aggregate([
      {
        $match: {
          participants: {
            $elemMatch: {
              $eq: mongoose.Types.ObjectId.createFromHexString(userId),
            },
          },
          $or: [
            { [`deletedBy.${userId}`]: { $exists: false } },
            { [`deletedBy.${userId}`]: false },
          ],
        },
      },
      { $addFields: { itemType: "conversation" } },
      {
        $unionWith: {
          coll: "communities",
          pipeline: [
            {
              $match: {
                members: {
                  $elemMatch: {
                    $eq: mongoose.Types.ObjectId.createFromHexString(userId),
                  },
                },
                isArchived: false,
              },
            },
            { $addFields: { itemType: "community" } },
          ],
        },
      },
      { $sort: { "lastMessage.timestamp": -1, updatedAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    res.json({ success: true, data: inbox });
  } catch (error) {
    console.error("Get inbox error:", error);
    res.status(500).json({ error: "Failed to retrieve inbox" });
  }
};

module.exports = {
  createCommunity,
  getCommunities,
  joinCommunity,
  leaveCommunity,
  assignAdmin,
  clearChatHistory,
  muteCommunity,
  unmuteCommunity,
  getInbox,
};
