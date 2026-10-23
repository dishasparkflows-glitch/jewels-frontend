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
    ? product.images
        .filter(imageOnly)
        .map((img) => (typeof img === 'string' ? img : img?.url))
        .filter(Boolean)
    : [];

  const images = apiImages.length > 0
    ? [...new Set(apiImages)]
    : [...new Set(getValidProductImages({ ...product, colorImages: product.colorImages?.map((row) => ({ ...row, images: row.images?.filter(imageOnly) })) }).filter(imageOnly))];

  const colors = new Map();

  // 1. Process metalColors directly if provided by API
  for (const mc of product.metalColors || []) {
    if (!mc) continue;
    const name = typeof mc === 'object' ? mc.name || '' : (typeof mc === 'string' && !/^[a-f0-9]{24}$/i.test(mc) ? mc : '');
    const hex = typeof mc === 'object' ? (mc.colorCode || mc.hex || mc.code || colorHex[name.toLowerCase()]) : colorHex[name.toLowerCase()];
    const colorCodeEnd = typeof mc === 'object' ? (mc.colorCodeEnd || '') : '';
    const image = typeof mc === 'object' ? (mc.firstPhoto || mc.image || '') : '';
    if (name || validHex(hex)) {
      colors.set(name || hex, {
        name: name || hex,
        hex: validHex(hex) ? hex : null,
        image: image || '',
        ...(colorCodeEnd ? { colorCodeEnd } : {}),
      });
    }
  }

  // 2. Process colorImages (each color entry with its images)
  for (const row of product.colorImages || []) {
    if (!row || row.status === 'inactive') continue;
    const color = row.metalColor || row.metalColorId || row.color;
    const name = typeof color === 'object' ? color?.name || '' : typeof color === 'string' && !/^[a-f0-9]{24}$/i.test(color) ? color : '';
    const hex = color?.colorCode || color?.hex || color?.code || row.hex || colorHex[name.toLowerCase()];
    const colorCodeEnd = color?.colorCodeEnd || row.colorCodeEnd || '';
    const rowImages = (row.images || []).filter(imageOnly).map((image) => typeof image === 'string' ? image : image?.url).filter(Boolean);
    const firstImg = row.firstPhoto || row.firstImage || rowImages[0] || '';

    if (name || validHex(hex)) {
      const key = name || hex;
      if (!colors.has(key)) {
        colors.set(key, {
          name: name || hex,
          hex: validHex(hex) ? hex : null,
          image: firstImg || '',
          ...(colorCodeEnd ? { colorCodeEnd } : {}),
        });
      } else if (firstImg && !colors.get(key).image) {
        colors.get(key).image = firstImg;
      }
    }
  }

  // 3. Fallback for metalColorIds / swatches
  for (const color of [...(product.metalColorIds || []), ...(product.swatches || [])]) {
    const name = typeof color === 'object' ? color?.name || '' : typeof color === 'string' && !/^[a-f0-9]{24}$/i.test(color) ? color : '';
    const hex = color?.colorCode || color?.hex || color?.code || (validHex(name) ? name : colorHex[name.toLowerCase()]);
    const colorCodeEnd = typeof color === 'object' ? color?.colorCodeEnd || '' : '';
    const image = typeof color === 'object' ? (color?.firstPhoto || color?.image || '') : '';
    if (name || validHex(hex)) {
      const key = name || hex;
      if (!colors.has(key)) {
        colors.set(key, {
          name: name || hex,
          hex: validHex(hex) ? hex : null,
          image: image || '',
          ...(colorCodeEnd ? { colorCodeEnd } : {}),
        });
      } else if (image && !colors.get(key).image) {
        colors.get(key).image = image;
      }
    }
  }

  const price = firstPrice(
    product.pricing?.salePrice,
    product.salePrice,
    product.pricing?.mrp,
    product.mrp,
    product.cataloguePrice,
    product.price
  );
  const originalPrice = firstPrice(product.pricing?.mrp, product.mrp, product.originalPrice);
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
