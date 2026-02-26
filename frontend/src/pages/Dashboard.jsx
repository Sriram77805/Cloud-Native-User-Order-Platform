import React, { useEffect, useState } from 'react';
import { healthCheck } from '../services/api';

function Dashboard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await healthCheck();
        setHealth(response.data);
      } catch (err) {
        console.error('Health check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-main p-8">
      <div className="max-w-4xl mx-auto card">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome to Cloud Native Platform</h1>
        <p className="text-gray-600 mb-12 text-lg">Manage your orders efficiently</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-500 hover:shadow-lg transition transform hover:-translate-y-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">📦 Order Management</h3>
            <p className="text-gray-700">Create, view, update, and delete your orders with ease.</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-l-4 border-purple-500 hover:shadow-lg transition transform hover:-translate-y-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">🔒 Secure Authentication</h3>
            <p className="text-gray-700">Your data is protected with JWT-based authentication.</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-l-4 border-green-500 hover:shadow-lg transition transform hover:-translate-y-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">☁️ Cloud Native</h3>
            <p className="text-gray-700">Built for scalability and reliability in the cloud.</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Checking server status...</p>
        ) : health ? (
          <div className="success-alert">
            <p>✓ Server Status: {health.status}</p>
            <p>Last Updated: {new Date(health.timestamp).toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-center text-gray-600">Unable to connect to server</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
