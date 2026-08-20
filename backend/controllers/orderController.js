const { Parser: CsvParser } = require("json2csv");
const Order = require("../models/Order");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

async function nextOrderNumber() {
  // Human-friendly, roughly-sequential order numbers (ORD-YYYYMMDD-XXXX).
  // Not strictly gapless/atomic across a huge cluster, but fine at this
  // scale and far more useful than a raw ObjectId for support/CS lookups.
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const count = await Order.countDocuments({
    orderNumber: new RegExp(`^ORD-${datePart}-`),
  });
  return `ORD-${datePart}-${String(count + 1).padStart(4, "0")}`;
}

function emitToUser(req, userId, event, payload) {
  req.app.get("io")?.to(`user:${userId}`).emit(event, payload);
}

exports.createOrder = catchAsync(async (req, res) => {
  const { product, quantity, price } = req.body;

  const order = await Order.create({
    product,
    quantity,
    price,
    userId: req.user.id,
    orderNumber: await nextOrderNumber(),
  });

  emitToUser(req, req.user.id, "order:created", order);
  res.status(201).json({ message: "Order created successfully", order });
});

exports.getOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, search, sort = "createdAt:desc", minPrice, maxPrice } = req.query;

  const filter = { userId: req.user.id, isDeleted: false };
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const [sortField, sortDir] = sort.split(":");
  const sortSpec = { [sortField]: sortDir === "asc" ? 1 : -1 };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

exports.getOrder = catchAsync(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user.id, isDeleted: false });
  if (!order) throw new AppError("Order not found", 404);
  res.json({ order });
});

exports.updateOrderStatus = catchAsync(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
  if (!order) throw new AppError("Order not found", 404);

  if (order.userId.toString() !== req.user.id) {
    throw new AppError("Not authorized to update this order", 403);
  }

  if (!Order.canTransition(order.status, status)) {
    throw new AppError(`Cannot transition order from "${order.status}" to "${status}"`, 422);
  }

  order.status = status;
  order.statusHistory.push({ status });
  await order.save();

  emitToUser(req, req.user.id, "order:updated", order);
  res.json({ message: "Order updated successfully", order });
});

// Soft delete: keeps history/audit trail and analytics accurate instead of
// permanently destroying records the moment a user clicks delete.
exports.deleteOrder = catchAsync(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
  if (!order) throw new AppError("Order not found", 404);

  if (order.userId.toString() !== req.user.id) {
    throw new AppError("Not authorized to delete this order", 403);
  }

  order.isDeleted = true;
  order.deletedAt = new Date();
  await order.save();

  emitToUser(req, req.user.id, "order:deleted", { id: order._id });
  res.json({ message: "Order deleted successfully" });
});

exports.getStats = catchAsync(async (req, res) => {
  const { Types } = require("mongoose");
  const userId = new Types.ObjectId(req.user.id);

  const [summary] = await Order.aggregate([
    { $match: { userId, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: { $multiply: ["$quantity", "$price"] } },
        avgOrderValue: { $avg: { $multiply: ["$quantity", "$price"] } },
      },
    },
  ]);

  const byStatus = await Order.aggregate([
    { $match: { userId, isDeleted: false } },
    { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: { $multiply: ["$quantity", "$price"] } } } },
  ]);

  const last30Days = await Order.aggregate([
    { $match: { userId, isDeleted: false, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        orders: { $sum: 1 },
        revenue: { $sum: { $multiply: ["$quantity", "$price"] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    totalOrders: summary?.totalOrders || 0,
    totalRevenue: Math.round((summary?.totalRevenue || 0) * 100) / 100,
    avgOrderValue: Math.round((summary?.avgOrderValue || 0) * 100) / 100,
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count, revenue: Math.round(s.revenue * 100) / 100 })),
    dailyTrend: last30Days.map((d) => ({ date: d._id, orders: d.orders, revenue: Math.round(d.revenue * 100) / 100 })),
  });
});

exports.exportOrdersCsv = catchAsync(async (req, res) => {
  const orders = await Order.find({ userId: req.user.id, isDeleted: false }).sort({ createdAt: -1 }).lean();

  const parser = new CsvParser({
    fields: ["orderNumber", "product", "quantity", "price", "status", "createdAt"],
  });
  const csv = parser.parse(orders);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="orders-${Date.now()}.csv"`);
  res.send(csv);
});
