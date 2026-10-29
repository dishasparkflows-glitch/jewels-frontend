/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuHeart } from "react-icons/lu";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { IoDiamondOutline } from "react-icons/io5";
import { useWishlist } from "../../contexts/WishlistContext";
import { useCart } from "../../contexts/CartContext";
import { getImageUrl } from "../../utils/imageUrl";
import {
  formatProductPrice,
  getProductCardData,
} from "../../utils/productCard";

function isVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  return /\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(url);
}

export default function HomeProductCard({ product, isSilver: isSilverProp }) {
  const navigate = useNavigate();
  const data = getProductCardData(product);
  const { isWishlisted, toggleWishlist, wishlistMap } = useWishlist();
  const { addToCart } = useCart();

  const [selectedColorName, setSelectedColorName] = useState(null);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

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

  const activeImage = cardImages[0] || color?.image || data.images[0] || "";

  useEffect(() => {
    setImageFailed(false);
  }, [activeImage]);

  const isOrnate =
    Boolean(product.isOrnate) ||
    String(product?.productType || "").toLowerCase() === "ornate" ||
    Boolean(product?.representative?.isOrnate);

  const isSilver =
    isSilverProp ??
    (Boolean(data.isSilver) ||
      String(product?.productType || product?.representative?.productType || "").toLowerCase() === "silver" ||
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

  async function handleWishlist(e) {
    if (e) {
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

  const handleAddToCart = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (addingToCart) return;
    setAddingToCart(true);

    try {
      const metalColorId = color?.id || product.metalColorIds?.[0]?._id || product.metalColorIds?.[0] || null;
      let selectedAttributes = product.selectedAttributes ? { ...product.selectedAttributes } : undefined;
      if (metalColorId) {
        selectedAttributes = {
          ...(selectedAttributes || {}),
          metalColor: metalColorId,
        };
      }

      const price = Number(data.price) || 0;
      await addToCart(
        {
          id: data.id,
          productId: data.id,
          title,
          price,
          totalItemPrice: price,
          quantity: 1,
          image: activeImage,
          category: product.category || product.categoryIds?.[0]?.name || "",
          productType: product.productType || "",
          selectedAttributes,
          selectedMetal: activeColorName || color?.name || "",
        },
        1,
        {
          selectedMetal: activeColorName || color?.name || "",
        },
      );
    } catch (err) {
      console.error("Failed to add to cart from home card:", err);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleCardClick = () => {
    sessionStorage.setItem("cameFromHomeProduct", "1");
    sessionStorage.setItem("homeScrollPos", String(window.scrollY));
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
      className="group cursor-pointer relative max-w-[280px] sm:max-w-none mx-auto w-full flex flex-col justify-between h-full bg-white rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all"
    >
      <div>
        {/* Image Container with Signature Background */}
        <div
          className={`relative aspect-square overflow-hidden mb-1.5 sm:mb-2.5 flex items-center justify-center rounded-xl ${
            isSilver ? "bg-[#FAF8F5] border border-[#e8dfd0]" : "bg-[#F0E8D8]"
          }`}
        >
          {/* Wishlist Button (Top Right) */}
          <button
            type="button"
            disabled={wishlistBusy}
            aria-label={`${wished ? "Remove from" : "Save to"} wishlist`}
            onClick={handleWishlist}
            className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20 shadow-xs p-1 sm:p-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
              wished
                ? "bg-black text-white"
                : "bg-white/90 backdrop-blur-xs text-gray-400 hover:text-red-500"
            }`}
          >
            <LuHeart
              size={12}
              className="sm:w-3.5 sm:h-3.5"
              fill={wished ? "white" : "none"}
            />
          </button>


          {/* Product Media */}
          {activeImage && !imageFailed ? (
            isVideoUrl(activeImage) ? (
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
              <img
                src={getImageUrl(activeImage)}
                alt={title}
                loading="lazy"
                decoding="async"
                onError={() => setImageFailed(true)}
                className={`w-full h-full transition-transform duration-700 group-hover:scale-105 ${
                  isSilver ? "object-cover" : "object-contain p-2"
                }`}
              />
            )
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-stone-300">
              <IoDiamondOutline className="h-8 w-8 text-stone-300" />
              <span className="text-[10px] text-stone-400">Image unavailable</span>
            </div>
          )}

          {/* Slide-Up Add to Cart Overlay on Hover */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-1.5 sm:p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
            <button
              type="button"
              disabled={addingToCart}
              onClick={handleAddToCart}
              className="w-full bg-[#1A1815] hover:bg-[#C8923C] text-white py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] disabled:opacity-75"
            >
              {addingToCart ? (
                <>
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <HiOutlineShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Title (Centered) */}
        <div className="text-center px-1.5 sm:px-2">
          <h3
            className="text-[11px] sm:text-[13px] font-medium mb-0.5 min-h-[28px] sm:min-h-[34px] line-clamp-2 text-gray-800 leading-[1.25]"
            title={title}
          >
            {title}
          </h3>
        </div>
      </div>

      {/* Swatches & Price (Centered) */}
      <div className="text-center pb-2.5 sm:pb-3.5 px-1.5 sm:px-2">
        {colors && colors.length > 0 && (
          <div
            className="flex justify-center gap-1 sm:gap-1.5 my-1 sm:my-1.5"
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
                  }}
                  className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border transition-all cursor-pointer ${
                    isSelected ? "ring-1 ring-black scale-110" : "border-gray-200"
                  }`}
                  style={{ background: bg }}
                />
              );
            })}
            {colors.length > 5 && (
              <span className="text-[9px] text-gray-400 self-center">
                +{colors.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          {isGroup &&
          product?.pricing?.minPrice &&
          product?.pricing?.maxPrice &&
          product.pricing.minPrice !== product.pricing.maxPrice ? (
            <p className="text-[11px] sm:text-[14px] text-gray-900 font-semibold">
              {formatProductPrice(product.pricing.minPrice)} – {formatProductPrice(product.pricing.maxPrice)}
            </p>
          ) : (
            <>
              <p className="text-[11px] sm:text-[14px] text-gray-900 font-semibold">
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
    </div>
  );
}
