/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineX, HiOutlineShoppingBag } from 'react-icons/hi';
import { useCart } from '../../contexts/CartContext';
import { productsAPI } from '../../api/services';
import { getProductCardData, formatProductPrice } from '../../utils/productCard';
import { getImageUrl } from '../../utils/imageUrl';
import { isSilverProduct } from '../../utils/productType';
import ColorSwatches from './ColorSwatches';

export default function WishlistProductCard({ item, onRemove }) {
  const [fullProduct, setFullProduct] = useState(null);
  const [selectedColorName, setSelectedColorName] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart } = useCart();

  const id = String(
    (item.productId && typeof item.productId === 'object' ? item.productId._id : null) ||
    (typeof item.productId === 'string' ? item.productId : null) ||
    item._id ||
    item.id ||
    ''
  );

  // Only fetch full product if we don't have basic card data at all
  useEffect(() => {
    let current = true;
    const hasBasicData = Boolean(
      item.basicInfo?.title ||
      item.title ||
      item.pricing?.salePrice ||
      item.pricing?.mrp ||
      item.image ||
      item.images
    );

    if (!hasBasicData && id && /^[a-f0-9]{24}$/i.test(id)) {
      productsAPI.getById(id)
        .then((res) => {
          if (current && res?.data?.data) {
            setFullProduct(res.data.data);
          }
        })
        .catch(() => {});
    }
    return () => { current = false; };
  }, [id, item]);

  const activeProduct = fullProduct || (item.productId && typeof item.productId === 'object' ? item.productId : item);
  const cardData = getProductCardData(activeProduct);

  const name =
    activeProduct.basicInfo?.title ||
    cardData.name ||
    'Jewellery';

  const slug =
    activeProduct.basicInfo?.slug ||
    cardData.slug ||
    (name ? name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : '');

  const productPath = slug ? `/product/${encodeURIComponent(slug)}` : '/shop';

  const colors = cardData.colors || [];
  const defaultColor = colors.find((c) => /yellow/i.test(c.name)) || colors[0];
  const activeColorName = selectedColorName || defaultColor?.name;
  const activeColor =
    colors.find((c) => c.name?.toLowerCase() === activeColorName?.toLowerCase()) ||
    defaultColor ||
    colors[0];

  // Resolve current image
  const displayImage =
    (activeColor?.image && getImageUrl(activeColor.image)) ||
    (cardData.images[0] && getImageUrl(cardData.images[0])) ||
    (typeof item.image === 'object' ? getImageUrl(item.image?.url) : getImageUrl(item.image)) ||
    '/featured/ring.jpg';

  const price = cardData.price || activeProduct.pricing?.salePrice || activeProduct.pricing?.calculatedPrice || activeProduct.pricing?.mrp;

  const isSilver = isSilverProduct(activeProduct) || isSilverProduct(cardData);

  const minPrice = Number(activeProduct?.pricing?.minPrice || cardData?.minPrice || 0);
  const maxPrice = Number(activeProduct?.pricing?.maxPrice || cardData?.maxPrice || 0);
  const hasRange = !isSilver && minPrice > 0 && maxPrice > 0 && maxPrice > minPrice;

  const salePrice =
    cardData.salePrice ||
    activeProduct?.pricing?.salePrice ||
    activeProduct?.representative?.pricing?.salePrice ||
    price;

  const mrp =
    cardData.mrp ||
    activeProduct?.pricing?.mrp ||
    activeProduct?.representative?.pricing?.mrp ||
    cardData.originalPrice;

  const hasDiscount = mrp && Number(mrp) > Number(salePrice);
  const unitPrice = Number(salePrice || minPrice || price || activeProduct?.pricing?.mrp || 0);

  const handleAddToCart = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (addingToCart) return;
    setAddingToCart(true);

    try {
      const activeColorId =
        activeColor?._id ||
        activeColor?.id ||
        activeProduct?.metalColorIds?.[0]?._id ||
        activeProduct?.metalColorIds?.[0] ||
        null;

      let selectedAttributes = activeProduct?.selectedAttributes ? { ...activeProduct.selectedAttributes } : {};
      if (activeColorId) {
        selectedAttributes.metalColor = activeColorId;
      }
      if (isSilver) {
        selectedAttributes.metalPurity = 'Silver';
        if (!selectedAttributes.metalColor) {
          selectedAttributes.metalColor = 'Silver';
        }
      }

      const selectedMetalStr = activeColorName || (isSilver ? 'Silver' : 'Gold');

      await addToCart(
        {
          _id: id,
          id,
          productId: id,
          title: name,
          name,
          price: unitPrice,
          totalItemPrice: unitPrice,
          quantity: 1,
          image: displayImage,
          category: activeProduct?.category || activeProduct?.categoryIds?.[0]?.name || activeProduct?.categoryIds?.[0] || '',
          productType: activeProduct?.productType || (isSilver ? 'silver' : 'jewellery'),
          selectedAttributes: Object.keys(selectedAttributes).length > 0 ? selectedAttributes : undefined,
          selectedMetal: selectedMetalStr,
        },
        1,
        {
          selectedMetal: selectedMetalStr,
          selectedAttributes: Object.keys(selectedAttributes).length > 0 ? selectedAttributes : undefined,
        }
      );
    } catch (err) {
      console.error('Failed to add to cart from wishlist:', err);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <article className="group min-w-0 flex flex-col justify-between text-center transition-all duration-300">
      {/* ─── Image Box (Warm subtle background matching reference) ─── */}
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

      {/* ─── Product Title ─── */}
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
          ) : isSilver ? (
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
          ) : (
            <>
              <span className="text-xs sm:text-[13px] font-bold text-stone-950">
                {formatProductPrice(price) || 'Price unavailable'}
              </span>
              {cardData.originalPrice && Number(cardData.originalPrice) > Number(price) && (
                <span className="text-[11px] sm:text-xs text-stone-400 line-through font-normal">
                  {formatProductPrice(cardData.originalPrice)}
                </span>
              )}
            </>
          )}
        </div>

        {/* ─── Add to Cart Button ─── */}
        <div className="mt-3 w-full pt-1">
          <button
            type="button"
            disabled={addingToCart}
            onClick={handleAddToCart}
            className="w-full h-9 sm:h-10 px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-[#211f1c] hover:bg-[#8b6f4e] text-white text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group/btn"
          >
            {addingToCart ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Adding...</span>
              </>
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
