export const isRawObjectId = (val) =>
  typeof val === 'string' && /^[a-f0-9]{24}$/i.test(val.trim());

/**
 * Resolves a metal color value (object, name, or raw ObjectId) into a human-friendly string.
 * Never returns a raw 24-character hexadecimal ObjectId.
 */
export const resolveMetalName = (metal, fallbackProduct = null) => {
  if (!metal && !fallbackProduct) return '';

  const str = String(typeof metal === 'string' ? metal : metal?.name || '').trim();

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

  // Check fallbackProduct first metal color
  const firstColor = fallbackProduct?.metalColors?.[0] || fallbackProduct?.metalColorIds?.[0];
  if (firstColor && typeof firstColor === 'object' && firstColor.name && !isRawObjectId(firstColor.name)) {
    return firstColor.name;
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
