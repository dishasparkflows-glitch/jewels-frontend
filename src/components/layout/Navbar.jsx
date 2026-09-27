import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { categoriesAPI } from '../../api/services';
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

const DEFAULT_CATEGORIES = [
  { name: 'RINGS', slug: 'rings' },
  { name: 'EARRINGS', slug: 'earrings' },
  { name: 'PENDANT', slug: 'pendant' },
  { name: 'BANGLES & BRACELETS', slug: 'bangles-bracelets' },
  { name: 'COLLECTION', slug: 'collection' },
  { name: 'SILVER COLLECTION', slug: 'silver-collection' },
];

const PREFERRED_ORDER = [
  'rings',
  'earrings',
  'pendant',
  'bangles & bracelets',
  'collection',
  'silver collection',
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const navigate = useNavigate();

  // Listen for open appointment modal event from anywhere in the app
  useEffect(() => {
    const handleOpen = () => setAppointmentModalOpen(true);
    window.addEventListener('open-virtual-appointment', handleOpen);
    return () => window.removeEventListener('open-virtual-appointment', handleOpen);
  }, []);

  // Call Categories API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesAPI.getAll({ status: 'active' });
        const list = res?.data?.data || res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          // Sort according to Neirah's header ordering
          const sorted = [...list].sort((a, b) => {
            const indexA = PREFERRED_ORDER.indexOf(a.name?.toLowerCase().trim());
            const indexB = PREFERRED_ORDER.indexOf(b.name?.toLowerCase().trim());
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return (a.order || 0) - (b.order || 0);
          });
          setCategories(sorted.map(c => ({
            name: c.name.toUpperCase(),
            slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
          })));
        }
      } catch (err) {
        console.warn('Failed to fetch categories from API, using default navigation:', err);
      }
    };
    fetchCategories();
  }, []);

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
      <div className="bg-[#60574d] text-white/95 text-[11px] sm:text-xs py-2 px-4 border-b border-black/10">
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

          {/* Center: BIS Hallmarked & Certified Jewellery */}
          <div className="text-center font-medium tracking-wide flex items-center justify-center gap-1">
            <span>BIS Hallmarked & Certified Jewellery</span>
            <span className="text-amber-300">✨</span>
          </div>

          {/* Right: Phone number */}
          <a
            href="tel:+918460091955"
            className="flex items-center gap-1.5 hover:text-white transition-colors text-white/80"
          >
            <HiOutlinePhone className="w-3.5 h-3.5" />
            <span className="font-normal">(+91) 8460091955</span>
          </a>
        </div>
      </div>

      {/* ─── Main Header / Brand & Search Bar (#22201e) ───────────── */}
      <div className="bg-[#22201e] text-white px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20 gap-4">
          {/* Mobile hamburger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-300 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo: NEIRAH — SHINE YOUR WAY */}
          <Link to="/" className="flex flex-col items-start leading-none group shrink-0">
            <div className="flex items-center gap-1">
              <span className="font-cinzel text-2xl sm:text-3xl font-medium tracking-[0.25em] text-[#f2ede6] group-hover:text-white transition-colors">
                NEIRAH
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-[0.5px] w-3 bg-[#bcaaa0]" />
              <span className="text-[8px] sm:text-[9px] tracking-[0.3em] text-[#bcaaa0] uppercase font-light">
                SHINE YOUR WAY
              </span>
              <span className="h-[0.5px] w-3 bg-[#bcaaa0]" />
            </div>
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
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="p-2 text-stone-300 hover:text-white transition-colors relative"
              title="My Wishlist"
            >
              <HiOutlineHeart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute 0 top-0.5 right-0.5 bg-black/60 text-stone-200 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
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
                  className="p-2 text-stone-300 hover:text-white transition-colors block"
                  title="Sign In"
                >
                  <HiOutlineUser className="w-5 h-5" />
                </Link>
              )}
            </div>

            {/* Shopping Bag with live badge */}
            <Link
              to="/cart"
              className="p-2 text-stone-300 hover:text-white transition-colors relative"
              title="Shopping Bag"
            >
              <HiOutlineShoppingBag className="w-5 h-5" />
              <span className="absolute top-0.5 right-0.5 bg-black/60 text-stone-200 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {totalItems || 0}
              </span>
            </Link>
          </div>
        </div>

        {/* ─── Desktop Categories Navigation Bar (#22201e) ───────────── */}
        <div className="hidden lg:block border-t border-white/[0.07]">
          <nav className="max-w-7xl mx-auto flex items-center justify-center space-x-8 xl:space-x-12 py-3">
            {categories.map((cat) => (
              <NavLink
                key={cat.slug}
                to={`/shop?category=${cat.slug}`}
                className={({ isActive }) =>
                  `text-[11px] xl:text-xs font-medium tracking-[0.18em] transition-colors duration-200 uppercase py-1 ${
                    isActive
                      ? 'text-amber-200 border-b border-amber-200'
                      : 'text-stone-300 hover:text-white'
                  }`
                }
              >
                {cat.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* ─── Mobile Drawer ───────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#22201e] border-b border-stone-800 px-6 py-6 space-y-5 animate-slide-up">
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
            {categories.map((cat) => (
              <NavLink
                key={cat.slug}
                to={`/shop?category=${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs uppercase font-medium tracking-[0.16em] text-stone-300 hover:text-white py-1.5 border-b border-white/5"
              >
                {cat.name}
              </NavLink>
            ))}
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
          </nav>
        </div>
      )}

      {/* Virtual Appointment Modal (Screenshot 1) */}
      <VirtualAppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
      />
    </header>
  );
};

export default Navbar;
