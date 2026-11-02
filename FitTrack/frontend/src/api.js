
import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fittrack_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      'API Error:',
      error.response?.status,
      error.response?.data || error.message
    );

    return Promise.reject(error);
  }
);

export default api;
