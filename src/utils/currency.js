export const DEFAULT_CURRENCY = {
  code: 'INR',
  name: 'Indian Rupee',
  symbol: '₹',
  countryCode: 'IN',
  rate: 1,
  inrRate: 1,
  isBaseCurrency: true,
};

let activeCurrency = { ...DEFAULT_CURRENCY };

export function setActiveCurrency(currency) {
  if (!currency || !currency.code) {
    activeCurrency = { ...DEFAULT_CURRENCY };
    return;
  }
  activeCurrency = {
    ...DEFAULT_CURRENCY,
    ...currency,
    code: String(currency.code).toUpperCase(),
    symbol: currency.symbol || currency.code,
    rate: Number(currency.rate) > 0 ? Number(currency.rate) : 1,
  };
}

export function getActiveCurrency() {
  return activeCurrency;
}

export function convertPrice(price) {
  const num = Number(price);
  if (!Number.isFinite(num)) return NaN;
  if (activeCurrency.isBaseCurrency || activeCurrency.code === 'INR') {
    return num;
  }
  return num * (activeCurrency.rate || 1);
}

/**
 * Formats a numeric base price (INR) into the currently selected currency format.
 * @param {number|string} price - Numeric price value in base currency (INR)
 * @param {number} [fractionDigits=0] - Number of decimal places (default 0 for INR)
 * @param {string} [fallback=''] - Fallback when price is missing or invalid
 * @returns {string} Formatted price string (e.g., '₹12,499' or '$149.50')
 */
export function formatPrice(price, fractionDigits = 0, fallback = '') {
  if (price === undefined || price === null || price === '') return fallback;
  const converted = convertPrice(price);
  if (!Number.isFinite(converted)) return fallback;

  const isInr = activeCurrency.code === 'INR';
  const digits = isInr ? fractionDigits : Math.max(fractionDigits, 2);
  const locale = isInr ? 'en-IN' : 'en-US';
  const symbol = activeCurrency.symbol || (isInr ? '₹' : `${activeCurrency.code} `);

  return `${symbol}${converted.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/**
 * Formats a numeric base price into the active currency with 2 decimal places.
 * @param {number|string} price - Numeric price value
 * @param {string} [fallback='—'] - Fallback when price is missing or invalid
 * @returns {string} Formatted price string (e.g., '₹12,499.00')
 */
export function formatPriceWithDecimals(price, fallback = '—') {
  return formatPrice(price, 2, fallback);
}

export default formatPrice;
