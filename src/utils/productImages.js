/**
 * Product Image Helper Utilities
 */

/**
 * Checks if a given image URL or image object is an invalid/unsupported ERP image
 */
export const isOrnateImage = (img) => {
  if (!img) return false;
  if (img.isOrnate === true && !img.url) return true;
  const url = typeof img === 'string' ? img : (img.url || '');
  if (!url || typeof url !== 'string') return false;

  const lower = url.toLowerCase();
  return (
    lower.includes('ftp://') ||
    lower.includes('/ftp/')
  );
};

/**
 * Extracts and returns an array of verified catalog image URLs for a product
 */
export const getValidProductImages = (product) => {
  if (!product) return [];

  const valid = [];

  // 1. Direct product.images array
  if (Array.isArray(product.images)) {
    product.images.forEach((img) => {
      const url = typeof img === 'string' ? img : img?.url;
      if (url && typeof url === 'string' && url.trim() && !isOrnateImage(img)) {
        valid.push(url.trim());
      }
    });
  }

  // 2. Product media is stored per color in colorImages.
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

  // 3. Ornate images fallback
  if (valid.length === 0 && Array.isArray(product.ornate?.ornateImages)) {
    product.ornate.ornateImages.forEach((img) => {
      const url = typeof img === 'string' ? img : img?.url;
      if (url && typeof url === 'string' && url.trim()) {
        valid.push(url.trim());
      }
    });
  }

  // 4. Fall back to a precomputed single thumbnail
  if (valid.length === 0 && product.image && !isOrnateImage(product.image)) {
    const url = typeof product.image === 'string' ? product.image : product.image?.url;
    if (url && typeof url === 'string' && url.trim()) {
      valid.push(url.trim());
    }
  }

  return [...new Set(valid)];
};

/**
 * Gets a primary thumbnail URL for a product
 */
export const getPrimaryProductImage = (product) => {
  const images = getValidProductImages(product);
  return images[0] || '';
};
