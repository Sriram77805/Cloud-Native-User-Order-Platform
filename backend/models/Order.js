const mongoose = require("mongoose");

const ORDER_STATUSES = ["pending", "shipped", "delivered", "cancelled"];

// Valid forward transitions. Prevents e.g. flipping a delivered order
// back to pending, or shipping a cancelled order.
const ALLOWED_TRANSITIONS = {
  pending: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    product: { type: String, required: true, trim: true, maxlength: 200 },
    quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
    price: { type: Number, required: true, min: [0.01, "Price must be greater than 0"] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    statusHistory: { type: [statusHistorySchema], default: () => [{ status: "pending" }] },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Supports the search/filter/sort combinations used by GET /orders.
orderSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ product: "text" });

orderSchema.virtual("total").get(function total() {
  return Math.round(this.quantity * this.price * 100) / 100;
});
orderSchema.set("toJSON", { virtuals: true });

orderSchema.statics.ORDER_STATUSES = ORDER_STATUSES;
orderSchema.statics.canTransition = function canTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to);
};

module.exports = mongoose.model("Order", orderSchema);
