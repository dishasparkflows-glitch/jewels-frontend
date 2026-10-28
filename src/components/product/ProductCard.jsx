/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineX,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineShoppingBag,
} from "react-icons/hi";
import { IoDiamondOutline } from "react-icons/io5";
import { useWishlist } from "../../contexts/WishlistContext";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { getImageUrl } from "../../utils/imageUrl";
import {
  formatProductPrice,
  getProductCardData,
} from "../../utils/productCard";

function ProductImage({ src, name, className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? (
    <img
      src={getImageUrl(src)}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  ) : (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-stone-300">
      <IoDiamondOutline className="h-10 w-10" />
      <span className="text-xs text-stone-400">Image unavailable</span>
    </div>
  );
}

function ImagePreview({ images, name, onClose }) {
  const dialog = useRef(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.showModal();
    return () => {
      document.body.style.overflow = overflow;
      focus?.focus();
    };
  }, []);
  const move = (step) =>
    setIndex((previous) => (previous + step + images.length) % images.length);
  return createPortal(
    <dialog
      ref={dialog}
      aria-label={`${name} image preview`}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (
          images.length > 1 &&
          ["ArrowLeft", "ArrowRight"].includes(event.key)
        ) {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-2xl bg-white p-4 shadow-2xl backdrop:bg-black/50"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm leading-6 text-stone-700">{name}</h2>
        <button
          type="button"
          aria-label="Close image preview"
          onClick={onClose}
          className="rounded-full p-2 hover:bg-stone-100"
        >
          <HiOutlineX className="h-5 w-5" />
        </button>
      </div>
      <div className="relative mt-3 h-[min(65vh,600px)]">
        <ProductImage
          src={images[index]}
          name={`${name} — image ${index + 1}`}
          className="h-full w-full object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => move(-1)}
              className="absolute left-0 top-1/2 rounded-full border border-stone-200 bg-white p-3"
            >
              <HiOutlineChevronLeft />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => move(1)}
              className="absolute right-0 top-1/2 rounded-full border border-stone-200 bg-white p-3"
            >
              <HiOutlineChevronRight />
            </button>
          </>
        )}
      </div>
      <p aria-live="polite" className="mt-2 text-center text-xs text-stone-500">
        {index + 1} / {images.length}
      </p>
    </dialog>,
    document.body,
  );
}

export default function ProductCard({ product }) {
  const data = getProductCardData(product);
  const { isWishlisted, toggleWishlist, wishlistMap } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [selectedColorName, setSelectedColorName] = useState(null);
  const [hoveredColorName, setHoveredColorName] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const isGold = product.productType === 'gold';
  const colors = data.colors || [];
  const defaultColor = colors.find((entry) => /yellow/i.test(entry.name)) || colors[0];
  const activeColorName = hoveredColorName || selectedColorName || defaultColor?.name;
  const color =
    colors.find((entry) => entry.name?.toLowerCase() === activeColorName?.toLowerCase()) ||
    colors.find((entry) => entry.name === activeColorName) ||
    defaultColor ||
    colors[0];

  const matchingColorRow = (product.colorImages || []).find((row) => {
    if (!row || row.status === 'inactive') return false;
    const c = row.metalColorId || row.color;
    const rowName = typeof c === 'object' ? c?.name : (typeof c === 'string' ? c : '');
    const rowId = typeof c === 'object' ? String(c?._id || c?.id || '') : (typeof c === 'string' ? c : '');
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
    : (color?.image ? [color.image, ...data.images.filter(img => img !== color.image)] : data.images);

  const [imageIndex, setImageIndex] = useState(0);
  const image = cardImages[imageIndex] || color?.image || data.images[0] || "";
  const isGroup = Boolean(product.isGroup);
  const slug =
    product.basicInfo?.slug ||
    product.slug ||
    data.slug ||
    product.representative?.basicInfo?.slug ||
    product.representative?.slug ||
    (data.name ? data.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : '');
  const href = `/product/${encodeURIComponent(slug)}`;
  const title =
    (isGroup && product.groupName) ||
    product.basicInfo?.title ||
    product.title ||
    product.name ||
    product.itemName ||
    data?.name ||
    'Jewellery';

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
  const previewImages = [...new Set([image, ...cardImages, ...data.images].filter(Boolean))];

  async function handleWishlist() {
    if (wishlistBusy) return;
    setWishlistBusy(true);
    const nextWished = !wished;
    setLocalWished(nextWished);
    try {
      await toggleWishlist({
        ...product,
        id: data.id,
        title,
        price: data.price,
        image,
      }, wished);
    } catch {
      setLocalWished(!nextWished);
    } finally {
      setWishlistBusy(false);
    }
  }

  const handleAddToCart = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (addingToCart) return;
    setAddingToCart(true);

    try {
      const colorEntry = color;
      const metalColorId = colorEntry?.id || product.metalColorIds?.[0]?._id || product.metalColorIds?.[0] || null;

      let selectedAttributes = product.selectedAttributes ? { ...product.selectedAttributes } : undefined;
      if (metalColorId) {
        selectedAttributes = {
          ...(selectedAttributes || {}),
          metalColor: metalColorId,
        };
      }

      const price = Number(data.price) || 0;
      const quantity = 1;
      const totalItemPrice = price * quantity;
      const addedAt = new Date().toISOString();

      await addToCart(
        {
          id: data.id,
          productId: data.id,
          userId: user?._id || user?.id || null,
          title,
          price,
          totalItemPrice,
          addedAt,
          quantity,
          originalPrice: data.originalPrice,
          image,
          category: product.category || product.categoryIds?.[0]?.name || '',
          productType: product.productType || '',
          selectedAttributes,
          selectedMetal: activeColorName || color?.name || '',
        },
        1,
        {
          selectedMetal: activeColorName || color?.name || '',
        }
      );
    } catch (err) {
      console.error('Failed to add to cart from product card:', err);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <article
      className="group relative flex h-full min-w-0 flex-col justify-between bg-white rounded-2xl border border-stone-200/90 p-3 sm:p-3.5 hover:shadow-md hover:border-stone-300/90 transition-all duration-300 cursor-pointer"
    >
      <div>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white flex items-center justify-center">
          <Link
            to={href}
            aria-label={`View ${title}`}
            className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8b6f4e]"
          >
            <ProductImage
              src={image}
              name={title}
              className="h-full w-full object-contain p-2 sm:p-2.5 transition-transform duration-500 motion-safe:group-hover:scale-105"
            />
          </Link>

          {/* Wishlist Button (Top Right) */}
          <button
            type="button"
            disabled={wishlistBusy}
            aria-label={`${wished ? "Remove" : "Save"} ${title} ${wished ? "from" : "to"} wishlist`}
            aria-pressed={wished}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleWishlist();
            }}
            className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/90 hover:bg-white text-stone-400 hover:text-stone-700 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs border border-stone-100"
          >
            {wished ? (
              <HiHeart className="h-4 w-4 text-[#e11d48] fill-current" />
            ) : (
              <HiOutlineHeart className="h-4 w-4 stroke-[1.6]" />
            )}
          </button>

          {/* Quick View / Fullscreen Preview Button (Bottom Left) */}
          <button
            type="button"
            aria-label={`Preview images for ${title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPreviewOpen(true);
            }}
            className="absolute left-1.5 bottom-1.5 z-20 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-white/90 hover:bg-white text-stone-400 hover:text-stone-700 transition-colors shadow-2xs cursor-pointer border border-stone-100"
            title="Quick view images"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          </button>

          {/* Carousel Prev/Next Arrows */}
          {cardImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImageIndex((prev) => (prev - 1 + cardImages.length) % cardImages.length);
                }}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-xs border border-stone-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <HiOutlineChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImageIndex((prev) => (prev + 1) % cardImages.length);
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-xs border border-stone-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <HiOutlineChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Product Information (Left-aligned, standard title case, swatches, price) */}
        <div className="flex flex-col pt-2.5 pb-0.5 text-left items-start w-full">
          <Link
            to={href}
            className="block line-clamp-2 min-h-[34px] sm:min-h-[36px] text-[11.5px] sm:text-[12.5px] font-normal leading-snug text-stone-800 hover:text-[#8b6f4e] transition-colors text-left"
            title={title}
          >
            {title}
          </Link>

          {/* Metal Color Swatches (Left-aligned) */}
          {!!colors.length && (
            <div
              role="group"
              aria-label={`${title} colours`}
              className="mt-1.5 mb-1 flex min-h-[16px] flex-wrap items-center justify-start gap-1.5"
            >
              {colors.slice(0, 5).map((entry) => {
                const isSelected = Boolean(activeColorName && entry.name?.toLowerCase() === activeColorName.toLowerCase());
                const bgGradient = entry.colorCodeEnd
                  ? `linear-gradient(135deg, ${entry.hex}, ${entry.colorCodeEnd})`
                  : entry.hex
                    ? `linear-gradient(135deg, ${entry.hex}, ${entry.hex})`
                    : undefined;

                return (
                  <button
                    key={entry.name}
                    type="button"
                    title={entry.name}
                    aria-label={`Preview ${entry.name}`}
                    aria-pressed={isSelected}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedColorName(entry.name);
                      setImageIndex(0);
                    }}
                    className="flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8b6f4e] cursor-pointer"
                  >
                    {entry.hex ? (
                      <span
                        style={{ background: bgGradient || entry.hex }}
                        className={`block h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border transition-all ${
                          isSelected
                            ? "ring-1 ring-stone-900 ring-offset-1 scale-105 border-transparent"
                            : "border-stone-300/80 hover:border-stone-400"
                        }`}
                      />
                    ) : (
                      <span className="rounded border px-1 text-[9px] border-stone-200">
                        {entry.name}
                      </span>
                    )}
                  </button>
                );
              })}
              {colors.length > 5 && (
                <Link
                  to={href}
                  aria-label={`View all ${colors.length} colours`}
                  className="px-0.5 text-[10px] text-stone-500 hover:text-[#8b6f4e]"
                >
                  +{colors.length - 5}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Price (Left-aligned at bottom) */}
      <div className="pt-1 flex items-baseline justify-start gap-1.5 text-left flex-wrap w-full">
        {(() => {
          const isSilver =
            Boolean(data.isSilver) ||
            String(product?.productType || product?.representative?.productType || '').toLowerCase() === 'silver' ||
            Boolean(product?.isOrnate || product?.representative?.isOrnate);

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

          const hasDiscount = mrp && Number(mrp) > Number(salePrice);

          if (isSilver) {
            return (
              <>
                <span className="text-xs sm:text-[13.5px] font-bold text-stone-900 tracking-tight">
                  {formatProductPrice(salePrice) || "Price on request"}
                </span>
                {hasDiscount && (
                  <span className="text-[11px] sm:text-xs text-stone-400 line-through font-normal">
                    {formatProductPrice(mrp)}
                  </span>
                )}
              </>
            );
          }

          if (isGroup && product?.pricing?.minPrice && product?.pricing?.maxPrice && product.pricing.minPrice !== product.pricing.maxPrice) {
            return (
              <span className="text-xs sm:text-[13.5px] font-bold text-stone-900 tracking-tight">
                {formatProductPrice(product.pricing.minPrice)} – {formatProductPrice(product.pricing.maxPrice)}
              </span>
            );
          }

          return (
            <>
              <span className="text-xs sm:text-[13.5px] font-bold text-stone-900 tracking-tight">
                {formatProductPrice(data.price) || "Price on request"}
              </span>
              {data.originalPrice && Number(data.originalPrice) > Number(data.price) && (
                <span className="text-[11px] sm:text-xs text-stone-400 line-through font-normal">
                  {formatProductPrice(data.originalPrice)}
                </span>
              )}
            </>
          );
        })()}
      </div>

      {previewOpen && (
        <ImagePreview
          images={previewImages}
          name={data.name}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </article>
  );
}
