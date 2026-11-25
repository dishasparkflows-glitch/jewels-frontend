/**
 * Common Frontend Utility Functions & Constants
 */

/**
 * Converts a string to a clean, URL-friendly slug.
 * @param {string} value
 * @returns {string}
 */
export const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Standard category aliases across the storefront.
 * Maps legacy or plural routes to canonical category slugs.
 */
export const CATEGORY_ALIASES = {
  necklaces: 'pendant',
  bracelets: 'bangles-bracelets',
  silver: 'silver-collection',
};

/**
 * Safely extracts items array from standard API response envelopes:
 * - res.data.data (array)
 * - res.data.data.items (paginated)
 * - res.data.items
 * - res.data (array)
 * @param {object} res
 * @returns {Array}
 */
export const getResponseItems = (res) => {
  if (!res) return [];
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.data?.data?.items)) return res.data.data.items;
  if (Array.isArray(res.data?.items)) return res.data.items;
  if (Array.isArray(res.data)) return res.data;
  return [];
};
