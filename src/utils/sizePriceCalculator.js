/**
 * Neirah Jewelry Sizing Engine Utility
 * 
 * Category Sizing Rules & Steps:
 * - Rings: Base Size = 7.0 (US), Step = 1.0 -> ±2.5% per step
 * - Bangles: Base Size = 2.4, Step = 0.2 -> ±4.0% per step
 * - Bracelets: Base Size = 7.0 Inch, Step = 0.5 Inch -> ±3.0% per step
 * - Necklaces: Base Size = 16.0 Inch, Step = 2.0 Inch -> ±10.0% per step
 */

/**
 * Checks if a given category object or string represents a Ring
 */
export const isRingCategory = (category) => {
  if (!category) return false;
  if (Array.isArray(category)) {
    return category.some((c) => {
      const name = (c?.name || c?.title || c || '').toString().toLowerCase();
      return name.includes('ring') && !name.includes('earring');
    });
  }
  const name = (category?.name || category?.title || category || '').toString().toLowerCase();
  return name.includes('ring') && !name.includes('earring');
};

/**
 * Returns dynamic size label based on category (e.g. "Size (US)" for rings, "Size" otherwise)
 */
export const getCategorySizeLabel = (category) => {
  return isRingCategory(category) ? 'Size (US)' : 'Size';
};

/**
 * Numerically sorts sizes so 4 -> 4.5 -> 5 -> 5.5 -> 6 -> 10
 */
export const sortSizesNumerically = (sizes = []) => {
  if (!Array.isArray(sizes)) return [];
  return [...sizes].sort((a, b) => {
    const strA = typeof a === 'object' ? (a?.name || '') : String(a || '');
    const strB = typeof b === 'object' ? (b?.name || '') : String(b || '');
    const numA = parseFloat(strA.match(/\d+(\.\d+)?/)?.[0] || 0);
    const numB = parseFloat(strB.match(/\d+(\.\d+)?/)?.[0] || 0);
    if (numA !== numB) return numA - numB;
    return strA.localeCompare(strB, undefined, { numeric: true });
  });
};

/**
 * Calculates size-adjusted metal weight for jewelry products
 */
export const calculateSizeAdjustedMetalWeight = ({
  baseMetalWeight = 0,
  selectedSize = '',
  sizeList = [],
  category = null,
  subType = null,
}) => {
  const baseWeightNum = Number(baseMetalWeight);
  if (!baseWeightNum || baseWeightNum <= 0) return baseWeightNum || 0;

  // Category matching helper
  const checkCategory = (keyword) => {
    if (Array.isArray(category)) {
      return category.some((cat) => {
        const name = (cat?.name || cat?.title || cat || '').toString().toLowerCase();
        if (keyword === 'ring') return name.includes('ring') && !name.includes('earring');
        return name.includes(keyword);
      });
    }
    const name = (category?.name || category?.title || category || '').toString().toLowerCase();
    if (keyword === 'ring') return name.includes('ring') && !name.includes('earring');
    return name.includes(keyword);
  };

  const isRing = checkCategory('ring');
  const isBangle = checkCategory('bangle');
  const isBracelet = !isBangle && checkCategory('bracelet');
  const isNecklace = checkCategory('necklace') || checkCategory('pendant');

  // If category is not size-scalable (e.g. earrings, brooches), return base weight
  if (!isRing && !isBracelet && !isNecklace && !isBangle) {
    return baseWeightNum;
  }

  if (!selectedSize) return baseWeightNum;

  // Find matching size entry or read value
  let sizeNameStr = '';
  if (typeof selectedSize === 'object' && selectedSize?.name) {
    sizeNameStr = selectedSize.name;
  } else if (Array.isArray(sizeList) && sizeList.length > 0) {
    const matched = sizeList.find(
      (s) => String(s?._id || s?.id || s?.name || s) === String(selectedSize)
    );
    sizeNameStr = matched ? (matched.name || String(matched)) : String(selectedSize);
  } else {
    sizeNameStr = String(selectedSize);
  }

  // Extract numeric size value (e.g. "4.5", "2.4", "7", "7 Inch")
  const match = sizeNameStr.match(/(\d+(?:\.\d+)?)/);
  const numericSize = match ? parseFloat(match[1]) : parseFloat(sizeNameStr);

  if (isNaN(numericSize)) return baseWeightNum;

  let baseSize = 7.0;
  let stepSize = 1.0;
  let percentPerStep = 0.025; // 2.5% for Rings

  if (isBangle) {
    baseSize = 2.4;
    stepSize = 0.2;
    percentPerStep = 0.04; // 4.0% per 0.2 step
  } else if (isNecklace) {
    baseSize = 16.0;
    stepSize = 2.0;
    percentPerStep = 0.10; // 10.0% per 2 Inch step
  } else if (isBracelet) {
    baseSize = 7.0;
    stepSize = 0.5;
    percentPerStep = 0.03; // 3.0% per 0.5 Inch step
  } else if (isRing) {
    baseSize = 7.0;
    stepSize = 1.0;
    percentPerStep = 0.025; // 2.5% per 1.0 US size step
  }

  const steps = (numericSize - baseSize) / stepSize;
  const weightMultiplier = 1 + steps * percentPerStep;
  const adjustedWeight = baseWeightNum * weightMultiplier;

  return Math.max(0, Math.round(adjustedWeight * 1000) / 1000);
};

