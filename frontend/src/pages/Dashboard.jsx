import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { healthCheck, orderService } from "../services/api";

const STATUS_COLORS = { pending: "#f59e0b", shipped: "#3b82f6", delivered: "#10b981", cancelled: "#ef4444" };

function StatCard({ label, value, accent }) {
  return (
    <div className={`p-6 bg-white rounded-lg border-l-4 shadow-sm ${accent}`}>
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function Dashboard() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [healthRes, statsRes] = await Promise.allSettled([healthCheck(), orderService.getStats()]);
        if (healthRes.status === "fulfilled") setHealth(healthRes.value.data);
        if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
        else setError("Could not load order analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pieData = (stats?.byStatus || []).map((s) => ({ name: s.status, value: s.count }));

  return (
    <div className="min-h-screen bg-gradient-main p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="card">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome to Cloud Native Platform</h1>
          <p className="text-gray-600 text-lg">Live order analytics, updated in real time</p>
        </div>

        {loading ? (
          <div className="card text-center text-gray-600">Loading dashboard...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Total Orders" value={stats?.totalOrders ?? "—"} accent="border-blue-500" />
              <StatCard label="Total Revenue" value={`$${(stats?.totalRevenue ?? 0).toFixed(2)}`} accent="border-green-500" />
              <StatCard label="Avg Order Value" value={`$${(stats?.avgOrderValue ?? 0).toFixed(2)}`} accent="border-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Orders by Status</h3>
                {pieData.length === 0 ? (
                  <p className="text-gray-500 text-sm">No orders yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#9ca3af"} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Revenue - Last 30 Days</h3>
                {(stats?.dailyTrend || []).length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent order activity.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={stats.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <div className={health?.status === "OK" ? "success-alert" : "error-alert"}>
              <p>{health?.status === "OK" ? "✓" : "✗"} Server Status: {health?.status || "Unknown"}</p>
              {health?.timestamp && <p>Last Updated: {new Date(health.timestamp).toLocaleString()}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
