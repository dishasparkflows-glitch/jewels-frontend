/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  LuHeart,
  LuMaximize,
  LuChevronLeft,
  LuChevronRight,
  LuX,
} from "react-icons/lu";
import { IoDiamondOutline } from "react-icons/io5";
import { useWishlist } from "../../contexts/WishlistContext";
import { getImageUrl } from "../../utils/imageUrl";
import {
  formatProductPrice,
  getProductCardData,
} from "../../utils/productCard";

function isVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  return /\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(url);
}

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
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-stone-300">
      <IoDiamondOutline className="h-8 w-8 text-stone-300" />
      <span className="text-[10px] sm:text-[11px] text-stone-400">Image unavailable</span>
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
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = overflow;
      focus?.focus();
    };
  }, []);

  const move = (step) =>
    setIndex((prev) => (prev + step + images.length) % images.length);

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
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl bg-white p-4 sm:p-6 shadow-2xl backdrop:bg-black/60 z-[200]"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-medium text-stone-800 line-clamp-1">{name}</h2>
        <button
          type="button"
          aria-label="Close image preview"
          onClick={onClose}
          className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors cursor-pointer"
        >
          <LuX className="h-5 w-5" />
        </button>
      </div>
      <div className="relative mt-3 h-[min(60vh,550px)] flex items-center justify-center bg-[#FAF8F5] rounded-xl overflow-hidden">
        {isVideoUrl(images[index]) ? (
          <video
            src={`${getImageUrl(images[index])}#t=0.01`}
            autoPlay
            loop
            muted
            playsInline
            controls
            className="h-full w-full object-contain"
          />
        ) : (
          <ProductImage
            src={images[index]}
            name={`${name} — image ${index + 1}`}
            className="h-full w-full object-contain"
          />
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => move(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white/90 text-stone-700 shadow-md hover:bg-white transition-all cursor-pointer"
            >
              <LuChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => move(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white/90 text-stone-700 shadow-md hover:bg-white transition-all cursor-pointer"
            >
              <LuChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      <p aria-live="polite" className="mt-3 text-center text-xs text-stone-500">
        {index + 1} / {images.length}
      </p>
    </dialog>,
    document.body,
  );
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const data = getProductCardData(product);
  const { isWishlisted, toggleWishlist, wishlistMap } = useWishlist();

  const [selectedColorName, setSelectedColorName] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const colors = data.colors || [];
  const defaultColor = colors.find((entry) => /yellow/i.test(entry.name)) || colors[0];
  const activeColorName = selectedColorName || defaultColor?.name;
  const color =
    colors.find((entry) => entry.name?.toLowerCase() === activeColorName?.toLowerCase()) ||
    colors.find((entry) => entry.name === activeColorName) ||
    defaultColor ||
    colors[0];

  const matchingColorRow = (product.colorImages || []).find((row) => {
    if (!row || row.status === "inactive") return false;
    const c = row.metalColorId || row.color;
    const rowName = typeof c === "object" ? c?.name : typeof c === "string" ? c : "";
    const rowId = typeof c === "object" ? String(c?._id || c?.id || "") : typeof c === "string" ? c : "";
    return (
      (color?.id && rowId && String(color.id) === rowId) ||
      (color?.name && rowName && color.name.toLowerCase() === rowName.toLowerCase())
    );
  });

  const colorRowImages = (matchingColorRow?.images || [])
    .map((img) => (typeof img === "string" ? img : img?.url))
    .filter(Boolean);

  const cardImages = colorRowImages.length > 0
    ? [...new Set(colorRowImages)]
    : color?.image
      ? [color.image, ...data.images.filter((img) => img !== color.image)]
      : data.images;

  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [activeColorName]);

  const activeImage = cardImages[imageIndex] || color?.image || data.images[0] || "";

  const isOrnate =
    Boolean(product.isOrnate) ||
    String(product?.productType || "").toLowerCase() === "ornate" ||
    Boolean(product?.representative?.isOrnate);

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
    "Jewellery";

  const slug =
    rawSlug ||
    (title && title !== "Jewellery"
      ? title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")
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

  async function handleWishlist() {
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

  const handleCardClick = () => {
    sessionStorage.setItem("cameFromProduct", "1");
    sessionStorage.setItem("shopScrollPos", String(window.scrollY));
    navigate(href);
  };

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

  const isGold = product.productType === "gold";
  const hasDiscount = !isGold && mrp && Number(mrp) > Number(salePrice);
  const discountPercent =
    product.discount ||
    (hasDiscount ? Math.round(((Number(mrp) - Number(salePrice)) / Number(mrp)) * 100) : 0);

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer flex flex-col justify-between h-full bg-white p-2 sm:p-3.5 border border-gray-100 hover:shadow-md transition-all rounded-lg sm:rounded-xl"
    >
      <div>
        {/* Product Image Area */}
        <div className="relative aspect-square flex items-center justify-center bg-[#FAF8F5] mb-1.5 sm:mb-3 overflow-hidden group/img rounded-md sm:rounded-lg">

          {isVideoUrl(activeImage) ? (
            <video
              src={`${getImageUrl(activeImage)}#t=0.01`}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 pointer-events-none"
            />
          ) : (
            <ProductImage
              src={activeImage}
              name={title}
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
            />
          )}

          {/* Wishlist Button (Top Right) */}
          <button
            type="button"
            disabled={wishlistBusy}
            aria-label={`${wished ? "Remove from" : "Save to"} wishlist`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleWishlist();
            }}
            className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors z-20 bg-white/90 backdrop-blur-xs shadow-xs border border-gray-100 hover:bg-white cursor-pointer disabled:opacity-50"
          >
            <LuHeart
              size={12}
              fill={wished ? "black" : "none"}
              className={wished ? "text-black" : "text-gray-400 sm:w-3.5 sm:h-3.5"}
            />
          </button>

          {/* Quick View Button (Bottom Left) */}
          <div
            className="hidden sm:flex absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-6 h-6 sm:w-7 sm:h-7 border-gray-200 border items-center justify-center rounded-sm bg-white hover:bg-black hover:text-white text-gray-500 hover:border-black transition-colors z-20 shadow-sm cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPreviewOpen(true);
            }}
            title="Quick view"
          >
            <LuMaximize size={11} className="sm:w-3 sm:h-3" />
          </div>

          {/* Carousel Arrows */}
          {cardImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImageIndex((prev) => (prev === 0 ? cardImages.length - 1 : prev - 1));
                }}
                className="flex absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 bg-white/40 backdrop-blur-md border border-white/50 text-gray-800 rounded-full items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-300 hover:bg-white/70 hover:scale-110 z-10 shadow-lg cursor-pointer"
              >
                <LuChevronLeft size={14} strokeWidth={2} className="text-gray-800" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImageIndex((prev) => (prev === cardImages.length - 1 ? 0 : prev + 1));
                }}
                className="flex absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 bg-white/40 backdrop-blur-md border border-white/50 text-gray-800 rounded-full items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-300 hover:bg-white/70 hover:scale-110 z-10 shadow-lg cursor-pointer"
              >
                <LuChevronRight size={14} strokeWidth={2} className="text-gray-800" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                {cardImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1 h-1 rounded-full ${idx === imageIndex ? "bg-black" : "bg-gray-300"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Product Title (Centered) */}
        <div className="text-center px-1">
          <h3
            className="text-[11px] sm:text-[13px] text-gray-800 font-medium leading-[1.25] mb-1 min-h-[28px] sm:min-h-[34px] line-clamp-2 text-center"
            title={title}
          >
            {title}
          </h3>
        </div>
      </div>

      {/* Bottom Section: Swatches & Price (Centered) */}
      <div className="text-center">
        {colors && colors.length > 0 && (
          <div
            className="flex justify-center items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5 mt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {colors.slice(0, 5).map((entry) => {
              const isSelected = Boolean(
                activeColorName && entry.name?.toLowerCase() === activeColorName.toLowerCase(),
              );
              const bg = entry.colorCodeEnd
                ? `linear-gradient(135deg, ${entry.hex || entry.colorCode}, ${entry.colorCodeEnd})`
                : entry.hex || entry.colorCode || "#ccc";

              return (
                <button
                  key={entry.id || entry.name}
                  type="button"
                  title={entry.name}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColorName(entry.name);
                    setImageIndex(0);
                  }}
                  className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border transition-all cursor-pointer ${
                    isSelected ? "ring-1 ring-black scale-110" : "border-gray-200"
                  }`}
                  style={{ background: bg }}
                />
              );
            })}
            {colors.length > 5 && (
              <span className="text-[10px] text-gray-400 self-center">
                +{colors.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-1.5 text-center">
          {isGroup &&
          product?.pricing?.minPrice &&
          product?.pricing?.maxPrice &&
          product.pricing.minPrice !== product.pricing.maxPrice ? (
            <p className="text-[11px] sm:text-[14px] text-gray-900 font-bold tracking-tight">
              {formatProductPrice(product.pricing.minPrice)} – {formatProductPrice(product.pricing.maxPrice)}
            </p>
          ) : (
            <>
              <p className="text-[11px] sm:text-[14px] text-gray-900 font-bold tracking-tight">
                {formatProductPrice(salePrice) || "Price on request"}
              </p>
              {hasDiscount && (
                <p className="text-[9px] sm:text-[11px] text-gray-400 line-through font-normal">
                  {formatProductPrice(mrp)}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {previewOpen && (
        <ImagePreview
          images={previewImages}
          name={title}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
