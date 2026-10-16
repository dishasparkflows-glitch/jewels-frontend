import api from '../api/axios';

export function getImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  const r2Base = 'https://pub-82427c7fd20e4acaa4bdb3b933c0a3bf.r2.dev';
  if (trimmed.includes('/api/upload/file/')) {
    return `${r2Base}/${trimmed.split('/api/upload/file/')[1]}`;
  }
  if (trimmed.includes('r2.cloudflarestorage.com/')) {
    return `${r2Base}/${trimmed.split('r2.cloudflarestorage.com/')[1]}`;
  }
  const apiBase = (api.defaults?.baseURL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
  if (trimmed.startsWith('/')) return `${apiBase}${trimmed}`;
  return trimmed;
}

export default getImageUrl;
