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
    const p = window.location.pathname;
    const publicAuth =
      p.startsWith('/login') ||
      p.startsWith('/register') ||
      p.startsWith('/verify-email') ||
      p.startsWith('/forgot-password') ||
      p.startsWith('/reset-password');
    if (err.response?.status === 401 && !publicAuth) {
      localStorage.removeItem('leadsher_token');
      localStorage.removeItem('leadsher_user');
      window.location.href = '/login';
    }
    if (err.response?.status === 403 && err.response?.data?.code === 'EMAIL_NOT_VERIFIED' && !publicAuth) {
      const u = (() => {
        try {
          return JSON.parse(localStorage.getItem('leadsher_user') || '{}');
        } catch {
          return {};
        }
      })();
      const q = u.email ? `?email=${encodeURIComponent(u.email)}` : '';
      window.location.href = `/verify-email${q}`;
    }
    return Promise.reject(err);
  }
);

export default api;
