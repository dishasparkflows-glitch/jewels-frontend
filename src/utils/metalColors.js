export const MASTER_METAL_COLORS = {
  '6ac90ab42c5692d9e254a047': 'Yellow Gold',
  '6ac90ab42c5692d9e254a048': 'White Gold',
  '6ac90ab42c5692d9e254a049': 'Rose Gold',
};

export const isRawObjectId = (val) =>
  typeof val === 'string' && /^[a-f0-9]{24}$/i.test(val.trim());

/**
 * Resolves a metal color value (object, name, or raw ObjectId) into a human-friendly string.
 * Never returns a raw 24-character hexadecimal ObjectId.
 */
export const resolveMetalName = (metal, fallbackProduct = null) => {
  if (!metal && !fallbackProduct) return '';

  const str = String(typeof metal === 'string' ? metal : metal?.name || '').trim();

  // If it's a known ObjectId mapped in MASTER_METAL_COLORS
  if (MASTER_METAL_COLORS[str]) {
    return MASTER_METAL_COLORS[str];
  }

  // If it's already a human readable string (not raw ObjectId)
  if (str && !isRawObjectId(str)) {
    return str;
  }

  // Check product metal colors if available
  if (fallbackProduct?.metalColors && Array.isArray(fallbackProduct.metalColors)) {
    const found = fallbackProduct.metalColors.find(
      (c) => String(c.id || c._id) === str || (c.name && !isRawObjectId(c.name))
    );
    if (found?.name && !isRawObjectId(found.name)) {
      return found.name;
    }
  }

  // Check fallbackProduct first metalColorId
  const firstId = fallbackProduct?.metalColorIds?.[0]
    ? String(fallbackProduct.metalColorIds[0]._id || fallbackProduct.metalColorIds[0])
    : '';
  if (firstId && MASTER_METAL_COLORS[firstId]) {
    return MASTER_METAL_COLORS[firstId];
  }

  // Suppress any raw ObjectId
  return '';
};

/**
 * Strips raw ObjectIds from sizes or other variant attributes.
 */
export const cleanAttribute = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  if (isRawObjectId(str)) return '';
  return str;
};
