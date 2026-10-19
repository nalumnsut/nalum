const express = require("express");
const router = express.Router();
const Profile = require("../../models/user/profile.model");
const { protect } = require("../../middleware/auth");
const User = require("../../models/user/user.model");
const uploadProfilePicture = require("../../config/profilePicture.multer");
const { compressionPresets } = require("../../middleware/imageCompression");
const { addToQueue } = require("../../services/geocodingQueue");
const { invalidateAlumniMapCache } = require("../../config/cacheKeys");

// POST /profile - Create profile with optional profile picture
router.post(
  "/",
  protect,
  uploadProfilePicture.single("profile_picture"),
  compressionPresets.profilePicture,
  async (req, res) => {
    try {
      // User ID from auth middleware
      const userId = req.user.user_id;
      if (!userId) {
        return res
          .status(401)
          .json({ error: "Unauthorized: User not authenticated." });
      }

      // Parse JSON fields from FormData
      let socialMedia = {};
      let skills = [];
      let experience = [];
      let location = {};

      if (req.body.social_media) {
        try {
          socialMedia = JSON.parse(req.body.social_media);
        } catch (e) {
          socialMedia = req.body.social_media;
        }
      }

      if (req.body.skills) {
        try {
          skills = JSON.parse(req.body.skills);
        } catch (e) {
          skills = [];
        }
      }

      if (req.body.experience) {
        try {
          experience = JSON.parse(req.body.experience);
        } catch (e) {
          experience = [];
        }
      }

      if (req.body.location) {
        try {
          location = JSON.parse(req.body.location);
        } catch (e) {
          location = {};
        }
      }

      const { batch, branch, campus, department, current_company, current_role } = req.body;

      // Only alumni can set location
      const user = await User.findById(userId).select("role");
      if (!user || user.role !== "alumni") {
        location = {};
      }

      // Alumni must provide city and country
      if (user && user.role === "alumni") {
        if (!location || !location.city || !location.country) {
          return res
            .status(400)
            .json({ error: "Alumni must provide their City and Country." });
        }
      }

      // Validate required fields (faculty: department+campus, others: batch+branch+campus)
      if (user && user.role === "faculty") {
        const DEPARTMENTS = [
          "Department of Applied Chemistry",
          "Department of Applied Mathematics",
          "Department of Applied Physics",
          "Department of Architecture",
          "Department of Biological Sciences & Engineering",
          "Department of Civil Engineering",
          "Department of Computer Science & Engineering",
          "Department of Design",
          "Department of Electrical Engineering",
          "Department of Electronics & Communication Engineering",
          "Department of Humanities & Social Sciences",
          "Department of Information Technology",
          "Department of Instrumentation & Control Engineering",
          "Department of Management Studies",
          "Department of Manufacturing Processes & Automation Engineering",
          "Department of Mechanical Engineering",
        ];
        if (!department || !campus) {
          return res
            .status(400)
            .json({ error: "Missing required fields: department or campus." });
        }
        if (!DEPARTMENTS.includes(department)) {
          return res.status(400).json({
            error: `Invalid department. Must be one of: ${DEPARTMENTS.join(", ")}`,
          });
        }
      } else {
        if (!batch || !branch || !campus) {
          return res
            .status(400)
            .json({
              error: "Missing required fields: batch, branch, or campus.",
            });
        }
      }

      // Validate campus enum
      const validCampuses = ["Main Campus", "East Campus", "West Campus"];
      if (!validCampuses.includes(campus)) {
        return res
          .status(400)
          .json({
            error: `Invalid campus. Must be one of: ${validCampuses.join(", ")}`,
          });
      }

      // Check for existing profile
      const existing = await Profile.findOne({ user: userId });
      if (existing) {
        return res
          .status(409)
          .json({ error: "Profile already exists for this user." });
      }

      // Handle profile picture upload
      let profilePicturePath = null;
      if (req.file) {
        profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
      }

      // Create and save the profile
      const profile = new Profile({
        user: userId,
        batch: user && user.role === "faculty" ? undefined : batch,
        branch: user && user.role === "faculty" ? undefined : branch,
        department: user && user.role === "faculty" ? department : undefined,
        campus,
        current_company,
        current_role,
        location,
        profile_picture: profilePicturePath,
        social_media: socialMedia,
        skills: skills,
        experience: experience,
      });

      await profile.save();
      await User.findByIdAndUpdate(userId, { profileCompleted: true });

      // A new location changes the map, so drop the cached response — both when
      // coordinates came with the profile (e.g. "Use My Location" GPS) and when
      // the queue will resolve them later.
      if (location && location.city && location.country) {
        await invalidateAlumniMapCache();
      }

      // Queue for geocoding if location provided but no coordinates (lat/lng of
      // 0 are valid coordinates, so only null/undefined mean "not yet
      // geocoded"). Wrapped in try/catch: geocoding is a background task — a
      // Redis blip must NOT fail a profile creation that already succeeded (the
      // profile is already saved).
      if (
        location &&
        location.city &&
        location.country &&
        (location.lat == null || location.lng == null)
      ) {
        try {
          await addToQueue(userId, location.city, location.country);
        } catch (queueError) {
          console.error(
            "Failed to enqueue geocoding job; coordinates will be filled later:",
            queueError,
          );
        }
      }

      res
        .status(201)
        .json({ message: "Profile created successfully.", profile });
    } catch (err) {
      console.error("Profile creation error:", err);
      res.status(500).json({ error: err.message || "Internal server error." });
    }
  },
);

module.exports = router;
