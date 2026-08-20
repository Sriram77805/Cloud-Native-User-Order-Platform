const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const mongoose = require("mongoose");

const { frontendOrigins } = require("./config/env");
const { state: dbState } = require("./config/db");
const { register, metricsMiddleware } = require("./config/metrics");
const requestId = require("./middleware/requestId");
const { globalLimiter } = require("./middleware/rateLimiters");
const errorHandler = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.set("trust proxy", 1); // correct client IPs/rate-limiting behind k8s ingress/ELB

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Explicit allowlist instead of reflecting any Origin - required
        // now that credentials:true is set (browsers reject wildcard "*"
        // combined with credentials, and reflecting-any-origin defeats
        // CORS entirely).
        if (!origin || frontendOrigins.includes(origin)) return callback(null, true);
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      exposedHeaders: ["X-Request-Id"],
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));
  app.use(cookieParser());
  app.use(mongoSanitize()); // strips $/. operators from user input -> blocks NoSQL injection
  app.use(hpp()); // guards against HTTP parameter pollution
  app.use(requestId);
  app.use(metricsMiddleware);
  app.use(globalLimiter);

  app.use("/auth", require("./routes/authRoutes"));
  app.use("/orders", require("./routes/orderRoutes"));

  app.get("/health", (req, res) => {
    const healthy = dbState.connected && mongoose.connection.readyState === 1;
    res.status(healthy ? 200 : 503).json({
      status: healthy ? "OK" : "DEGRADED",
      db: healthy ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  // Separate from /health: k8s readiness should pull a pod out of rotation
  // when the DB is down, while liveness should NOT restart the pod for a
  // transient DB blip. Keeping one endpoint conflates the two.
  app.get("/health/live", (req, res) => res.json({ status: "OK" }));
  app.get("/health/ready", (req, res) => {
    const ready = dbState.connected;
    res.status(ready ? 200 : 503).json({ status: ready ? "READY" : "NOT_READY" });
  });

  app.get("/metrics", async (req, res) => {
    res.setHeader("Content-Type", register.contentType);
    res.send(await register.metrics());
  });

  app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
