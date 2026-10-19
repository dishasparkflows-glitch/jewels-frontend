import { Link } from "react-router-dom";
import { HiOutlineShoppingBag, HiOutlineX } from "react-icons/hi";
import { useCart } from "../../contexts/CartContext";
import { getImageUrl } from "../../utils/imageUrl";
import {
  getPrimaryProductImage,
  isOrnateImage,
} from "../../utils/productImages";

/* eslint-disable react/prop-types */
const formatPrice = (price) =>
  `₹${Number(price || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function WishlistProductCard({ item, onRemove }) {
  const { addToCart } = useCart();
  const name = item.title || item.name || "Saved jewellery";
  const id = item.productId || item._id;
  const rawImage =
    typeof item.image === "object" ? item.image?.url : item.image;
  const image =
    (rawImage && !isOrnateImage(rawImage)
      ? getImageUrl(rawImage)
      : getPrimaryProductImage(item)) || "/featured/ring.jpg";
  const productPath = item.slug
    ? `/product/${item.slug}`
    : id
      ? `/product/${id}`
      : "/shop";
  const colors = Array.isArray(item.colors)
    ? item.colors
    : Array.isArray(item.colorOptions)
      ? item.colorOptions
      : [];

  return (
    <article className="group min-w-0 text-center">
      <div className="relative bg-[#f3eadb] p-2 sm:p-3">
        <Link
          to={productPath}
          aria-label={`View ${name}`}
          className="flex aspect-square items-center justify-center bg-white"
        >
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-contain p-7 transition-transform duration-300 group-hover:scale-[1.03] sm:p-10"
          />
        </Link>
        <button
          type="button"
          onClick={() => onRemove(id)}
          aria-label={`Remove ${name} from wishlist`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-500 shadow-sm transition hover:text-stone-900"
        >
          <HiOutlineX className="h-4 w-4" />
        </button>
      </div>

      <Link
        to={productPath}
        className="mx-auto mt-4 block max-w-sm px-2 text-xs leading-5 text-stone-800 transition hover:text-[#92704e] sm:text-sm"
      >
        {name}
      </Link>

      {colors.length > 0 && (
        <div
          className="mt-2 flex justify-center gap-2"
          aria-label={`${name} available colors`}
        >
          {colors.slice(0, 6).map((color, index) => {
            const colorName =
              typeof color === "string"
                ? color
                : color.name || `Color ${index + 1}`;
            const colorValue =
              typeof color === "string" ? color : color.hex || color.colorCode;
            return (
              <span
                key={`${colorName}-${index}`}
                title={colorName}
                className="h-4 w-4 rounded-full border border-stone-300"
                style={colorValue ? { backgroundColor: colorValue } : undefined}
              />
            );
          })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-baseline justify-center gap-2">
        <span className="text-sm font-semibold text-[#211f1c]">
          {Number(item.price) > 0
            ? formatPrice(item.price)
            : "Price unavailable"}
        </span>
        {Number(item.originalPrice) > Number(item.price) && (
          <span className="text-xs text-stone-400 line-through">
            {formatPrice(item.originalPrice)}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          addToCart(
            {
              id,
              productId: id,
              name,
              title: name,
              price: item.price,
              originalPrice: item.originalPrice,
              image,
              category: item.category,
            },
            1,
          )
        }
        disabled={!id}
        className="mt-3 inline-flex items-center gap-2 border border-stone-300 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-700 transition hover:border-[#92704e] hover:text-[#92704e] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        <HiOutlineShoppingBag className="h-3.5 w-3.5" /> Add to bag
      </button>
    </article>
  );
}
