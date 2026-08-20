require("dotenv").config();

const required = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "MONGO_URL"];

// Fail fast and loud on boot instead of failing silently mid-request.
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const parseOrigins = (value) =>
  (value || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUrl: process.env.MONGO_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS, 10) || 7,
  frontendOrigins: parseOrigins(process.env.FRONTEND_URL),
  isProd: (process.env.NODE_ENV || "development") === "production",
};
