/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineChevronDown } from 'react-icons/hi';
import { getImageUrl } from '../../utils/imageUrl';

const categoryLink = (category) => `/shop?category=${encodeURIComponent(category.slug || category._id)}`;
const itemLink = (category, item) => `${categoryLink(category)}&menuItem=${encodeURIComponent(item._id || item.slug || item.name)}`;
const safeLink = (value, fallback) => (/^(https?:\/\/|\/(?!\/))/i.test(value || '') ? value : fallback);

const slugify = (value = '') =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const DEFAULT_CATEGORY_CARDS = {
  rings: [
    {
      title: 'Solitaire Rings',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Halo Engagement Rings',
      image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80',
    },
  ],
  earrings: [
    {
      title: 'Diamond Earring',
      image: 'https://pub-e3b67182a2c44631ad54fab41304d36a.r2.dev/Neirah_Jewellers/admin/Products/1792433539330-359_Y-_viwe4.png',
    },
    {
      title: 'Solitaire Studs',
      image: 'https://pub-e3b67182a2c44631ad54fab41304d36a.r2.dev/Neirah_Jewellers/admin/Products/1792384361062-ER-0008_Y-_viwe4.png',
    },
  ],
  pendant: [
    {
      title: 'Diamond Pendants',
      image: 'https://pub-82427c7fd20e4acaa4bdb3b933c0a3bf.r2.dev/OrnateProducts/1792642608828-925PD_114.jpg',
    },
    {
      title: 'Solitaire Necklace',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
    },
  ],
  'bangles-bracelets': [
    {
      title: 'Bracelets',
      image: 'https://images.unsplash.com/photo-1611591475155-42845c994b7e?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Bangles',
      image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=600&q=80',
    },
  ],
  'silver-collection': [
    {
      title: 'Silver Rings',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Silver Earrings',
      image: 'https://pub-e3b67182a2c44631ad54fab41304d36a.r2.dev/Neirah_Jewellers/admin/Products/1792433539330-359_Y-_viwe4.png',
    },
  ],
};

function MenuContents({ category, onNavigate, mobile = false }) {
  const sections = (category.menuSections || []).filter((section) => section.menuItems?.length);
  const banners = (category.promoBanners || []).filter((banner) => banner.image?.url);

  const catKey = slugify(category.slug || category.name);
  const fallbackCards = DEFAULT_CATEGORY_CARDS[catKey] || DEFAULT_CATEGORY_CARDS.earrings;

  const showcaseCards = banners.length > 0
    ? banners.map((b) => ({
        title: b.title || category.name,
        link: safeLink(b.link, categoryLink(category)),
        image: getImageUrl(b.image.url),
      }))
    : fallbackCards.map((c) => ({
        ...c,
        link: categoryLink(category),
      }));

  if (mobile) {
    return (
      <div className="space-y-6 pt-2 pb-3 text-left">
        {sections.map((section) => (
          <div key={section._id} className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
              {section.name}
            </h4>
            <ul className="space-y-2.5">
              {section.menuItems.map((item) => (
                <li key={item._id}>
                  <Link
                    to={itemLink(category, item)}
                    onClick={onNavigate}
                    className="group/item flex items-center gap-2 text-xs text-stone-200 hover:text-white transition-colors"
                  >
                    <span className="text-stone-500 group-hover/item:text-[#d2b18a] text-[10px] shrink-0 transition-colors">✦</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to={categoryLink(category)}
              onClick={onNavigate}
              className="inline-block pt-1 text-[10px] font-bold uppercase tracking-widest text-[#d2b18a] hover:text-white underline underline-offset-2"
            >
              EXPLORE ALL
            </Link>
          </div>
        ))}
        {!sections.length && (
          <Link
            to={categoryLink(category)}
            onClick={onNavigate}
            className="text-xs text-stone-300 underline underline-offset-4"
          >
            Explore all {category.name}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-h-[calc(100vh-200px)] max-w-7xl overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 justify-between gap-10">
      {/* ─── Left Section: Menu Columns (Featured, Styles, Metals) ─── */}
      <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-8 divide-x divide-stone-800/80">
        {sections.length > 0 ? (
          sections.map((section, idx) => (
            <div key={section._id} className={`space-y-4 ${idx > 0 ? 'pl-8' : ''}`}>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400 font-sans">
                {section.name}
              </h3>
              <ul className="space-y-3">
                {section.menuItems.map((item) => (
                  <li key={item._id}>
                    <Link
                      to={itemLink(category, item)}
                      onClick={onNavigate}
                      className="group/item flex items-center gap-2.5 text-xs sm:text-[13px] text-stone-300 hover:text-white transition-colors"
                    >
                      <span className="text-stone-500 group-hover/item:text-[#d2b18a] text-[10px] shrink-0 transition-colors">✦</span>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to={categoryLink(category)}
                onClick={onNavigate}
                className="inline-block mt-4 text-[11px] font-bold uppercase tracking-widest text-[#d2b18a] hover:text-white border-b border-[#d2b18a]/60 hover:border-white pb-0.5 transition-all"
              >
                EXPLORE ALL
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400 mb-3 font-sans">
              {category.name}
            </h3>
            <p className="text-xs text-stone-400 mb-4 max-w-md">
              Discover our exclusive collection of handcrafted {category.name.toLowerCase()}.
            </p>
            <Link
              to={categoryLink(category)}
              onClick={onNavigate}
              className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#d2b18a] hover:text-white border-b border-[#d2b18a]/60 pb-0.5 transition-all"
            >
              EXPLORE ALL
            </Link>
          </div>
        )}
      </div>

      {/* ─── Right Section: Featured Highlight Cards ─── */}
      {showcaseCards.length > 0 && (
        <aside aria-label={`${category.name} highlights`} className="flex items-center gap-5 shrink-0 pl-8 border-l border-stone-800/80">
          {showcaseCards.slice(0, 2).map((card, idx) => (
            <Link
              key={idx}
              to={card.link || categoryLink(category)}
              onClick={onNavigate}
              className="group/card relative w-[180px] xl:w-[210px] h-[210px] xl:h-[235px] rounded-2xl overflow-hidden border border-white/10 bg-[#23201d] shadow-xl transition-all duration-300 hover:-translate-y-1 block cursor-pointer"
            >
              <img
                src={card.image}
                alt={card.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
              />
              {/* Bottom Dark Gradient & Title */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-4">
                <span className="text-xs sm:text-[13px] font-medium text-white tracking-wide leading-snug drop-shadow-sm group-hover/card:text-[#d2b18a] transition-colors">
                  {card.title}
                </span>
              </div>
            </Link>
          ))}
        </aside>
      )}
    </div>
  );
}

export default function MegaMenuNav({ categories, mobile = false, onNavigate, error, onRetry }) {
  const [activeId, setActiveId] = useState(null);
  const root = useRef(null);
  const triggers = useRef({});
  const location = useLocation();

  useEffect(() => {
    setActiveId(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!activeId) return;
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setActiveId(null);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [activeId]);

  const active = categories.find((category) => category._id === activeId);
  const close = () => {
    setActiveId(null);
    onNavigate?.();
  };

  return (
    <div
      ref={root}
      className={mobile ? '' : 'relative w-full border-b border-white/10 bg-[#22201e]'}
      onMouseLeave={mobile ? undefined : () => setActiveId(null)}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setActiveId(null);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          setActiveId(null);
          triggers.current[activeId]?.focus();
        }
      }}
    >
      {error && (
        <div className="p-3 text-center text-xs text-stone-500">
          Navigation is temporarily unavailable.{' '}
          <button type="button" onClick={onRetry} className="underline">
            Retry
          </button>
        </div>
      )}

      {mobile ? (
        <nav aria-label="Product categories" className="space-y-1">
          {categories.map((category) => (
            <div key={category._id} className="border-b border-white/10">
              <button
                type="button"
                ref={(element) => {
                  triggers.current[category._id] = element;
                }}
                aria-expanded={activeId === category._id}
                aria-controls={`mobile-menu-${category._id}`}
                onClick={() => setActiveId(activeId === category._id ? null : category._id)}
                className="flex w-full items-center justify-between py-3 text-left text-xs uppercase tracking-widest text-stone-200"
              >
                <span>{category.name}</span>
                <HiOutlineChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeId === category._id ? 'rotate-180' : ''}`} />
              </button>
              {activeId === category._id && (
                <div id={`mobile-menu-${category._id}`} className="rounded-xl bg-[#181615] p-4 border border-white/10 mb-3 animate-fadeIn">
                  <Link to={categoryLink(category)} onClick={close} className="mb-4 block text-xs font-semibold text-[#d2b18a] hover:underline">
                    Shop all {category.name} →
                  </Link>
                  <MenuContents category={category} onNavigate={close} mobile />
                </div>
              )}
            </div>
          ))}
        </nav>
      ) : (
        <>
          <nav aria-label="Product categories" className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 px-4 sm:px-6 lg:px-8 xl:gap-x-12">
            {categories.map((category) => (
              <div
                key={category._id}
                className="flex items-center"
                onMouseEnter={() => setActiveId(category._id)}
              >
                <Link
                  to={categoryLink(category)}
                  onClick={close}
                  onFocus={() => setActiveId(category._id)}
                  className={`border-b-2 py-4 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                    activeId === category._id
                      ? 'border-[#d2b18a] text-[#d2b18a]'
                      : 'border-transparent text-stone-300 hover:text-[#d2b18a]'
                  }`}
                >
                  {category.name}
                </Link>
              </div>
            ))}
          </nav>

          {/* ─── Desktop Luxury Dark Mega Menu Drawer (Full Screen Width) ─── */}
          {active && (
            <div
              id={`desktop-menu-${active._id}`}
              className="absolute left-0 right-0 w-full top-full z-50 border-b border-stone-800 bg-[#1c1a19] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] animate-fadeIn text-stone-200"
            >
              <MenuContents category={active} onNavigate={close} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
