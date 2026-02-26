const Order = require("../models/Order");

exports.createOrder = async (req, res) => {
  try {
    const { product, quantity, price } = req.body;
    
    if (!product || !quantity || !price) {
      return res.status(400).json({ error: "Product, quantity, and price are required" });
    }

    const order = await Order.create({
      product,
      quantity,
      price,
      userId: req.user.id
    });
    
    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this order" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    
    res.json({ message: "Order updated successfully", order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this order" });
    }
    
    await Order.findByIdAndDelete(id);
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
