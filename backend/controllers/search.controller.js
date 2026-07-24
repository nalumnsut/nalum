const Profile = require("../models/user/profile.model");
const User = require("../models/user/user.model");
const Connection = require("../models/chat/connections.model");

const searchProfiles = async (req, res) => {
  try {
    const { name, graduationYear, skills, campus, branch, company, role, city, country, } = req.query;

    // Parse page and limit as numbers
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let userQuery = {};
    if (name) {
      userQuery.name = { $regex: name, $options: "i" };
    }

    // Add role filter (only allow alumni or student, never admin)
    if (role && (role === "alumni" || role === "student")) {
      userQuery.role = role;
    }

    // Exclude current user from search results
    if (req.user && req.user.user_id) {
      userQuery._id = { $ne: req.user.user_id };
    }

    let users = [];
    if (Object.keys(userQuery).length > 0) {
      users = await User.find(userQuery).select("_id");
    }

    let profileQuery = {};
    // If a name filter was applied but no users matched, return empty result
    if (userQuery.name && users.length === 0) {
      return res.json({ profiles: [], totalPages: 0, currentPage: page });
    }
    if (users.length > 0) {
      profileQuery.user = { $in: users.map((user) => user._id) };
    }

    if (graduationYear) {
      profileQuery.batch = graduationYear;
    }

    if (skills) {
      profileQuery.skills = { $in: skills.split(",") };
    }

    if (campus) {
      profileQuery.campus = campus;
    }

    if (branch) {
      profileQuery.branch = { $regex: `^${branch}$`, $options: "i" };
    }

    if (company) {
      profileQuery.current_company = { $regex: company, $options: "i" };
    }

    if (city) {
      profileQuery["location.city"] = { $regex: city, $options: "i" };
    }

    if (country) {
      profileQuery["location.country"] = { $regex: country, $options: "i" };
    }

    const profiles = await Profile.find(profileQuery)
      .populate("user", "name email role")
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await Profile.countDocuments(profileQuery);

    // Add connection status to each profile
    let profilesWithStatus = profiles;

    if (req.user && req.user.user_id && profiles.length > 0) {
      try {
        // Get all profile user IDs from the search results
        const profileUserIds = profiles.map((p) => p.user._id);

        // Query all connections in ONE database call (bulk query for efficiency)
        const connections = await Connection.find({
          $or: [
            { requester: req.user.user_id, recipient: { $in: profileUserIds } },
            { requester: { $in: profileUserIds }, recipient: req.user.user_id },
          ],
        });

        // Create a map for quick lookup: { userId: status }
        const connectionMap = {};
        connections.forEach((conn) => {
          // Convert all IDs to strings for comparison
          const currentUserId = req.user.user_id.toString();
          const requesterId = conn.requester.toString();
          const recipientId = conn.recipient.toString();

          // Determine which user is the "other" user
          const otherUserId =
            requesterId === currentUserId ? recipientId : requesterId;

          connectionMap[otherUserId] = conn.status; // 'pending', 'accepted', 'rejected', 'blocked'
        });

        // Add connectionStatus to each profile
        profilesWithStatus = profiles.map((profile) => {
          const profileObj = profile.toObject();
          const userId = profile.user._id.toString();
          const status = connectionMap[userId] || "not_connected";
          profileObj.connectionStatus = status;

          return profileObj;
        });
      } catch (error) {
        console.error("Error checking connection status:", error);
        // If error, just return profiles without status
        profilesWithStatus = profiles.map((p) => ({
          ...p.toObject(),
          connectionStatus: "not_connected",
        }));
      }
    }

    res.json({
      profiles: profilesWithStatus,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Suggest potential connections based on batch/branch/campus (sequential priority)
const getSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user?.user_id;
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get current user's profile to match on batch/branch/campus
    const currentProfile = await Profile.findOne({ user: currentUserId });
    if (!currentProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const { batch, branch, campus } = currentProfile;

    // Build user exclusion list: self + admins
    const excludedUsers = [currentUserId.toString()];
    const adminUsers = await User.find({ role: "admin" }).select("_id");
    adminUsers.forEach((u) => excludedUsers.push(u._id.toString()));

    // Find all connections (accepted or pending) for current user
    const existingConnections = await Connection.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }],
      status: { $in: ["accepted", "pending"] },
    }).select("requester recipient");

    // Add connected user IDs to exclusion list
    existingConnections.forEach((conn) => {
      const requesterId = conn.requester.toString();
      const recipientId = conn.recipient.toString();
      const otherId =
        requesterId === currentUserId.toString() ? recipientId : requesterId;
      excludedUsers.push(otherId);
    });

    const suggestions = [];

    // Helper function to run query stage and append results to suggestions
    const addMatchingSuggestions = async (queryFilter) => {
      const limitVal = 5 - suggestions.length;
      if (limitVal <= 0) return;

      const results = await Profile.find({
        ...queryFilter,
        user: { $nin: excludedUsers },
      })
        .populate("user", "name email role")
        .limit(limitVal)
        .exec();

      for (const profile of results) {
        if (profile.user && profile.user._id) {
          suggestions.push(profile);
          excludedUsers.push(profile.user._id.toString());
        }
      }
    };

    // Priority 1: Same branch & same campus & same year
    if (branch && campus && batch) {
      await addMatchingSuggestions({ branch, campus, batch });
    }

    // Priority 2: Same branch & same campus & adjacent year (+- 1yr)
    const batchNum = parseInt(batch);
    if (branch && campus && !isNaN(batchNum)) {
      await addMatchingSuggestions({
        branch,
        campus,
        batch: { $in: [String(batchNum - 1), String(batchNum + 1)] },
      });
    }

    // Priority 3: Different branch & same campus & same year
    if (campus && batch) {
      const filter = { campus, batch };
      if (branch) {
        filter.branch = { $ne: branch };
      }
      await addMatchingSuggestions(filter);
    }

    // Priority 4: Same branch & different campus & same year
    if (branch && batch) {
      const filter = { branch, batch };
      if (campus) {
        filter.campus = { $ne: campus };
      }
      await addMatchingSuggestions(filter);
    }

    // Priority 5: Rest (matching any of batch, branch, or campus)
    const restOrConditions = [];
    if (batch) restOrConditions.push({ batch });
    if (branch) restOrConditions.push({ branch });
    if (campus) restOrConditions.push({ campus });

    if (restOrConditions.length > 0) {
      await addMatchingSuggestions({ $or: restOrConditions });
    }

    // Fallback: Any profile left in the database
    await addMatchingSuggestions({});

    // Attach connectionStatus
    const formatted = suggestions.map((profile) => {
      const obj = profile.toObject();
      obj.connectionStatus = "not_connected";
      return obj;
    });

    return res.json({ suggestions: formatted });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  searchProfiles,
  getSuggestions,
};
