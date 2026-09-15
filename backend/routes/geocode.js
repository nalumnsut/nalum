const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getQueueStatus, addReverseToQueue } = require("../services/geocodingQueue");
const { getRedisClient } = require("../config/redis.config");

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 20000;

// Coordinate validation: reject null, undefined, empty string, non-finite numbers
const isFiniteCoordinate = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// POST /api/geocode/reverse - Reverse geocode coordinates to City & Country.
// Enqueues onto the shared geocoding queue (same 1 req/sec pacing as forward
// geocoding, no direct Nominatim call here) and waits for that specific item
// to be processed before responding, so the caller gets one request/response
// cycle with a real resolved result rather than needing to poll separately.
router.post("/reverse", protect, async (req, res) => {
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

    const { user_id: userId } = req.user;
    const requestId = await addReverseToQueue(userId, numericLat, numericLng);
    const resultKey = `geocoding:result:${requestId}`;
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      let stored = null;
      try {
        const redis = getRedisClient();
        stored = await redis.get(resultKey);
      } catch (pollErr) {
        // Transient Redis hiccup — treat as "not yet available" and keep
        // polling within the same overall timeout budget.
        console.error(
          "[geocode] Poll attempt failed, retrying:",
          pollErr && pollErr.message ? pollErr.message : pollErr,
        );
      }

      if (stored) {
        try {
          const redis = getRedisClient();
          await redis.del(resultKey);
        } catch (delErr) {
          // Best-effort cleanup only; the key has a short TTL regardless.
        }

        const parsed = JSON.parse(stored);
        if (parsed.error) {
          return res.status(404).json({
            error: "Could not determine location for the given coordinates",
          });
        }
        return res.status(200).json(parsed);
      }

      await sleep(POLL_INTERVAL_MS);
    }

    return res.status(504).json({
      error:
        "Geocoding is taking longer than expected. Please try again or enter your location manually.",
    });
  } catch (error) {
    console.error(
      "Reverse geocoding error:",
      error && error.message ? error.message : error,
    );
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
