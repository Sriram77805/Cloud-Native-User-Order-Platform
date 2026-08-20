const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

// Run after an array of express-validator checks: `[checks..., validate]`
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new AppError("Validation failed", 422, details));
  }
  next();
};
