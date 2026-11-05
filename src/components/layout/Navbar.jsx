import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
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
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';

import VirtualAppointmentModal from '../common/VirtualAppointmentModal';
import CartDrawer from '../store/CartDrawer';

const getSearchProductMeta = (item) => {
  const title = item.basicInfo?.title || '';
  const targetSlug =
    item.basicInfo?.slug ||
    item.slug ||
    (title ? title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : '');
  const productHref = `/product/${encodeURIComponent(targetSlug)}`;
  const minPrice = Number(item.pricing?.minPrice || 0);
  const maxPrice = Number(item.pricing?.maxPrice || 0);
  const hasRange = minPrice > 0 && maxPrice > 0 && maxPrice > minPrice;
  const priceText = hasRange
    ? `${formatProductPrice(minPrice)} – ${formatProductPrice(maxPrice)}`
    : (item.pricing?.salePrice || item.pricing?.minPrice ? formatProductPrice(item.pricing.salePrice || item.pricing.minPrice) : '');
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
  const { wishlistCount } = useWishlist();
  const [categories, setCategories] = useState([]);
  const collections = useMemo(() => {
    return (categories || [])
      .filter(
        (c) =>
          String(c.type || '').toLowerCase() === 'collection' ||
          /collection/i.test(c.name || c.title || '')
      )
      .map((item) => ({
        id: item._id || item.id,
        name: item.name || item.title || '',
        query: item.name || item.title || '',
      }));
  }, [categories]);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchTab, setSearchTab] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const userDropdownRef = useRef(null);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';
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

  const matchedCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!Array.isArray(categories) || !categories.length) return [];
    if (!q) return categories.slice(0, 6);
    const direct = categories.filter((cat) => {
      const name = (cat.name || cat.title || '').toLowerCase();
      const slug = (cat.slug || '').toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
    if (direct.length > 0) return direct;
    return categories.slice(0, 6);
  }, [searchQuery, categories]);

  const matchedCollections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!Array.isArray(collections) || !collections.length) return [];
    if (!q) return collections.slice(0, 6);
    return collections.filter((col) => (col.name || '').toLowerCase().includes(q));
  }, [searchQuery, collections]);

  const productCount = searchTotal || searchResults.length;
  const categoryCount = matchedCategories.length;
  const collectionCount = matchedCollections.length;
  const allCount = productCount;
  const displayedProducts = searchResults.slice(0, 6);

  // Close dropdown on outside click or route navigation
  useEffect(() => {
    setShowSearchDropdown(false);
    setUserDropdownOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchDropdown, userDropdownOpen]);

  const handleTrendingClick = (keyword) => {
    setSearchQuery(keyword);
    navigate(`/shop?search=${encodeURIComponent(keyword)}`);
    setShowSearchDropdown(false);
    setMobileSearchOpen(false);
  };

  // Listen for open appointment modal event from anywhere in the app
  useEffect(() => {
    const handleOpen = () => setAppointmentModalOpen(true);
    window.addEventListener('open-virtual-appointment', handleOpen);
    return () => window.removeEventListener('open-virtual-appointment', handleOpen);
  }, []);

  // Storefront navigation sourced primarily from fast bootstrap context
  useEffect(() => {
    const applyNav = (currentCategories) => {
      if (!themeConfig?.navigation?.length) { setCategories(currentCategories); return; }
      const byId = new Map(currentCategories.map((category) => [String(category._id), category]));
      const themedCategories = themeConfig.navigation
        .filter((entry) => entry.visible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((entry) => {
          const category = byId.get(String(entry.categoryId?._id || entry.categoryId));
          return category ? { ...category, name: entry.displayName || category.name } : null;
        })
        .filter(Boolean);
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

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchDropdown(false);
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
    }
  };

  if (isCheckout) {
    return (
      <header className="sticky top-0 z-40 w-full bg-[#181614] border-b border-white/10 shadow-sm font-sans">
        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" title="Return to store">
            {brandLogo.desktop ? (
              <img
                src={brandLogo.desktop}
                alt={storeSettings.companyName || 'Neirah'}
                className="h-7 sm:h-8 w-auto object-contain brightness-0 invert"
              />
            ) : (
              <span className="font-serif text-xl sm:text-2xl font-light tracking-[0.2em] text-white uppercase flex items-center gap-1.5">
                NEIRAH <span className="text-stone-400 text-xs font-normal tracking-[0.1em]">JEWELS</span>
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-stone-300">
            <HiOutlineShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm font-sans">
      {/* ─── Top announcement bar (Neirah Charcoal) ───────────── */}
      {!isCheckout && (
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
      )}

      {/* ─── Main Header / Brand & Search Bar (#201e1b) ───────────── */}
      <div
        style={{
          backgroundColor: 'var(--storefront-header-bg, #201e1b)',
          color: 'var(--storefront-header-text, #ffffff)',
        }}
        className="px-4 sm:px-6 lg:px-8 border-b border-white/5"
      >
        <div className={`max-w-7xl 2xl:max-w-[1536px] mx-auto flex items-center justify-between gap-3 sm:gap-6 ${isCheckout ? 'h-14 sm:h-16' : 'h-14 sm:h-16 lg:h-[68px]'}`}>
          {/* Mobile hamburger */}
          <div className="order-last flex items-center lg:order-none lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-300 hover:text-white transition-colors cursor-pointer"
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
                  className="h-8 sm:h-9.5 lg:h-10.5 w-auto max-w-[150px] sm:max-w-[185px] lg:max-w-[215px] object-contain object-left transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </picture>
            ) : (
              storeSettings.companyName && (
                <span className="font-cinzel text-base sm:text-xl lg:text-2xl font-semibold tracking-[0.18em] sm:tracking-[0.2em] text-[#f5f0eb] group-hover:text-amber-100 transition-colors uppercase">
                  {storeSettings.companyName}
                </span>
              )
            )}
          </Link>

          {/* ─── Compact Luxury Search Bar ─── */}
          <div ref={searchContainerRef} className="flex-1 max-w-sm lg:max-w-md xl:max-w-lg mx-auto hidden md:block relative z-40">
            <form
              onSubmit={handleSearch}
              className="relative flex items-center w-full h-9 sm:h-9.5 rounded-full bg-white border border-stone-200/90 shadow-2xs hover:border-[#8b6f4e]/60 focus-within:border-[#8b6f4e] focus-within:ring-2 focus-within:ring-[#8b6f4e]/20 transition-all duration-300"
            >
              <HiOutlineSearch className="w-4 h-4 ml-3.5 text-stone-400 shrink-0 pointer-events-none transition-colors" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search jewellery, diamonds, rings..."
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setShowSearchDropdown(true);
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim().length >= 2) {
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
                className="mr-1 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-[#8c6f4b] hover:bg-[#785d3c] active:scale-95 text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer shrink-0"
                title="Search"
              >
                <HiOutlineSearch className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </form>

            {/* Desktop Instant Search Dropdown (Matches Screenshot) */}
            {showSearchDropdown && searchQuery.trim().length >= 2 && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[780px] lg:w-[890px] xl:w-[980px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-stone-200/90 p-5 z-50 text-left animate-fadeIn">
                {/* Top Tab Bar: All (128) | Products (128) | Collections (4) | Categories (6) | View all -> */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
                      <div className="flex items-center gap-5 sm:gap-7 text-xs sm:text-sm">
                        <button
                          type="button"
                          onClick={() => setSearchTab('all')}
                          className={`font-semibold transition-all relative pb-2 cursor-pointer ${
                            searchTab === 'all'
                              ? 'text-[#8b6f4e] font-bold'
                              : 'text-stone-500 hover:text-stone-900'
                          }`}
                        >
                          <span>All ({allCount})</span>
                          {searchTab === 'all' && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b6f4e] rounded-full" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSearchTab('products')}
                          className={`font-semibold transition-all relative pb-2 cursor-pointer ${
                            searchTab === 'products'
                              ? 'text-[#8b6f4e] font-bold'
                              : 'text-stone-500 hover:text-stone-900'
                          }`}
                        >
                          <span>Products ({productCount})</span>
                          {searchTab === 'products' && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b6f4e] rounded-full" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSearchTab('collections')}
                          className={`font-semibold transition-all relative pb-2 cursor-pointer ${
                            searchTab === 'collections'
                              ? 'text-[#8b6f4e] font-bold'
                              : 'text-stone-500 hover:text-stone-900'
                          }`}
                        >
                          <span>Collections ({collectionCount})</span>
                          {searchTab === 'collections' && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b6f4e] rounded-full" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSearchTab('categories')}
                          className={`font-semibold transition-all relative pb-2 cursor-pointer ${
                            searchTab === 'categories'
                              ? 'text-[#8b6f4e] font-bold'
                              : 'text-stone-500 hover:text-stone-900'
                          }`}
                        >
                          <span>Categories ({categoryCount})</span>
                          {searchTab === 'categories' && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b6f4e] rounded-full" />
                          )}
                        </button>
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

                    {/* Content Section based on selected tab */}
                    {isSearching ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-stone-400">
                        <div className="w-6 h-6 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium">Searching luxury collection...</span>
                      </div>
                    ) : (searchTab === 'all' || searchTab === 'products') ? (
                      displayedProducts.length > 0 ? (
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
                      )
                    ) : searchTab === 'collections' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {matchedCollections.map((col) => (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => handleTrendingClick(col.query)}
                            className="p-3 rounded-2xl bg-[#f8f6f0] hover:bg-[#8b6f4e]/10 border border-stone-100 hover:border-[#8b6f4e]/40 transition-all text-left group cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#8b6f4e] mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                              <IoDiamondOutline className="w-4 h-4" />
                            </div>
                            <p className="text-xs font-bold text-stone-900 group-hover:text-[#8b6f4e] transition-colors">
                              {col.name}
                            </p>
                            <span className="text-[10px] text-stone-400 group-hover:text-[#8b6f4e] mt-1 inline-block">
                              Explore collection →
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {matchedCategories.map((cat) => {
                          const catImage = cat.image?.url || cat.icon?.url;
                          return (
                            <Link
                              key={cat._id}
                              to={`/shop?category=${encodeURIComponent(cat._id)}`}
                              onClick={() => {
                                setShowSearchDropdown(false);
                                setSearchQuery('');
                              }}
                              className="p-2.5 rounded-2xl bg-[#f8f6f0] hover:bg-[#8b6f4e]/10 border border-stone-100 hover:border-[#8b6f4e]/40 transition-all text-center group"
                            >
                              <div className="w-full aspect-square rounded-xl bg-white mb-2 overflow-hidden flex items-center justify-center p-2 shadow-2xs">
                                {catImage ? (
                                  <img
                                    src={getImageUrl(catImage)}
                                    alt={cat.name}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <IoDiamondOutline className="w-6 h-6 text-[#8b6f4e]/60" />
                                )}
                              </div>
                              <p className="text-xs font-bold text-stone-800 group-hover:text-[#8b6f4e] truncate transition-colors">
                                {cat.name}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    )}
              </div>
            )}
          </div>

          {/* Actions: Wishlist, Profile, Shopping Bag */}
          <div className="order-2 flex items-center space-x-1 sm:space-x-4">
            {/* Mobile Search Icon */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className="p-1.5 text-stone-300 hover:text-white transition-colors md:hidden"
              title="Search"
              aria-label="Search"
            >
              <HiOutlineSearch className="w-[18px] h-[18px]" />
            </button>

            {isCheckout && <span className="hidden items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1.5 text-[11px] text-white sm:inline-flex"><span aria-hidden="true">🇮🇳</span> INR <span aria-hidden="true">⌄</span></span>}
            {/* Wishlist Icon */}
            {user ? (
              <Link
                to="/wishlist"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-1.5 sm:p-2 text-stone-300 hover:text-white transition-colors relative"
                title="My Wishlist"
              >
                <HiOutlineHeart className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#e11d48] text-white text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold shadow-md ring-2 ring-[#201e1b] transition-transform animate-scaleIn">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openLoginModal(() => navigate('/wishlist'))}
                className="p-1.5 sm:p-2 text-stone-300 hover:text-white transition-colors relative cursor-pointer"
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
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#60574d] border border-stone-600 flex items-center justify-center text-white font-medium text-xs">
                      {user.profile?.firstName?.[0] || 'U'}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div
                      style={{ backgroundColor: 'var(--storefront-header-bg, #201e1b)' }}
                      className="absolute right-0 mt-2 w-52 border border-stone-800 rounded-xl shadow-2xl py-2 z-50 text-xs"
                    >
                      <div className="px-4 py-2 border-b border-stone-800">
                        <p className="font-semibold text-white truncate">{user.profile?.firstName} {user.profile?.lastName}</p>
                        <p className="text-stone-400 truncate">{user.auth?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-stone-300 hover:bg-white/5 hover:text-white"
                      >
                        My Account & Orders
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-rose-400 hover:bg-white/5 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openLoginModal()}
                  className="p-1.5 sm:p-2 text-stone-300 hover:text-white transition-colors block cursor-pointer"
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
              className="p-1.5 sm:p-2 text-stone-300 hover:text-white transition-colors relative"
              title="Shopping Bag"
              aria-label={`Open shopping bag, ${totalItems || 0} items`}
              aria-expanded={cartDrawerOpen}
            >
              <HiOutlineShoppingBag className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#bd9462] text-white text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold shadow-md ring-2 ring-[#201e1b] transition-transform animate-scaleIn">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Category Navigation Bar & Full-Width Mega Menu ───────── */}
      <div className="hidden lg:block w-full">
        <MegaMenuNav categories={categories} error={navigationError} onRetry={() => setNavigationRevision((value) => value + 1)} />
      </div>

      {/* ─── Mobile Instant Search Bar ──────────────────────────────── */}
      {mobileSearchOpen && (
        <div
          style={{ backgroundColor: 'var(--storefront-header-bg, #201e1b)' }}
          className="md:hidden border-b border-stone-800 px-4 py-3 animate-fadeIn"
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
              className="mr-1 w-8 h-8 rounded-full bg-[#8c6f4b] hover:bg-[#785d3c] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95"
            >
              <HiOutlineSearch className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </form>

          {/* Mobile Search Results */}
          {searchQuery.trim().length >= 2 && (
            <div className="mt-3 bg-white rounded-2xl shadow-xl border border-stone-200/90 p-3.5 text-left animate-fadeIn">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
                <div className="flex items-center gap-3 text-xs overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSearchTab('all')}
                    className={`font-semibold pb-1 whitespace-nowrap ${searchTab === 'all' ? 'text-[#8b6f4e] border-b-2 border-[#8b6f4e]' : 'text-stone-500'}`}
                  >
                    All ({allCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchTab('products')}
                    className={`font-semibold pb-1 whitespace-nowrap ${searchTab === 'products' ? 'text-[#8b6f4e] border-b-2 border-[#8b6f4e]' : 'text-stone-500'}`}
                  >
                    Products ({productCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchTab('collections')}
                    className={`font-semibold pb-1 whitespace-nowrap ${searchTab === 'collections' ? 'text-[#8b6f4e] border-b-2 border-[#8b6f4e]' : 'text-stone-500'}`}
                  >
                    Collections ({collectionCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchTab('categories')}
                    className={`font-semibold pb-1 whitespace-nowrap ${searchTab === 'categories' ? 'text-[#8b6f4e] border-b-2 border-[#8b6f4e]' : 'text-stone-500'}`}
                  >
                    Categories ({categoryCount})
                  </button>
                </div>
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
          style={{ backgroundColor: 'var(--storefront-header-bg, #201e1b)' }}
          className="lg:hidden border-b border-stone-800 px-4 sm:px-6 py-5 space-y-5 animate-slide-up"
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
                className="mr-1 w-8 h-8 rounded-full bg-[#8c6f4b] hover:bg-[#785d3c] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95"
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
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs uppercase font-medium tracking-[0.16em] text-amber-200 hover:text-white py-1.5 border-b border-white/5 flex items-center justify-between"
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
                className="text-xs uppercase font-medium tracking-[0.16em] text-amber-200 hover:text-white py-1.5 border-b border-white/5 flex items-center justify-between w-full cursor-pointer text-left"
              >
                <span>My Wishlist</span>
              </button>
            )}
            <Link
              to="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs uppercase font-medium tracking-[0.16em] text-stone-200 hover:text-white py-1.5 border-b border-white/5 flex items-center justify-between"
            >
              <span>The Journal / Blog</span>
            </Link>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="rounded-lg border border-white/15 px-3 py-3 text-center text-xs uppercase tracking-wider text-stone-200 hover:bg-white/5">Shopping Bag ({totalItems || 0})</Link>
              {!user && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openLoginModal();
                  }}
                  className="rounded-lg border border-white/15 px-3 py-3 text-center text-xs uppercase tracking-wider text-stone-200 hover:bg-white/5 cursor-pointer"
                >
                  Sign In
                </button>
              )}
              {!user && <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-[#8b6b47] px-3 py-3 text-center text-xs uppercase tracking-wider text-white hover:bg-[#745735]">Create Account</Link>}
              {user && <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-[#8b6b47] px-3 py-3 text-center text-xs uppercase tracking-wider text-white hover:bg-[#745735]">My Account</Link>}
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
