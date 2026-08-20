import React, { useState } from "react";
import { orderService } from "../services/api";
import { useToast } from "../context/ToastContext";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

// Mirrors backend/models/Order.js ALLOWED_TRANSITIONS - kept in sync so the
// UI only offers actions the API will actually accept.
const NEXT_STATUSES = {
  pending: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

function OrderList({ orders, onOrderUpdated, onOrderDeleted }) {
  const [busyId, setBusyId] = useState(null);
  const { pushToast } = useToast();

  const handleStatusChange = async (order, status) => {
    setBusyId(order._id);
    try {
      await orderService.updateStatus(order._id, status);
      pushToast(`Order ${order.orderNumber} marked as ${status}`, "success");
      onOrderUpdated();
    } catch (err) {
      pushToast(err.response?.data?.error || "Failed to update order", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Delete order ${order.orderNumber}?`)) return;
    setBusyId(order._id);
    try {
      await orderService.deleteOrder(order._id);
      pushToast(`Order ${order.orderNumber} deleted`, "info");
      onOrderDeleted();
    } catch (err) {
      pushToast(err.response?.data?.error || "Failed to delete order", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => {
          const nextStatuses = NEXT_STATUSES[order.status] || [];
          const busy = busyId === order._id;
          const total = order.total ?? order.quantity * order.price;

          return (
            <div key={order._id} className="card hover:shadow-2xl transition transform hover:-translate-y-1">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono text-gray-400">{order.orderNumber}</span>
                <span className={`px-4 py-1 rounded-full text-sm font-semibold capitalize ${STATUS_STYLES[order.status]}`}>
                  {order.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-4 border-b-2 border-gray-200">{order.product}</h3>

              <div className="space-y-2 mb-6">
                <p className="text-gray-700"><span className="font-semibold text-gray-900">Quantity:</span> {order.quantity}</p>
                <p className="text-gray-700"><span className="font-semibold text-gray-900">Price:</span> ${order.price.toFixed(2)}</p>
                <p className="text-gray-700"><span className="font-semibold text-gray-900">Total:</span> ${total.toFixed(2)}</p>
                <p className="text-gray-700"><span className="font-semibold text-gray-900">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((next) => (
                  <button
                    key={next}
                    disabled={busy}
                    onClick={() => handleStatusChange(order, next)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition disabled:opacity-50 capitalize"
                  >
                    Mark {next}
                  </button>
                ))}
                <button
                  disabled={busy}
                  onClick={() => handleDelete(order)}
                  className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrderList;
