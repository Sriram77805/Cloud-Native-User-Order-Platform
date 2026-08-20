// Wraps async route handlers so rejected promises are forwarded to
// Express's error-handling middleware instead of needing try/catch
// boilerplate in every controller.
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
