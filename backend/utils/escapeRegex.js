/**
 * Escapes special characters in a string to safely use it in a MongoDB $regex query.
 * Prevents 500 errors and ReDoS attacks from unbalanced or malicious input.
 * 
 * @param {string} value The user input string to escape
 * @returns {string} The escaped string safe for $regex
 */
function escapeRegex(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegex;
