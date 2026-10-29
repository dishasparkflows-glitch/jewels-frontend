/**
 * Checks whether the given URL points to a video file.
 * @param {string} url
 * @returns {boolean}
 */
export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(url);
}

/**
 * Returns the image URL directly from backend.
 * @param {string|object} url
 * @returns {string}
 */
export function getImageUrl(url) {
  if (!url) return '';
  if (typeof url === 'object') {
    return (url.url || url.src || '').trim();
  }
  if (typeof url !== 'string') return '';
  return url.trim();
}

export default getImageUrl;
