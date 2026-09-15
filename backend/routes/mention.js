const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/user/user.model");
const Profile = require("../models/user/profile.model");

/**
 * GET /api/mention?q=name
 * Returns up to 8 users matching the name query for @mention autocomplete.
 * Only visible users (alumni/student/faculty, not banned) are returned.
 */
router.get("/", protect, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    // Search users by name if query provided, or return top users if bare @
    const filter = {
      role: { $in: ["alumni", "student", "faculty"] },
      _id: { $ne: req.user.user_id }, // exclude self
    };

    if (q && q.length > 0) {
      filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }

    const users = await User.find(filter)
      .select("_id name role")
      .limit(8)
      .lean();

    if (!users.length) {
      return res.json({ users: [] });
    }

    // Fetch profile pictures for the matched users
    const profiles = await Profile.find({
      user: { $in: users.map((u) => u._id) },
    })
      .select("user profile_picture")
      .lean();

    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.user.toString()] = p.profile_picture || null;
    });

    const result = users.map((u) => ({
      _id: u._id,
      name: u.name,
      role: u.role,
      profile_picture: profileMap[u._id.toString()] || null,
    }));

    return res.json({ users: result });
  } catch (err) {
    console.error("Mention search error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
