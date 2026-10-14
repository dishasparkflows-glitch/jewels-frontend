import { Link } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { HiHeart, HiOutlineShoppingBag, HiOutlineArrowRight } from 'react-icons/hi';
import { getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';

const Wishlist = () => {
  const { wishlistItems, wishlistCount, loading, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (item) => {
    addToCart(
      {
        id: item.productId,
        productId: item.productId,
        name: item.title,
        title: item.title,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        category: item.category,
      },
      1
    );
  };

  return (
    <div className="bg-white min-h-[75vh] py-8 sm:py-12 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Breadcrumb (Screenshot 1: HOME > WISHLIST) ───────── */}
        <nav className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-stone-400 mb-4 flex items-center gap-1.5 font-medium">
          <Link to="/" className="hover:text-stone-700 transition-colors">
            HOME
          </Link>
          <span>&gt;</span>
          <span className="text-stone-700">WISHLIST</span>
        </nav>

        {/* ─── Title & Item Count (Screenshot 1: My Wishlist (3)) ── */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-8">
          <h1 className="font-serif text-xl sm:text-2xl text-[#22201e] font-normal tracking-wide">
            My Wishlist {wishlistCount > 0 && <span className="font-sans text-stone-500 text-base font-normal">({wishlistCount})</span>}
          </h1>

          {wishlistCount > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* ─── Content ────────────────────────────────────────── */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
            <p className="text-xs text-stone-500 mt-3 font-serif">Loading your wishlist...</p>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#faf8f5] border border-stone-200 flex items-center justify-center text-stone-400 mx-auto mb-4">
              <HiHeart className="w-8 h-8 text-stone-300" />
            </div>
            <h2 className="font-serif text-xl text-[#22201e] mb-2 font-normal">
              Your Wishlist Is Empty
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed mb-6">
              You haven't saved any jewellery items yet. Explore our handcrafted collections to curate your dream wishlist.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-[#22201e] text-white hover:bg-black transition-all text-xs tracking-widest uppercase font-medium shadow-sm"
            >
              <span>Explore Collections</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-7">
            {wishlistItems.map((item) => (
              <div
                key={item._id || item.productId}
                className="group flex flex-col justify-between"
              >
                <div>
                  {/* Image container with Wishlist Heart Badge */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#faf8f5] border border-stone-100 flex items-center justify-center p-2 mb-2">
                    <Link
                      to={item.slug ? `/product/${item.slug}` : `/shop`}
                      className="w-full h-full flex items-center justify-center overflow-hidden"
                    >
                      {item.image && !isOrnateImage(item.image) ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <img
                          src={getPrimaryProductImage(item)}
                          alt={item.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </Link>

                    {/* Active Heart button in top right to remove from wishlist */}
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(item.productId)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/95 backdrop-blur-sm shadow-sm flex items-center justify-center text-black hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                    >
                      <HiHeart className="w-4 h-4 fill-black" />
                    </button>
                  </div>

                  {/* ADD TO CART button (Screenshot match) */}
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-[#c6913c] hover:bg-[#b07d2c] active:scale-[0.98] text-white py-2 px-3 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 cursor-pointer mb-2.5"
                    aria-label={`Add ${item.title} to cart`}
                  >
                    <HiOutlineShoppingBag className="w-3.5 h-3.5" />
                    <span>ADD TO CART</span>
                  </button>

                  {/* Title (Screenshot 1: centered, clean text) */}
                  <Link
                    to={item.slug ? `/product/${item.slug}` : `/shop`}
                    className="block text-center text-xs sm:text-[13px] text-stone-800 font-normal line-clamp-2 hover:text-[#8a5042] transition-colors leading-snug mb-1.5"
                  >
                    {item.title}
                  </Link>

                  {/* Color Swatches (Screenshot 1: centered dots) */}
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white border border-stone-300 inline-block shadow-2xs" />
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-300 border border-stone-400 inline-block shadow-2xs" />
                  </div>
                </div>

                {/* Price (Screenshot 1: centered with Rupee symbol) */}
                <div className="text-center pt-0.5">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-[#22201e]">
                      ₹{Number(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                        ₹{Number(item.originalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
