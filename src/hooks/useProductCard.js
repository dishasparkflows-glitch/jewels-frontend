import { useEffect, useState } from 'react';
import { useWishlist } from '../contexts/WishlistContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { getProductCardData } from '../utils/productCard';

/**
 * Shared hook encapsulating all product card business logic:
 * Color variation resolution, image switching, wishlist state,
 * title/slug/URL formatting, and price calculation.
 */
export function useProductCard(product, options = {}) {
  useCurrency();
  const data = getProductCardData(product);
  const { isWishlisted, toggleWishlist, wishlistMap } = useWishlist();

  const [selectedColorName, setSelectedColorName] = useState(null);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const colors = data.colors || [];
  const defaultColor = colors.find((entry) => /yellow/i.test(entry.name)) || colors[0];
  const activeColorName = selectedColorName || defaultColor?.name;
  const color =
    colors.find((entry) => entry.name?.toLowerCase() === activeColorName?.toLowerCase()) ||
    colors.find((entry) => entry.name === activeColorName) ||
    defaultColor ||
    colors[0];

  const matchingColorRow = (product.colorImages || []).find((row) => {
    if (!row || row.status === 'inactive') return false;
    const c = row.metalColorId || row.color;
    const rowName = typeof c === 'object' ? c?.name : typeof c === 'string' ? c : '';
    const rowId = typeof c === 'object' ? String(c?._id || c?.id || '') : typeof c === 'string' ? c : '';
    return (
      (color?.id && rowId && String(color.id) === rowId) ||
      (color?.name && rowName && color.name.toLowerCase() === rowName.toLowerCase())
    );
  });

  const colorRowImages = (matchingColorRow?.images || [])
    .map((img) => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean);

  const cardImages = colorRowImages.length > 0
    ? [...new Set(colorRowImages)]
    : color?.image
      ? [color.image, ...data.images.filter((img) => img !== color.image)]
      : data.images;

  useEffect(() => {
    setImageIndex(0);
  }, [activeColorName]);

  const activeImage = cardImages[imageIndex] || color?.image || data.images[0] || '';

  const isDiamond = Boolean(product?.itemType === 'diamond' || product?.productType === 'diamond');

  const isOrnate =
    !isDiamond &&
    (Boolean(product.isOrnate) ||
      String(product?.productType || '').toLowerCase() === 'ornate');

  const isSilver =
    !isDiamond &&
    (options.isSilver ??
      (Boolean(data.isSilver) ||
        String(product?.productType || '').toLowerCase() === 'silver' ||
        Boolean(product?.isOrnate) ||
        isOrnate ||
        /silver|92\.5|925/i.test(product?.basicInfo?.title || product?.title || data?.name || '')));

  const isGroup = Boolean(product.isGroup);

  const rawSlug =
    product.basicInfo?.slug ||
    (isDiamond ? (product.sku || String(product._id || product.id || '')) : '') ||
    data.slug;

  const title =
    (isGroup && product.groupName) ||
    product.basicInfo?.title ||
    data?.name ||
    (isDiamond ? 'Certified Diamond' : 'Jewellery');

  const slug =
    rawSlug ||
    (title && title !== 'Jewellery'
      ? title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      : String(product._id || product.id || data.id));

  const href = isDiamond
    ? `/diamond/${encodeURIComponent(slug)}`
    : isOrnate
      ? `/silver-collection/${encodeURIComponent(slug)}`
      : `/product/${encodeURIComponent(slug)}`;

  const [localWished, setLocalWished] = useState(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return false;
    if (wishlistMap && wishlistMap[data.id] !== undefined) return Boolean(wishlistMap[data.id]);
    if (product?.inWishlist !== undefined) return Boolean(product.inWishlist);
    return false;
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLocalWished(false);
      return;
    }
    if (wishlistMap && wishlistMap[data.id] !== undefined) {
      setLocalWished(Boolean(wishlistMap[data.id]));
    } else if (product?.inWishlist !== undefined) {
      setLocalWished(Boolean(product.inWishlist));
    }
  }, [wishlistMap, data.id, product?.inWishlist]);

  const wished = localWished !== undefined ? localWished : isWishlisted(data.id);
  const previewImages = [...new Set([activeImage, ...cardImages, ...data.images].filter(Boolean))];

  async function handleWishlist(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }
    if (wishlistBusy) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      await toggleWishlist(product, false);
      return;
    }

    setWishlistBusy(true);
    const nextWished = !wished;
    setLocalWished(nextWished);
    try {
      const res = await toggleWishlist(
        {
          ...product,
          id: data.id,
          title,
          price: data.price,
          image: activeImage,
        },
        wished,
      );
      if (res === false && !token) {
        setLocalWished(wished);
      }
    } catch {
      setLocalWished(!nextWished);
    } finally {
      setWishlistBusy(false);
    }
  }

  const salePrice =
    data.salePrice ||
    product?.pricing?.salePrice ||
    data.price;

  const mrp =
    data.mrp ||
    product?.pricing?.mrp ||
    data.originalPrice;

  const minPrice = Number(product?.pricing?.minPrice || data?.minPrice || 0);
  const maxPrice = Number(product?.pricing?.maxPrice || data?.maxPrice || 0);
  const hasRange = !isSilver && minPrice > 0 && maxPrice > 0 && maxPrice > minPrice && (minPrice !== salePrice || maxPrice !== mrp);

  const isGold = product.productType === 'gold';
  const hasDiscount = !isGold && mrp && Number(mrp) > Number(salePrice);
  const discountPercent =
    product.discount ||
    (hasDiscount ? Math.round(((Number(mrp) - Number(salePrice)) / Number(mrp)) * 100) : 0);

  const selectColor = (name) => {
    setSelectedColorName(name);
    setImageIndex(0);
  };

  return {
    data,
    colors,
    defaultColor,
    activeColorName,
    selectedColorName,
    setSelectedColorName,
    selectColor,
    color,
    cardImages,
    activeImage,
    imageIndex,
    setImageIndex,
    previewImages,
    isDiamond,
    isOrnate,
    isSilver,
    isGroup,
    title,
    slug,
    href,
    wished,
    wishlistBusy,
    handleWishlist,
    salePrice,
    mrp,
    minPrice,
    maxPrice,
    hasRange,
    isGold,
    hasDiscount,
    discountPercent,
  };
}

export default useProductCard;
