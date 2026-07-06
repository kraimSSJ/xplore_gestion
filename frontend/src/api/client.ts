import axios from 'axios';

// In production this comes from VITE_API_URL (set in Vercel env vars),
// pointing at the Render backend, e.g. https://xplore-backend.onrender.com/api
// In dev it falls back to '/api', which Vite proxies to localhost:3000.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Backend origin without the trailing /api, used to resolve relative
// asset paths like photoUrl ("/uploads/xyz.jpeg") into full URLs.
export const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// Turns a relative path like "/uploads/xyz.jpeg" returned by the backend
// into a full URL that works regardless of which domain the frontend is on.
export function resolveAssetUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${ASSET_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('xplore_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('xplore_token');
      localStorage.removeItem('xplore_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export async function downloadOrderPdf(orderId: string) {
  const res = await api.get(`/orders/${orderId}/pdf`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `order-${orderId.slice(0, 8)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default api;