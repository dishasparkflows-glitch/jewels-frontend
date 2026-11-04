import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9900/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const pendingGetRequests = new Map();

/** Coalesce simultaneous identical GETs, including Strict Mode effect replays. */
export function getOnce(url, config = {}) {
  if (config.signal) return api.get(url, config);

  const token = typeof localStorage === 'undefined' ? '' : localStorage.getItem('token') || '';
  const key = JSON.stringify({ url, params: config.params || {}, token });
  const pending = pendingGetRequests.get(key);
  if (pending) return pending;

  const request = api.get(url, config).finally(() => {
    if (pendingGetRequests.get(key) === request) pendingGetRequests.delete(key);
  });
  pendingGetRequests.set(key, request);
  return request;
}

// Helper to retrieve or initialize a persistent guest session ID
function getOrCreateSessionId() {
  let sessionId = localStorage.getItem('neirah_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('neirah_session_id', sessionId);
  }
  return sessionId;
}

// Request interceptor - attach token & session ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const sessionId = getOrCreateSessionId();
    if (sessionId) {
      config.headers['x-session-id'] = sessionId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
// ONLY clear credentials when the /auth/me endpoint explicitly says the token
// is invalid/expired.  A 401 from /cart or /wishlist just means the user wasn't
// attached by optionalAuth — do NOT wipe the stored session for those.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/me') || url.includes('/auth/login');
      if (isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const isAuthRequiredPath = ['/profile', '/user', '/orders', '/account'].some(
          (p) => window.location.pathname.startsWith(p)
        );
        if (isAuthRequiredPath) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
