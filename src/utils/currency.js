/**
 * Formats a numeric price into Indian Rupee (INR) currency format.
 * @param {number|string} price - Numeric price value
 * @param {number} [fractionDigits=0] - Number of decimal places (default 0)
 * @param {string} [fallback=''] - Fallback when price is missing or invalid
 * @returns {string} Formatted price string (e.g., '₹12,499')
 */
export function formatPrice(price, fractionDigits = 0, fallback = '') {
  if (price === undefined || price === null || price === '') return fallback;
  const num = Number(price);
  if (!Number.isFinite(num)) return fallback;
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

/**
 * Formats a numeric price into Indian Rupee (INR) with 2 decimal places.
 * @param {number|string} price - Numeric price value
 * @param {string} [fallback='—'] - Fallback when price is missing or invalid
 * @returns {string} Formatted price string (e.g., '₹12,499.00')
 */
export function formatPriceWithDecimals(price, fallback = '—') {
  return formatPrice(price, 2, fallback);
}

export default formatPrice;
