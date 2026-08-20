import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const isDev = process.env.NODE_ENV === "development";

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send/receive the httpOnly auth cookies
  headers: { "Content-Type": "application/json" },
});

// The CSRF token itself is not secret (it's readable JS-side by design -
// see backend/middleware/csrf.js for the double-submit rationale) so it's
// fine to keep in memory here rather than re-reading the cookie each time.
let csrfToken = null;
export const setCsrfToken = (token) => {
  csrfToken = token;
};

apiClient.interceptors.request.use((config) => {
  if (csrfToken && ["post", "put", "patch", "delete"].includes(config.method)) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  if (isDev) console.debug("[api]", config.method?.toUpperCase(), config.url);
  return config;
});

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    // On a 401 from an expired access token (not from /auth/login itself),
    // try exactly one silent refresh, then replay the original request.
    if (response?.status === 401 && !config._retried && !config.url.includes("/auth/")) {
      config._retried = true;
      try {
        refreshPromise = refreshPromise || apiClient.post("/auth/refresh");
        const { data } = await refreshPromise;
        refreshPromise = null;
        setCsrfToken(data.csrfToken);
        return apiClient(config);
      } catch (refreshError) {
        refreshPromise = null;
        window.dispatchEvent(new CustomEvent("auth:expired"));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (email, password) => apiClient.post("/auth/register", { email, password }),
  login: (email, password) => apiClient.post("/auth/login", { email, password }),
  logout: () => apiClient.post("/auth/logout"),
  me: () => apiClient.get("/auth/me"),
};

export const orderService = {
  createOrder: (product, quantity, price) => apiClient.post("/orders", { product, quantity, price }),
  getOrders: (params) => apiClient.get("/orders", { params }),
  getOrder: (id) => apiClient.get(`/orders/${id}`),
  updateStatus: (id, status) => apiClient.put(`/orders/${id}`, { status }),
  deleteOrder: (id) => apiClient.delete(`/orders/${id}`),
  getStats: () => apiClient.get("/orders/stats/summary"),
  exportCsv: () => apiClient.get("/orders/export/csv", { responseType: "blob" }),
};

export const healthCheck = () => apiClient.get("/health");

export default apiClient;
