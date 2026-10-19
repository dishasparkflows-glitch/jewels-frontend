/**
 * Product Image Helper Utilities
 * Strictly filters out raw ERP / FTP ornateImages from customer-facing storefront pages.
 */

/**
 * Checks if a given image URL or image object is an internal Ornate ERP image
 */
export const isOrnateImage = (img) => {
  if (!img) return false;
  if (img.isOrnate || img.source === 'ornate') return true;
  const url = typeof img === 'string' ? img : (img.url || '');
  if (!url || typeof url !== 'string') return false;

  const lower = url.toLowerCase();
  return (
    lower.includes('ornate') ||
    lower.includes('ornateproducts') ||
    lower.includes('/ornate-') ||
    lower.includes('ftp')
  );
};

/**
 * Extracts and returns an array of verified non-ornate catalog image URLs for a product
 */
export const getValidProductImages = (product) => {
  if (!product) return [];

  const valid = [];

  // Product media is stored per color in colorImages.
  if (Array.isArray(product.colorImages)) {
    product.colorImages.forEach((c) => {
      if (Array.isArray(c?.images)) {
        c.images.forEach((img) => {
          if (!isOrnateImage(img)) {
            const url = typeof img === 'string' ? img : img?.url;
            if (url && typeof url === 'string' && url.trim()) {
              valid.push(url.trim());
            }
          }
        });
      }
    });
  }

  // Fall back to a precomputed single thumbnail when one is provided by a listing API.
  if (valid.length === 0 && product.image && !isOrnateImage(product.image)) {
    const url = typeof product.image === 'string' ? product.image : product.image?.url;
    if (url && typeof url === 'string' && url.trim()) {
      valid.push(url.trim());
    }
  }

  // Return non-ornate images, from uploaded product media
  return valid;
};

/**
 * Gets a clean, non-ornate primary thumbnail URL for a product
 */
export const getPrimaryProductImage = (product) => {
  const images = getValidProductImages(product);
  return images[0] || '';
};
