const sessions = require("../controllers/session.controller.js");

// The mobile app identifies itself with `X-NALUM-Client: mobile` and its
// device with `X-Device-Id` (plus optional name/platform/version headers).
// The website sends none of these, so it always takes the cookie path.

const DEVICE_VALUE_PATTERN = /^[\w.:\- ]{1,128}$/;

const headerValue = (req, name) => {
  const value = req.get(name);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return DEVICE_VALUE_PATTERN.test(trimmed) ? trimmed : undefined;
};

/**
 * True when the request comes from the NALUM mobile app.
 * @param {import("express").Request} req
 */
function isMobileClient(req) {
  return (req.get("x-nalum-client") || "").trim().toLowerCase() === "mobile";
}

/**
 * Device details sent by the mobile app. Invalid values are dropped.
 * @param {import("express").Request} req
 */
function getDeviceInfo(req) {
  return {
    device_id: headerValue(req, "x-device-id"),
    device_name: headerValue(req, "x-device-name"),
    platform: headerValue(req, "x-device-platform"),
    app_version: headerValue(req, "x-app-version"),
  };
}

/**
 * Start a session after a successful login: the shared web session for the
 * website, or a per-device session for the mobile app. Same return shape as
 * `sessions.getOrCreate`.
 */
async function startSession(req, email, user_id) {
  if (isMobileClient(req)) {
    return sessions.getOrCreateMobile(email, user_id, getDeviceInfo(req));
  }
  return sessions.getOrCreate(email, user_id);
}

/**
 * Hand the refresh token to the client. Web gets the httpOnly cookie (as
 * before) and nothing extra in the body; mobile gets no cookie and the token
 * in the response body instead.
 *
 * @param {boolean} inBody - send the token in the body instead of a cookie
 * @returns {object} fields to spread into the response `data`
 */
function deliverRefreshToken(res, refresh_token, cookieOptions, inBody) {
  if (inBody) {
    return { refresh_token };
  }
  res.cookie("refresh_token", refresh_token, cookieOptions);
  return {};
}

module.exports = {
  isMobileClient,
  getDeviceInfo,
  startSession,
  deliverRefreshToken,
};
