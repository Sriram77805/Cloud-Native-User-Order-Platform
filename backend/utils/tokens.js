const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");
const { jwtAccessSecret, jwtRefreshSecret, accessTokenTtl, refreshTokenTtlDays, isProd } = require("../config/env");

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, jwtAccessSecret, {
    expiresIn: accessTokenTtl,
  });
}

async function issueRefreshToken(user, userAgent) {
  const raw = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    user: user._id,
    tokenHash: RefreshToken.hash(raw),
    expiresAt,
    userAgent,
  });
  return raw;
}

const cookieBaseOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
};

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, { ...cookieBaseOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, {
    ...cookieBaseOptions,
    path: "/auth",
    maxAge: refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/auth" });
  res.clearCookie("csrfToken", { path: "/" });
}

module.exports = { signAccessToken, issueRefreshToken, setAuthCookies, clearAuthCookies, jwtRefreshSecret };
