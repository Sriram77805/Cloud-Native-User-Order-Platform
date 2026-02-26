import React, { useState } from 'react';
import { orderService } from '../services/api';

function OrderForm({ onOrderCreated }) {
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!product || !quantity || !price) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const response = await orderService.createOrder(product, parseInt(quantity), parseFloat(price));
      onOrderCreated(response.data.order);
      setProduct('');
      setQuantity('');
      setPrice('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto mb-8">
      <div className="card">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Order</h3>
        {error && <div className="error-alert mb-6">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="product" className="block text-gray-900 font-semibold mb-2">Product Name</label>
            <input
              type="text"
              id="product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Enter product name"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="quantity" className="block text-gray-900 font-semibold mb-2">Quantity</label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                placeholder="Enter quantity"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-gray-900 font-semibold mb-2">Price ($)</label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="Enter price"
                className="input-field"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OrderForm;
