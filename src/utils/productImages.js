/**
 * Product Image Helper Utilities
 * Strictly filters out raw ERP / FTP ornateImages from customer-facing storefront pages.
 */

// Placeholder high-definition studio fine jewelry shots
export const DEFAULT_STUDIO_IMAGES = [
  '/products/oval_band_front.jpg',
  '/products/oval_band_side.jpg',
  '/products/oval_band_circle.jpg',
];

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
  if (!product) return [...DEFAULT_STUDIO_IMAGES];

  const valid = [];

  // 1. Process product.images (skipping ornateImages)
  if (Array.isArray(product.images)) {
    product.images.forEach((img) => {
      if (!isOrnateImage(img)) {
        const url = typeof img === 'string' ? img : img?.url;
        if (url && typeof url === 'string' && url.trim()) {
          valid.push(url.trim());
        }
      }
    });
  }

  // 2. Check product.colorImages if images empty
  if (valid.length === 0 && Array.isArray(product.colorImages)) {
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

  // 3. Check product.image
  if (valid.length === 0 && product.image && !isOrnateImage(product.image)) {
    const url = typeof product.image === 'string' ? product.image : product.image?.url;
    if (url && typeof url === 'string' && url.trim()) {
      valid.push(url.trim());
    }
  }

  // Return non-ornate images, or fine jewelry studio fallback
  return valid.length > 0 ? valid : [...DEFAULT_STUDIO_IMAGES];
};

/**
 * Gets a clean, non-ornate primary thumbnail URL for a product
 */
export const getPrimaryProductImage = (product) => {
  const images = getValidProductImages(product);
  return images[0] || DEFAULT_STUDIO_IMAGES[0];
};
