import { getValidProductImages, isOrnateImage } from './productImages.js';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
export const formatProductPrice = (value) => Number.isFinite(Number(value)) && Number(value) > 0 ? money.format(Number(value)) : '';
const firstPrice = (...values) => values.map(Number).find((value) => Number.isFinite(value) && value > 0) || null;
const colorHex = { 'white gold': '#dedede', 'rose gold': '#c88c88', 'yellow gold': '#d4b85b', silver: '#d4d4d4', platinum: '#e5e4e2', gold: '#d4b85b' };
const imageOnly = (image) => image?.mediaType !== 'video' && !/\.(mp4|webm|mov)(?:[?#]|$)/i.test(typeof image === 'string' ? image : image?.url || '') && !isOrnateImage(image);
const validHex = (value) => /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value || '');

export function getProductCardData(product) {
  const images = [...new Set(getValidProductImages({ ...product, images: product.images?.filter(imageOnly), colorImages: product.colorImages?.map((row) => ({ ...row, images: row.images?.filter(imageOnly) })) }).filter(imageOnly))];
  const colors = new Map();
  for (const row of product.colorImages || []) {
    const color = row.metalColor || row.metalColorId || row.color;
    const name = typeof color === 'object' ? color?.name || '' : typeof color === 'string' && !/^[a-f0-9]{24}$/i.test(color) ? color : '';
    const hex = color?.hex || color?.code || row.hex || colorHex[name.toLowerCase()];
    const rowImages = getValidProductImages({ images: row.images?.filter(imageOnly) }).filter(imageOnly);
    if (name || validHex(hex)) colors.set(name || hex, { name: name || hex, hex: validHex(hex) ? hex : null, image: rowImages[0] || '' });
  }
  for (const color of [...(product.metalColors || []), ...(product.metalColorIds || []), ...(product.swatches || [])]) {
    const name = typeof color === 'object' ? color?.name || '' : typeof color === 'string' && !/^[a-f0-9]{24}$/i.test(color) ? color : '';
    const hex = color?.hex || color?.code || (validHex(name) ? name : colorHex[name.toLowerCase()]);
    if ((name || validHex(hex)) && !colors.has(name || hex)) colors.set(name || hex, { name: name || hex, hex: validHex(hex) ? hex : null, image: '' });
  }
  const price = firstPrice(product.salePrice, product.pricing?.salePrice, product.displayPrice, product.pricing?.displayPrice, product.price);
  const originalPrice = firstPrice(product.mrp, product.pricing?.mrp, product.originalPrice);
  return { id: String(product._id || product.id || ''), name: product.basicInfo?.title || product.title || product.name || product.itemName || 'Untitled product', images, colors: [...colors.values()], price, originalPrice: originalPrice > price && price ? originalPrice : null };
}
