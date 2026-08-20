const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { jwtAccessSecret } = require("../config/env");

// Reads the access token from the httpOnly cookie set at login (preferred,
// immune to XSS token theft), and falls back to an Authorization header so
// non-browser clients (mobile apps, curl, CI smoke tests) can still work.
module.exports = catchAsync(async (req, res, next) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;
  const token = req.cookies?.accessToken || bearer;

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const decoded = jwt.verify(token, jwtAccessSecret);
    req.user = { id: decoded.sub, role: decoded.role };
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Access token expired", 401, { code: "TOKEN_EXPIRED" }));
    }
    return next(new AppError("Invalid token", 401));
  }
});
