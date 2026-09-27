import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import {
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineHeart,
} from 'react-icons/hi';

const navLinks = [
  { title: 'Home', path: '/' },
  { title: 'Shop All', path: '/shop' },
  { title: 'Rings', path: '/shop?category=rings' },
  { title: 'Necklaces', path: '/shop?category=necklaces' },
  { title: 'Earrings', path: '/shop?category=earrings' },
  { title: 'Bracelets', path: '/shop?category=bracelets' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-surface-950/95 backdrop-blur-md border-b border-surface-800 text-white">
      {/* Top announcement bar */}
      <div className="bg-gradient-to-r from-surface-900 via-surface-800 to-surface-900 py-1.5 px-4 text-center text-xs tracking-wider text-gold-300/90 border-b border-surface-800/50">
        <span>✨ COMPLIMENTARY INSURED GLOBAL SHIPPING ON ORDERS OVER $1,000 | 30-DAY RETURNS</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-surface-300 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-amber-700 flex items-center justify-center shadow-lg shadow-gold-500/20 group-hover:scale-105 transition-transform">
              <span className="font-serif text-xl font-bold text-surface-950">J</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-[0.2em] text-white">
                JEWELS
              </span>
              <span className="text-[10px] tracking-[0.3em] text-gold-400 uppercase -mt-1 font-medium">
                Haute Joaillerie
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.title}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide uppercase transition-colors duration-200 relative py-2 ${
                    isActive && link.path === window.location.pathname
                      ? 'text-gold-400 font-semibold'
                      : 'text-surface-300 hover:text-gold-300'
                  }`
                }
              >
                {link.title}
              </NavLink>
            ))}
          </nav>

          {/* Actions: Search, Wishlist, Bag, Auth */}
          <div className="flex items-center space-x-4">
            {/* Search Toggle */}
            <div className="relative">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    placeholder="Search diamonds, rings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="bg-surface-900 border border-gold-500/40 text-white text-xs rounded-full pl-4 pr-9 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400 w-44 sm:w-60 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-2.5 text-surface-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-surface-300 hover:text-gold-300 transition-colors"
                  aria-label="Search"
                >
                  <HiOutlineSearch className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Shopping Bag with live badge */}
            <Link
              to="/cart"
              className="p-2 text-surface-300 hover:text-gold-300 transition-colors relative"
              aria-label="Shopping Bag"
            >
              <HiOutlineShoppingBag className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-gold-500 to-amber-600 text-surface-950 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale-in">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Account / Profile */}
            <div className="relative">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold-400 to-amber-600 flex items-center justify-center text-surface-950 font-bold text-xs">
                      {user.firstName?.[0] || 'U'}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-surface-900 border border-surface-700/80 rounded-xl shadow-2xl py-2 z-50 text-sm">
                      <div className="px-4 py-2 border-b border-surface-800">
                        <p className="font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-surface-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-surface-300 hover:bg-surface-800 hover:text-gold-300"
                      >
                        My Account & Orders
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-surface-800 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-800/80 hover:bg-surface-700 border border-surface-700/60 text-xs font-semibold tracking-wider uppercase text-gold-300 hover:text-white transition-all duration-200"
                >
                  <HiOutlineUser className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-900 border-b border-surface-800 px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.title}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium uppercase tracking-wider text-surface-200 hover:text-gold-400 py-1"
              >
                {link.title}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
