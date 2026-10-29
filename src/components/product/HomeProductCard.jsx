/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuHeart } from "react-icons/lu";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { useCart } from "../../contexts/CartContext";
import { formatProductPrice } from "../../utils/productCard";
import { useProductCard } from "../../hooks/useProductCard";
import ProductMediaImage from "./ProductMediaImage";
import ColorSwatches from "./ColorSwatches";

export default function HomeProductCard({ product, isSilver: isSilverProp }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  const {
    data,
    colors,
    color,
    activeColorName,
    selectColor,
    activeImage,
    isSilver,
    isGroup,
    title,
    href,
    wished,
    wishlistBusy,
    handleWishlist,
    salePrice,
    mrp,
    hasDiscount,
  } = useProductCard(product, { isSilver: isSilverProp });

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
          <ProductMediaImage
            src={activeImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            videoClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
          />

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
        <ColorSwatches
          colors={colors}
          activeColorName={activeColorName}
          onSelectColor={selectColor}
          maxVisible={5}
          className="flex justify-center gap-1 sm:gap-1.5 my-1 sm:my-1.5"
          sizeClass="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5"
          extraBadgeClass="text-[9px] text-gray-400 self-center"
        />

        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          <p className="text-[11px] sm:text-[14px] text-gray-900 font-semibold">
            {formatProductPrice(salePrice) || "Price on request"}
          </p>
          {hasDiscount && (
            <p className="text-[9px] sm:text-[11px] text-gray-400 line-through font-normal">
              {formatProductPrice(mrp)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
