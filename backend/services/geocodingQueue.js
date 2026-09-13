const axios = require("axios");
const { getRedisClient } = require("../config/redis.config");
const Profile = require("../models/user/profile.model");
const {
  GEOCODING_QUEUE_KEY: QUEUE_KEY,
  GEOCODING_PROCESSING_KEY: PROCESSING_KEY,
  GEOCODING_ERROR_COUNT_KEY: ERROR_COUNT_KEY,
  GEOCODING_IN_PROGRESS_KEY: IN_PROGRESS_KEY,
  GEOCODING_WORKER_LOCK_KEY: WORKER_LOCK_KEY,
  GEOCODING_FAILED_KEY: FAILED_KEY,
  invalidateAlumniMapCache,
} = require("../config/cacheKeys");
const { getCanonicalLocation } = require("../config/canonicalCities");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Nominatim's usage policy is ~1 request/second, aggregate, for the whole app.
// The pacing loop is a self-scheduling setTimeout chain, NOT a setInterval:
// the next request is only scheduled after the previous one has completed, so
// the gap between request starts is always >= RATE_LIMIT_MS even when a
// response is slower than 1s. (A setInterval with an async callback would fire
// overlapping requests whenever a response outlives the tick.)
const RATE_LIMIT_MS = 1000;

// Max attempts per queue item before it is dropped (dead-lettered) to avoid
// infinite retry loops on permanent failures (e.g. ungeocodable city names).
const MAX_RETRIES = 5;

// Exponential backoff delays after rate-limit responses
const BACKOFF_DELAYS = {
  1: 5 * 60 * 1000, // 5 minutes
  2: 15 * 60 * 1000, // 15 minutes
  3: 60 * 60 * 1000, // 1 hour
};

// Distributed worker lock: only one backend instance may run the pacing loop,
// so the aggregate request rate stays at 1/sec even if the app is scaled to
// multiple replicas. lMove already prevents double-processing; this prevents
// double request rate. A crashed worker's lock expires via the TTL.
//
// Assumption: a single tick (one geocode + one Mongo write + Redis ops) never
// outlives LOCK_TTL_SECONDS. If it ever could, the per-tick renewal (plain SET
// EX) and stopProcessing's unconditional DEL could clobber a new owner's lock
// after TTL expiry — the renewal would need an ownership check instead.
const LOCK_TTL_SECONDS = 60;
const WORKER_ID = `${process.pid}-${Date.now()}`;

let isProcessing = false;
let processingTimeout = null;
let backoffTimeout = null;
let standbyTimeout = null;
let resumeTimeout = null;
let pausedUntil = 0; // ms timestamp; 0 = not in a backoff pause

// Add a user to the geocoding queue
async function addToQueue(userId, city, country) {
  try {
    const redis = getRedisClient();
    const queueItem = JSON.stringify({
      userId,
      city,
      country,
      addedAt: Date.now(),
    });
    await redis.rPush(QUEUE_KEY, queueItem);
    console.log(
      `Added user ${userId} to geocoding queue (${city}, ${country})`,
    );

    // Start processing if not already running
    if (!isProcessing) {
      startProcessing();
    }
  } catch (error) {
    console.error("Error adding to geocoding queue:", error);
    throw error;
  }
}

// Geocode a city/country using OpenStreetMap Nominatim API with canonical validation
async function geocodeLocation(city, country) {
  try {
    const canonical = getCanonicalLocation(city, country);
    if (canonical.isCanonical) {
      console.log(
        `✓ Using canonical coordinates for ${city}, ${country}: lat=${canonical.lat}, lng=${canonical.lng}`
      );
      return [canonical.lat, canonical.lng];
    }

    const query = `${city}, ${country}`;
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: query,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "NSUT-Alumni-Network/1.0",
      },
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const geocodedLat = parseFloat(result.lat);
      const geocodedLng = parseFloat(result.lon);

      // Guard against malformed responses persisting NaN coordinates in Mongo
      if (Number.isFinite(geocodedLat) && Number.isFinite(geocodedLng)) {
        return [geocodedLat, geocodedLng];
      }
    }

    console.warn(`No geocoding results for: ${query}`);
    return null;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    console.error(`Geocoding error for ${city}, ${country}:`, error.message);
    console.error(`Full error:`, error);
    throw error;
  }
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Requeue items left in the in-progress list by a previously crashed worker.
// Idempotent — a duplicate geocode is harmless (it just re-sets lat/lng).
async function recoverInProgressItems() {
  try {
    const redis = getRedisClient();
    while ((await redis.lLen(IN_PROGRESS_KEY)) > 0) {
      const stuck = await redis.rPop(IN_PROGRESS_KEY);
      if (!stuck) break;
      await redis.lPush(QUEUE_KEY, stuck);
      console.warn(
        "[geocoding] Requeued in-progress item from previous run:",
        stuck,
      );
    }
  } catch (error) {
    console.error(
      "[geocoding] Failed to recover in-progress items:",
      error.message,
    );
  }
}

// Process one item from the queue
async function processNextItem() {
  let redis;
  let item = null;

  try {
    redis = getRedisClient();

    // Atomically claim an item so concurrent workers never process the same
    // one (lMove works across instances; lPop does not).
    item = await redis.lMove(QUEUE_KEY, IN_PROGRESS_KEY, "LEFT", "RIGHT");
    if (!item) {
      console.log("Geocoding queue is empty");
      stopProcessing();
      // Close the race where an item is enqueued between the empty lMove and
      // this worker stopping: isProcessing is already false here, so either we
      // detect the new item and restart, or a concurrent addToQueue starts a
      // fresh worker. Either way no item is stranded.
      try {
        if ((await redis.lLen(QUEUE_KEY)) > 0) {
          startProcessing();
        }
      } catch (err) {
        console.error(
          "[geocoding] Failed to re-check queue length:",
          err && err.message ? err.message : err,
        );
      }
      return;
    }

    const parsed = safeParse(item);
    if (!parsed) {
      // Corrupt item — drop it so it can't block the queue forever.
      console.error("[geocoding] Dropping corrupt queue item:", item);
      await redis.lRem(IN_PROGRESS_KEY, 1, item);
      await redis.del(PROCESSING_KEY);
      return;
    }

    const { userId, city, country } = parsed;
    console.log(`Processing geocoding for user ${userId}: ${city}, ${country}`);

    // Mark as processing (observability only; concurrency is handled by lMove)
    await redis.set(PROCESSING_KEY, userId, { EX: 60 });

    // Geocode the location
    const result = await geocodeLocation(city, country);

    // A missing or non-finite result is a retryable failure: it goes through
    // the same retry/dead-letter path as network errors below, so the failure
    // is observable instead of being dropped silently with no trace.
    if (!result || !Number.isFinite(result[0]) || !Number.isFinite(result[1])) {
      throw new Error("NO_USABLE_RESULT");
    }

    const [lat, lng] = result;

    // Update user profile with lat/lng
    await Profile.findOneAndUpdate(
      { user: userId },
      {
        "location.lat": lat,
        "location.lng": lng,
      },
    );
    console.log(`✓ Geocoded user ${userId}: lat=${lat}, lng=${lng}`);

    // Reset error count (rolling 1h window so it can't grow unbounded)
    await redis.set(ERROR_COUNT_KEY, 0, { EX: 3600 });

    // Invalidate alumni-map cache so the new pin shows up immediately
    await invalidateAlumniMapCache();

    // Clear processing flag and remove item from the in-progress list
    await redis.del(PROCESSING_KEY);
    await redis.lRem(IN_PROGRESS_KEY, 1, item);
  } catch (error) {
    console.error("Error processing queue item:", error.message);

    // Release the claimed item from the in-progress list
    if (item) {
      try {
        await redis.lRem(IN_PROGRESS_KEY, 1, item);
      } catch (remErr) {
        console.error(
          "[geocoding] Failed to remove item from in-progress list:",
          remErr.message,
        );
      }
    }

    if (error.message === "RATE_LIMIT") {
      // Re-queue so the item is NOT lost — retried after the backoff window.
      // Rate-limit retries do not count toward MAX_RETRIES (backoff throttles
      // them instead).
      if (item) {
        const parsed = safeParse(item);
        if (parsed) {
          await redis.rPush(QUEUE_KEY, JSON.stringify(parsed));
          console.warn(
            `[geocoding] Re-queued item for user ${parsed.userId} after rate limit`,
          );
        }
      }
      await handleRateLimit(redis);
      await redis.del(PROCESSING_KEY);
      return;
    }

    const isNoResult = error.message === "NO_USABLE_RESULT";

    // Non-rate-limit failure: retry up to MAX_RETRIES, then dead-letter so a
    // permanently failing item can't spin forever.
    if (item) {
      const parsed = safeParse(item);
      if (parsed) {
        parsed.retries = (parsed.retries || 0) + 1;
        if (parsed.retries <= MAX_RETRIES) {
          await redis.rPush(QUEUE_KEY, JSON.stringify(parsed));
          console.warn(
            `[geocoding] Re-queued item for user ${parsed.userId} after ${
              isNoResult ? "no usable geocode result" : "error"
            } (retry ${parsed.retries}/${MAX_RETRIES})`,
          );
        } else {
          console.error(
            `[geocoding] Dead-lettering item for user ${parsed.userId} after ${MAX_RETRIES} failed attempts (${parsed.city}, ${parsed.country})${
              isNoResult ? " — no usable geocode result" : ""
            }. Manual intervention required.`,
          );
          try {
            if (typeof redis.sAdd === "function") {
              await redis.sAdd(
                FAILED_KEY,
                JSON.stringify({
                  userId: parsed.userId,
                  city: parsed.city,
                  country: parsed.country,
                  failedAt: Date.now(),
                  reason: isNoResult ? "NO_RESULT" : "ERROR",
                }),
              );
            }
          } catch (failedErr) {
            console.error(
              "[geocoding] Failed to record dead-lettered item in Redis:",
              failedErr && failedErr.message ? failedErr.message : failedErr,
            );
          }
        }
      }
    }

    await redis.del(PROCESSING_KEY);
  }
}

// Handle rate limit error with exponential backoff
async function handleRateLimit(redis) {
  const errorCount = await redis.incr(ERROR_COUNT_KEY);
  // Rolling 1-hour window so a slow trickle of 429s can't accumulate forever
  await redis.expire(ERROR_COUNT_KEY, 3600);

  const delay = BACKOFF_DELAYS[errorCount] || BACKOFF_DELAYS[3];

  console.error(
    `⚠️ Rate limit hit! Error count: ${errorCount}. Pausing for ${delay / 1000}s`,
  );

  if (errorCount >= 3) {
    // Keep backing off at the max delay — never stop permanently. Log loudly
    // so humans can review Nominatim usage.
    console.error(
      "🛑 Multiple consecutive rate-limit errors. Processing paused with max backoff (1h). Verify Nominatim usage and consider a self-hosted geocoder.",
    );
    // TODO: Send alert to admins
  }

  // Record the pause so startProcessing() (e.g. from a new addToQueue) does not
  // immediately resume hammering Nominatim during the backoff window.
  pausedUntil = Date.now() + delay;

  // Stop processing and restart after delay (items are safe in the queue)
  stopProcessing();
  backoffTimeout = setTimeout(() => {
    backoffTimeout = null;
    pausedUntil = 0;
    console.log("Resuming geocoding queue processing after backoff period");
    startProcessing();
  }, delay);
}

// Start the queue processor. The pacing loop is a self-scheduling setTimeout
// chain: the next tick is scheduled only after the current one finishes, so
// consecutive Nominatim requests are always >= RATE_LIMIT_MS apart, even when
// responses are slow. Also acquires a distributed lock so only one backend
// instance runs the loop when the app is scaled horizontally.
function startProcessing() {
  if (isProcessing) return;

  // Respect an active backoff pause — don't restart early.
  if (pausedUntil && Date.now() < pausedUntil) {
    resumeTimeout = setTimeout(() => {
      resumeTimeout = null;
      if (!isProcessing) startProcessing();
    }, pausedUntil - Date.now());
    return;
  }
  pausedUntil = 0;

  // The lock acquisition is async; do it in a fire-and-forget wrapper so call
  // sites (addToQueue, index.js startup) don't have to await startProcessing.
  (async () => {
    try {
      const redis = getRedisClient();
      const acquired = await redis.set(WORKER_LOCK_KEY, WORKER_ID, {
        NX: true,
        EX: LOCK_TTL_SECONDS,
      });
      if (!acquired) {
        // Another instance owns the loop; retry after the lock TTL so we take
        // over if that instance crashes while items are still queued.
        console.log(
          "[geocoding] Another instance holds the worker lock; standing by",
        );
        standbyTimeout = setTimeout(() => {
          standbyTimeout = null;
          startProcessing();
        }, LOCK_TTL_SECONDS * 1000);
        return;
      }
    } catch (err) {
      console.error(
        "[geocoding] Failed to acquire worker lock:",
        err && err.message ? err.message : err,
      );
      return;
    }

    if (isProcessing) {
      // Defensive: if another path started the loop while we were acquiring
      // the lock, release the lock we just won so it doesn't linger for the
      // full TTL. (Not reachable today — only the lock winner can set
      // isProcessing — but cheap insurance against future refactors.)
      try {
        await redis.del(WORKER_LOCK_KEY);
      } catch (err) {
        // Lock will expire via TTL
      }
      return;
    }

    isProcessing = true;
    console.log("Started geocoding queue processor (1 req/sec)");

    // Recover items left in-progress by a crashed worker (idempotent)
    recoverInProgressItems();

    processingTimeout = setTimeout(tick, RATE_LIMIT_MS);
  })();
}

async function tick() {
  try {
    await processNextItem();
  } catch (err) {
    // Defensive: never let a rejected promise escape the tick
    console.error(
      "[geocoding] Unhandled error in queue tick:",
      err && err.message ? err.message : err,
    );
  } finally {
    // Only renew the lock / schedule the next tick if this tick's own
    // processing did not already stop the loop (empty queue or rate-limit
    // pause call stopProcessing, which releases the lock). Renewing the lock
    // after a release would block other instances for the full TTL.
    if (isProcessing) {
      try {
        const redis = getRedisClient();
        let shouldRenew = true;
        if (typeof redis.get === "function") {
          const currentOwner = await redis.get(WORKER_LOCK_KEY);
          if (currentOwner && currentOwner !== WORKER_ID) {
            shouldRenew = false;
            console.warn(
              "[geocoding] Lost worker lock ownership during tick; stopping processor",
            );
            stopProcessing();
          }
        }
        if (shouldRenew) {
          await redis.set(WORKER_LOCK_KEY, WORKER_ID, { EX: LOCK_TTL_SECONDS });
        }
      } catch (err) {
        // Best-effort: a failed renew just means the lock TTL will let another
        // instance take over after LOCK_TTL_SECONDS.
        console.error(
          "[geocoding] Failed to renew worker lock:",
          err && err.message ? err.message : err,
        );
      }
      if (isProcessing) {
        processingTimeout = setTimeout(tick, RATE_LIMIT_MS);
      }
    }
  }
}

// Stop the queue processor
function stopProcessing() {
  if (processingTimeout) {
    clearTimeout(processingTimeout);
    processingTimeout = null;
  }
  if (backoffTimeout) {
    clearTimeout(backoffTimeout);
    backoffTimeout = null;
  }
  if (standbyTimeout) {
    clearTimeout(standbyTimeout);
    standbyTimeout = null;
  }
  if (resumeTimeout) {
    clearTimeout(resumeTimeout);
    resumeTimeout = null;
  }
  pausedUntil = 0;
  if (isProcessing) {
    isProcessing = false;
    // Best-effort release of the distributed lock (only if still owned by this worker)
    try {
      const redis = getRedisClient();
      if (typeof redis.get === "function") {
        redis
          .get(WORKER_LOCK_KEY)
          .then((currentOwner) => {
            if (currentOwner === WORKER_ID) {
              redis.del(WORKER_LOCK_KEY).catch(() => {});
            }
          })
          .catch(() => {});
      } else {
        redis.del(WORKER_LOCK_KEY).catch(() => {});
      }
    } catch (err) {
      // Redis unavailable — the lock will expire via TTL
    }
  }
  console.log("Stopped geocoding queue processor");
}

// Get current queue status
async function getQueueStatus() {
  try {
    const redis = getRedisClient();
    const queueLength = await redis.lLen(QUEUE_KEY);
    const inProgressLength = await redis.lLen(IN_PROGRESS_KEY);
    const errorCount = (await redis.get(ERROR_COUNT_KEY)) || 0;
    const currentlyProcessing = await redis.get(PROCESSING_KEY);

    const status = {
      queueLength,
      inProgressLength,
      errorCount: parseInt(errorCount),
      isProcessing,
      pausedUntil: pausedUntil || null,
      currentlyProcessing,
    };

    if (typeof redis.sCard === "function") {
      try {
        const failedCount = await redis.sCard(FAILED_KEY);
        status.failedCount = parseInt(failedCount) || 0;
      } catch (cardErr) {
        // ignore
      }
    }

    return status;
  } catch (error) {
    console.error("Error getting queue status:", error);
    return null;
  }
}

module.exports = {
  addToQueue,
  startProcessing,
  stopProcessing,
  getQueueStatus,
  // Exported for tests / observability
  _internal: {
    QUEUE_KEY,
    IN_PROGRESS_KEY,
    ERROR_COUNT_KEY,
    FAILED_KEY,
    WORKER_LOCK_KEY,
    MAX_RETRIES,
    processNextItem,
    handleRateLimit,
  },
};
