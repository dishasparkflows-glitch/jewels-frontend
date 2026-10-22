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
} from "react-icons/hi";
import { IoDiamondOutline } from "react-icons/io5";
import { useWishlist } from "../../contexts/WishlistContext";
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
  const [colorName, setColorName] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const color =
    data.colors.find((entry) => entry.name === colorName) || data.colors[0];
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
  return (
    <article className="group flex min-w-0 flex-col rounded-2xl border border-[#e8ddd2] bg-white p-2.5 text-left transition-colors hover:border-[#c7b49e] sm:p-3.5">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f8f8f8]">
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
            className="h-full w-full object-contain p-3 transition-transform duration-300 motion-safe:group-hover:scale-[1.03] sm:p-5"
          />
        </Link>
        <button
          type="button"
          disabled={wishlistBusy}
          aria-label={`${wished ? "Remove" : "Save"} ${title} ${wished ? "from" : "to"} wishlist`}
          aria-pressed={wished}
          onClick={handleWishlist}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-[#e8ddd2] bg-white/95 text-[#8c7968] transition-colors hover:text-rose-600 disabled:opacity-50"
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
            className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded border border-[#e8ddd2] bg-white text-[#8c7968] shadow-sm hover:bg-stone-50"
          >
            <HiOutlineArrowsExpand className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col pt-3">
        <Link
          to={href}
          className="line-clamp-2 min-h-[2.5rem] text-xs font-normal leading-5 text-stone-900 hover:text-[#8b6f4e] sm:text-[13px]"
        >
          {title}
        </Link>
        {!!data.colors.length && (
          <div
            role="group"
            aria-label={`${title} colours`}
            className="mt-1 flex flex-wrap items-center gap-0.5"
          >
            {data.colors.slice(0, 5).map((entry) => (
              <button
                key={entry.name}
                type="button"
                title={entry.name}
                aria-label={`Preview ${entry.name}`}
                aria-pressed={color?.name === entry.name}
                onClick={() => setColorName(entry.name)}
                className="flex h-7 min-w-7 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8b6f4e]"
              >
                {entry.hex ? (
                  <span
                    style={{
                      backgroundColor: entry.hex,
                      backgroundImage:
                        "linear-gradient(135deg, rgba(255,255,255,.65), transparent)",
                    }}
                    className={`block h-3.5 w-3.5 rounded-full border border-stone-200 ${color?.name === entry.name ? "ring-1 ring-stone-700 ring-offset-2" : ""}`}
                  />
                ) : (
                  <span
                    className={`rounded border px-1 text-[9px] ${color?.name === entry.name ? "border-stone-700" : "border-stone-200"}`}
                  >
                    {entry.name}
                  </span>
                )}
              </button>
            ))}
            {data.colors.length > 5 && (
              <Link
                to={href}
                aria-label={`View all ${data.colors.length} colours`}
                className="px-1 text-[10px] text-stone-500"
              >
                +{data.colors.length - 5}
              </Link>
            )}
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-1 text-[13px]">
          {isGroup && product.pricing?.minPrice && product.pricing?.maxPrice && product.pricing.minPrice !== product.pricing.maxPrice ? (
            <div className="flex flex-col">
              <span className="font-semibold text-stone-950">
                {formatProductPrice(product.pricing.minPrice)} – {formatProductPrice(product.pricing.maxPrice)}
              </span>
              <span className="text-[10px] text-stone-400">
                Rep: {formatProductPrice(product.pricing.salePrice || data.price)}
              </span>
            </div>
          ) : (
            <>
              <span className="font-semibold text-stone-950">
                {formatProductPrice(data.price) || "Price on request"}
              </span>
              {data.originalPrice && (
                <span className="text-xs text-stone-400 line-through">
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
