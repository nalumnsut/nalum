const sessions = require("../controllers/session.controller.js");

// Sessions work the same for the website and the mobile app. The only
// difference is where the refresh token travels: the website keeps it in an
// httpOnly cookie, while the app (`X-NALUM-Client: mobile`) gets it in the
// body. Optional `X-Device-Id`/name/platform/version headers describe the
// device so signing in again on it reuses its session.

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
 * Start this browser's or device's own session after a successful login.
 * Same return shape as `sessions.start`.
 */
async function startSession(req, email, user_id) {
  const mobile = isMobileClient(req);
  return sessions.start(email, user_id, {
    client_type: mobile ? "mobile" : "web",
    device: getDeviceInfo(req),
    current_refresh_token: mobile ? undefined : req.cookies?.refresh_token,
  });
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
