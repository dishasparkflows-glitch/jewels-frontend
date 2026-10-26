import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiHeart, HiOutlineArrowRight } from 'react-icons/hi';
import WishlistProductCard from '../../components/product/WishlistProductCard';
import { useWishlist } from '../../contexts/WishlistContext';

export default function Wishlist() {
  const { wishlistItems, wishlistCount, loading, removeFromWishlist, clearWishlist, refreshWishlist } = useWishlist();

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  return (
    <section className="min-h-[75vh] bg-white py-10 sm:py-16">
      <div className="mx-auto max-w-[1380px] px-4 sm:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.16em] text-stone-400">
          <Link to="/" className="transition hover:text-stone-800">Home</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page" className="text-stone-800">Wishlist</span>
        </nav>

        <header className="mb-8 flex items-center justify-between border-b border-stone-200 pb-4 sm:mb-12">
          <h1 className="text-xl font-medium text-[#211f1c] sm:text-2xl">
            My Wishlist <span className="font-normal text-stone-500">({wishlistCount})</span>
          </h1>
          {wishlistCount > 0 && (
            <button type="button" onClick={clearWishlist} className="text-xs text-stone-500 transition hover:text-rose-600">
              Clear all
            </button>
          )}
        </header>

        {loading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading wishlist" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="animate-pulse"><div className="aspect-square bg-stone-100" /><div className="mx-auto mt-4 h-4 w-3/4 bg-stone-100" /><div className="mx-auto mt-3 h-4 w-1/3 bg-stone-100" /></div>)}
          </div>
        ) : wishlistItems.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
            {wishlistItems.map((item) => (
              <WishlistProductCard key={item._id || item.productId} item={item} onRemove={removeFromWishlist} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md py-20 text-center">
            <HiHeart className="mx-auto h-10 w-10 text-stone-300" aria-hidden="true" />
            <h2 className="mt-5 font-serif text-2xl text-stone-800">Your wishlist is empty</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">Save the pieces you love and find them here whenever you return.</p>
            <Link to="/shop" className="mt-6 inline-flex items-center gap-2 bg-[#201e1b] px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#92704e]">
              Explore jewellery <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
