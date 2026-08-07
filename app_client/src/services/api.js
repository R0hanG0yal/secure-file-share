import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000
});

// Attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('identishare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
