const { Queue, Worker } = require("bullmq");
const Redis = require("redis");
const mailService = require("../mail/mailService");
const User = require("../models/user/user.model");

// Parse Redis connection details
function getRedisConnectionOptions() {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname || "localhost",
      port: parseInt(url.port || "6379", 10),
      username: url.username || undefined,
      password: url.password || undefined,
      maxRetriesPerRequest: null,
    };
  } catch (err) {
    return {
      host: "localhost",
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
}

const connection = getRedisConnectionOptions();
const QUEUE_NAME = "admin-post-email-queue";
const DAILY_EMAIL_LIMIT = 100; // Lowered to leave room for OTP emails

// Create Redis client for rate limiting tracking
const redisClient = Redis.createClient({
  socket: {
    host: connection.host,
    port: connection.port,
  },
  username: connection.username,
  password: connection.password,
});

redisClient.on("error", (err) => {
  console.error("[Redis Client] Error:", err);
});

redisClient.connect().catch(console.error);

/**
 * Get the current date in YYYY-MM-DD format for rate limiting key
 */
function getDateKey() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Check and increment daily email counter
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date}>}
 */
async function checkDailyLimit() {
  const dateKey = getDateKey();
  const redisKey = `email:daily:${dateKey}`;

  const currentCount = parseInt((await redisClient.get(redisKey)) || "0", 10);

  if (currentCount >= DAILY_EMAIL_LIMIT) {
    // Calculate when limit resets (midnight UTC)
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return {
      allowed: false,
      remaining: 0,
      resetAt: tomorrow,
    };
  }

  return {
    allowed: true,
    remaining: DAILY_EMAIL_LIMIT - currentCount,
    resetAt: null,
  };
}

/**
 * Increment the daily email counter
 */
async function incrementDailyCounter(count = 1) {
  const dateKey = getDateKey();
  const redisKey = `email:daily:${dateKey}`;

  const newCount = await redisClient.incrBy(redisKey, count);

  // Set expiry to end of tomorrow (to clean up old keys)
  await redisClient.expireAt(redisKey, Math.floor(Date.now() / 1000) + 86400 * 2);

  return newCount;
}

// 1. Create BullMQ Queue for admin post email broadcasts
const emailQueue = new Queue(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // retry after 5s, 10s...
    },
    removeOnComplete: 100, // Keep last 100 completed jobs for audit
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

// 2. Create BullMQ Worker to process background email sending with rate limiting
const emailWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`[BullMQ Worker] Processing job ${job.id}: Admin Post Notification (${job.data.postId})`);

    const { postId, title, content, authorName, recipients } = job.data;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const postLink = `${frontendUrl}/dashboard/posts/${postId}`;

    // Check daily limit
    const limitCheck = await checkDailyLimit();

    if (!limitCheck.allowed) {
      console.log(
        `[BullMQ Worker] Daily limit reached (${DAILY_EMAIL_LIMIT}). Job will retry tomorrow at ${limitCheck.resetAt}`
      );

      // Schedule job to retry after midnight
      const delayUntilMidnight = limitCheck.resetAt.getTime() - Date.now();
      throw new Error(`Daily email limit reached. Retrying at ${limitCheck.resetAt.toISOString()}`);
    }

    // Determine how many emails we can send today
    const emailsToSend = Math.min(recipients.length, limitCheck.remaining);

    if (emailsToSend < recipients.length) {
      console.log(
        `[BullMQ Worker] Can only send ${emailsToSend} of ${recipients.length} emails today (limit: ${limitCheck.remaining})`
      );
    }

    // Truncate content preview for email
    const contentPreview = content.length > 250 ? content.substring(0, 250) + "..." : content;

    let successCount = 0;
    let failureCount = 0;

    // Send emails in batches of 10
    const BATCH_SIZE = 10;
    const recipientsBatch = recipients.slice(0, emailsToSend);

    for (let i = 0; i < recipientsBatch.length; i += BATCH_SIZE) {
      const batch = recipientsBatch.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((user) =>
          mailService.send({
            to: user.email,
            subject: `📢 Admin Announcement: ${title || "New Update"}`,
            template: "admin-post-notification",
            data: {
              name: user.name,
              authorName: authorName || "Portal Admin",
              postTitle: title || "",
              postContent: contentPreview,
              postLink,
            },
          })
        )
      );

      results.forEach((res) => {
        if (res.status === "fulfilled" && !res.value?.error) {
          successCount++;
        } else {
          failureCount++;
        }
      });
    }

    // Update the daily counter
    await incrementDailyCounter(successCount);

    // If we couldn't send to everyone, re-queue the remaining
    if (emailsToSend < recipients.length) {
      const remainingRecipients = recipients.slice(emailsToSend);

      await emailQueue.add(
        "send-admin-post-email",
        {
          postId,
          title,
          content,
          authorName,
          recipients: remainingRecipients,
        },
        {
          jobId: `post-email-${postId}-continuation-${Date.now()}`,
          delay: 86400000, // Retry after 24 hours
        }
      );

      console.log(
        `[BullMQ Worker] Re-queued ${remainingRecipients.length} remaining recipients for tomorrow`
      );
    }

    console.log(
      `[BullMQ Worker] Completed job ${job.id}: Sent ${successCount} emails successfully (${failureCount} failed). ${recipients.length - emailsToSend} deferred to tomorrow.`
    );

    return {
      total: recipients.length,
      sent: successCount,
      failed: failureCount,
      deferred: recipients.length - emailsToSend,
    };
  },
  {
    connection,
    concurrency: 1, // Process one broadcast job at a time to respect rate limits
  }
);

emailWorker.on("completed", (job, returnvalue) => {
  console.log(`[BullMQ Worker] Job ${job.id} completed successfully:`, returnvalue);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err);
});

/**
 * Queue an Admin Post Broadcast job in BullMQ
 * This will send emails to all alumni, respecting the 250/day limit
 */
async function queueAdminPostBroadcast(post, author, recipientGroups) {
  try {
    const groupRoles = { all: ["admin", "alumni", "student", "faculty"], alumni: ["alumni"], students: ["student"], faculty: ["faculty"] };
    const roles = [...new Set(recipientGroups.flatMap((group) => groupRoles[group] || []))];
    if (!roles.length) return null;
    const alumniList = await User.find({ role: { $in: roles } }).select("name email").lean();

    if (alumniList.length === 0) {
      console.log(`[BullMQ Queue] No alumni found to notify for post ${post._id}`);
      return null;
    }

    console.log(`[BullMQ Queue] Queuing email broadcast to ${alumniList.length} alumni for post ${post._id}`);

    const job = await emailQueue.add(
      "send-admin-post-email",
      {
        postId: post._id.toString(),
        title: post.title || "",
        content: post.content || "",
        authorName: author.name || "Portal Admin",
        recipients: alumniList,
      },
      {
        jobId: `post-email-${post._id}`, // Ensures duplicate jobs aren't created for the same post
      }
    );

    console.log(`[BullMQ Queue] Enqueued email broadcast job ${job.id} for post ${post._id}`);
    return job;
  } catch (error) {
    console.error("[BullMQ Queue] Error enqueueing email broadcast job:", error);
    throw error;
  }
}

/**
 * Get current daily email statistics
 */
async function getDailyEmailStats() {
  const dateKey = getDateKey();
  const redisKey = `email:daily:${dateKey}`;
  const currentCount = parseInt((await redisClient.get(redisKey)) || "0", 10);

  return {
    sent: currentCount,
    limit: DAILY_EMAIL_LIMIT,
    remaining: Math.max(0, DAILY_EMAIL_LIMIT - currentCount),
    date: dateKey,
  };
}

module.exports = {
  emailQueue,
  emailWorker,
  queueAdminPostBroadcast,
  getDailyEmailStats,
};
