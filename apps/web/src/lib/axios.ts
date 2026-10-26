import axios from 'axios';

// Get base URL from environment or default to local dev server
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'dev-key-local';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Also attach tenant id if needed for specific operations
    // config.headers['x-tenant-id'] = 'default-tenant'; 
    // In a multi-tenant app, you might want to resolve this dynamically
    config.headers['x-tenant-id'] = localStorage.getItem('tenant_id') || 't_local';
  }
  return config;
});

// Interceptor to handle 401 Unauthorized (only for authenticated routes, never for /login or /auth/login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/login');

    if (error.response?.status === 401 && typeof window !== 'undefined' && !isLoginEndpoint && !isLoginPage) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
