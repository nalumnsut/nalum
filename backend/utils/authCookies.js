const isProduction = process.env.NODE_ENV === "production";

const cookieDomain = process.env.COOKIE_DOMAIN;
const cookieSameSite = process.env.COOKIE_SAME_SITE || "lax";

const buildCookieOptions = (maxAge) => {
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: cookieSameSite,
    path: "/",
  };

  if (typeof maxAge === "number") {
    options.maxAge = maxAge;
  }

  if (cookieDomain) {
    options.domain = cookieDomain;
  }

  return options;
};

const refreshCookieOptions = () => buildCookieOptions(14 * 24 * 60 * 60 * 1000);

const accessCookieOptions = () => buildCookieOptions(30 * 60 * 1000);

const clearCookieOptions = () => buildCookieOptions();

module.exports = {
  refreshCookieOptions,
  accessCookieOptions,
  clearCookieOptions,
};
