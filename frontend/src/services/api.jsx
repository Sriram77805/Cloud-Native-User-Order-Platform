import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

console.log('API_URL:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for debugging
apiClient.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  register: async (email, password) => {
    return apiClient.post('/auth/register', { email, password });
  },
  login: async (email, password) => {
    return apiClient.post('/auth/login', { email, password });
  }
};

// Order Services
export const orderService = {
  createOrder: async (product, quantity, price) => {
    return apiClient.post('/orders', { product, quantity, price });
  },
  getOrders: async () => {
    return apiClient.get('/orders');
  },
  updateOrder: async (id, status) => {
    return apiClient.put(`/orders/${id}`, { status });
  },
  deleteOrder: async (id) => {
    return apiClient.delete(`/orders/${id}`);
  }
};

// Health check
export const healthCheck = async () => {
  return apiClient.get('/health');
};

export default apiClient;
