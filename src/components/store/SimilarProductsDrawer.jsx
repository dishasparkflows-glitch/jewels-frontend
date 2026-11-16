import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineX,
  HiChevronLeft,
  HiChevronRight,
  HiSparkles,
} from 'react-icons/hi';
import { productsAPI } from '../../api/services';
import ProductCard from '../product/ProductCard';

export default function SimilarProductsDrawer({
  open,
  onClose,
  productId,
  currentProduct,
}) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef(null);

  // Close on Escape key & lock body scroll
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Fetch similar products whenever drawer opens
  const fetchSimilar = useCallback(async () => {
    const targetId =
      productId ||
      currentProduct?._id ||
      currentProduct?.id ||
      currentProduct?.basicInfo?.slug ||
      currentProduct?.slug;

    if (!targetId) return;

    try {
      setLoading(true);
      const res = await productsAPI.getSimilar(targetId);
      const data = res?.data?.data || res?.data || {};

      setProducts(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error('Failed to load similar products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [productId, currentProduct]);

  useEffect(() => {
    if (open) {
      fetchSimilar();
    }
  }, [open, fetchSimilar]);

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!open) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="View Similar Products"
      className="fixed inset-0 z-[9999] flex flex-col justify-end"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
      />

      {/* Slide-Up Bottom Drawer Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-h-[88vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slideUp border-t border-stone-200"
      >
        {/* Mobile Pull Indicator */}
        <div className="pt-2 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Drawer Header */}
        <header className="px-5 sm:px-8 pt-3 sm:pt-5 pb-3 sm:pb-4 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <HiSparkles className="w-5 h-5 text-[#8b6f4e] shrink-0" />
            <h2 className="font-serif text-lg sm:text-2xl font-bold text-stone-900 tracking-wide">
              View Similar Products
            </h2>
            {products.length > 0 && !loading && (
              <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
                {products.length} {products.length === 1 ? 'piece' : 'pieces'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close similar products"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </header>

        {/* Products Scrollable Area */}
        <div className="relative flex-1 p-4 sm:p-6 overflow-hidden">
          {/* Desktop Left/Right Navigation Chevrons */}
          {products.length > 4 && (
            <>
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 border border-stone-200 shadow-md items-center justify-center text-stone-700 hover:text-stone-900 hover:scale-105 transition-all cursor-pointer"
                aria-label="Scroll left"
              >
                <HiChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 border border-stone-200 shadow-md items-center justify-center text-stone-700 hover:text-stone-900 hover:scale-105 transition-all cursor-pointer"
                aria-label="Scroll right"
              >
                <HiChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-[190px] sm:w-[220px] md:w-[240px] shrink-0 bg-stone-50 rounded-xl p-3 border border-stone-100 animate-pulse space-y-3"
                >
                  <div className="aspect-square bg-stone-200 rounded-lg" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Products List (Horizontal Scroll / Carousel) */}
          {!loading && products.length > 0 && (
            <div
              ref={scrollContainerRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2 scroll-smooth"
            >
              {products.map((item) => (
                <div
                  key={item._id || item.id || item.slug}
                  className="w-[190px] sm:w-[220px] md:w-[240px] shrink-0"
                  onClick={() => onClose?.()}
                >
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && products.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                <HiSparkles className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-stone-800">
                No similar products found
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm">
                Try selecting a different filter above to view more pieces from our collection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : null;
}
