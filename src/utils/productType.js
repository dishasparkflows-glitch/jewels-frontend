/**
 * Checks whether a product, cart item, or order item is a Silver product.
 * In our catalog/database, `productType` is compulsory and stored as 'silver' or 'gold'.
 */
export const isSilverProduct = (item) => {
  if (!item) return false;

  const pType = String(
    item.productType || ''
  ).toLowerCase().trim();

  if (pType === 'silver') return true;
  if (pType === 'gold') return false;

  // Fallback in case of minimal cart snapshot
  return Boolean(
    item.isSilver ||
    item.isOrnate
  );
};
