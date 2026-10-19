const express = require("express");
const router = express.Router();
const Profile = require("../../models/user/profile.model");
const User = require("../../models/user/user.model");
const { protect } = require("../../middleware/auth");
const { addToQueue } = require("../../services/geocodingQueue");
const { invalidateAlumniMapCache } = require("../../config/cacheKeys");

// PUT /profile/update - Update existing profile
router.put("/", protect, async (req, res) => {
  try {
    // User ID from auth middleware
    const userId = req.user.user_id;
    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User not authenticated." });
    }

    const {
      name,
      batch,
      branch,
      campus,
      department,
      bio,
      current_company,
      current_role,
      location,
      social_media,
      skills,
      experience,
    } = req.body;

    // Fetch role early for faculty/department validation
    const profileOwner = await User.findById(userId).select("role");
    const isFacultyOwner = profileOwner && profileOwner.role === "faculty";

    // Validate required fields if provided
    if (isFacultyOwner) {
      if (department !== undefined || campus !== undefined) {
        if (!department || !campus) {
          return res.status(400).json({
            error: "If updating academic info, department and campus are both required.",
          });
        }
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
        if (!DEPARTMENTS.includes(department)) {
          return res.status(400).json({
            error: `Invalid department. Must be one of: ${DEPARTMENTS.join(", ")}`,
          });
        }
      }
      // Disallow batch/branch for faculty
      if (batch !== undefined || branch !== undefined) {
        return res.status(400).json({
          error: "Faculty profiles use department, not batch/branch.",
        });
      }
    } else {
      if (batch !== undefined || branch !== undefined || campus !== undefined) {
        if (!batch || !branch || !campus) {
          return res.status(400).json({
            error:
              "If updating academic info, batch, branch, and campus are all required.",
          });
        }
      }
      if (department !== undefined) {
        return res.status(400).json({
          error: "Only faculty profiles use department.",
        });
      }
    }

    // Validate campus enum if provided
    if (campus) {
      const validCampuses = ["Main Campus", "West Campus", "East Campus"];
      if (!validCampuses.includes(campus)) {
        return res.status(400).json({
          error: `Invalid campus. Must be one of: ${validCampuses.join(", ")}`,
        });
      }
    }

    // Find existing profile
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res
        .status(404)
        .json({ error: "Profile not found. Please create a profile first." });
    }

    // Update User name if provided
    if (name !== undefined && name.trim()) {
      await User.findByIdAndUpdate(userId, { name: name.trim() });
    }

    // Update fields
    if (batch !== undefined) profile.batch = batch;
    if (branch !== undefined) profile.branch = branch;
    if (department !== undefined) profile.department = department;
    if (campus !== undefined) profile.campus = campus;
    if (bio !== undefined) profile.bio = bio;
    if (current_company !== undefined) profile.current_company = current_company;
    if (current_role !== undefined) profile.current_role = current_role;
    if (social_media !== undefined) profile.social_media = { ...profile.social_media, ...social_media };
    if (skills !== undefined) profile.skills = skills;
    if (experience !== undefined) profile.experience = experience;
    if (location !== undefined) {
      const user = await User.findById(userId).select("role");
      if (user && user.role === "alumni") {
        if (location && location.city && location.country) {
          const { normalizeCityAndCountry, getCanonicalLocation } = require("../../config/canonicalCities");
          const norm = normalizeCityAndCountry(location.city, location.country);
          const canonical = getCanonicalLocation(location.city, location.country);

          profile.location = {
            city: norm.displayCity.toLowerCase(),
            country: norm.displayCountry.toLowerCase(),
            // Use != null (not falsy) so a real coordinate of 0 (equator /
            // prime meridian) is preserved instead of being dropped; null and
            // undefined both fall through to "no coordinates yet".
            lat: canonical.isCanonical ? canonical.lat : (location.lat != null ? location.lat : undefined),
            lng: canonical.isCanonical ? canonical.lng : (location.lng != null ? location.lng : undefined),
          };
        } else {
          profile.location = location;
        }
      }
    }

    await profile.save();

    // Invalidate alumni-map cache whenever the location is provided at all —
    // even when it is cleared to {} — so removed pins disappear immediately
    // instead of lingering for up to the 1h cache TTL.
    if (location !== undefined) {
      await invalidateAlumniMapCache();
    }

    // Queue for geocoding if location updated but no coordinates (lat/lng of 0
    // are valid coordinates, so only null/undefined mean "not yet geocoded").
    if (
      location &&
      location.city &&
      location.country &&
      (location.lat == null || location.lng == null)
    ) {
      try {
        await addToQueue(userId, location.city, location.country);
      } catch (queueError) {
        // Geocoding is a background task — a Redis blip must NOT fail a profile
        // update that already succeeded, nor return a misleading 500.
        console.error(
          "Failed to enqueue geocoding job; coordinates will be filled later:",
          queueError,
        );
      }
    }

    res.status(200).json({ message: "Profile updated successfully.", profile });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: err.message || "Internal server error." });
  }
});

module.exports = router;
