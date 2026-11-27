/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiOutlineChevronDown } from 'react-icons/hi';
import { getImageUrl, getMediaUrl } from '../../utils/imageUrl';

const categoryLink = (category) => `/shop?category=${encodeURIComponent(category.slug || category._id)}`;
const itemLink = (category, item) => `${categoryLink(category)}&menuItem=${encodeURIComponent(item._id || item.slug || item.name)}`;
const safeLink = (value, fallback) => (/^(https?:\/\/|\/(?!\/))/i.test(value || '') ? value : fallback);

function MenuContents({ category, onNavigate, mobile = false }) {
  const sections = (category.menuSections || []).filter((section) => section.menuItems?.length);
  const banners = (category.promoBanners || []).filter((banner) => banner.media?.url || banner.image?.url || (typeof (banner.media || banner.image) === 'string' && (banner.media || banner.image)));

  const showcaseCards = banners.map((b) => {
    const bannerId = b._id || b.id;
    const defaultBannerLink = bannerId
      ? `${categoryLink(category)}&promoBanner=${encodeURIComponent(bannerId)}`
      : categoryLink(category);

    return {
      title: b.title || category.name,
      link: safeLink(b.link, defaultBannerLink),
      image: getImageUrl(b.media?.url || b.image?.url || b.media || b.image),
    };
  }).filter((c) => c.image);

  if (mobile) {
    return (
      <div className="space-y-6 pt-2 pb-3 text-left">
        {sections.map((section) => (
          <div key={section._id} className="space-y-3">
            <h4
              style={{ color: 'color-mix(in srgb, currentColor 65%, transparent)' }}
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
            >
              {section.name}
            </h4>
            <ul className="space-y-2.5">
              {section.menuItems.map((item) => {
                const itemIconUrl = getMediaUrl(item.icon?.url || item.icon || item.iconUrl);
                return (
                  <li key={item._id}>
                    <Link
                      to={itemLink(category, item)}
                      onClick={onNavigate}
                      className="group/item flex items-center gap-2.5 text-xs opacity-85 hover:opacity-100 transition-opacity"
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {itemIconUrl ? (
                          <img
                            src={itemIconUrl}
                            alt=""
                            className="w-3.5 h-3.5 object-contain opacity-85 group-hover/item:opacity-100 transition-all"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'inline-block';
                              }
                            }}
                          />
                        ) : null}
                        <span
                          style={{ color: 'var(--storefront-megamenu-accent, #d2b18a)' }}
                          className={`text-[10px] shrink-0 opacity-75 group-hover/item:opacity-100 transition-opacity ${itemIconUrl ? 'hidden' : ''}`}
                        >
                          ✦
                        </span>
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              to={categoryLink(category)}
              onClick={onNavigate}
              style={{ color: 'var(--storefront-megamenu-accent, #d2b18a)' }}
              className="inline-block pt-1 text-[10px] font-bold uppercase tracking-widest hover:opacity-80 underline underline-offset-2 transition-opacity"
            >
              EXPLORE ALL
            </Link>
          </div>
        ))}
        {!sections.length && (
          <Link
            to={categoryLink(category)}
            onClick={onNavigate}
            className="text-xs opacity-85 hover:opacity-100 underline underline-offset-4 transition-opacity"
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
      <div
        style={{ borderColor: 'color-mix(in srgb, currentColor 12%, transparent)' }}
        className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-8 divide-x"
      >
        {sections.length > 0 ? (
          sections.map((section, idx) => (
            <div
              key={section._id}
              style={idx > 0 ? { borderColor: 'color-mix(in srgb, currentColor 12%, transparent)' } : undefined}
              className={`space-y-4 ${idx > 0 ? 'pl-8' : ''}`}
            >
              <h3
                style={{ color: 'color-mix(in srgb, currentColor 65%, transparent)' }}
                className="text-xs font-bold uppercase tracking-[0.14em] font-sans"
              >
                {section.name}
              </h3>
              <ul className="space-y-3">
                {section.menuItems.map((item) => {
                  const itemIconUrl = getMediaUrl(item.icon?.url || item.icon || item.iconUrl);
                  return (
                    <li key={item._id}>
                      <Link
                        to={itemLink(category, item)}
                        onClick={onNavigate}
                        className="group/item flex items-center gap-2.5 text-xs sm:text-[13px] opacity-85 hover:opacity-100 transition-opacity"
                      >
                        <span className="w-5 h-5 flex items-center justify-center shrink-0">
                          {itemIconUrl ? (
                            <img
                              src={itemIconUrl}
                              alt=""
                              className="w-4 h-4 object-contain opacity-85 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextSibling) {
                                  e.currentTarget.nextSibling.style.display = 'inline-block';
                                }
                              }}
                            />
                          ) : null}
                          <span
                            style={{ color: 'var(--storefront-megamenu-accent, #d2b18a)' }}
                            className={`text-[10px] shrink-0 opacity-75 group-hover/item:opacity-100 transition-opacity ${itemIconUrl ? 'hidden' : ''}`}
                          >
                            ✦
                          </span>
                        </span>
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link
                to={categoryLink(category)}
                onClick={onNavigate}
                style={{
                  color: 'var(--storefront-megamenu-accent, #d2b18a)',
                  borderColor: 'color-mix(in srgb, var(--storefront-megamenu-accent, #d2b18a) 60%, transparent)',
                }}
                className="inline-block mt-4 text-[11px] font-bold uppercase tracking-widest hover:opacity-80 border-b pb-0.5 transition-all"
              >
                EXPLORE ALL
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-4">
            <h3
              style={{ color: 'color-mix(in srgb, currentColor 65%, transparent)' }}
              className="text-xs font-bold uppercase tracking-[0.14em] mb-3 font-sans"
            >
              {category.name}
            </h3>
            <p
              style={{ color: 'color-mix(in srgb, currentColor 72%, transparent)' }}
              className="text-xs mb-4 max-w-md"
            >
              Discover our exclusive collection of handcrafted {category.name.toLowerCase()}.
            </p>
            <Link
              to={categoryLink(category)}
              onClick={onNavigate}
              style={{
                color: 'var(--storefront-megamenu-accent, #d2b18a)',
                borderColor: 'color-mix(in srgb, var(--storefront-megamenu-accent, #d2b18a) 60%, transparent)',
              }}
              className="inline-block text-[11px] font-bold uppercase tracking-widest hover:opacity-80 border-b pb-0.5 transition-all"
            >
              EXPLORE ALL
            </Link>
          </div>
        )}
      </div>

      {/* ─── Right Section: Featured Highlight Cards ─── */}
      {showcaseCards.length > 0 && (
        <aside
          aria-label={`${category.name} highlights`}
          style={{ borderColor: 'color-mix(in srgb, currentColor 12%, transparent)' }}
          className="flex items-center gap-5 shrink-0 pl-8 border-l"
        >
          {showcaseCards.slice(0, 2).map((card, idx) => (
            <Link
              key={idx}
              to={card.link || categoryLink(category)}
              onClick={onNavigate}
              className="group/card relative w-[205px] xl:w-[230px] h-[215px] xl:h-[240px] rounded-2xl overflow-hidden border border-white/10 bg-[#181513] shadow-2xl transition-all duration-300 hover:-translate-y-1 block cursor-pointer"
            >
              {/* Full Box Photo (Zoomed to fill complete box without empty letterbox spaces) */}
              <img
                src={card.image}
                alt={card.title}
                loading="lazy"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover/card:scale-105"
              />

              {/* Bottom Subtle Gradient & Title */}
              {card.title && card.title.trim() && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3.5 pt-8 flex items-end">
                  <span className="text-xs sm:text-[13px] font-medium text-white tracking-wide leading-snug drop-shadow-sm group-hover/card:text-[#d2b18a] transition-colors line-clamp-1">
                    {card.title}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </aside>
      )}
    </div>
  );
}

export default function MegaMenuNav({
  categories,
  mobile = false,
  onNavigate,
  onMenuOpen,
  closeSignal = 0,
  error,
  onRetry,
}) {
  const [activeId, setActiveId] = useState(null);
  const root = useRef(null);
  const triggers = useRef({});
  const location = useLocation();

  const activateDesktopCategory = (categoryId) => {
    setActiveId(categoryId);
    onMenuOpen?.(categoryId);
  };

  useEffect(() => {
    if (closeSignal) {
      setActiveId(null);
    }
  }, [closeSignal]);

  const sortedCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return [...categories].sort((a, b) => {
      const diff = (Number(a.order) || 0) - (Number(b.order) || 0);
      if (diff !== 0) return diff;
      return String(a.name || a.title || '').localeCompare(String(b.name || b.title || ''));
    });
  }, [categories]);

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

  const active = sortedCategories.find((category) => category._id === activeId);
  const close = () => {
    setActiveId(null);
    onNavigate?.();
  };

  return (
    <div
      ref={root}
      style={
        mobile
          ? undefined
          : {
              backgroundColor: 'var(--storefront-nav-bg, var(--storefront-header-bg, #201e1b))',
              color: 'var(--storefront-nav-text, var(--storefront-header-text, #d6d3d1))',
              borderColor: 'color-mix(in srgb, var(--storefront-nav-text, #d6d3d1) 14%, transparent)',
            }
      }
      className={mobile ? '' : 'relative w-full border-b transition-colors'}
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
        <div className="p-3 text-center text-xs opacity-70">
          Navigation is temporarily unavailable.{' '}
          <button type="button" onClick={onRetry} className="underline">
            Retry
          </button>
        </div>
      )}

      {mobile ? (
        <nav aria-label="Product categories" className="space-y-1">
          {sortedCategories.map((category) => (
            <div
              key={category._id}
              style={{ borderColor: 'color-mix(in srgb, currentColor 12%, transparent)' }}
              className="border-b"
            >
              <button
                type="button"
                ref={(element) => {
                  triggers.current[category._id] = element;
                }}
                aria-expanded={activeId === category._id}
                aria-controls={`mobile-menu-${category._id}`}
                onClick={() => setActiveId(activeId === category._id ? null : category._id)}
                className="flex w-full items-center justify-between py-3 text-left text-xs uppercase tracking-widest opacity-90 hover:opacity-100 transition-opacity"
              >
                <span>{category.name}</span>
                <HiOutlineChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeId === category._id ? 'rotate-180' : ''}`} />
              </button>
              {activeId === category._id && (
                <div
                  id={`mobile-menu-${category._id}`}
                  style={{
                    backgroundColor: 'var(--storefront-megamenu-bg, #181615)',
                    color: 'var(--storefront-megamenu-text, #e7e5e4)',
                    borderColor: 'color-mix(in srgb, var(--storefront-megamenu-text, #e7e5e4) 15%, transparent)',
                  }}
                  className="rounded-xl p-4 border mb-3 animate-fadeIn transition-colors"
                >
                  <Link
                    to={categoryLink(category)}
                    onClick={close}
                    style={{ color: 'var(--storefront-megamenu-accent, #d2b18a)' }}
                    className="mb-4 block text-xs font-semibold hover:underline"
                  >
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
          <nav aria-label="Product categories" className="mx-auto flex max-w-7xl 2xl:max-w-[1536px] flex-wrap items-center justify-center gap-x-8 px-4 sm:px-6 lg:px-8 xl:gap-x-12">
            {sortedCategories.map((category) => (
              <div
                key={category._id}
                className="flex items-center"
                onMouseEnter={() => activateDesktopCategory(category._id)}
              >
                <Link
                  to={categoryLink(category)}
                  onClick={close}
                  onFocus={() => activateDesktopCategory(category._id)}
                  style={{
                    color:
                      activeId === category._id
                        ? 'var(--storefront-nav-accent, #d2b18a)'
                        : 'var(--storefront-nav-text, var(--storefront-header-text, #d6d3d1))',
                    borderColor:
                      activeId === category._id
                        ? 'var(--storefront-nav-accent, #d2b18a)'
                        : 'transparent',
                  }}
                  className="border-b-2 py-2.5 sm:py-3 text-[11px] font-medium uppercase tracking-[0.14em] opacity-90 hover:opacity-100 transition-all cursor-pointer"
                >
                  {category.name}
                </Link>
              </div>
            ))}
          </nav>

          {/* ─── Desktop Luxury Mega Menu Drawer (Full Screen Width) ─── */}
          {active && (
            <div
              id={`desktop-menu-${active._id}`}
              style={{
                backgroundColor: 'var(--storefront-megamenu-bg, #1c1a19)',
                color: 'var(--storefront-megamenu-text, #e7e5e4)',
                borderColor: 'color-mix(in srgb, var(--storefront-megamenu-text, #e7e5e4) 15%, transparent)',
              }}
              className="absolute left-0 right-0 w-full top-full z-50 border-b shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] animate-fadeIn transition-colors"
            >
              <MenuContents category={active} onNavigate={close} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
