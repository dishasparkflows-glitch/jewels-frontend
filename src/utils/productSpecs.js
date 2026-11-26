import { isSilverProduct } from './productType';
import { cleanAttribute, resolveMetalName } from './metalColors';

/**
 * Normalizes and extracts structured display specifications for an item
 * (Cart item, Order item, or Checkout item).
 *
 * Consolidates attributes: diamondType, metalDisplay, metalColor, clarity, carat, size, etc.
 */
export function getItemSpecs(item) {
  if (!item) {
    return {
      isSilver: false,
      diamondType: '',
      metalPurity: '',
      metalColor: '',
      metalDisplay: '',
      diamondShape: '',
      diamondColor: '',
      diamondClarity: '',
      clarityDisplay: '',
      caratWeight: null,
      sizeDisplay: '',
      hasRightCol: false,
      hasSpecs: false,
      displayName: 'Fine Jewellery',
      productLink: '#',
    };
  }

  const isDiamond = Boolean(item.itemType === 'diamond' || item.productType === 'diamond');
  const isSilver = !isDiamond && isSilverProduct(item);
  const attrs = item.selectedAttributes || {};

  const rawDiamondType = isSilver ? '' : (attrs.diamondType || '');
  const diamondType = cleanAttribute(rawDiamondType) || '';

  const metalPurity = cleanAttribute(attrs.metalPurity) || (isSilver ? 'Silver' : '');
  const metalColor = isSilver ? '' : (cleanAttribute(attrs.metalColor) || resolveMetalName(item.selectedMetal) || '');

  const cleanPurity = metalPurity.replace(/\s*gold$/i, '').trim();
  const rawMetal = item.selectedMetal
    || (cleanPurity && metalColor ? `${cleanPurity} ${metalColor}` : [metalPurity, metalColor].filter(Boolean).join(' '))
    || resolveMetalName(item.selectedMetal);

  const metalDisplay = isSilver
    ? 'Silver'
    : (rawMetal ? rawMetal.replace(/^92\.5\s*/i, '').replace(/925\s*/i, '') : '');

  const diamondShape = isSilver ? '' : (cleanAttribute(attrs.diamondShape) || '');
  const diamondColor = isSilver ? '' : (cleanAttribute(attrs.diamondColor) || '');
  const diamondClarity = isSilver ? '' : (cleanAttribute(attrs.diamondClarity) || '');
  const clarityDisplay = diamondClarity || [diamondColor, diamondClarity].filter(Boolean).join(' ');
  const caratWeight = isSilver ? null : (attrs.caratWeight != null && attrs.caratWeight !== '' ? attrs.caratWeight : null);
  const sizeDisplay = cleanAttribute(attrs.size || item.selectedSize);

  const hasRightCol = Boolean(metalColor || caratWeight != null || (metalDisplay && sizeDisplay));
  const hasSpecs = Boolean(metalDisplay || metalColor || clarityDisplay || caratWeight != null || diamondShape || sizeDisplay);

  const displayName = item.basicInfo?.title || item.title || item.name || 'Fine Jewellery';
  const targetIdentifier =
    item.basicInfo?.slug ||
    item.slug ||
    item.basicInfo?.sku ||
    item.sku ||
    item.refId ||
    item.id ||
    (displayName ? displayName.toLowerCase().trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') : '');
  const productLink = isDiamond
    ? `/diamond/${encodeURIComponent(targetIdentifier)}`
    : `/product/${encodeURIComponent(targetIdentifier)}`;

  return {
    isDiamond,
    isSilver,
    diamondType,
    metalPurity,
    metalColor,
    metalDisplay,
    diamondShape,
    diamondColor,
    diamondClarity,
    clarityDisplay,
    caratWeight,
    sizeDisplay,
    hasRightCol,
    hasSpecs,
    displayName,
    productLink,
  };
}
