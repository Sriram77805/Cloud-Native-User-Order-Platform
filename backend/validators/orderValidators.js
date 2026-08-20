const { body, query } = require("express-validator");
const Order = require("../models/Order");

const createOrderRules = [
  body("product").trim().notEmpty().withMessage("Product is required").isLength({ max: 200 }),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
  body("price").isFloat({ min: 0.01 }).withMessage("Price must be greater than 0"),
];

const updateStatusRules = [
  body("status").isIn(Order.ORDER_STATUSES).withMessage(`Status must be one of: ${Order.ORDER_STATUSES.join(", ")}`),
];

const listOrdersRules = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(Order.ORDER_STATUSES),
  query("search").optional().isString().trim().isLength({ max: 200 }),
  query("sort").optional().matches(/^(createdAt|price|quantity|product):(asc|desc)$/),
  query("minPrice").optional().isFloat({ min: 0 }).toFloat(),
  query("maxPrice").optional().isFloat({ min: 0 }).toFloat(),
];

module.exports = { createOrderRules, updateStatusRules, listOrdersRules };
