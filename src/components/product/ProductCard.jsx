/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineArrowsExpand,
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
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [selectedColorName, setSelectedColorName] = useState(null);
  const [hoveredColorName, setHoveredColorName] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const isGold = (product.productType === 'gold') || /gold/i.test(product.basicInfo?.title || product.title || '');
  const defaultGoldColor = data.colors.find((entry) => /yellow/i.test(entry.name)) || data.colors[0];
  const activeColorName = hoveredColorName || selectedColorName || (isGold ? defaultGoldColor?.name : undefined);
  const color =
    data.colors.find((entry) => entry.name === activeColorName) || defaultGoldColor || data.colors[0];
  const image = color?.image || data.images[0] || "";
  const isGroup = Boolean(product.isGroup);
  const href = isGroup
    ? `/product/${encodeURIComponent(product.representative?._id || product.slug || data.id)}`
    : `/product/${encodeURIComponent(data.id)}`;
  const title = isGroup ? (product.groupName || data.name) : data.name;
  const wished = isWishlisted(data.id);
  const previewImages = [...new Set([image, ...data.images].filter(Boolean))];

  async function handleWishlist() {
    if (wishlistBusy) return;
    setWishlistBusy(true);
    try {
      await toggleWishlist({
        ...product,
        id: data.id,
        title,
        price: data.price,
        image,
      });
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

      let selectedAttributes = undefined;
      if (isGold) {
        selectedAttributes = {
          metalPurity: product.selectedAttributes?.metalPurity || product.metalPurityIds?.[0] || '6a6add8dac243de1a327163a',
          metalColor: metalColorId || product.selectedAttributes?.metalColor || '69f477a1952290faef1ebe12',
          diamondType: product.selectedAttributes?.diamondType || '69b94dfb18de26f09b61e19b',
          diamondShape: product.selectedAttributes?.diamondShape || '6a571bb6701e99117e65bbf4',
          diamondClarity: product.selectedAttributes?.diamondClarity || '6a571bb6701e99117e65bbf7',
          diamondColor: product.selectedAttributes?.diamondColor || '6a571bb6701e99117e65bbfa',
          caratWeight: Number(product.selectedAttributes?.caratWeight || 1.5),
          size: null,
          sizeRange: null,
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
          productType: product.productType || (isGold ? 'gold' : ''),
          selectedAttributes,
          selectedMetal: activeColorName || color?.name || '',
        },
        1,
        {
          userId: user?._id || user?.id || null,
          price,
          totalItemPrice,
          addedAt,
          selectedMetal: activeColorName || color?.name || '',
          selectedAttributes,
        }
      );
    } catch (err) {
      console.error('Failed to add to cart from product card:', err);
    } finally {
      setAddingToCart(false);
    }
  };
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-stone-200/80 bg-white text-center shadow-[0_2px_10px_rgba(73,54,35,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#ddcbb4] hover:shadow-[0_12px_28px_rgba(73,54,35,0.10)] cursor-pointer">
      <div className={`relative aspect-square overflow-hidden mb-1.5 sm:mb-2 flex items-center justify-center transition-colors duration-300 ${isGold ? "bg-[#F0E8D8]" : "bg-[#f5ebd5]"}`}>
        {isGroup && (
          <span className="absolute top-2 left-2 z-10 bg-[#8b6f4e] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            {product.variantCount} {product.variantCount === 1 ? 'Variant' : 'Variants'}
          </span>
        )}
        <Link
          to={href}
          aria-label={`View ${title}`}
          className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8b6f4e]"
        >
          <ProductImage
            src={image}
            name={title}
            className="h-full w-full object-contain p-3 transition-transform duration-700 motion-safe:group-hover:scale-105 sm:p-4"
          />
        </Link>
        <button
          type="button"
          disabled={wishlistBusy}
          aria-label={`${wished ? "Remove" : "Save"} ${title} ${wished ? "from" : "to"} wishlist`}
          aria-pressed={wished}
          onClick={handleWishlist}
          className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-400 backdrop-blur-xs shadow-xs transition hover:text-red-500 hover:scale-105 disabled:opacity-50"
        >
          {wished ? (
            <HiHeart className="h-4 w-4 text-rose-500" />
          ) : (
            <HiOutlineHeart className="h-4 w-4" />
          )}
        </button>
        {!!image && (
          <button
            type="button"
            aria-label={`Enlarge ${title} image`}
            onClick={() => setPreviewOpen(true)}
            className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#8c7968] opacity-0 shadow-xs backdrop-blur-xs transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100 z-10"
          >
            <HiOutlineArrowsExpand className="h-3.5 w-3.5" />
          </button>
        )}

        {/* ADD TO CART Button - Matches Screenshot */}
        <div className="absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3 z-20 transition-all duration-300 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
          <button
            type="button"
            disabled={addingToCart}
            onClick={handleAddToCart}
            className="flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#201e1b] py-2 sm:py-2.5 px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all duration-200 hover:bg-[#8b6f4e] active:scale-[0.98] disabled:opacity-75 cursor-pointer"
          >
            <HiOutlineShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>{addingToCart ? "ADDING..." : "ADD TO CART"}</span>
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center px-2 pb-3 pt-1.5 sm:px-3 sm:pb-3.5 text-center">
        <Link
          to={href}
          className="line-clamp-2 min-h-[28px] sm:min-h-[34px] w-full text-[11px] sm:text-[13px] font-medium leading-[1.3] text-stone-800 hover:text-[#8b6f4e]"
        >
          {title}
        </Link>
        {!!data.colors.length && (
          <div
            role="group"
            aria-label={`${title} colours`}
            onMouseLeave={() => setHoveredColorName(null)}
            className="mt-1.5 sm:mt-2 flex min-h-6 flex-wrap items-center justify-center gap-1 sm:gap-1.5"
          >
            {data.colors.slice(0, 5).map((entry) => {
              const isSelected = color?.name === entry.name;
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
                  }}
                  onMouseEnter={() => {
                    setHoveredColorName(entry.name);
                  }}
                  className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8b6f4e]"
                >
                  {entry.hex ? (
                    <span
                      style={{
                        background: bgGradient || entry.hex,
                      }}
                      className={`block h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 rounded-full border transition-all ${
                        isSelected ? "ring-1 ring-stone-900 ring-offset-1 scale-110" : "border-stone-300 hover:border-stone-400"
                      }`}
                    />
                  ) : (
                    <span
                      className={`rounded border px-1 text-[9px] ${
                        isSelected ? "border-stone-700 bg-stone-100 font-medium" : "border-stone-200"
                      }`}
                    >
                      {entry.name}
                    </span>
                  )}
                </button>
              );
            })}
            {data.colors.length > 5 && (
              <Link
                to={href}
                aria-label={`View all ${data.colors.length} colours`}
                className="px-1 text-[10px] text-stone-500 hover:text-[#8b6f4e]"
              >
                +{data.colors.length - 5}
              </Link>
            )}
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-baseline justify-center gap-1.5 sm:gap-2 pt-2">
          {isGroup && product.pricing?.minPrice && product.pricing?.maxPrice && product.pricing.minPrice !== product.pricing.maxPrice ? (
            <div className="flex flex-col">
              <span className="text-xs sm:text-[14px] font-semibold text-stone-950">
                {formatProductPrice(product.pricing.minPrice)} – {formatProductPrice(product.pricing.maxPrice)}
              </span>
              <span className="text-[10px] text-stone-400">
                Rep: {formatProductPrice(product.pricing.salePrice || data.price)}
              </span>
            </div>
          ) : (
            <>
              <span className="text-xs sm:text-[14px] font-semibold text-stone-950">
                {formatProductPrice(data.price) || "Price on request"}
              </span>
              {data.originalPrice && (
                <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                  {formatProductPrice(data.originalPrice)}
                </span>
              )}
            </>
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
