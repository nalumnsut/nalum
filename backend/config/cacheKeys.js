const { getRedisClient } = require("./redis.config");

// Centralized Redis cache & queue keys for the Alumni Map feature. Keeping keys
// in a single module prevents key typos from breaking caching and queue
// processing across backend controllers and workers.
const ALUMNI_MAP_LOCATIONS_KEY = "alumni-map:locations";
const GEOCODING_QUEUE_KEY = "geocoding:queue";
const GEOCODING_PROCESSING_KEY = "geocoding:processing";
const GEOCODING_IN_PROGRESS_KEY = "geocoding:in_progress";
const GEOCODING_ERROR_COUNT_KEY = "geocoding:error_count";
const GEOCODING_WORKER_LOCK_KEY = "geocoding:worker_lock";
const GEOCODING_FAILED_KEY = "geocoding:failed";

// Best-effort invalidation of the alumni map cache. Never throws — Redis
// unavailability should not fail a request that already succeeded in the DB.
async function invalidateAlumniMapCache() {
  try {
    const redis = getRedisClient();
    await redis.del(ALUMNI_MAP_LOCATIONS_KEY);
  } catch (err) {
    console.warn(
      "[cache] Failed to invalidate alumni-map cache:",
      err && err.message ? err.message : err
    );
  }
}

module.exports = {
  ALUMNI_MAP_LOCATIONS_KEY,
  GEOCODING_QUEUE_KEY,
  GEOCODING_PROCESSING_KEY,
  GEOCODING_IN_PROGRESS_KEY,
  GEOCODING_ERROR_COUNT_KEY,
  GEOCODING_WORKER_LOCK_KEY,
  GEOCODING_FAILED_KEY,
  invalidateAlumniMapCache,
};
