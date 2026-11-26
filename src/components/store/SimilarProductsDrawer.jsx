import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import {
  HiOutlineX,
  HiChevronLeft,
  HiChevronRight,
  HiSparkles,
} from 'react-icons/hi';
import { productsAPI } from '../../api/services';
import ProductCard from '../product/ProductCard';

// In-memory module cache and in-flight request tracker for instantaneous rendering
const similarCache = new Map();
const inFlightRequests = new Map();

/**
 * Silently prefetch similar products into cache and warm up browser image cache
 */
export async function prefetchSimilarProducts(targetId) {
  if (!targetId) return [];
  if (similarCache.has(targetId)) {
    return similarCache.get(targetId);
  }
  if (inFlightRequests.has(targetId)) {
    return inFlightRequests.get(targetId);
  }

  const promise = (async () => {
    try {
      const res = await productsAPI.getSimilar(targetId);
      const data = res?.data?.data || res?.data || {};
      const items = Array.isArray(data.items) ? data.items : [];
      similarCache.set(targetId, items);

      // Preload primary images of top similar products
      if (typeof window !== 'undefined') {
        items.slice(0, 8).forEach((item) => {
          const imgUrl = item.images?.[0]?.url || item.image;
          if (imgUrl) {
            const img = new Image();
            img.src = imgUrl;
          }
        });
      }

      return items;
    } catch (err) {
      console.error('Failed to prefetch similar products:', err);
      return [];
    } finally {
      inFlightRequests.delete(targetId);
    }
  })();

  inFlightRequests.set(targetId, promise);
  return promise;
}

export default function SimilarProductsDrawer({
  open,
  onClose,
  productId,
  currentProduct,
}) {
  const targetId = productId || currentProduct?._id || currentProduct?.id;

  // Initialize with cached items if already fetched so rendering is completely instant
  const [products, setProducts] = useState(() => (targetId && similarCache.has(targetId) ? similarCache.get(targetId) : []));
  const [loading, setLoading] = useState(false);
  const [isRendered, setIsRendered] = useState(open);
  const [isVisible, setIsVisible] = useState(false);
  const scrollContainerRef = useRef(null);
  const closeTimerRef = useRef(null);

  // Smooth drawer entry & exit animation handling
  useEffect(() => {
    if (open) {
      clearTimeout(closeTimerRef.current);
      setIsRendered(true);
      // Double RAF ensures initial render (translate-y-full, opacity-0) is painted before transition starts
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setIsVisible(true);
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    } else {
      setIsVisible(false);
      closeTimerRef.current = setTimeout(() => {
        setIsRendered(false);
      }, 300);
      return () => clearTimeout(closeTimerRef.current);
    }
  }, [open]);

  // Lock body scroll and handle Escape key while open
  useEffect(() => {
    if (!isRendered) return;

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
  }, [isRendered, onClose]);

  // Sync products and background fetch when targetId is available
  useEffect(() => {
    if (!targetId) return;

    if (similarCache.has(targetId)) {
      setProducts(similarCache.get(targetId));
      setLoading(false);
      return;
    }

    let active = true;
    if (open) {
      setLoading(true);
    }

    prefetchSimilarProducts(targetId).then((items) => {
      if (!active) return;
      setProducts(items);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [targetId, open]);

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = Math.min(scrollContainerRef.current.clientWidth * 0.75, 480);
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!isRendered) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="View Similar Products"
      className="fixed inset-0 z-[9999] flex flex-col justify-end"
    >
      {/* Backdrop with smooth fade transition */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Slide-Up Bottom Drawer Sheet with smooth translateY transition */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-h-[88vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border-t border-stone-200 transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Mobile Pull Indicator */}
        <div className="pt-2.5 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Drawer Header */}
        <header className="relative px-12 sm:px-14 pt-3 sm:pt-5 pb-3 sm:pb-4 flex items-center justify-center border-b border-stone-100 select-none">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap text-center">
            <h2 className="font-serif text-base sm:text-2xl font-bold text-stone-900 tracking-wide">
              View Similar Products
            </h2>
            {products.length > 0 && (
              <span className="text-[11px] sm:text-xs font-medium text-stone-500 bg-stone-100 px-2 sm:px-2.5 py-0.5 rounded-full transition-opacity duration-200">
                {products.length} {products.length === 1 ? 'piece' : 'pieces'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close similar products"
          >
            <HiOutlineX className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>
        </header>

        {/* Products Scrollable Area */}
        <div className="relative flex-1 p-4 sm:p-6 overflow-hidden">
          {/* Desktop Left/Right Navigation Chevrons */}
          {products.length > 3 && (
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

          {/* Loading Skeleton fallback (only if drawer opens before background prefetch finishes) */}
          {loading && products.length === 0 && (
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-[190px] sm:w-[220px] md:w-[240px] shrink-0 bg-stone-50 rounded-xl p-3 border border-stone-100 animate-pulse space-y-3"
                >
                  <div className="aspect-square bg-stone-200/70 rounded-lg" />
                  <div className="h-4 bg-stone-200/70 rounded w-3/4" />
                  <div className="h-3 bg-stone-200/70 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Products List (Horizontal Scroll / Carousel) */}
          {products.length > 0 && (
            <div
              ref={scrollContainerRef}
              className={`flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2 scroll-smooth transition-opacity duration-300 ${
                loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
              }`}
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

SimilarProductsDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  productId: PropTypes.string,
  currentProduct: PropTypes.object,
};
