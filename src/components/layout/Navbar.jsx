import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import MegaMenuNav from './MegaMenuNav';
import { getOnce } from '../../api/axios';
import { productsAPI } from '../../api/services';
import { formatProductPrice } from '../../utils/productCard';
import { getImageUrl } from '../../utils/imageUrl';
import {
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineHeart,
  HiOutlinePhone,
  HiOutlineVideoCamera,
  HiOutlineCube,
  HiOutlineLocationMarker,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineCheck,
  HiOutlineLogout,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';

import VirtualAppointmentModal from '../common/VirtualAppointmentModal';
import CartDrawer from '../store/CartDrawer';

const getSearchProductMeta = (item) => {
  const title = item.basicInfo?.title || item.title || item.name || '';
  const targetSlug =
    item.basicInfo?.slug ||
    item.slug ||
    (title ? title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : '');
  const productHref = `/product/${encodeURIComponent(targetSlug)}`;
  const isSilver =
    String(item.productType || '').toLowerCase() === 'silver' ||
    Boolean(item.isOrnate) ||
    /silver|92\.5|925/i.test(title);
  const minPrice = Number(item.pricing?.minPrice || 0);
  const maxPrice = Number(item.pricing?.maxPrice || 0);
  const salePrice =
    item.pricing?.salePrice ??
    item.pricing?.calculatedPrice ??
    item.pricing?.ornatePrice ??
    item.pricing?.minPrice ??
    item.salePrice ??
    item.price ??
    0;
  const hasRange =
    !isSilver &&
    minPrice > 0 &&
    maxPrice > 0 &&
    maxPrice > minPrice &&
    (minPrice !== item.pricing?.salePrice || maxPrice !== item.pricing?.mrp);
  const priceText = hasRange
    ? `${formatProductPrice(minPrice)} – ${formatProductPrice(maxPrice)}`
    : (salePrice ? formatProductPrice(salePrice) : '');
  const imgUrl = item.image || (Array.isArray(item.images) && item.images[0]) || '';
  return { title, targetSlug, productHref, priceText, imgUrl };
};

const SearchProductCard = ({ item, variant = 'desktop', onSelect }) => {
  const { title, productHref, priceText, imgUrl } = getSearchProductMeta(item);

  if (variant === 'mobile-overlay') {
    return (
      <Link
        to={productHref}
        onClick={onSelect}
        className="w-28 shrink-0 flex flex-col text-left group"
      >
        <div className="w-28 h-28 rounded-xl bg-[#f8f6f0] border border-stone-100 flex items-center justify-center p-2 overflow-hidden shadow-2xs">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={title}
              className="w-full h-full object-contain mix-blend-multiply"
            />
          ) : (
            <IoDiamondOutline className="w-6 h-6 text-[#8b6f4e]/40" />
          )}
        </div>
        <p className="text-[11px] font-semibold text-stone-800 line-clamp-2 mt-1.5 leading-tight" title={title}>
          {title}
        </p>
        <p className="text-[11px] font-bold text-[#8b6f4e] mt-0.5">
          {priceText}
        </p>
      </Link>
    );
  }

  if (variant === 'mobile-drawer') {
    return (
      <Link
        to={productHref}
        onClick={onSelect}
        className="w-24 shrink-0 flex flex-col text-left group"
      >
        <div className="w-24 h-24 rounded-xl bg-[#f8f6f0] border border-stone-100 flex items-center justify-center p-1.5 overflow-hidden">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={title}
              className="w-full h-full object-contain mix-blend-multiply"
            />
          ) : (
            <IoDiamondOutline className="w-5 h-5 text-[#8b6f4e]/40" />
          )}
        </div>
        <p className="text-[10px] font-semibold text-stone-800 truncate mt-1" title={title}>{title}</p>
        <p className="text-[10px] font-bold text-[#8b6f4e]">{priceText}</p>
      </Link>
    );
  }

  return (
    <Link
      to={productHref}
      onClick={onSelect}
      className="group flex flex-col text-left"
    >
      <div className="w-full aspect-square rounded-2xl bg-[#f8f6f0] border border-stone-100 flex items-center justify-center p-2.5 overflow-hidden group-hover:border-[#8b6f4e]/40 transition-all shadow-2xs">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={title}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <IoDiamondOutline className="w-8 h-8 text-[#8b6f4e]/40" />
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-stone-800 line-clamp-2 mt-2 leading-tight group-hover:text-[#8b6f4e] transition-colors min-h-[2rem]" title={title}>
        {title}
      </p>
      <p className="text-xs font-bold text-[#8b6f4e] mt-1">
        {priceText}
      </p>
    </Link>
  );
};

const Navbar = () => {
  const { user, logout, openLoginModal } = useAuth();
  const { totalItems, cartDrawerOpen, setCartDrawerOpen } = useCart();
  const { wishlistCount, refreshWishlist } = useWishlist();
  const [categories, setCategories] = useState([]);
  const [navigationError, setNavigationError] = useState(false);
  const [navigationRevision, setNavigationRevision] = useState(0);
  const { settings: storeSettings, theme: themeConfig, topAnnouncement: contextTopAnnouncement, navigation: bootstrapNavigation } = useStoreSettings();
  const topAnnouncement = contextTopAnnouncement || { isEnabled: false, displayDirection: 'horizontal', autoplayInterval: 4000, items: [] };
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const brandLogo = {
    desktop: getImageUrl(storeSettings.logoImage?.url),
    mobile: getImageUrl(storeSettings.mobileLogoImage?.url),
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [closeMegaMenuSignal, setCloseMegaMenuSignal] = useState(0);
  const { currencies, selectedCurrency, selectCurrency, showOnStorefront: showCurrencyOnStorefront } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const userDropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = String(
    storeSettings?.businessDetails?.mobileNumber ||
    '+91 84600-91955'
  ).trim();
  const phoneHref = phoneNumber.replace(/[^\d+]/g, '');

  // Instant search debounce effect
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setSearchTotal(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      productsAPI
        .getSearchStorefront({ search: trimmed, limit: 12 })
        .then((response) => {
          const resData = response.data?.data;
          const items = Array.isArray(resData)
            ? resData
            : resData?.items || [];
          const total = resData?.pagination?.totalDocs ?? items.length;
          setSearchResults(items);
          setSearchTotal(total);
          setShowSearchDropdown(true);
        })
        .catch(() => {
          setSearchResults([]);
          setSearchTotal(0);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const allCount = searchTotal || searchResults.length;
  const displayedProducts = searchResults.slice(0, 6);

  // Close dropdown on outside click or route navigation
  useEffect(() => {
    setShowSearchDropdown(false);
    setUserDropdownOpen(false);
    setCurrencyDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target)) {
        setCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Shortcut ⌘K / Ctrl+K to focus search and Escape to close dropdowns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      }
      if (e.key === 'Escape') {
        if (showSearchDropdown) {
          setShowSearchDropdown(false);
          searchInputRef.current?.blur();
        }
        if (userDropdownOpen) {
          setUserDropdownOpen(false);
        }
        if (currencyDropdownOpen) {
          setCurrencyDropdownOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchDropdown, userDropdownOpen, currencyDropdownOpen]);

  // Listen for open appointment modal event from anywhere in the app
  useEffect(() => {
    const handleOpen = () => setAppointmentModalOpen(true);
    window.addEventListener('open-virtual-appointment', handleOpen);
    return () => window.removeEventListener('open-virtual-appointment', handleOpen);
  }, []);

  // Storefront navigation sourced primarily from fast bootstrap context
  useEffect(() => {
    const applyNav = (currentCategories) => {
      const sorted = [...(currentCategories || [])].sort((a, b) => {
        const diff = (Number(a.order) || 0) - (Number(b.order) || 0);
        if (diff !== 0) return diff;
        return String(a.name || a.title || '').localeCompare(String(b.name || b.title || ''));
      });
      if (!themeConfig?.navigation?.length) { setCategories(sorted); return; }
      const byId = new Map(sorted.map((category) => [String(category._id), category]));
      const themedCategories = themeConfig.navigation
        .filter((entry) => entry.visible !== false)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
        .map((entry) => {
          const category = byId.get(String(entry.categoryId?._id || entry.categoryId));
          return category ? { ...category, name: entry.displayName || category.name, order: entry.order ?? category.order } : null;
        })
        .filter(Boolean)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      setCategories(themedCategories);
    };

    if (bootstrapNavigation && bootstrapNavigation.length > 0) {
      applyNav(bootstrapNavigation);
      return;
    }

    let active = true;
    setNavigationError(false);
    getOnce('/categories/navigation')
      .then((response) => {
        if (!active) return;
        applyNav(response.data?.data || []);
      })
      .catch(() => { if (active) setNavigationError(true); });
    return () => { active = false; };
  }, [bootstrapNavigation, navigationRevision, themeConfig?.navigation, themeConfig?.mediaOverrides]);

  useEffect(() => {
    const items = topAnnouncement.items || [];
    if (items.length <= 1) return undefined;
    const interval = window.setInterval(() => {
      setAnnouncementIndex((index) => (index + 1) % items.length);
    }, topAnnouncement.autoplayInterval || 4000);
    return () => window.clearInterval(interval);
  }, [topAnnouncement.items, topAnnouncement.autoplayInterval]);

  const handleCategoryMenuOpen = useCallback(() => {
    setUserDropdownOpen(false);
    setCurrencyDropdownOpen(false);
    setShowSearchDropdown(false);
  }, []);

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchDropdown(false);
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm font-sans">
      {/* ─── Top announcement bar (Neirah Charcoal) ───────────── */}
      <div
        style={{
          backgroundColor: 'var(--storefront-topbar-bg, #201e1b)',
          color: 'var(--storefront-topbar-text, #ffffff)',
        }}
        className="text-[10px] sm:text-xs py-1.5 px-4 sm:px-6 lg:px-8 border-b border-black/10"
      >
          <div className="relative max-w-7xl 2xl:max-w-[1536px] mx-auto flex items-center justify-between min-h-[24px]">
            {/* Left: Virtual Appointment */}
            <div className="flex-1 flex items-center justify-start min-w-0 relative z-10">
              <button
                type="button"
                onClick={() => setAppointmentModalOpen(true)}
                className="flex items-center gap-1.5 hover:text-white transition-colors text-white/80 cursor-pointer shrink-0"
                title="Book Virtual Appointment"
              >
                <HiOutlineVideoCamera className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline font-normal">Virtual Appointment</span>
              </button>
            </div>

            {/* Center: Announcement (guaranteed mathematical center on all devices) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-7 sm:px-36 md:px-44 lg:px-48">
              <div className="pointer-events-auto min-w-0 max-w-full font-medium tracking-wide h-6 overflow-hidden flex items-center justify-center text-center">
                {topAnnouncement.isEnabled && topAnnouncement.items?.length ? (() => {
                  const items = topAnnouncement.items;
                  const current = items[announcementIndex % items.length];
                  const isVertical = topAnnouncement.displayDirection === 'vertical';
                  return (
                    <div
                      key={`${announcementIndex}-${topAnnouncement.displayDirection}`}
                      className={`truncate text-center ${
                        isVertical
                          ? 'animate-announcement-vertical'
                          : 'animate-announcement-horizontal'
                      }`}
                      title={current?.message || ''}
                    >
                      {current?.link ? (
                        <a href={current.link} className="hover:underline">
                          {current.message}
                        </a>
                      ) : (
                        current?.message
                      )}
                    </div>
                  );
                })() : (
                  <span className="truncate">{storeSettings?.businessDetails?.companyName || 'Neirah'}</span>
                )}
              </div>
            </div>

            {/* Right: Phone or balanced empty spacer */}
            <div className="flex-1 flex items-center justify-end min-w-0 relative z-10">
              {phoneNumber ? (
                <a
                  href={`tel:${phoneHref}`}
                  className="flex items-center gap-1.5 hover:text-white transition-colors text-white/80 shrink-0"
                  title={`Call ${phoneNumber}`}
                >
                  <HiOutlinePhone className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline font-normal">{phoneNumber}</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>

      {/* ─── Main Header / Brand & Search Bar ───────────── */}
      <div
        style={{
          backgroundColor: 'var(--storefront-header-bg, #201e1b)',
          color: 'var(--storefront-header-text, #ffffff)',
          borderColor: 'color-mix(in srgb, var(--storefront-header-text, #ffffff) 10%, transparent)',
        }}
        className="relative z-50 px-4 sm:px-6 lg:px-8 border-b transition-colors"
      >
        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto flex items-center justify-between gap-3 sm:gap-6 h-14 sm:h-16 lg:h-[70px]">
          {/* Mobile hamburger */}
          <div className="order-last flex items-center lg:order-none lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>
          </div>

          {/* ─── Prominent Brand Logo ─── */}
          <Link
            to="/"
            onClick={() => {
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="order-first flex items-center leading-none group shrink-0 min-w-0 py-1 h-full"
            aria-label={storeSettings.companyName || 'Home'}
          >
            {brandLogo.desktop ? (
              <picture className="flex items-center h-full">
                {brandLogo.mobile && <source media="(max-width: 639px)" srcSet={brandLogo.mobile} />}
                <img
                  src={brandLogo.desktop}
                  alt={storeSettings.companyName || 'Neirah Jewels'}
                  className="h-9 sm:h-10 md:h-11 lg:h-[46px] xl:h-[48px] w-auto max-w-[160px] sm:max-w-[190px] md:max-w-[220px] lg:max-w-[245px] object-contain object-left transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </picture>
            ) : (
              storeSettings.companyName && (
                <span className="font-cinzel text-base sm:text-xl lg:text-2xl font-semibold tracking-[0.18em] sm:tracking-[0.2em] opacity-95 group-hover:opacity-100 transition-opacity uppercase">
                  {storeSettings.companyName}
                </span>
              )
            )}
          </Link>

          {/* ─── Compact Luxury Search Bar ─── */}
          <div ref={searchContainerRef} className="flex-1 max-w-sm lg:max-w-md xl:max-w-lg mx-auto hidden md:block relative z-40">
            <form
              onSubmit={handleSearch}
              className="relative flex items-center w-full h-9 sm:h-10 rounded-full bg-white border border-stone-200/90 shadow-2xs hover:border-[#8b6f4e]/60 focus-within:border-[#8b6f4e] focus-within:ring-2 focus-within:ring-[#8b6f4e]/20 transition-all duration-300"
            >
              <HiOutlineSearch className="w-4 h-4 ml-3.5 text-stone-400 shrink-0 pointer-events-none transition-colors" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search jewellery, diamonds, rings..."
                value={searchQuery}
                onFocus={() => {
                  setUserDropdownOpen(false);
                  setCurrencyDropdownOpen(false);
                  setCloseMegaMenuSignal((n) => n + 1);
                  if (searchQuery.trim().length >= 2) setShowSearchDropdown(true);
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim().length >= 2) {
                    setUserDropdownOpen(false);
                    setCurrencyDropdownOpen(false);
                    setCloseMegaMenuSignal((n) => n + 1);
                    setShowSearchDropdown(true);
                  } else {
                    setShowSearchDropdown(false);
                  }
                }}
                className="w-full bg-transparent px-2.5 text-xs sm:text-[13px] text-stone-900 placeholder:text-stone-400 font-normal focus:outline-none"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 mr-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <HiOutlineX className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                aria-label="Submit search"
                style={{
                  backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                  color: 'var(--btn-primary-text, #ffffff)',
                }}
                className="mr-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:opacity-90 active:scale-95 flex items-center justify-center shadow-2xs transition-all cursor-pointer shrink-0"
                title="Search"
              >
                <HiOutlineSearch className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </form>

            {/* Desktop Instant Search Dropdown (Matches Screenshot) */}
            {showSearchDropdown && searchQuery.trim().length >= 2 && (
              <div
                style={{ transform: 'translateX(-50%)' }}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[780px] lg:w-[890px] xl:w-[980px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-stone-200/90 p-5 z-50 text-left animate-fadeIn"
              >
                {/* Top Header: Products ({allCount}) | View all -> */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                  <div className="flex items-center text-xs sm:text-sm">
                    <span
                      className="font-bold relative pb-2"
                      style={{ color: 'var(--btn-primary-bg, #8c6536)' }}
                    >
                      <span>Products ({allCount})</span>
                      <span
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--btn-primary-bg, #8c6536)' }}
                      />
                    </span>
                  </div>

                  <Link
                    to={`/shop?search=${encodeURIComponent(searchQuery.trim())}`}
                    onClick={() => setShowSearchDropdown(false)}
                    className="text-xs sm:text-sm font-semibold text-stone-700 hover:text-[#8b6f4e] flex items-center gap-1 group transition-colors cursor-pointer shrink-0"
                  >
                    <span>View all</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                </div>

                {/* Content Section: Matched Products */}
                {isSearching ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-stone-400">
                    <div className="w-6 h-6 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Searching luxury collection...</span>
                  </div>
                ) : displayedProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-3.5">
                    {displayedProducts.map((item) => (
                      <SearchProductCard
                        key={item._id}
                        item={item}
                        variant="desktop"
                        onSelect={() => {
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 px-4 text-center">
                    <p className="text-xs text-stone-500">
                      No products found matching &ldquo;<span className="text-stone-900 font-semibold">{searchQuery}</span>&rdquo;.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions: Currency, Wishlist, Profile, Shopping Bag */}
          <div className="order-2 flex items-center space-x-1 sm:space-x-3">
            {/* Mobile Search Icon */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className="p-1.5 opacity-80 hover:opacity-100 transition-opacity md:hidden"
              title="Search"
              aria-label="Search"
            >
              <HiOutlineSearch className="w-[18px] h-[18px]" />
            </button>

            {/* Currency Dropdown */}
            {showCurrencyOnStorefront && currencies.length > 0 && (
              <div className="relative" ref={currencyDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrencyDropdownOpen((prev) => {
                      const next = !prev;
                      if (next) {
                        setUserDropdownOpen(false);
                        setShowSearchDropdown(false);
                        setCloseMegaMenuSignal((n) => n + 1);
                      }
                      return next;
                    });
                  }}
                  aria-label="Select currency"
                  aria-expanded={currencyDropdownOpen}
                  title="Select currency"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 30%, transparent)',
                    backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 8%, transparent)',
                  }}
                  className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border opacity-95 hover:opacity-100 text-xs font-medium transition-all cursor-pointer shrink-0"
                >
                  <span
                    style={{ color: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 75%, currentColor)' }}
                    className="font-bold"
                  >
                    {selectedCurrency?.symbol || '₹'}
                  </span>
                  <span className="tracking-wide">{selectedCurrency?.code || 'INR'}</span>
                  <HiOutlineChevronDown
                    style={{ color: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 65%, currentColor)' }}
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      currencyDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {currencyDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-60 bg-white border border-stone-200 rounded-2xl shadow-xl p-1.5 z-50 animate-fadeIn">
                    <div className="absolute -top-[7px] right-4 w-3.5 h-3.5 bg-white border-t border-l border-stone-200 rotate-45 rounded-tl-[2px]" />
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Select Currency
                    </div>
                    <div className="max-h-64 overflow-y-auto luxury-scrollbar space-y-0.5 pr-0.5">
                      {currencies.map((cur) => {
                        const isSelected = cur.code === selectedCurrency?.code;
                        return (
                          <button
                            key={cur._id || cur.code}
                            type="button"
                            onClick={() => {
                              selectCurrency(cur);
                              setCurrencyDropdownOpen(false);
                            }}
                            style={
                              isSelected
                                ? { backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, white)' }
                                : undefined
                            }
                            className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'text-stone-950 font-semibold'
                                : 'text-stone-700 hover:bg-stone-50 hover:text-stone-950'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                style={{
                                  backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, white)',
                                  color: 'var(--btn-primary-bg, #8b6f4e)',
                                }}
                                className="min-w-[40px] h-7 px-2 rounded-full text-[11px] font-bold leading-none whitespace-nowrap flex items-center justify-center shrink-0"
                              >
                                {cur.symbol}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-stone-900 leading-tight">
                                  {cur.code}
                                </div>
                                <div className="text-[10.5px] text-stone-500 truncate">
                                  {cur.name}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <HiOutlineCheck
                                style={{ color: 'var(--btn-primary-bg, #8b6f4e)' }}
                                className="w-4 h-4 shrink-0"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Icon */}
            {user ? (
              <Link
                to="/wishlist"
                onMouseEnter={() => refreshWishlist?.({ silent: true })}
                onTouchStart={() => refreshWishlist?.({ silent: true })}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-1.5 sm:p-2 opacity-80 hover:opacity-100 transition-opacity relative"
                title="My Wishlist"
              >
                <HiOutlineHeart className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                {wishlistCount > 0 && (
                  <span
                    style={{ '--tw-ring-color': 'var(--storefront-header-bg, #201e1b)' }}
                    className="absolute -top-1 -right-1 bg-[#e11d48] text-white text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold shadow-md ring-2 transition-transform animate-scaleIn"
                  >
                    {wishlistCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openLoginModal(() => navigate('/wishlist'))}
                className="p-1.5 sm:p-2 opacity-80 hover:opacity-100 transition-opacity relative cursor-pointer"
                title="My Wishlist"
              >
                <HiOutlineHeart className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              </button>
            )}

            {/* User Account / Profile */}
            <div className="relative">
              {user ? (
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => {
                      setUserDropdownOpen((prev) => {
                        const next = !prev;
                        if (next) {
                          setCurrencyDropdownOpen(false);
                          setShowSearchDropdown(false);
                          setCloseMegaMenuSignal((n) => n + 1);
                        }
                        return next;
                      });
                    }}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    title="Account"
                    aria-label="Account menu"
                  >
                    <div
                      style={{
                        backgroundColor: 'var(--btn-primary-bg, #8b6f4e)',
                        color: 'var(--btn-primary-text, #ffffff)',
                      }}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-serif font-bold text-xs sm:text-[13px] shadow-xs transition-opacity hover:opacity-90"
                    >
                      {user.profile?.firstName?.[0]?.toUpperCase() || user.auth?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 top-full mt-3 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white border border-stone-200 rounded-2xl shadow-xl p-3 z-50 animate-fadeIn">
                      {/* Speech bubble pointer arrow */}
                      <div className="absolute -top-[7px] right-3.5 w-3.5 h-3.5 bg-white border-t border-l border-stone-200 rotate-45 rounded-tl-[2px]" />

                      {/* User Header */}
                      <div className="flex items-center gap-3 p-1 pb-3 border-b border-stone-100 select-none">
                        <div
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, white)',
                            borderColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 28%, white)',
                            color: 'var(--btn-primary-bg, #8b6f4e)',
                          }}
                          className="w-11 h-11 rounded-full border flex items-center justify-center font-serif text-lg font-bold shrink-0 shadow-2xs"
                        >
                          {user.profile?.firstName?.[0]?.toUpperCase() || user.auth?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-stone-900 text-sm tracking-tight truncate">
                            {[user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') || 'Valued Customer'}
                          </p>
                          <p className="text-xs text-stone-500 font-normal truncate mt-0.5">
                            {user.auth?.email || ''}
                          </p>
                        </div>
                      </div>

                      {/* Menu List */}
                      <div className="py-1.5 space-y-0.5">
                        <Link
                          to="/profile"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-50 text-stone-700 hover:text-stone-950 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <HiOutlineUser className="w-[18px] h-[18px] text-stone-600 group-hover:text-[var(--btn-primary-bg,#8b6f4e)] transition-colors stroke-[1.8]" />
                            <span className="text-[13px] font-medium">My Account & Orders</span>
                          </div>
                          <HiOutlineChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                          to="/profile?tab=orders"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-50 text-stone-700 hover:text-stone-950 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <HiOutlineCube className="w-[18px] h-[18px] text-stone-600 group-hover:text-[var(--btn-primary-bg,#8b6f4e)] transition-colors stroke-[1.8]" />
                            <span className="text-[13px] font-medium">Orders</span>
                          </div>
                          <HiOutlineChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                          to="/profile?tab=addresses"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-50 text-stone-700 hover:text-stone-950 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <HiOutlineLocationMarker className="w-[18px] h-[18px] text-stone-600 group-hover:text-[var(--btn-primary-bg,#8b6f4e)] transition-colors stroke-[1.8]" />
                            <span className="text-[13px] font-medium">Addresses</span>
                          </div>
                          <HiOutlineChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                      </div>

                      {/* Sign Out Button */}
                      <div className="pt-1 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#fdf2f1] hover:bg-[#fae6e4] text-[#c2413a] font-semibold text-[13px] transition-colors cursor-pointer border border-[#f7d6d3]"
                        >
                          <HiOutlineLogout className="w-4 h-4 text-[#c2413a] stroke-[2]" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openLoginModal()}
                  className="p-1.5 sm:p-2 opacity-80 hover:opacity-100 transition-opacity block cursor-pointer"
                  title="Sign In"
                >
                  <HiOutlineUser className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Shopping Bag with live badge */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="p-1.5 sm:p-2 opacity-80 hover:opacity-100 transition-opacity relative"
              title="Shopping Bag"
              aria-label={`Open shopping bag, ${totalItems || 0} items`}
              aria-expanded={cartDrawerOpen}
            >
              <HiOutlineShoppingBag className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              {totalItems > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--btn-primary-bg, #8b6f4e)',
                    color: 'var(--btn-primary-text, #ffffff)',
                    '--tw-ring-color': 'var(--storefront-header-bg, #201e1b)',
                  }}
                  className="absolute -top-1 -right-1 text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold shadow-md ring-2 transition-transform animate-scaleIn"
                >
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Category Navigation Bar & Full-Width Mega Menu ───────── */}
      <div className="hidden lg:block w-full relative z-40">
        <MegaMenuNav
          categories={categories}
          onMenuOpen={handleCategoryMenuOpen}
          closeSignal={closeMegaMenuSignal}
          error={navigationError}
          onRetry={() => setNavigationRevision((value) => value + 1)}
        />
      </div>

      {/* ─── Mobile Instant Search Bar ──────────────────────────────── */}
      {mobileSearchOpen && (
        <div
          style={{
            backgroundColor: 'var(--storefront-header-bg, #201e1b)',
            color: 'var(--storefront-header-text, #ffffff)',
            borderColor: 'color-mix(in srgb, var(--storefront-header-text, #ffffff) 14%, transparent)',
          }}
          className="md:hidden border-b px-4 py-3 animate-fadeIn transition-colors"
        >
          <form
            onSubmit={handleSearch}
            className="relative flex items-center w-full h-11 rounded-full bg-white border border-stone-200 shadow-xs focus-within:border-[#8b6f4e] transition-all"
          >
            <HiOutlineSearch className="w-4 h-4 ml-3.5 text-stone-400 pointer-events-none shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search jewellery, diamonds, rings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-3 text-xs text-stone-900 placeholder:text-stone-400 font-medium focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 mr-1 text-stone-400 hover:text-stone-700"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              style={{
                backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                color: 'var(--btn-primary-text, #ffffff)',
              }}
              className="mr-1 w-8 h-8 rounded-full hover:opacity-90 flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95"
            >
              <HiOutlineSearch className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </form>

          {/* Mobile Search Results */}
          {searchQuery.trim().length >= 2 && (
            <div className="mt-3 bg-white rounded-2xl shadow-xl border border-stone-200/90 p-3.5 text-left animate-fadeIn">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3 text-xs">
                <span className="font-bold text-[#8b6f4e] border-b-2 border-[#8b6f4e] pb-1">
                  Products ({allCount})
                </span>
                <Link
                  to={`/shop?search=${encodeURIComponent(searchQuery.trim())}`}
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setShowSearchDropdown(false);
                  }}
                  className="text-xs font-semibold text-stone-700 hover:text-[#8b6f4e] shrink-0 ml-2"
                >
                  View all →
                </Link>
              </div>

              {isSearching ? (
                <div className="py-6 text-center text-xs text-stone-400">Searching jewellery...</div>
              ) : displayedProducts.length > 0 ? (
                <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
                  {displayedProducts.map((item) => (
                    <SearchProductCard
                      key={item._id}
                      item={item}
                      variant="mobile-overlay"
                      onSelect={() => {
                        setMobileSearchOpen(false);
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-stone-400">No products found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Mobile Drawer ───────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'var(--storefront-nav-bg, var(--storefront-header-bg, #201e1b))',
            color: 'var(--storefront-nav-text, var(--storefront-header-text, #ffffff))',
            borderColor: 'color-mix(in srgb, var(--storefront-nav-text, #ffffff) 14%, transparent)',
          }}
          className="lg:hidden border-b px-4 sm:px-6 py-5 space-y-5 animate-slide-up transition-colors"
        >
          {/* Mobile Search */}
          <div className="relative w-full">
            <form
              onSubmit={handleSearch}
              className="relative flex items-center w-full h-11 rounded-full bg-white border border-stone-200 shadow-xs focus-within:border-[#8b6f4e] transition-all"
            >
              <HiOutlineSearch className="w-4 h-4 ml-3.5 text-stone-400 pointer-events-none shrink-0" />
              <input
                type="text"
                placeholder="Search jewellery, diamonds..."
                value={searchQuery}
                onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 text-xs text-stone-900 placeholder:text-stone-400 font-medium focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 mr-1 text-stone-400 hover:text-stone-700"
                >
                  <HiOutlineX className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                style={{
                  backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                  color: 'var(--btn-primary-text, #ffffff)',
                }}
                className="mr-1 w-8 h-8 rounded-full hover:opacity-90 flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95"
              >
                <HiOutlineSearch className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </form>
            {showSearchDropdown && searchQuery.trim().length >= 2 && (
              <div className="mt-2 bg-white border border-stone-200 rounded-2xl shadow-xl p-3 text-left animate-fadeIn">
                {isSearching ? (
                  <div className="py-3 text-center text-xs text-stone-400">Searching jewellery...</div>
                ) : displayedProducts.length > 0 ? (
                  <>
                    <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-2">
                      {displayedProducts.map((item) => (
                        <SearchProductCard
                          key={item._id}
                          item={item}
                          variant="mobile-drawer"
                          onSelect={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                            setMobileMenuOpen(false);
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="w-full py-2 px-3 text-center text-xs text-[#8b6f4e] font-bold hover:underline cursor-pointer border-t border-stone-100 mt-1"
                    >
                      View all results →
                    </button>
                  </>
                ) : (
                  <div className="py-3 text-center text-xs text-stone-400">No jewellery found</div>
                )}
              </div>
            )}
          </div>

          {/* Categories List */}
          <nav className="flex flex-col space-y-3 pt-2">
            <MegaMenuNav categories={categories} mobile onNavigate={() => setMobileMenuOpen(false)} error={navigationError} onRetry={() => setNavigationRevision((value) => value + 1)} />
            {user ? (
              <Link
                to="/wishlist"
                onMouseEnter={() => refreshWishlist?.({ silent: true })}
                onTouchStart={() => refreshWishlist?.({ silent: true })}
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  color: 'var(--storefront-nav-accent, #fde68a)',
                  borderColor: 'color-mix(in srgb, currentColor 12%, transparent)',
                }}
                className="text-xs uppercase font-medium tracking-[0.16em] opacity-90 hover:opacity-100 py-1.5 border-b flex items-center justify-between transition-opacity"
              >
                <span>My Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="bg-[#e11d48] text-white text-[10px] min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLoginModal(() => navigate('/wishlist'));
                }}
                style={{
                  color: 'var(--storefront-nav-accent, #fde68a)',
                  borderColor: 'color-mix(in srgb, currentColor 12%, transparent)',
                }}
                className="text-xs uppercase font-medium tracking-[0.16em] opacity-90 hover:opacity-100 py-1.5 border-b flex items-center justify-between w-full cursor-pointer text-left transition-opacity"
              >
                <span>My Wishlist</span>
              </button>
            )}
            <Link
              to="/blog"
              onClick={() => setMobileMenuOpen(false)}
              style={{ borderColor: 'color-mix(in srgb, currentColor 12%, transparent)' }}
              className="text-xs uppercase font-medium tracking-[0.16em] opacity-85 hover:opacity-100 py-1.5 border-b flex items-center justify-between transition-opacity"
            >
              <span>The Journal / Blog</span>
            </Link>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                style={{ borderColor: 'color-mix(in srgb, currentColor 18%, transparent)' }}
                className="rounded-lg border px-3 py-3 text-center text-xs uppercase tracking-wider opacity-90 hover:opacity-100 transition-opacity"
              >
                Shopping Bag ({totalItems || 0})
              </Link>
              {!user && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openLoginModal();
                  }}
                  style={{ borderColor: 'color-mix(in srgb, currentColor 18%, transparent)' }}
                  className="rounded-lg border px-3 py-3 text-center text-xs uppercase tracking-wider opacity-90 hover:opacity-100 cursor-pointer transition-opacity"
                >
                  Sign In
                </button>
              )}
              {!user && (
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                    color: 'var(--btn-primary-text, #ffffff)',
                  }}
                  className="rounded-lg px-3 py-3 text-center text-xs uppercase tracking-wider hover:opacity-90"
                >
                  Create Account
                </Link>
              )}
              {user && (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    backgroundColor: 'var(--btn-primary-bg, #8c6536)',
                    color: 'var(--btn-primary-text, #ffffff)',
                  }}
                  className="rounded-lg px-3 py-3 text-center text-xs uppercase tracking-wider hover:opacity-90"
                >
                  My Account
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Virtual Appointment Modal (Screenshot 1) */}
      <VirtualAppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
      />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </header>
  );
};

export default Navbar;
