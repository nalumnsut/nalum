/**
 * mentionHelper.js
 *
 * Extracts @Name mentions from text, resolves them to user IDs,
 * and fires "post_mention" notifications for each mentioned user.
 *
 * Supports both the legacy @[Name](userId) token (in case any old content
 * exists) and the plain @word format that is currently stored.
 */

const User = require("../models/user/user.model");
const notificationService = require("./notificationService");

const SPECIAL_MENTION_GROUPS = { all: "all", alumni: "alumni", student: "students", faculty: "faculty" };
const SPECIAL_MENTION_NAMES = new Set(Object.keys(SPECIAL_MENTION_GROUPS));
function extractSpecialMentionGroups(text) {
  if (!text) return [];
  const groups = new Set();
  const re = /@(All|Alumni|Student|Faculty)(?=[.,!?;:]*(?:\s|$))/gi;
  let match;
  while ((match = re.exec(text)) !== null) groups.add(SPECIAL_MENTION_GROUPS[match[1].toLowerCase()]);
  return [...groups];
}

/**
 * Extract mentioned names from a piece of text.
 * Handles:
 *  - @[Name](userId)  → captures Name
 *  - @word            → captures word
 *
 * Returns an array of lowercased name strings (de-duplicated).
 */
function extractMentionNames(text) {
  if (!text) return [];

  const names = new Set();

  // Legacy token: @[Name](userId)
  const legacyRe = /@\[([^\]]+)\]\([^)]+\)/g;
  let m;
  while ((m = legacyRe.exec(text)) !== null) {
    const name = m[1].trim().toLowerCase();
    if (!SPECIAL_MENTION_NAMES.has(name)) names.add(name);
  }

  // Remove legacy tokens so remaining @words aren't re-scanned for them
  const stripped = text.replace(legacyRe, "");

  // Plain @Name (supports single and multi-word names)
  const plainRe =
    /@([A-Za-z0-9_]+(?:[-.'][A-Za-z0-9_]+)*(?:\s+[A-Z][a-zA-Z0-9_]*(?:[-.'][a-zA-Z0-9_]+)*)*)(?=[.,!?;:]*(?:\s|$))/g;
  while ((m = plainRe.exec(stripped)) !== null) {
    names.add(m[1].trim().toLowerCase());
  }

  return [...names];
}

/**
 * Send mention notifications.
 *
 * @param {object} opts
 * @param {string}   opts.text        - The content that may contain @mentions
 * @param {string}   opts.senderId    - ObjectId string of the author
 * @param {string}   opts.senderName  - Display name of the author
 * @param {string}   opts.contextType - "post" | "event" | "query"
 * @param {string}   opts.contextTitle- Title/subject of the content (for notification text)
 * @param {string}   opts.actionUrl   - Frontend URL to navigate to when notification is tapped
 * @param {string}   [opts.entityId]  - Optional MongoDB id of the created entity
 */
async function notifyMentions({
  text,
  senderId,
  senderName,
  contextType,
  contextTitle,
  actionUrl,
  entityId = null,
}) {
  try {
    const names = extractMentionNames(text);
    if (!names.length) return;

    // Look up all matching users in one query (case-insensitive exact name match)
    const users = await User.find({
      name: { $in: names.map((n) => new RegExp(`^${escapeRegex(n)}$`, "i")) },
      _id: { $ne: senderId }, // don't notify yourself
      role: { $in: ["alumni", "student", "faculty"] },
    }).select("_id name");

    if (!users.length) return;

    const contextLabel =
      contextType === "post"
        ? "a post"
        : contextType === "event"
        ? "an event"
        : "a query";

    await Promise.all(
      users.map((user) =>
        notificationService.createNotification({
          recipientId: user._id,
          senderId,
          type: "post_mention",
          title: `You were mentioned in ${contextLabel}`,
          message: `${senderName} mentioned you in "${contextTitle}"`,
          actionUrl,
          relatedEntity: entityId
            ? { entityType: contextType, entityId }
            : undefined,
          priority: "medium",
          metadata: {
            contextType,
            entityId,
            senderName,
          },
        })
      )
    );
  } catch (err) {
    // Non-fatal: log but don't crash the caller
    console.error("mentionHelper: failed to send mention notifications", err);
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { notifyMentions, extractMentionNames, extractSpecialMentionGroups };
