const express = require("express");
const router = express.Router();
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/auth");
const { getQueueStatus } = require("../services/geocodingQueue");
const { normalizeCityAndCountry } = require("../config/canonicalCities");
const { getRedisClient } = require("../config/redis.config");

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

// Rate limiter for reverse geocoding to prevent abuse
const reverseRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reverse geocoding requests, please try again later." },
});

// Coordinate validation: reject null, undefined, empty string, non-finite numbers
const isFiniteCoordinate = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

// POST /api/geocode/reverse - Reverse geocode coordinates to City & Country
router.post("/reverse", protect, reverseRateLimiter, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!isFiniteCoordinate(lat) || !isFiniteCoordinate(lng)) {
      return res
        .status(400)
        .json({ error: "Valid latitude and longitude are required" });
    }

    const numericLat = Number(lat);
    const numericLng = Number(lng);

    if (
      numericLat < -90 ||
      numericLat > 90 ||
      numericLng < -180 ||
      numericLng > 180
    ) {
      return res.status(400).json({ error: "Coordinates out of bounds" });
    }

    // Check Redis cache first (~110m precision via 3 decimals)
    const normLat = Math.abs(numericLat) < 0.0005 ? 0 : numericLat;
    const normLng = Math.abs(numericLng) < 0.0005 ? 0 : numericLng;
    const cacheKey = `geocoding:reverse:${normLat.toFixed(3)}:${normLng.toFixed(3)}`;
    let redis = null;
    try {
      redis = getRedisClient();
      if (redis && typeof redis.get === "function") {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.displayCity || parsed.city || parsed.displayCountry || parsed.country)) {
            return res.status(200).json(parsed);
          }
        }
      }
    } catch (cacheErr) {
      // Redis unavailable or read failed; proceed to live lookup
    }

    let response;
    try {
      response = await axios.get(NOMINATIM_REVERSE_URL, {
        params: {
          lat: numericLat,
          lon: numericLng,
          format: "json",
          zoom: 10,
          addressdetails: 1,
        },
        headers: {
          "User-Agent": "NSUT-Alumni-Network/1.0",
        },
        timeout: 10000,
      });
    } catch (axiosErr) {
      if (axiosErr.response && axiosErr.response.status === 429) {
        return res.status(429).json({
          error: "Geocoding service rate limit reached. Please try again shortly or enter location manually.",
        });
      }
      if (axiosErr.response && axiosErr.response.status === 403) {
        console.error("Nominatim 403 Forbidden:", axiosErr.response.data);
        return res.status(503).json({
          error: "Geocoding service temporarily unavailable. Please enter location manually.",
        });
      }
      throw axiosErr;
    }

    const data = response.data || {};
    if (data.error) {
      return res.status(404).json({
        error: "Could not determine location for the given coordinates",
      });
    }

    const address = data.address || {};

    const rawCity =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.suburb ||
      address.borough ||
      address.city_district ||
      address.district ||
      address.quarter ||
      address.hamlet ||
      address.county ||
      address.state_district ||
      address.state ||
      "";
    const rawCountry = address.country || "";

    if (!rawCity && !rawCountry) {
      return res.status(404).json({
        error: "Could not determine location for the given coordinates",
      });
    }

    let normalizedCity = "";
    let normalizedCountry = "";
    let displayCity = "";
    let displayCountry = "";

    if (rawCity || rawCountry) {
      const norm = normalizeCityAndCountry(rawCity || "unknown", rawCountry);
      if (rawCity) {
        normalizedCity = norm.normalizedCity;
        displayCity = norm.displayCity;
      }
      if (rawCountry) {
        normalizedCountry = norm.normalizedCountry;
        displayCountry = norm.displayCountry;
      }
    }

    const resultPayload = {
      city: displayCity,
      country: normalizedCountry,
      normalizedCity,
      normalizedCountry,
      displayCity,
      displayCountry,
      lat: numericLat,
      lng: numericLng,
    };

    // Cache in Redis for 24 hours only if a valid city or country was resolved
    if ((displayCity || normalizedCountry) && redis && typeof redis.set === "function") {
      try {
        await redis.set(cacheKey, JSON.stringify(resultPayload), {
          EX: 86400,
        });
      } catch (setCacheErr) {
        // Best-effort cache set
      }
    }

    res.status(200).json(resultPayload);
  } catch (error) {
    console.error("Reverse geocoding error:", error && error.message ? error.message : error);
    res.status(500).json({ error: "Failed to reverse geocode location" });
  }
});

// GET /api/geocode/status - Get current status of the global geocoding queue
router.get("/status", protect, async (req, res) => {
  try {
    const status = await getQueueStatus();
    res.status(200).json({ success: true, status });
  } catch (error) {
    console.error("Geocoding queue status error:", error);
    res.status(500).json({ error: "Failed to fetch queue status" });
  }
});

module.exports = router;
