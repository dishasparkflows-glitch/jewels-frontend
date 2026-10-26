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
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';

import VirtualAppointmentModal from '../common/VirtualAppointmentModal';
import CartDrawer from '../store/CartDrawer';

const TRENDING_SEARCHES = [
  'Solitaire Rings',
  'Diamond Earrings',
  'Huggie Hoops',
  '18K Yellow Gold',
  'Lab Grown Diamonds',
  'Daily Wear',
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const [categories, setCategories] = useState([]);
  const [navigationError, setNavigationError] = useState(false);
  const [navigationRevision, setNavigationRevision] = useState(0);
  const { settings: storeSettings, theme: themeConfig, topAnnouncement: contextTopAnnouncement } = useStoreSettings();
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
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';
  const phoneNumber = String(storeSettings.mobileNumber || '').trim();
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
          const total = resData?.pagination?.totalDocs ?? resData?.pagination?.total ?? items.length;
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

  // Curated collections for the collections tab
  const CURATED_COLLECTIONS = useMemo(() => [
    { id: 'solitaires', name: 'Solitaire Rings', query: 'Solitaire' },
    { id: 'halo', name: 'Halo Collection', query: 'Halo' },
    { id: 'bridal', name: 'Bridal Heritage', query: 'Bridal' },
    { id: 'earrings', name: 'Diamond Earrings', query: 'Earrings' },
    { id: 'daily', name: 'Everyday Luxury', query: 'Daily' },
    { id: 'festive', name: 'Festive Sparkle', query: 'Festive' },
  ], []);

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
    if (!q) return CURATED_COLLECTIONS;
    const direct = CURATED_COLLECTIONS.filter((col) => col.name.toLowerCase().includes(q));
    if (direct.length > 0) return direct;
    return CURATED_COLLECTIONS.slice(0, 4);
  }, [searchQuery, CURATED_COLLECTIONS]);

  const productCount = searchTotal || searchResults.length;
  const categoryCount = matchedCategories.length > 0 ? matchedCategories.length : Math.min(categories.length || 6, 6);
  const collectionCount = matchedCollections.length > 0 ? matchedCollections.length : 4;
  const allCount = productCount;
  const displayedProducts = searchResults.slice(0, 6);

  // Close dropdown on outside click or route navigation
  useEffect(() => {
    setShowSearchDropdown(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Shortcut ⌘K / Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      }
      if (e.key === 'Escape' && showSearchDropdown) {
        setShowSearchDropdown(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchDropdown]);

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

  // A single request contains categories, sections, items and promo banners.
  useEffect(() => {
    let active = true;
    setNavigationError(false);
    getOnce('/categories/navigation')
      .then((response) => {
        if (!active) return;
        const currentCategories = response.data?.data || [];
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
      })
      .catch(() => { if (active) setNavigationError(true); });
    return () => { active = false; };
  }, [navigationRevision, themeConfig?.navigation, themeConfig?.mediaOverrides]);

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

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm font-sans">
      {/* ─── Top announcement bar (Neirah Taupe #60574d) ───────────── */}
      {!isCheckout && <div className="bg-[#60574d] text-white/95 text-[10px] sm:text-xs py-2 px-3 sm:px-4 border-b border-black/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Virtual Appointment */}
          <button
            type="button"
            onClick={() => setAppointmentModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-white transition-colors text-white/80 cursor-pointer"
          >
            <HiOutlineVideoCamera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-normal">Virtual Appointment</span>
          </button>

          <div className="min-w-0 flex-1 px-3 text-center font-medium tracking-wide sm:flex-none sm:px-0">
            {topAnnouncement.isEnabled && topAnnouncement.items?.length ? (() => {
              const items = topAnnouncement.items;
              const current = items[announcementIndex % items.length];
              if (topAnnouncement.displayDirection === 'vertical') {
                return <div key={current?._id || announcementIndex} className="animate-announcement-vertical truncate">{current?.link ? <a href={current.link}>{current.message}</a> : current?.message}</div>;
              }
              return <div className="overflow-hidden whitespace-nowrap"><span key={current?._id || announcementIndex} className="inline-block max-w-full truncate animate-announcement-horizontal">{current?.link ? <a href={current.link}>{current.message}</a> : current?.message}</span></div>;
            })() : storeSettings.companyName}
          </div>

          {phoneNumber && (
            <a
              href={`tel:${phoneHref}`}
              className="hidden sm:flex items-center gap-1.5 hover:text-white transition-colors text-white/80"
            >
              <HiOutlinePhone className="w-3.5 h-3.5" />
              <span className="font-normal">{phoneNumber}</span>
            </a>
          )}
        </div>
      </div>}

      {/* ─── Main Header / Brand & Search Bar (#22201e) ───────────── */}
      <div className="bg-[#22201e] text-white px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div className={`max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6 ${isCheckout ? 'h-16 sm:h-20' : 'h-20 sm:h-24 lg:h-26'}`}>
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
            className="order-first flex items-center leading-none group shrink-0 min-w-0 py-1"
            aria-label={storeSettings.companyName || 'Home'}
          >
            {brandLogo.desktop ? (
              <picture className="flex items-center">
                {brandLogo.mobile && <source media="(max-width: 639px)" srcSet={brandLogo.mobile} />}
                <img
                  src={brandLogo.desktop}
                  alt={storeSettings.companyName || 'Neirah Jewels'}
                  className="h-12 sm:h-16 lg:h-20 w-auto max-w-[170px] sm:max-w-[260px] lg:max-w-[340px] object-contain object-left transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </picture>
            ) : (
              storeSettings.companyName && (
                <span className="font-cinzel text-xl sm:text-3xl lg:text-4xl font-semibold tracking-[0.18em] sm:tracking-[0.2em] text-[#f5f0eb] group-hover:text-amber-100 transition-colors uppercase">
                  {storeSettings.companyName}
                </span>
              )
            )}
          </Link>

          {/* ─── Compact Luxury Search Bar ─── */}
          <div ref={searchContainerRef} className="flex-1 max-w-sm lg:max-w-md mx-3 sm:mx-6 lg:mx-8 hidden md:block relative z-40">
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
                onFocus={() => setShowSearchDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!showSearchDropdown) setShowSearchDropdown(true);
                }}
                className="w-full bg-transparent px-2.5 text-xs sm:text-[13px] text-stone-900 placeholder:text-stone-400 font-normal focus:outline-none"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
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
            {showSearchDropdown && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[780px] lg:w-[890px] xl:w-[980px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-stone-200/90 p-5 z-50 text-left animate-fadeIn">
                {/* Empty / Short query -> Trending Suggestions */}
                {searchQuery.trim().length < 2 ? (
                  <div className="py-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8b6f4e] flex items-center gap-1.5">
                        <span>✨</span> Trending Searches
                      </span>
                      <span className="text-[11px] text-stone-400">Popular fine jewellery</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING_SEARCHES.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleTrendingClick(item)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-700 bg-[#f8f6f0] hover:bg-[#8b6f4e]/15 hover:text-[#8b6f4e] border border-stone-200 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <HiOutlineSearch className="w-3 h-3 text-[#8b6f4e]" />
                          <span>{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
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
                          {displayedProducts.map((item) => {
                            const targetSlug =
                              item.basicInfo?.slug ||
                              item.slug ||
                              (item.title ? item.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : '');
                            const productHref = `/product/${encodeURIComponent(targetSlug)}`;
                            const price = item.pricing?.salePrice || item.pricing?.minPrice || 0;
                            const imgUrl = item.image || (Array.isArray(item.images) && item.images[0]) || '';

                            return (
                              <Link
                                key={item._id}
                                to={productHref}
                                onClick={() => {
                                  setShowSearchDropdown(false);
                                  setSearchQuery('');
                                }}
                                className="group flex flex-col text-left"
                              >
                                {/* Warm Ivory Image Container */}
                                <div className="w-full aspect-square rounded-2xl bg-[#f8f6f0] border border-stone-100 flex items-center justify-center p-2.5 overflow-hidden group-hover:border-[#8b6f4e]/40 transition-all shadow-2xs">
                                  {imgUrl ? (
                                    <img
                                      src={imgUrl}
                                      alt={item.title}
                                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                                      <IoDiamondOutline className="w-8 h-8 text-[#8b6f4e]/40" />
                                    </div>
                                  )}
                                </div>

                                {/* Title */}
                                <p className="text-xs font-semibold text-stone-800 line-clamp-2 mt-2 leading-tight group-hover:text-[#8b6f4e] transition-colors min-h-[2rem]">
                                  {item.title}
                                </p>

                                {/* Price */}
                                <p className="text-xs font-bold text-[#8b6f4e] mt-1">
                                  {price > 0 ? formatProductPrice(price) : ''}
                                </p>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 px-4 text-center">
                          <p className="text-xs text-stone-500">
                            No products found matching &ldquo;<span className="text-stone-900 font-semibold">{searchQuery}</span>&rdquo;.
                          </p>
                          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                            {TRENDING_SEARCHES.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => handleTrendingClick(t)}
                                className="px-3 py-1 rounded-full text-xs bg-[#f8f6f0] hover:bg-[#8b6f4e]/10 text-stone-700 hover:text-[#8b6f4e] border border-stone-200 transition-colors"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
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
                  </>
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
            <Link
              to={user ? "/wishlist" : "/login"}
              state={!user ? { from: '/wishlist' } : undefined}
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

            {/* User Account / Profile */}
            <div className="relative">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#60574d] border border-stone-600 flex items-center justify-center text-white font-medium text-xs">
                      {user.firstName?.[0] || 'U'}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-[#22201e] border border-stone-800 rounded-xl shadow-2xl py-2 z-50 text-xs">
                      <div className="px-4 py-2 border-b border-stone-800">
                        <p className="font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-stone-400 truncate">{user.email}</p>
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
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="p-1.5 sm:p-2 text-stone-300 hover:text-white transition-colors block"
                  title="Sign In"
                >
                  <HiOutlineUser className="w-5 h-5" />
                </Link>
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
        <div className="md:hidden bg-[#22201e] border-b border-stone-800 px-4 py-3 animate-fadeIn">
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
                  {displayedProducts.map((item) => {
                    const targetSlug =
                      item.basicInfo?.slug ||
                      item.slug ||
                      (item.title ? item.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : '');
                    const productHref = `/product/${encodeURIComponent(targetSlug)}`;
                    const price = item.pricing?.salePrice || item.pricing?.minPrice || 0;
                    const imgUrl = item.image || (Array.isArray(item.images) && item.images[0]) || '';
                    return (
                      <Link
                        key={item._id}
                        to={productHref}
                        onClick={() => {
                          setMobileSearchOpen(false);
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        className="w-28 shrink-0 flex flex-col text-left group"
                      >
                        <div className="w-28 h-28 rounded-xl bg-[#f8f6f0] border border-stone-100 flex items-center justify-center p-2 overflow-hidden shadow-2xs">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={item.title}
                              className="w-full h-full object-contain mix-blend-multiply"
                            />
                          ) : (
                            <IoDiamondOutline className="w-6 h-6 text-[#8b6f4e]/40" />
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-stone-800 line-clamp-2 mt-1.5 leading-tight">
                          {item.title}
                        </p>
                        <p className="text-[11px] font-bold text-[#8b6f4e] mt-0.5">
                          {price > 0 ? formatProductPrice(price) : ''}
                        </p>
                      </Link>
                    );
                  })}
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
        <div className="lg:hidden bg-[#22201e] border-b border-stone-800 px-4 sm:px-6 py-5 space-y-5 animate-slide-up">
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
                      {displayedProducts.map((item) => {
                        const targetSlug =
                          item.basicInfo?.slug ||
                          item.slug ||
                          (item.title ? item.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : '');
                        const productHref = `/product/${encodeURIComponent(targetSlug)}`;
                        const price = item.pricing?.salePrice || item.pricing?.minPrice || 0;
                        const imgUrl = item.image || (Array.isArray(item.images) && item.images[0]) || '';
                        return (
                          <Link
                            key={item._id}
                            to={productHref}
                            onClick={() => {
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                              setMobileMenuOpen(false);
                            }}
                            className="w-24 shrink-0 flex flex-col text-left group"
                          >
                            <div className="w-24 h-24 rounded-xl bg-[#f8f6f0] border border-stone-100 flex items-center justify-center p-1.5 overflow-hidden">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={item.title}
                                  className="w-full h-full object-contain mix-blend-multiply"
                                />
                              ) : (
                                <IoDiamondOutline className="w-5 h-5 text-[#8b6f4e]/40" />
                              )}
                            </div>
                            <p className="text-[10px] font-semibold text-stone-800 truncate mt-1">{item.title}</p>
                            <p className="text-[10px] font-bold text-[#8b6f4e]">{price > 0 ? formatProductPrice(price) : ''}</p>
                          </Link>
                        );
                      })}
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
            <Link
              to={user ? "/wishlist" : "/login"}
              state={!user ? { from: '/wishlist' } : undefined}
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
            <Link
              to="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs uppercase font-medium tracking-[0.16em] text-stone-200 hover:text-white py-1.5 border-b border-white/5 flex items-center justify-between"
            >
              <span>The Journal / Blog</span>
            </Link>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="rounded-lg border border-white/15 px-3 py-3 text-center text-xs uppercase tracking-wider text-stone-200 hover:bg-white/5">Shopping Bag ({totalItems || 0})</Link>
              {!user && <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-lg border border-white/15 px-3 py-3 text-center text-xs uppercase tracking-wider text-stone-200 hover:bg-white/5">Sign In</Link>}
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
