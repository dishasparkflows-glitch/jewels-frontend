import { getValidProductImages, isOrnateImage } from './productImages.js';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
export const formatProductPrice = (value) => Number.isFinite(Number(value)) && Number(value) > 0 ? money.format(Number(value)) : '';
const firstPrice = (...values) => values.map(Number).find((value) => Number.isFinite(value) && value > 0) || null;
const colorHex = { 'white gold': '#dedede', 'rose gold': '#c88c88', 'yellow gold': '#d4b85b', silver: '#d4d4d4', platinum: '#e5e4e2', gold: '#d4b85b' };
const imageOnly = (image) => image?.mediaType !== 'video' && !/\.(mp4|webm|mov)(?:[?#]|$)/i.test(typeof image === 'string' ? image : image?.url || '') && !isOrnateImage(image);
const validHex = (value) => /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value || '');

export function getProductCardData(product) {
  // If product already provides images (from lightweight storefront API)
  const apiImages = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images.map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean)
    : [];

  const images = apiImages.length > 0
    ? [...new Set(apiImages)]
    : [...new Set(getValidProductImages({ ...product, colorImages: product.colorImages?.map((row) => ({ ...row, images: row.images?.filter(imageOnly) })) }).filter(imageOnly))];

  const colors = new Map();
  for (const row of product.colorImages || []) {
    const color = row.metalColor || row.metalColorId || row.color;
    const name = typeof color === 'object' ? color?.name || '' : typeof color === 'string' && !/^[a-f0-9]{24}$/i.test(color) ? color : '';
    const hex = color?.hex || color?.code || row.hex || colorHex[name.toLowerCase()];
    const rowImages = (row.images || []).filter(imageOnly).map((image) => typeof image === 'string' ? image : image.url).filter(Boolean);
    if (name || validHex(hex)) colors.set(name || hex, { name: name || hex, hex: validHex(hex) ? hex : null, image: rowImages[0] || '' });
  }
  for (const color of [...(product.metalColors || []), ...(product.metalColorIds || []), ...(product.swatches || [])]) {
    const name = typeof color === 'object' ? color?.name || '' : typeof color === 'string' && !/^[a-f0-9]{24}$/i.test(color) ? color : '';
    const hex = color?.hex || color?.code || (validHex(name) ? name : colorHex[name.toLowerCase()]);
    if ((name || validHex(hex)) && !colors.has(name || hex)) colors.set(name || hex, { name: name || hex, hex: validHex(hex) ? hex : null, image: '' });
  }

  const price = firstPrice(product.pricing?.salePrice, product.pricing?.mrp, product.cataloguePrice);
  const originalPrice = firstPrice(product.pricing?.mrp, product.originalPrice);
  const name = product.basicInfo?.title || product.title || product.name || product.itemName || 'Untitled product';

  return {
    id: String(product._id || product.id || ''),
    name,
    images,
    colors: [...colors.values()],
    price,
    originalPrice: originalPrice > price && price ? originalPrice : null,
  };
}
