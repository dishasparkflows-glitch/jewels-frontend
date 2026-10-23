import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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
    const isMobileBannerLookup = /^\/banners\/lookup(?:\?|$)/.test(config.url || '') && config.params?.platform === 'mobile';
    if ((!config.method || config.method === 'get') && !isMobileBannerLookup && /^\/(banners|categories|featured)(\/|\?|$)/.test(config.url || '')) {
      config.params = { ...config.params, themeMedia: true };
    }
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const isAuthRequiredPath = ['/profile', '/user', '/orders', '/account'].some(
        (p) => window.location.pathname.startsWith(p)
      );
      if (isAuthRequiredPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
