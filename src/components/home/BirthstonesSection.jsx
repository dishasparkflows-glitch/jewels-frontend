import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { birthstoneAPI } from '../../api/services';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';

export default function BirthstonesSection({ style }) {
  const { settings: storeSettings } = useStoreSettings();
  const isStorefrontVisible =
    storeSettings?.birthstones?.showOnStorefront !== false;

  const [birthstones, setBirthstones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isStorefrontVisible) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    (async () => {
      try {
        const res = await birthstoneAPI.getLookup();
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];

        if (isMounted) {
          // Sort items by order
          const sorted = [...list].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
          setBirthstones(sorted);
        }
      } catch (err) {
        console.warn('Failed to load birthstones:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      return;
    }
    const current = Math.min(1, Math.max(0, el.scrollLeft / maxScroll));
    setScrollProgress(current);
  };

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.65;
    el.scrollBy({
      left: direction === 'next' ? distance : -distance,
      behavior: 'smooth',
    });
  };

  // Format stone name neatly (e.g. "ALEXANDRITE & PEARL" -> "Alexandrite & Pearl")
  const formatStoneName = (name) => {
    if (!name) return '';
    return String(name)
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!isStorefrontVisible || (!loading && birthstones.length === 0)) {
    return null;
  }

  return (
    <section style={style} className="w-full max-w-[95%] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Section Title */}
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-[32px] text-stone-900 font-normal tracking-wide">
          Make Birthdays More Colourful
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative group/birthstones max-w-7xl mx-auto px-4 sm:px-10">
        {/* Left Arrow */}
        <button
          type="button"
          onClick={() => scroll('prev')}
          aria-label="Previous birthstones"
          className="absolute left-0 sm:-left-2 lg:-left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-md border border-stone-200/80 transition-all hover:bg-stone-50 hover:scale-110 active:scale-95 cursor-pointer opacity-80 group-hover/birthstones:opacity-100"
        >
          <HiOutlineChevronLeft className="h-4 w-4" />
        </button>

        {/* Scrollable Birthstones Row */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="flex items-center overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-1 sm:px-2 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden justify-start gap-6 sm:gap-7 md:gap-8 lg:gap-9 xl:gap-8 2xl:gap-10"
        >
          {birthstones.map((item) => {
            const imageUrl = item.image?.url || item.imageUrl;
            const targetMonth = encodeURIComponent(item.month || '');

            return (
              <Link
                key={item._id || item.month}
                to={`/shop?birthMonth=${targetMonth}`}
                className="group flex flex-col items-center text-center shrink-0 w-[72px] sm:w-[84px] md:w-[88px] snap-start transition-transform duration-300 hover:-translate-y-1"
                title={`${item.month} • ${item.stoneName || 'Birthstone'}`}
              >
                {/* Gemstone Image Container */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mb-2.5">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${item.month} - ${item.stoneName}`}
                      loading="lazy"
                      className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-stone-200 shadow-md transition-transform duration-300 group-hover:scale-110" />
                  )}
                </div>

                {/* Month Name */}
                <span className="text-[11px] sm:text-xs font-semibold text-stone-800 tracking-tight capitalize block transition-colors group-hover:text-[#8b6f4e]">
                  {item.month}
                </span>

                {/* Stone Name */}
                <span className="text-[9.5px] sm:text-[10px] text-stone-400 capitalize block tracking-tight line-clamp-1 mt-0.5 group-hover:text-stone-600 transition-colors">
                  {formatStoneName(item.stoneName)}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          type="button"
          onClick={() => scroll('next')}
          aria-label="Next birthstones"
          className="absolute right-0 sm:-right-2 lg:-right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-md border border-stone-200/80 transition-all hover:bg-stone-50 hover:scale-110 active:scale-95 cursor-pointer opacity-80 group-hover/birthstones:opacity-100"
        >
          <HiOutlineChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Dots/Pill Indicator */}
      <div className="flex items-center justify-center gap-1.5 mt-4 sm:mt-6">
        <span
          className={`h-1.5 rounded-full transition-all duration-300 ${
            scrollProgress < 0.35 ? 'w-5 bg-[#8b6f4e]' : 'w-1.5 bg-stone-300'
          }`}
        />
        <span
          className={`h-1.5 rounded-full transition-all duration-300 ${
            scrollProgress >= 0.35 && scrollProgress <= 0.7 ? 'w-5 bg-[#8b6f4e]' : 'w-1.5 bg-stone-300'
          }`}
        />
        <span
          className={`h-1.5 rounded-full transition-all duration-300 ${
            scrollProgress > 0.7 ? 'w-5 bg-[#8b6f4e]' : 'w-1.5 bg-stone-300'
          }`}
        />
      </div>

      {/* View All Button */}
      <div className="flex justify-center mt-6 sm:mt-8">
        <Link
          to="/shop"
          className="px-10 py-2.5 border border-stone-800 rounded text-xs sm:text-[13px] uppercase hover:bg-stone-900 hover:text-white transition-all font-medium tracking-widest text-stone-800"
        >
          View All
        </Link>
      </div>
    </section>
  );
}
