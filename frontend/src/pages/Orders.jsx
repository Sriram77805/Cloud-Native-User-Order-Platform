import React, { useState, useEffect } from 'react';
import { orderService } from '../services/api';
import OrderForm from '../components/OrderForm';
import OrderList from '../components/OrderList';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders();
      setOrders(response.data.orders);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCreated = async (newOrder) => {
    setOrders([newOrder, ...orders]);
    setShowForm(false);
  };

  const handleOrderUpdated = (updatedOrder) => {
    setOrders(orders.map(order => order._id === updatedOrder._id ? updatedOrder : order));
  };

  const handleOrderDeleted = (orderId) => {
    setOrders(orders.filter(order => order._id !== orderId));
  };

  return (
    <div className="min-h-screen bg-gradient-main p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h1 className="text-4xl font-bold text-white">My Orders</h1>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-white text-primary px-6 py-3 font-semibold rounded-lg hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            {showForm ? '✕ Cancel' : '+ New Order'}
          </button>
        </div>

        {error && <div className="error-alert mb-6">{error}</div>}

        {showForm && <OrderForm onOrderCreated={handleOrderCreated} />}

        {loading ? (
          <div className="text-center text-white text-xl p-8">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-white text-lg p-8">
            <p>No orders yet. Create your first order!</p>
          </div>
        ) : (
          <OrderList 
            orders={orders} 
            onOrderUpdated={handleOrderUpdated}
            onOrderDeleted={handleOrderDeleted}
          />
        )}
      </div>
    </div>
  );
}

export default Orders;
