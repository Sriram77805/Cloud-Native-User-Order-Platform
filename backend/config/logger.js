const winston = require("winston");
const { env, isProd } = require("./env");

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProd ? winston.format.json() : winston.format.combine(winston.format.colorize(), winston.format.simple())
  ),
  defaultMeta: { service: "order-platform-backend", env },
  transports: [new winston.transports.Console()],
});

module.exports = logger;
