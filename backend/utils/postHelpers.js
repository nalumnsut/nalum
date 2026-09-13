const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 24;

// Tags arrive either as a repeated multipart field (array), a single field
// (string), or a JSON array from a plain-JSON client. Everything is trimmed,
// de-duplicated case-insensitively and capped. Shared by the alumni and admin
// post controllers so both normalise tags identically.
function normalizeTags(raw) {
  let list = raw;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
      try {
        list = JSON.parse(trimmed);
      } catch (error) {
        list = trimmed.split(",");
      }
    } else {
      list = trimmed.split(",");
    }
  }

  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const tags = [];

  for (const entry of list) {
    if (typeof entry !== "string") continue;
    const tag = entry.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length === MAX_TAGS) break;
  }

  return tags;
}

// Accepts a JSON array, a repeated multipart field (array) or a single value.
function normalizeImageList(raw) {
  let list = raw;

  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try {
      list = JSON.parse(raw);
    } catch (error) {
      list = [raw];
    }
  }

  if (!Array.isArray(list)) list = [list];
  return list.filter((entry) => typeof entry === "string" && entry.trim());
}

const VISIBILITY_VALUES = ["everyone", "alumni", "students"];

function normalizeVisibility(raw) {
  return VISIBILITY_VALUES.includes(raw) ? raw : "everyone";
}

function visibilityFilter(role) {
  if (role === "admin") return {};
  const allowed = role === "student" ? ["everyone", "students"] : ["everyone", "alumni"];
  return { $or: [{ visibility: { $exists: false } }, { visibility: { $in: allowed } }] };
}

function isVisibleTo(post, role) {
  if (role === "admin") return true;
  if (!post.visibility || post.visibility === "everyone") return true;
  if (post.visibility === "alumni") return role === "alumni" || role === "faculty";
  if (post.visibility === "students") return role === "student";
  return true;
}

module.exports = {
  normalizeTags,
  normalizeImageList,
  MAX_TAGS,
  MAX_TAG_LENGTH,
  VISIBILITY_VALUES,
  normalizeVisibility,
  visibilityFilter,
  isVisibleTo,
};
