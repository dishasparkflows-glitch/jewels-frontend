import api from '../api/axios';

export function getImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  const apiBase = (api.defaults?.baseURL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
  if (trimmed.startsWith('/')) return `${apiBase}${trimmed}`;
  if (trimmed.includes('/api/upload/file/')) {
    return `${apiBase}/api/upload/file/${trimmed.split('/api/upload/file/')[1]}`;
  }
  return trimmed;
}

export default getImageUrl;
