/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineX } from 'react-icons/hi';
import { productsAPI } from '../../api/services';
import { getProductCardData, formatProductPrice, getMetallicColorStyle } from '../../utils/productCard';
import { getImageUrl } from '../../utils/imageUrl';

export default function WishlistProductCard({ item, onRemove }) {
  const [fullProduct, setFullProduct] = useState(null);
  const [selectedColorName, setSelectedColorName] = useState(null);

  const id = String(item.productId || item._id || item.id || '');

  // If item doesn't have metalColors or colorImages, fetch from API
  useEffect(() => {
    let current = true;
    const hasColors = (Array.isArray(item.metalColors) && item.metalColors.length > 0) ||
      (Array.isArray(item.colorImages) && item.colorImages.length > 0) ||
      (Array.isArray(item.metalColorIds) && item.metalColorIds.length > 0 && typeof item.metalColorIds[0] === 'object');

    if (!hasColors && id && /^[a-f0-9]{24}$/i.test(id)) {
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

  const activeProduct = fullProduct || item;
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

        {/* ─── Metal Color Swatches (Matches Reference) ─── */}
        {colors.length > 0 && (
          <div
            role="group"
            aria-label={`${name} available metal colors`}
            className="my-2 flex min-h-[20px] items-center justify-center gap-1.5"
          >
            {colors.slice(0, 6).map((colorEntry) => {
              const isSelected = Boolean(
                activeColorName && colorEntry.name?.toLowerCase() === activeColorName.toLowerCase()
              );
              const metallic = getMetallicColorStyle(
                colorEntry.name,
                colorEntry.hex,
                colorEntry.colorCodeEnd
              );

              return (
                <button
                  key={colorEntry.name}
                  type="button"
                  title={colorEntry.name}
                  aria-label={`Select ${colorEntry.name}`}
                  aria-pressed={isSelected}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColorName(colorEntry.name);
                  }}
                  className="flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8b6f4e] cursor-pointer"
                >
                  {colorEntry.hex ? (
                    <span
                      style={{
                        background: metallic.background,
                        boxShadow: metallic.boxShadow,
                        border: metallic.border,
                      }}
                      className={`block h-3 w-3 rounded-full relative overflow-hidden transition-all ${
                        isSelected
                          ? 'ring-1.5 ring-stone-900 ring-offset-1 scale-110'
                          : 'opacity-95 hover:opacity-100'
                      }`}
                    >
                      <span
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                          background:
                            'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 28%, rgba(255,255,255,0) 55%)',
                        }}
                        aria-hidden="true"
                      />
                    </span>
                  ) : (
                    <span className="rounded border px-1 text-[9px] border-stone-200">
                      {colorEntry.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── Price ─── */}
        <div className="pt-0.5 flex flex-wrap items-baseline justify-center gap-1.5">
          {(() => {
            const isSilver =
              Boolean(cardData.isSilver) ||
              String(activeProduct?.productType || activeProduct?.representative?.productType || '').toLowerCase() === 'silver' ||
              Boolean(activeProduct?.isOrnate || activeProduct?.representative?.isOrnate);

            const minPrice = Number(activeProduct?.pricing?.minPrice || cardData?.minPrice || 0);
            const maxPrice = Number(activeProduct?.pricing?.maxPrice || cardData?.maxPrice || 0);
            const hasRange = minPrice > 0 && maxPrice > 0 && maxPrice > minPrice;

            if (hasRange) {
              return (
                <span className="text-xs sm:text-[13px] font-bold text-stone-950">
                  {formatProductPrice(minPrice)} – {formatProductPrice(maxPrice)}
                </span>
              );
            }

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

            if (isSilver) {
              return (
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
              );
            }

            return (
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
            );
          })()}
        </div>
      </div>
    </article>
  );
}
