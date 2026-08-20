const http = require("http");
const createApp = require("./app");
const { connectDB } = require("./config/db");
const initSockets = require("./sockets");
const logger = require("./config/logger");
const { port } = require("./config/env");

async function start() {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = initSockets(httpServer);
  app.set("io", io);

  httpServer.listen(port, () => {
    logger.info(`Backend server listening on port ${port}`);
  });

  // Graceful shutdown: stop accepting new connections, let in-flight
  // requests finish, close the DB connection, then exit. Without this,
  // `kubectl rollout` / SIGTERM during a deploy just kills in-flight
  // requests mid-response.
  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    httpServer.close(async () => {
      const mongoose = require("mongoose");
      await mongoose.connection.close(false);
      logger.info("Shutdown complete");
      process.exit(0);
    });

    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", { reason: reason?.message || reason });
  });
}

start();
