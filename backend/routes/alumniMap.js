const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const Profile = require("../models/user/profile.model");

// 60 requests per 15 minutes per IP
const mapRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// GET /api/alumni-map - Return alumni locations for map visualization
router.get("/", mapRateLimiter, async (req, res) => {
  try {
    // Find all profiles with valid location coordinates
    const profilesWithLocations = await Profile.find({
      "location.lat": { $exists: true, $ne: null },
      "location.lng": { $exists: true, $ne: null },
    })
      .populate({
        path: "user",
        match: { role: "alumni" },
        select: "role",
      })
      .select("location");

    // Filter out profiles where user didn't match (not alumni or user deleted)
    const locations = profilesWithLocations
      .filter((profile) => profile.user !== null)
      .map((profile) => ({
        city: profile.location?.city || "Unknown",
        country: profile.location?.country || "Unknown",
        lat: profile.location?.lat || 0,
        lng: profile.location?.lng || 0,
      }));

    res.status(200).json({ locations });
  } catch (error) {
    console.error("Error fetching alumni map data:", error);
    res.status(200).json({ locations: [] });
  }
});

module.exports = router;
