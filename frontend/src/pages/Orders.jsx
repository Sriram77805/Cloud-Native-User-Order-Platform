import React, { useCallback, useEffect, useState } from "react";
import { orderService } from "../services/api";
import { useToast } from "../context/ToastContext";
import useOrderSocket from "../hooks/useOrderSocket";
import OrderForm from "../components/OrderForm";
import OrderList from "../components/OrderList";

const PAGE_SIZE = 9;

function Orders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("createdAt:desc");
  const [page, setPage] = useState(1);

  const { pushToast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await orderService.getOrders({
        page,
        limit: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        sort,
      });
      setOrders(data.orders);
      setPagination(data.pagination);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sort]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Live updates: if this order changes from another tab/device, or the
  // backend pushes a status change, refresh the current page rather than
  // trusting a stale local list.
  useOrderSocket({
    enabled: true,
    onCreated: () => {
      pushToast("A new order was created", "success");
      fetchOrders();
    },
    onUpdated: () => {
      pushToast("An order was updated", "info");
      fetchOrders();
    },
    onDeleted: () => {
      pushToast("An order was deleted", "info");
      fetchOrders();
    },
  });

  const handleOrderCreated = () => {
    setShowForm(false);
    setPage(1);
    fetchOrders();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await orderService.exportCsv();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `orders-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      pushToast("Failed to export orders", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-4xl font-bold text-white">My Orders</h1>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-white bg-opacity-90 text-primary px-5 py-3 font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "⬇ Export CSV"}
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-white text-primary px-6 py-3 font-semibold rounded-lg hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              {showForm ? "✕ Cancel" : "+ New Order"}
            </button>
          </div>
        </div>

        <div className="card mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-700 text-sm font-semibold mb-1">Search product</label>
            <input
              className="input-field"
              placeholder="e.g. Widget"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Status</label>
            <select
              className="input-field"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Sort by</label>
            <select className="input-field" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="price:desc">Price: high to low</option>
              <option value="price:asc">Price: low to high</option>
            </select>
          </div>
        </div>

        {error && <div className="error-alert mb-6">{error}</div>}

        {showForm && <OrderForm onOrderCreated={handleOrderCreated} />}

        {loading ? (
          <div className="text-center text-white text-xl p-8">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-white text-lg p-8">
            <p>No orders match your filters yet.</p>
          </div>
        ) : (
          <>
            <OrderList orders={orders} onOrderUpdated={fetchOrders} onOrderDeleted={fetchOrders} />

            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                className="px-4 py-2 bg-white bg-opacity-90 rounded-lg font-semibold disabled:opacity-40"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span className="text-white font-medium">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
              </span>
              <button
                className="px-4 py-2 bg-white bg-opacity-90 rounded-lg font-semibold disabled:opacity-40"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Orders;
