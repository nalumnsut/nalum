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
    const locations = await Profile.aggregate([
      {
        $match: {
          "location.lat": { $exists: true, $ne: null },
          "location.lng": { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $match: {
          "userInfo.role": "alumni",
        },
      },
      {
        $group: {
          _id: {
            city: "$location.city",
            country: "$location.country",
          },
          count: { $sum: 1 },
          lat: { $first: "$location.lat" },
          lng: { $first: "$location.lng" },
        },
      },
      {
        $project: {
          _id: 0,
          city: { $ifNull: ["$_id.city", "Unknown"] },
          country: { $ifNull: ["$_id.country", "Unknown"] },
          count: 1,
          lat: 1,
          lng: 1,
        },
      },
    ]);

    res.status(200).json({ locations });
  } catch (error) {
    console.error("Error fetching alumni map data:", error);
    res.status(500).json({ error: "Failed to load alumni map data" });
  }
});

module.exports = router;
