import PropTypes from 'prop-types';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi';

/**
 * Mobile Sticky Bottom Action Bar with price, Add to Cart, and Wishlist toggle
 */
export default function ProductMobileBottomBar({
  currentPrice = 0,
  formatPrice,
  handleAddToCart,
  addingToCart = false,
  handleToggleWishlist,
  isItemWishlisted = false,
}) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="min-w-0">
        <div className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">
          Total (MRP Incl. taxes)
        </div>
        <div className="text-base sm:text-lg font-sans font-bold text-stone-900 leading-tight truncate">
          {formatPrice ? formatPrice(currentPrice) : `₹${currentPrice.toLocaleString('en-IN')}`}
        </div>
      </div>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={addingToCart}
        className="flex-1 py-3 bg-[#141414] active:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
      >
        {addingToCart ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span>ADD TO CART</span>
        )}
      </button>
      <button
        type="button"
        onClick={handleToggleWishlist}
        className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
          isItemWishlisted
            ? 'border-rose-200 bg-rose-50 text-[#e11d48]'
            : 'border-stone-200 bg-white text-stone-600 hover:text-[#e11d48]'
        }`}
        aria-label={isItemWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {isItemWishlisted ? (
          <HiHeart className="w-5 h-5 text-[#e11d48] fill-current" />
        ) : (
          <HiOutlineHeart className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

ProductMobileBottomBar.propTypes = {
  currentPrice: PropTypes.number,
  formatPrice: PropTypes.func,
  handleAddToCart: PropTypes.func,
  addingToCart: PropTypes.bool,
  handleToggleWishlist: PropTypes.func,
  isItemWishlisted: PropTypes.bool,
};
