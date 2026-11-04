/**
 * Neirah Jewelry Sizing Engine Utility
 * 
 * Dynamic database-driven sizing engine:
 * Reads sizingConfig directly from the category record in the database:
 * - isScalable: Whether this category scales metal weight with size (true for Rings, Bangles, Bracelets, Chains; false for Earrings, Pendants, etc.)
 * - sizeLabel: Storefront label (e.g. "Size (US)", "Bangle Size", "Chain Length (Inch)")
 * - baseSize: Baseline size measured by the CAD designer (e.g. 7.0 for Rings, 2.4 for Bangles, 16.0 for Necklaces)
 * - stepSize: Size increment per jump (e.g. 1.0 for Rings, 0.2 for Bangles, 2.0 for Necklaces)
 * - percentPerStep: Weight change percentage per step (e.g. 2.5% for Rings, 4.0% for Bangles, 10.0% for Necklaces)
 */

/**
 * Extracts sizingConfig directly from a category, array of categories, or product record
 */
export const extractSizingConfig = (category) => {
  if (!category) return null;

  // If a full product object was passed
  if (category.categoryIds || category.category) {
    const fromIds = extractSizingConfig(category.categoryIds);
    if (fromIds) return fromIds;
    return extractSizingConfig(category.category);
  }

  // If an array of categories was passed
  if (Array.isArray(category)) {
    for (const item of category) {
      if (item && typeof item === 'object' && item.sizingConfig) {
        return item.sizingConfig;
      }
    }
    return null;
  }

  // If single category object was passed
  if (typeof category === 'object' && category?.sizingConfig) {
    return category.sizingConfig;
  }

  return null;
};

/**
 * Checks if a given category object or string represents a Ring
 */
export const isRingCategory = (category) => {
  const config = extractSizingConfig(category);
  if (config?.sizeLabel) {
    return config.sizeLabel.toLowerCase().includes('us') || config.sizeLabel.toLowerCase().includes('ring');
  }
  const name = (typeof category === 'object' ? (category?.name || '') : String(category || '')).toLowerCase();
  return name.includes('ring') && !name.includes('earring');
};

/**
 * Returns dynamic size label based on category database configuration (e.g. "Size (US)", "Bangle Size", "Chain Length (Inch)")
 */
export const getCategorySizeLabel = (category) => {
  const sizingConfig = extractSizingConfig(category);
  if (sizingConfig?.sizeLabel) {
    return sizingConfig.sizeLabel;
  }
  return 'Size';
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
 * Calculates size-adjusted metal weight for jewelry products directly from database sizingConfig
 */
export const calculateSizeAdjustedMetalWeight = ({
  baseMetalWeight = 0,
  selectedSize = '',
  sizeList = [],
  category = null,
}) => {
  const baseWeightNum = Number(baseMetalWeight);
  if (!baseWeightNum || baseWeightNum <= 0) return baseWeightNum || 0;

  const sizingConfig = extractSizingConfig(category);

  // Directly fetch from DB sizingConfig: If not scalable in DB, metal weight is static
  if (!sizingConfig || !sizingConfig.isScalable) {
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

  // Direct parameters from Database sizingConfig
  const baseSize = Number(sizingConfig.baseSize ?? 7.0);
  const stepSize = Number(sizingConfig.stepSize ?? 1.0) || 1.0;
  const percentPerStep = Number(sizingConfig.percentPerStep ?? 2.5) / 100;

  const steps = (numericSize - baseSize) / stepSize;
  const weightMultiplier = 1 + steps * percentPerStep;
  const adjustedWeight = baseWeightNum * weightMultiplier;

  return Math.max(0, Math.round(adjustedWeight * 1000) / 1000);
};
