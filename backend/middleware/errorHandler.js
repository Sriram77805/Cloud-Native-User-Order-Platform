const logger = require("../config/logger");
const { isProd } = require("../config/env");

module.exports = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let { statusCode = 500, message, details } = err;

  // Normalize a few common non-operational error shapes into clean 4xx
  // responses instead of leaking raw driver/library error text.
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already in use` : "Duplicate value";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid identifier";
  }

  const isOperational = err.isOperational || statusCode < 500;

  logger.error(message || "Unhandled error", {
    requestId: req.id,
    statusCode,
    stack: err.stack,
    operational: isOperational,
  });

  res.status(statusCode).json({
    error: isOperational ? message : "Internal server error",
    ...(details ? { details } : {}),
    requestId: req.id,
    // Stack traces never go to the client in production.
    ...(!isProd && !isOperational ? { stack: err.stack } : {}),
  });
};
