import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import { HiHeart, HiOutlineArrowRight, HiOutlineTrash } from 'react-icons/hi';
import WishlistProductCard from '../../components/product/WishlistProductCard';
import { useWishlist } from '../../contexts/WishlistContext';

export default function Wishlist() {
  const {
    wishlistItems,
    wishlistCount,
    loading,
    isInitialLoaded,
    removeFromWishlist,
    clearWishlist,
    refreshWishlist,
  } = useWishlist();
  const [isClearing, setIsClearing] = useState(false);
  const clearTimerRef = useRef(null);

  useEffect(() => {
    refreshWishlist({ silent: true });
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [refreshWishlist]);

  const handleClearAll = () => {
    if (isClearing) return;
    setIsClearing(true);
    clearTimerRef.current = setTimeout(() => {
      clearWishlist();
      setIsClearing(false);
    }, 280);
  };

  const showSkeleton = (!isInitialLoaded || loading) && wishlistItems.length === 0;

  return (
    <section className="min-h-[75vh] bg-white pt-3 sm:pt-5 pb-12 sm:pb-16">
      <SEO title="My Wishlist | Neirah Fine Jewellery" noindex={true} />
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
        <nav aria-label="Breadcrumb" className="mb-2 sm:mb-2.5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-stone-400">
          <Link to="/" className="transition hover:text-stone-800">Home</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page" className="text-stone-800">Wishlist</span>
        </nav>

        <header className="mb-5 sm:mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-stone-200 pb-3.5 sm:pb-4">
          <div aria-hidden="true" />
          <div className="text-center">
            <h1
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontVariantNumeric: 'lining-nums',
                fontFeatureSettings: '"lnum" 1',
              }}
              className="text-lg sm:text-xl font-medium sm:font-semibold text-[#1c1917] tracking-normal leading-tight lining-nums"
            >
              My Wishlist ({wishlistCount})
            </h1>
          </div>
          <div className="justify-self-end">
            {wishlistCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isClearing}
                className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg border border-[#d6c7b2] hover:border-[#8b6f4e] bg-white hover:bg-[#FAF7F2] text-[#8b6f4e] text-xs sm:text-[13px] font-medium transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <HiOutlineTrash className="w-4 h-4 text-[#8b6f4e]" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </header>

        {showSkeleton ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading wishlist" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="animate-pulse"><div className="aspect-square bg-stone-100" /><div className="mx-auto mt-4 h-4 w-3/4 bg-stone-100" /><div className="mx-auto mt-3 h-4 w-1/3 bg-stone-100" /></div>)}
          </div>
        ) : wishlistItems.length ? (
          <div
            className={`grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-8 transition-all duration-300 ease-out ${
              isClearing ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
            }`}
          >
            {wishlistItems.map((item) => (
              <WishlistProductCard key={item.refId || item._id} item={item} onRemove={removeFromWishlist} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md py-20 text-center animate-fadeIn">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#faf5ee] border border-[#e7dccb]">
              <HiHeart className="h-7 w-7 text-[#8b6f4e]/60" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-serif text-2xl text-stone-800">Your wishlist is empty</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">Save the pieces you love and find them here whenever you return.</p>
            <Link to="/shop" className="mt-6 inline-flex items-center gap-2 btn-theme-primary px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition rounded-lg shadow-sm">
              Explore jewellery <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
