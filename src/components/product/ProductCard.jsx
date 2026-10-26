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
      className="group flex h-full min-w-0 flex-col justify-between p-2.5 sm:p-3 rounded-2xl border border-stone-200/90 bg-white shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#FAF9F7] flex items-center justify-center transition-colors">
        <Link
          to={href}
          aria-label={`View ${title}`}
          className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8b6f4e]"
        >
          <ProductImage
            src={image}
            name={title}
            className="h-full w-full object-contain p-4 sm:p-5 transition-transform duration-700 motion-safe:group-hover:scale-105"
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
          className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200/70 shadow-2xs transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {wished ? (
            <HiHeart className="h-4 w-4 text-[#e11d48] fill-current" />
          ) : (
            <HiOutlineHeart className="h-4 w-4" />
          )}
        </button>

        {/* Quick Preview / Expand Button (Bottom Left) */}
        <button
          type="button"
          title="Quick preview"
          aria-label="Expand image"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setPreviewOpen(true);
          }}
          className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 z-20 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded bg-white/90 hover:bg-white text-stone-500 hover:text-stone-900 border border-stone-200/80 shadow-2xs transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
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

        {/* Carousel Pagination Dots */}
        {cardImages.length > 1 && (
          <div className="absolute bottom-2.5 inset-x-0 z-10 flex items-center justify-center gap-1.5 pointer-events-none">
            {cardImages.slice(0, 5).map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === imageIndex ? 'w-3.5 bg-stone-800' : 'w-1.5 bg-stone-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Information (Left-aligned) */}
      <div className="flex flex-1 flex-col pt-3 pb-1 px-1 text-left justify-between bg-white">
        <div>
          <Link
            to={href}
            className="block line-clamp-2 min-h-[32px] sm:min-h-[36px] text-xs sm:text-[13px] font-normal leading-[1.35] text-stone-800 hover:text-[#8b6f4e] transition-colors"
          >
            {title}
          </Link>

          {/* Metal Color Swatches */}
          {!!colors.length && (
            <div
              role="group"
              aria-label={`${title} colours`}
              className="my-2 flex min-h-[20px] flex-wrap items-center gap-1.5"
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
                    className="flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8b6f4e] cursor-pointer"
                  >
                    {entry.hex ? (
                      <span
                        style={{ background: bgGradient || entry.hex }}
                        className={`block h-3 w-3 rounded-full border transition-all ${
                          isSelected
                            ? "ring-1 ring-stone-900 ring-offset-1 scale-110 border-transparent"
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
                  className="px-1 text-[10px] text-stone-500 hover:text-[#8b6f4e]"
                >
                  +{colors.length - 5}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="pt-0.5">
          {isGroup && product.pricing?.minPrice && product.pricing?.maxPrice && product.pricing.minPrice !== product.pricing.maxPrice ? (
            <div className="flex flex-col">
              <span className="text-xs sm:text-[14px] font-bold text-stone-950">
                {formatProductPrice(product.pricing.minPrice)} – {formatProductPrice(product.pricing.maxPrice)}
              </span>
            </div>
          ) : (
            <span className="text-xs sm:text-[14px] font-bold text-stone-950 tracking-tight">
              {formatProductPrice(data.price) || "Price on request"}
            </span>
          )}
        </div>
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
