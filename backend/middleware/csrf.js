const crypto = require("crypto");
const AppError = require("../utils/AppError");
const { isProd } = require("../config/env");

const CSRF_COOKIE = "csrfToken";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Because auth tokens live in httpOnly cookies (not readable/attachable by
// JS the way a bearer header would be), we need the classic double-submit
// cookie pattern so a third-party site can't silently ride the browser's
// cookies to mutate data (CSRF). The frontend reads the non-httpOnly
// csrfToken cookie and echoes it back in the X-CSRF-Token header; an
// attacker's page can trigger the cookie to be sent, but can't read it to
// forge the matching header.
function issueCsrfCookie(res) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  });
  return token;
}

function verifyCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError("Invalid or missing CSRF token", 403));
  }
  next();
}

module.exports = { issueCsrfCookie, verifyCsrf, CSRF_COOKIE, CSRF_HEADER };
