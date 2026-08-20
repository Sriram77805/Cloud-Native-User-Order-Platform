const mongoose = require("mongoose");
const { mongoUrl } = require("./env");
const logger = require("./logger");

const state = { connected: false };

async function connectDB() {
  mongoose.connection.on("connected", () => {
    state.connected = true;
    logger.info(`MongoDB connected: ${mongoose.connection.name}`);
  });

  mongoose.connection.on("disconnected", () => {
    state.connected = false;
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    state.connected = false;
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  try {
    await mongoose.connect(mongoUrl, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
  } catch (err) {
    logger.error(`Initial MongoDB connection failed: ${err.message}`);
    // Don't crash the process - health checks will report unhealthy and
    // k8s/orchestrator can decide to restart. Mongoose will keep retrying
    // in the background via its default reconnection behavior.
  }
}

module.exports = { connectDB, state };
