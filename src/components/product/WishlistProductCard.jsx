/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineX, HiOutlineShoppingBag } from 'react-icons/hi';
import { useCart } from '../../contexts/CartContext';
import { formatProductPrice } from '../../utils/productCard';
import { getImageUrl } from '../../utils/imageUrl';
import ColorSwatches from './ColorSwatches';

export default function WishlistProductCard({ item, onRemove }) {
  const [selectedColorName, setSelectedColorName] = useState(null);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart } = useCart();

  if (!item) return null;

  const id = String(item.refId || item._id || '');
  const isDiamond = Boolean(item.itemType === 'diamond' || item.productType === 'diamond');
  const itemType = isDiamond ? 'diamond' : 'product';
  const name = item.basicInfo?.title || (isDiamond ? 'Certified Diamond' : 'Jewellery');
  const slug = item.basicInfo?.slug || '';
  const productPath = isDiamond
    ? `/diamond/${encodeURIComponent(slug || id)}`
    : slug
      ? `/product/${encodeURIComponent(slug)}`
      : '/shop';

  // Metal colors from backend
  const colors = (item.metalColors || []).map((mc) => ({
    id: mc._id || mc.name,
    _id: mc._id,
    name: mc.name,
    hex: mc.hex || mc.colorCode,
    colorCode: mc.colorCode,
    colorCodeEnd: mc.colorCodeEnd,
    firstPhoto: mc.firstPhoto,
  }));

  const defaultColor = colors.find((c) => /yellow/i.test(c.name)) || colors[0];
  const activeColorName = selectedColorName || defaultColor?.name;
  const activeColor =
    colors.find((c) => c.name?.toLowerCase() === activeColorName?.toLowerCase()) ||
    defaultColor ||
    colors[0];

  // Resolve current image: active color image if available, otherwise primary item image
  const displayImage =
    getImageUrl(activeColor?.firstPhoto) ||
    getImageUrl(item.image) ||
    '/featured/ring.jpg';

  // Pricing from backend
  const isSilver = item.productType === 'silver';
  const minPrice = Number(item.pricing?.minPrice || 0);
  const maxPrice = Number(item.pricing?.maxPrice || 0);
  const salePrice = Number(item.pricing?.salePrice || minPrice || 0);
  const mrp = Number(item.pricing?.mrp || 0);
  const hasRange = !isSilver && minPrice > 0 && maxPrice > 0 && maxPrice > minPrice;
  const hasDiscount = mrp > salePrice;
  const unitPrice = salePrice || minPrice || mrp || 0;

  const handleAddToCart = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      const activeColorId = activeColor?._id || activeColor?.id || null;
      const selectedMetalStr = isDiamond ? '' : (activeColorName || (isSilver ? 'Silver' : 'Gold'));
      const selectedAttributes = {};
      if (isDiamond) {
        if (item.diamondType) selectedAttributes.diamondType = item.diamondType;
        if (item.shape) selectedAttributes.diamondShape = item.shape;
        if (item.color) selectedAttributes.diamondColor = item.color;
        if (item.clarity) selectedAttributes.diamondClarity = item.clarity;
        if (item.carat) selectedAttributes.caratWeight = item.carat;
      } else {
        if (activeColorId) {
          selectedAttributes.metalColor = activeColorId;
        }
        if (isSilver) {
          selectedAttributes.metalPurity = 'Silver';
          if (!selectedAttributes.metalColor) {
            selectedAttributes.metalColor = 'Silver';
          }
        }
      }

      addToCart(
        {
          refId: id,
          id,
          itemType,
          title: name,
          name,
          price: unitPrice,
          totalItemPrice: unitPrice,
          quantity: 1,
          image: displayImage,
          productType: item.productType || (isSilver ? 'silver' : 'jewellery'),
          selectedAttributes: Object.keys(selectedAttributes).length > 0 ? selectedAttributes : undefined,
          selectedMetal: selectedMetalStr,
        },
        1,
        {
          itemType,
          selectedMetal: selectedMetalStr,
          selectedAttributes: Object.keys(selectedAttributes).length > 0 ? selectedAttributes : undefined,
        }
      );

      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    } catch (err) {
      console.error('Failed to add to cart from wishlist:', err);
    }
  };

  return (
    <article className="group min-w-0 flex flex-col justify-between text-center transition-all duration-300">
      {/* ─── Image Box ─── */}
      <div className="relative aspect-square bg-[#f6f2ec] rounded-2xl p-4 sm:p-5 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:shadow-sm">
        <Link
          to={productPath}
          aria-label={`View ${name}`}
          className="flex h-full w-full items-center justify-center"
        >
          <img
            src={displayImage}
            alt={name}
            loading="lazy"
            className="h-full w-full object-contain p-2 sm:p-4 transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Remove (✕) Button */}
        <button
          type="button"
          onClick={() => onRemove(id)}
          aria-label={`Remove ${name} from wishlist`}
          className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white text-stone-500 hover:text-stone-900 border border-stone-200/60 shadow-xs transition-all hover:scale-110 active:scale-95 cursor-pointer"
        >
          <HiOutlineX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {/* ─── Product Title & Info ─── */}
      <div className="pt-3 flex flex-col items-center">
        <Link
          to={productPath}
          className="block line-clamp-2 min-h-[32px] sm:min-h-[36px] px-1 text-xs sm:text-[13px] font-normal leading-snug text-stone-800 transition hover:text-[#92704e]"
        >
          {name}
        </Link>

        {/* ─── Metal Color Swatches ─── */}
        {colors.length > 0 && (
          <ColorSwatches
            colors={colors}
            activeColorName={activeColorName}
            onSelectColor={(colorName) => setSelectedColorName(colorName)}
            maxVisible={6}
            className="my-2 flex min-h-[22px] items-center justify-center gap-2"
            sizeClass="w-3.5 h-3.5 sm:w-4 sm:h-4"
          />
        )}

        {/* ─── Price ─── */}
        <div className="pt-0.5 flex flex-wrap items-baseline justify-center gap-1.5">
          {hasRange ? (
            <span className="text-xs sm:text-[13px] font-bold text-stone-950">
              {formatProductPrice(minPrice)} – {formatProductPrice(maxPrice)}
            </span>
          ) : (
            <>
              <span className="text-xs sm:text-[13px] font-bold text-stone-950">
                {formatProductPrice(salePrice) || 'Price unavailable'}
              </span>
              {hasDiscount && (
                <span className="text-[11px] sm:text-xs text-stone-400 line-through font-normal">
                  {formatProductPrice(mrp)}
                </span>
              )}
            </>
          )}
        </div>

        {/* ─── Add to Cart Button ─── */}
        <div className="mt-3 w-full pt-1">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full h-9 sm:h-10 px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-[#211f1c] hover:bg-[#8b6f4e] text-white text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer group/btn"
          >
            {justAdded ? (
              <span className="text-emerald-300 font-bold flex items-center gap-1 animate-fadeIn">
                ✓ Added
              </span>
            ) : (
              <>
                <HiOutlineShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover/btn:scale-110" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
