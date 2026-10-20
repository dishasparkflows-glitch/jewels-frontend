import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import MegaMenuNav from './MegaMenuNav';
import { getOnce } from '../../api/axios';
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

import VirtualAppointmentModal from '../common/VirtualAppointmentModal';
import CartDrawer from '../store/CartDrawer';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const [categories, setCategories] = useState([]);
  const [navigationError, setNavigationError] = useState(false);
  const [navigationRevision, setNavigationRevision] = useState(0);
  const { settings: storeSettings } = useStoreSettings();
  const [topAnnouncement, setTopAnnouncement] = useState({ isEnabled: false, displayDirection: 'horizontal', autoplayInterval: 4000, items: [] });
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const brandLogo = {
    desktop: getImageUrl(storeSettings.logoImage?.url),
    mobile: getImageUrl(storeSettings.mobileLogoImage?.url),
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';
  const phoneNumber = String(storeSettings.mobileNumber || '').trim();
  const phoneHref = phoneNumber.replace(/[^\d+]/g, '');

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
      .then((response) => { if (active) setCategories(response.data?.data || []); })
      .catch(() => { if (active) setNavigationError(true); });
    return () => { active = false; };
  }, [navigationRevision]);

  useEffect(() => {
    let active = true;
    getOnce('/top-announcements/public')
      .then((response) => { if (active) setTopAnnouncement(response.data?.data || { isEnabled: false, items: [] }); })
      .catch(() => { if (active) setTopAnnouncement({ isEnabled: false, items: [] }); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const items = topAnnouncement.items || [];
    if (items.length <= 1) return undefined;
    const interval = window.setInterval(() => {
      setAnnouncementIndex((index) => (index + 1) % items.length);
    }, topAnnouncement.autoplayInterval || 4000);
    return () => window.clearInterval(interval);
  }, [topAnnouncement.items, topAnnouncement.autoplayInterval]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
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
        <div className={`max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 ${isCheckout ? 'h-14 sm:h-16' : 'h-16 sm:h-20'}`}>
          {/* Mobile hamburger */}
          <div className="order-last flex items-center lg:order-none lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-300 hover:text-white transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>
          </div>

          <Link to="/" className="order-first flex items-center leading-none group shrink-0 min-w-0" aria-label={storeSettings.companyName || 'Home'}>
            {brandLogo.desktop ? (
              <picture>
                {brandLogo.mobile && <source media="(max-width: 639px)" srcSet={brandLogo.mobile} />}
                <img src={brandLogo.desktop} alt={storeSettings.companyName || ''} className="h-9 sm:h-12 max-w-[120px] sm:max-w-[210px] object-contain" />
              </picture>
            ) : (
              storeSettings.companyName && <span className="font-cinzel text-lg sm:text-3xl font-medium tracking-[0.16em] sm:tracking-[0.2em] text-[#f2ede6] group-hover:text-white transition-colors">{storeSettings.companyName}</span>
            )}
          </Link>

          {/* Center Search Input */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4 hidden md:block">
            <div className="relative">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search jewellery, diamonds and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.08] border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-200/40 focus:bg-white/[0.12] transition-all"
              />
            </div>
          </form>

          {/* Actions: Wishlist, Profile, Shopping Bag */}
          <div className="order-2 flex items-center space-x-1 sm:space-x-4">
            {isCheckout && <span className="hidden items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1.5 text-[11px] text-white sm:inline-flex"><span aria-hidden="true">🇮🇳</span> INR <span aria-hidden="true">⌄</span></span>}
            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="p-1.5 sm:p-2 text-stone-300 hover:text-white transition-colors relative"
              title="My Wishlist"
            >
              <HiOutlineHeart className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#a9865c] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
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
              <span className="absolute top-0 right-0 bg-[#a9865c] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {totalItems || 0}
              </span>
            </button>
          </div>
        </div>

        <div className="hidden lg:block">
          <MegaMenuNav categories={categories} error={navigationError} onRetry={() => setNavigationRevision((value) => value + 1)} />
        </div>
      </div>

      {/* ─── Mobile Drawer ───────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#22201e] border-b border-stone-800 px-4 sm:px-6 py-5 space-y-5 animate-slide-up">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative w-full">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search jewellery, diamonds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.08] border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-stone-400 focus:outline-none"
            />
          </form>

          {/* Categories List */}
          <nav className="flex flex-col space-y-3 pt-2">
            <MegaMenuNav categories={categories} mobile onNavigate={() => setMobileMenuOpen(false)} error={navigationError} onRetry={() => setNavigationRevision((value) => value + 1)} />
            <Link
              to="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs uppercase font-medium tracking-[0.16em] text-amber-200 hover:text-white py-1.5 border-b border-white/5 flex items-center justify-between"
            >
              <span>My Wishlist</span>
              {wishlistCount > 0 && (
                <span className="bg-[#60574d] text-white text-[10px] px-2 py-0.5 rounded-full">
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
