import { useEffect, useState } from 'react';
import { useWishlist } from '../contexts/WishlistContext';
import { getProductCardData } from '../utils/productCard';

/**
 * Shared hook encapsulating all product card business logic:
 * Color variation resolution, image switching, wishlist state,
 * title/slug/URL formatting, and price calculation.
 */
export function useProductCard(product, options = {}) {
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

  const isOrnate =
    Boolean(product.isOrnate) ||
    String(product?.productType || '').toLowerCase() === 'ornate' ||
    Boolean(product?.representative?.isOrnate);

  const isSilver =
    options.isSilver ??
    (Boolean(data.isSilver) ||
      String(product?.productType || product?.representative?.productType || '').toLowerCase() === 'silver' ||
      isOrnate);

  const isGroup = Boolean(product.isGroup);

  const rawSlug =
    product.basicInfo?.slug ||
    product.slug ||
    data.slug ||
    product.representative?.basicInfo?.slug ||
    product.representative?.slug;

  const title =
    (isGroup && product.groupName) ||
    product.basicInfo?.title ||
    product.title ||
    product.name ||
    product.itemName ||
    data?.name ||
    'Jewellery';

  const slug =
    rawSlug ||
    (title && title !== 'Jewellery'
      ? title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      : String(product._id || product.id || data.id));

  const href = isOrnate
    ? `/silver-collection/${encodeURIComponent(slug)}`
    : `/product/${encodeURIComponent(slug)}`;

  const [localWished, setLocalWished] = useState(() => {
    if (wishlistMap && wishlistMap[data.id] !== undefined) return Boolean(wishlistMap[data.id]);
    if (product?.inWishlist !== undefined) return Boolean(product.inWishlist);
    return undefined;
  });

  useEffect(() => {
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
    setWishlistBusy(true);
    const nextWished = !wished;
    setLocalWished(nextWished);
    try {
      await toggleWishlist(
        {
          ...product,
          id: data.id,
          title,
          price: data.price,
          image: activeImage,
        },
        wished,
      );
    } catch {
      setLocalWished(!nextWished);
    } finally {
      setWishlistBusy(false);
    }
  }

  const salePrice =
    data.salePrice ||
    product?.pricing?.salePrice ||
    product?.representative?.pricing?.salePrice ||
    data.price;

  const mrp =
    data.mrp ||
    product?.pricing?.mrp ||
    product?.representative?.pricing?.mrp ||
    data.originalPrice;

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
    isGold,
    hasDiscount,
    discountPercent,
  };
}

export default useProductCard;
