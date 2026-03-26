import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('leadsher_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      localStorage.removeItem('leadsher_token');
      localStorage.removeItem('leadsher_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
