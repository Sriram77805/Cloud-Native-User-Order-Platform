const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimiters");
const { registerRules, loginRules } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", authLimiter, registerRules, validate, authController.register);
router.post("/login", authLimiter, loginRules, validate, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authMiddleware, authController.me);

module.exports = router;
