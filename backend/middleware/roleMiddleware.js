const AppError = require("../utils/AppError");

// usage: router.get('/admin-only', requireRole('admin'), handler)
module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new AppError("You do not have permission to perform this action", 403));
  }
  next();
};
