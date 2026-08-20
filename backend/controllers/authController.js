const crypto = require("crypto");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { signAccessToken, issueRefreshToken, setAuthCookies, clearAuthCookies } = require("../utils/tokens");
const { issueCsrfCookie } = require("../middleware/csrf");
const { refreshTokenTtlDays } = require("../config/env");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

async function loginSession(res, user, userAgent) {
  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user, userAgent);
  setAuthCookies(res, accessToken, refreshToken);
  const csrfToken = issueCsrfCookie(res);
  return csrfToken;
}

exports.register = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("An account with that email already exists", 409);
  }

  const user = await User.create({ email, password });
  const csrfToken = await loginSession(res, user, req.headers["user-agent"]);

  res.status(201).json({ message: "Registration successful", user: user.toSafeObject(), csrfToken });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password +failedLoginAttempts +lockUntil");
  // Same generic error whether the email doesn't exist or the password is
  // wrong, so we don't leak which emails are registered.
  const invalidCredentials = () => new AppError("Invalid email or password", 401);

  if (!user) throw invalidCredentials();

  if (user.isLocked()) {
    throw new AppError("Account temporarily locked due to repeated failed logins. Try again later.", 423);
  }

  const validPassword = await user.comparePassword(password);
  if (!validPassword) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw invalidCredentials();
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  const csrfToken = await loginSession(res, user, req.headers["user-agent"]);
  res.json({ message: "Login successful", user: user.toSafeObject(), csrfToken });
});

exports.refresh = catchAsync(async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  if (!rawToken) throw new AppError("No refresh token provided", 401);

  const tokenHash = RefreshToken.hash(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash }).populate("user");

  if (!stored || !stored.isActive() || !stored.user) {
    // Reuse of a revoked/expired token is a signal of a stolen token -
    // proactively revoke the entire family would go here in a fuller
    // implementation; at minimum we refuse and force re-login.
    clearAuthCookies(res);
    throw new AppError("Invalid or expired refresh token, please log in again", 401);
  }

  // Rotate: revoke the used token and issue a brand new one.
  const newRawToken = crypto.randomBytes(48).toString("hex");
  stored.revokedAt = new Date();
  stored.replacedByHash = RefreshToken.hash(newRawToken);
  await stored.save();

  await RefreshToken.create({
    user: stored.user._id,
    tokenHash: RefreshToken.hash(newRawToken),
    expiresAt: new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000),
    userAgent: req.headers["user-agent"],
  });

  const accessToken = signAccessToken(stored.user);
  setAuthCookies(res, accessToken, newRawToken);
  const csrfToken = issueCsrfCookie(res);

  res.json({ message: "Token refreshed", csrfToken });
});

exports.logout = catchAsync(async (req, res) => {
  const rawToken = req.cookies?.refreshToken;
  if (rawToken) {
    await RefreshToken.updateOne({ tokenHash: RefreshToken.hash(rawToken) }, { revokedAt: new Date() });
  }
  clearAuthCookies(res);
  res.json({ message: "Logged out" });
});

exports.me = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError("User not found", 404);
  res.json({ user: user.toSafeObject() });
});
