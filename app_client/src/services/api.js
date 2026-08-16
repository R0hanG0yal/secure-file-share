import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000
});

// Attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('doshare_token') || localStorage.getItem('identishare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept 401 Unauthorized to handle expired tokens cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // If token expired on a protected endpoint
      if (error.config.url !== '/login' && error.config.url !== '/register') {
        // Only clear if it was an invalid token error
        if (error.response.data?.error?.toLowerCase().includes('token') ||
            error.response.data?.error?.toLowerCase().includes('expired')) {
          localStorage.removeItem('doshare_token');
          localStorage.removeItem('doshare_user');
          localStorage.removeItem('identishare_token');
          localStorage.removeItem('identishare_user');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
