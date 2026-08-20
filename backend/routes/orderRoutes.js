const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const validate = require("../middleware/validate");
const { verifyCsrf } = require("../middleware/csrf");
const { createOrderRules, updateStatusRules, listOrdersRules } = require("../validators/orderValidators");

const router = express.Router();

router.use(authMiddleware);
router.use(verifyCsrf); // no-op on GET/HEAD, enforced on mutating verbs

router.get("/stats/summary", orderController.getStats);
router.get("/export/csv", orderController.exportOrdersCsv);

router.get("/", listOrdersRules, validate, orderController.getOrders);
router.post("/", createOrderRules, validate, orderController.createOrder);
router.get("/:id", validateObjectId("id"), orderController.getOrder);
router.put("/:id", validateObjectId("id"), updateStatusRules, validate, orderController.updateOrderStatus);
router.delete("/:id", validateObjectId("id"), orderController.deleteOrder);

module.exports = router;
