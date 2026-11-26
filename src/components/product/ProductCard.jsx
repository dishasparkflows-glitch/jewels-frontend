/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { prefetchProductBySku } from "../../api/services";
import {
  LuHeart,
  LuChevronLeft,
  LuChevronRight,
  LuX,
} from "react-icons/lu";
import { formatProductPrice } from "../../utils/productCard";
import { useProductCard } from "../../hooks/useProductCard";
import ProductMediaImage from "./ProductMediaImage";
import ColorSwatches from "./ColorSwatches";
import SimilarProductsButton from "../store/SimilarProductsButton";

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
        <ProductMediaImage
          src={images[index]}
          alt={`${name} — image ${index + 1}`}
          className="h-full w-full object-contain"
          videoClassName="h-full w-full object-contain"
        />
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

export default function ProductCard({ product, showSimilarButton = true, size = "default" }) {
  const isLarge = size === "lg";
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    colors,
    activeColorName,
    selectColor,
    cardImages,
    activeImage,
    imageIndex,
    setImageIndex,
    previewImages,
    title,
    href,
    wished,
    wishlistBusy,
    handleWishlist,
    salePrice,
    mrp,
    minPrice,
    maxPrice,
    hasRange,
    hasDiscount,
    isDiamond,
  } = useProductCard(product);

  const diamondMetaLine = isDiamond
    ? [
        product.carat ? `${product.carat} ct` : '',
        product.shapeId?.name || product.shape || '',
        product.colorId?.name || product.color || '',
        product.clarityId?.name || product.clarity || '',
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  const handlePrefetch = () => {
    if (isDiamond) return;
    const code = product.basicInfo?.slug || product.basicInfo?.sku || product.sku || product._id || product.id;
    if (code) prefetchProductBySku(code);
  };

  const handleCardClick = () => {
    sessionStorage.setItem("cameFromProduct", "1");
    sessionStorage.setItem("shopScrollPos", String(window.scrollY));
    navigate(href, { state: { previewProduct: product } });
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      onTouchStart={handlePrefetch}
      className={`group cursor-pointer flex flex-col justify-between h-full bg-white border border-gray-100 hover:shadow-md transition-all ${
        isLarge
          ? "p-2.5 sm:p-3.5 lg:p-4 rounded-xl"
          : "p-2 sm:p-2.5 rounded-lg sm:rounded-xl"
      }`}
    >
      <div>
        {/* Product Image Area */}
        <div
          className={`relative aspect-square flex items-center justify-center bg-[#FAF8F5] overflow-hidden group/img ${
            isLarge
              ? "mb-2 sm:mb-3 rounded-lg"
              : "mb-1 sm:mb-2 rounded-md sm:rounded-lg"
          }`}
        >
          <ProductMediaImage
            src={activeImage}
            alt={title}
            className={`w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 ${
              isLarge ? "p-2 sm:p-3" : "p-1.5 sm:p-2"
            }`}
            videoClassName={`w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 pointer-events-none ${
              isLarge ? "p-2 sm:p-3" : "p-1.5 sm:p-2"
            }`}
          />

          {/* Wishlist Button (Top Right) */}
          <button
            type="button"
            disabled={wishlistBusy}
            aria-label={`${wished ? "Remove from" : "Save to"} wishlist`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleWishlist(e);
            }}
            className={`absolute rounded-full flex items-center justify-center transition-colors z-20 bg-white/90 backdrop-blur-xs shadow-xs border border-gray-100 hover:bg-white cursor-pointer disabled:opacity-50 ${
              isLarge
                ? "top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8"
                : "top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-6 h-6 sm:w-7 sm:h-7"
            }`}
          >
            <LuHeart
              size={isLarge ? 14 : 12}
              fill={wished ? "black" : "none"}
              className={
                wished
                  ? "text-black"
                  : isLarge
                    ? "text-gray-400 sm:w-4 sm:h-4"
                    : "text-gray-400 sm:w-3.5 sm:h-3.5"
              }
            />
          </button>

          {/* Similar Products Button (Bottom Left) */}
          {showSimilarButton && !isDiamond && (
            <SimilarProductsButton
              product={product}
              variant="icon"
              className={
                isLarge
                  ? "absolute bottom-2 left-2 sm:bottom-3 sm:left-3"
                  : "absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5"
              }
            />
          )}

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
            className={`text-gray-800 font-medium line-clamp-2 text-center ${
              isLarge
                ? "text-xs sm:text-[14px] lg:text-[15px] leading-[1.35] mb-1.5 min-h-[34px] sm:min-h-[40px]"
                : "text-[11px] sm:text-[12.5px] leading-[1.25] mb-1 min-h-[26px] sm:min-h-[30px]"
            }`}
            title={title}
          >
            {title}
          </h3>
          {diamondMetaLine && (
            <p
              className={`text-[#8b6f4e] font-medium mb-1 truncate ${
                isLarge ? "text-[11px] sm:text-xs" : "text-[10px] sm:text-[11px]"
              }`}
            >
              {diamondMetaLine}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Section: Swatches & Price (Centered) */}
      <div className="text-center">
        <ColorSwatches
          colors={colors}
          activeColorName={activeColorName}
          onSelectColor={selectColor}
          maxVisible={5}
          className={`flex justify-center items-center mt-0.5 ${
            isLarge ? "gap-1.5 mb-1.5 sm:mb-2" : "gap-1 sm:gap-1.5 mb-1 sm:mb-1"
          }`}
          sizeClass={isLarge ? "w-3 h-3 sm:w-3.5 sm:h-3.5" : "w-2.5 h-2.5 sm:w-3 sm:h-3"}
          extraBadgeClass="text-[10px] text-gray-400 self-center"
        />

        <div className="flex flex-wrap items-center justify-center gap-1.5 text-center">
          <p
            className={`text-gray-900 font-bold tracking-tight ${
              isLarge ? "text-xs sm:text-[14.5px] lg:text-[15px]" : "text-[11px] sm:text-[13px]"
            }`}
          >
            {hasRange ? (
              `${formatProductPrice(minPrice)} – ${formatProductPrice(maxPrice)}`
            ) : (
              formatProductPrice(salePrice) || "Price on request"
            )}
          </p>
          {!hasRange && hasDiscount && (
            <p
              className={`text-gray-400 line-through font-normal ${
                isLarge ? "text-[10px] sm:text-xs" : "text-[9px] sm:text-[10.5px]"
              }`}
            >
              {formatProductPrice(mrp)}
            </p>
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
