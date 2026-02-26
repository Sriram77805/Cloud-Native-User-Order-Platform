import React, { useState } from 'react';
import { orderService } from '../services/api';

function OrderList({ orders, onOrderUpdated, onOrderDeleted }) {
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateStatus = async (orderId, currentStatus) => {
    setEditingId(orderId);
    setEditStatus(currentStatus);
  };

  const saveStatusUpdate = async (orderId) => {
    setError('');
    setLoading(true);

    try {
      const response = await orderService.updateOrder(orderId, editStatus);
      onOrderUpdated(response.data.order);
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await orderService.deleteOrder(orderId);
        onOrderDeleted(orderId);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete order');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {error && <div className="error-alert mb-6">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <div key={order._id} className="card hover:shadow-2xl transition transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex-1">{order.product}</h3>
              <span className={`px-4 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-gray-700"><span className="font-semibold text-gray-900">Quantity:</span> {order.quantity}</p>
              <p className="text-gray-700"><span className="font-semibold text-gray-900">Price:</span> ${order.price.toFixed(2)}</p>
              <p className="text-gray-700"><span className="font-semibold text-gray-900">Total:</span> ${(order.quantity * order.price).toFixed(2)}</p>
              <p className="text-gray-700"><span className="font-semibold text-gray-900">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>

            {editingId === order._id ? (
              <div className="flex flex-col gap-3">
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
                <div className="flex gap-3">
                  <button 
                    onClick={() => saveStatusUpdate(order._id)} 
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => setEditingId(null)} 
                    className="flex-1 px-4 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdateStatus(order._id, order.status)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                >
                  Edit Status
                </button>
                <button 
                  onClick={() => handleDelete(order._id)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderList;
