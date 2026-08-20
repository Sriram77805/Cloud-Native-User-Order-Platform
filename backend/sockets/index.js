const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const { jwtAccessSecret, frontendOrigins } = require("../config/env");
const logger = require("../config/logger");

function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: frontendOrigins, credentials: true },
  });

  // Authenticate the socket using the same httpOnly access-token cookie the
  // REST API trusts, so a socket can only join its own user's room.
  io.use((socket, next) => {
    try {
      const rawCookies = socket.handshake.headers.cookie || "";
      const parsed = cookie.parse(rawCookies);
      const token = parsed.accessToken;
      if (!token) return next(new Error("Unauthorized"));
      const decoded = jwt.verify(token, jwtAccessSecret);
      socket.userId = decoded.sub;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
    logger.debug(`Socket connected for user ${socket.userId}`);

    socket.on("disconnect", () => {
      logger.debug(`Socket disconnected for user ${socket.userId}`);
    });
  });

  return io;
}

module.exports = initSockets;
