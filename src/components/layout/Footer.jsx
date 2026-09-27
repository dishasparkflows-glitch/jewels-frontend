import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineChatAlt2,
  HiChevronUp,
} from 'react-icons/hi';
import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaPaypal,
  FaGooglePay,
  FaApplePay,
  FaCcVisa,
  FaCcMastercard,
} from 'react-icons/fa';

const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full font-sans select-none">
      {/* ─── 1. MAIN DARK FOOTER SECTION (#1c1917) ─────────────────── */}
      <div className="bg-[#1c1917] text-stone-300 relative overflow-hidden pt-14 pb-8 px-4 sm:px-6 lg:px-8 border-t border-black/20">
        {/* Large Faint Watermark Logo in Background (Screenshot match) */}
        <div className="absolute right-4 md:right-16 top-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.04] text-white flex flex-col items-center">
          <span className="font-cinzel text-7xl md:text-9xl font-semibold tracking-[0.25em]">
            NEIRAH
          </span>
          <span className="text-sm md:text-lg tracking-[0.4em] uppercase font-light mt-1">
            SHINE YOUR WAY
          </span>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 pb-12">
            {/* Column 1: NEIRAH JEWELS */}
            <div>
              <h4 className="text-white text-xs font-semibold uppercase tracking-[0.2em] mb-4">
                NEIRAH JEWELS
              </h4>
              <ul className="space-y-2 text-xs text-stone-400 font-light">
                <li>
                  <Link to="/" className="hover:text-white transition-colors">Our Story</Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">Jewellery Care</Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">Neirah Jewels Blog</Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">Reviews</Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">FAQ's</Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">Shipping Policy</Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">Terms Of Service</Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-virtual-appointment'))}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: CATEGORY */}
            <div>
              <h4 className="text-white text-xs font-semibold uppercase tracking-[0.2em] mb-4">
                CATEGORY
              </h4>
              <ul className="space-y-2 text-xs text-stone-400 font-light">
                <li>
                  <Link to="/shop?category=rings" className="hover:text-white transition-colors">Rings</Link>
                </li>
                <li>
                  <Link to="/shop?category=earrings" className="hover:text-white transition-colors">Earrings</Link>
                </li>
                <li>
                  <Link to="/shop?category=pendant" className="hover:text-white transition-colors">Pendant</Link>
                </li>
                <li>
                  <Link to="/shop?category=bangles-bracelets" className="hover:text-white transition-colors">Bangles & Bracelets</Link>
                </li>
                <li>
                  <Link to="/shop?category=collection" className="hover:text-white transition-colors">Collection</Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact & Store Details */}
            <div className="space-y-3.5 text-xs text-stone-400 font-light">
              {/* Phone */}
              <div className="flex items-center gap-2.5">
                <HiOutlinePhone className="w-4 h-4 text-stone-300 shrink-0" />
                <a href="tel:+918460091955" className="hover:text-white transition-colors">
                  (+91) 8460091955
                </a>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2.5">
                <HiOutlineMail className="w-4 h-4 text-stone-300 shrink-0" />
                <a href="mailto:info@neirah.in" className="hover:text-white transition-colors">
                  info@neirah.in
                </a>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-2.5">
                <HiOutlineChatAlt2 className="w-4 h-4 text-stone-300 shrink-0" />
                <a
                  href="https://wa.me/918460091955?text=Hi%20Neirah%20Jewels,%20I%20would%20like%20to%20inquire%20about%20your%20jewellery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors text-amber-200/90 hover:underline"
                >
                  Chat on WhatsApp
                </a>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2.5 pt-1">
                <HiOutlineLocationMarker className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[11px] text-stone-400">
                  Sanskrut - 1 GH Road G-1, 1/2 Sector 10 plot no.1102 G-1, near Hi-Tech Hospital, Gandhinagar, Gujarat 382008
                </span>
              </div>

              {/* FOLLOW US */}
              <div className="pt-3">
                <span className="block text-[11px] font-semibold text-stone-200 uppercase tracking-widest mb-2.5">
                  FOLLOW US
                </span>
                <div className="flex items-center gap-2.5">
                  <a
                    href="https://facebook.com/neirahjewels"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full border border-stone-600 flex items-center justify-center text-stone-400 hover:text-white hover:border-white transition-colors"
                    aria-label="Facebook"
                  >
                    <FaFacebookF className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://instagram.com/neirahjewelsofficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full border border-stone-600 flex items-center justify-center text-stone-400 hover:text-white hover:border-white transition-colors"
                    aria-label="Instagram"
                  >
                    <FaInstagram className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Policy Links (Screenshot match) */}
          <div className="border-t border-stone-800/80 pt-5 pb-5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] text-stone-400">
              <Link to="/shop" className="hover:text-white transition-colors">Shipping Policy</Link>
              <span className="text-stone-700">•</span>
              <Link to="/profile" className="hover:text-white transition-colors">Track your order</Link>
              <span className="text-stone-700">•</span>
              <Link to="/cart" className="hover:text-white transition-colors">Payment Options</Link>
              <span className="text-stone-700">•</span>
              <Link to="/shop" className="hover:text-white transition-colors">Corporate</Link>
            </div>
          </div>

          {/* Bottom Dark Strip: Brand Logo, Copyright & Payment Badges */}
          <div className="border-t border-stone-800/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-400">
            {/* Logo */}
            <Link to="/" className="flex flex-col items-start leading-none group shrink-0">
              <span className="font-cinzel text-xl font-medium tracking-[0.25em] text-[#f2ede6] group-hover:text-white transition-colors">
                NEIRAH
              </span>
              <span className="text-[7px] tracking-[0.3em] text-[#bcaaa0] uppercase font-light mt-0.5">
                SHINE YOUR WAY
              </span>
            </Link>

            {/* Copyright */}
            <div className="text-[11px] text-stone-400 text-center font-light">
              © {new Date().getFullYear()} Neirah - Shine your way
            </div>

            {/* Payment Gateway Badges (Screenshot match) */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-white text-[#003087] font-bold text-[10px] flex items-center gap-1 shadow-xs" title="PayPal">
                <FaPaypal className="w-3 h-3 text-[#0079C1]" />
                <span className="tracking-tight">PayPal</span>
              </span>
              <span className="px-2 py-1 rounded bg-white text-stone-800 text-[10px] font-semibold flex items-center gap-1 shadow-xs" title="Cards">
                <FaCcVisa className="w-3.5 h-3.5 text-[#1A1F71]" />
                <FaCcMastercard className="w-3.5 h-3.5 text-[#EB001B]" />
              </span>
              <span className="px-2 py-1 rounded bg-white text-stone-800 text-[10px] font-semibold flex items-center gap-1 shadow-xs" title="Google Pay">
                <FaGooglePay className="w-4 h-4 text-stone-800" />
              </span>
              <span className="px-2 py-1 rounded bg-white text-stone-900 text-[10px] font-semibold flex items-center gap-0.5 shadow-xs" title="Apple Pay">
                <FaApplePay className="w-4 h-4 text-black" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. POPULAR JEWELRY DIRECTORY SECTION (Screenshot #f3ede5) ─ */}
      <div className="bg-[#f3ede5] border-t border-stone-300 text-stone-700 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center pb-4 mb-6 border-b border-stone-300/80">
            <h5 className="font-serif text-sm sm:text-base text-stone-800 font-normal tracking-wide">
              Popular Jewelry
            </h5>
          </div>

          {/* 2-Column Grid Directory matching Screenshot 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 text-[11px] leading-relaxed">
            {/* Left Column (Rings, Pendant, Collection) */}
            <div className="space-y-5">
              {/* Rings */}
              <div>
                <h6 className="font-bold text-stone-900 text-xs mb-1.5 uppercase tracking-wider">
                  Rings
                </h6>
                <div className="text-stone-600 space-x-1.5 font-light leading-loose">
                  <Link to="/shop?category=rings" className="hover:text-black transition-colors">Cocktail Rings</Link>
                  <span>|</span>
                  <Link to="/shop?category=rings" className="hover:text-black transition-colors">Three Stone Ring</Link>
                  <span>|</span>
                  <Link to="/shop?category=rings" className="hover:text-black transition-colors">Wedding Band</Link>
                  <span>|</span>
                  <Link to="/shop?category=rings" className="hover:text-black transition-colors">Toi Et Moi Rings</Link>
                  <span>|</span>
                  <Link to="/shop?category=rings" className="hover:text-black transition-colors">Stackable Rings</Link>
                  <span>|</span>
                  <Link to="/shop?category=rings" className="hover:text-black transition-colors">Solitaire Rings</Link>
                  <span>|</span>
                  <Link to="/shop?category=rings" className="hover:text-black transition-colors">Engagement &amp; Anniversary Rings</Link>
                  <span>|</span>
                  <Link to="/shop?category=rings" className="hover:text-black transition-colors">Promise Rings</Link>
                  <span>|</span>
                  <Link to="/shop?category=rings" className="hover:text-black transition-colors">Lab Diamond Rings</Link>
                </div>
              </div>

              <div className="border-b border-stone-300/70" />

              {/* Pendant */}
              <div>
                <h6 className="font-bold text-stone-900 text-xs mb-1.5 uppercase tracking-wider">
                  Pendant
                </h6>
                <div className="text-stone-600 space-x-1.5 font-light leading-loose">
                  <Link to="/shop?category=pendant" className="hover:text-black transition-colors">Delicate Necklaces</Link>
                  <span>|</span>
                  <Link to="/shop?category=pendant" className="hover:text-black transition-colors">Y Necklaces &amp; Lariats</Link>
                  <span>|</span>
                  <Link to="/shop?category=pendant" className="hover:text-black transition-colors">Delicate Pendants</Link>
                  <span>|</span>
                  <Link to="/shop?category=pendant" className="hover:text-black transition-colors">Lab Diamond Necklaces</Link>
                </div>
              </div>

              <div className="border-b border-stone-300/70" />

              {/* Collection */}
              <div>
                <h6 className="font-bold text-stone-900 text-xs mb-1.5 uppercase tracking-wider">
                  Collection
                </h6>
                <div className="text-stone-600 space-x-1.5 font-light leading-loose">
                  <Link to="/shop?category=collection" className="hover:text-black transition-colors">Convertible Jewellery</Link>
                  <span>|</span>
                  <Link to="/shop?category=collection" className="hover:text-black transition-colors">Stackable Jewellery</Link>
                  <span>|</span>
                  <Link to="/shop?category=collection" className="hover:text-black transition-colors">Mother's Day</Link>
                  <span>|</span>
                  <Link to="/shop?category=collection" className="hover:text-black transition-colors">Valentine's day</Link>
                  <span>|</span>
                  <Link to="/shop?category=collection" className="hover:text-black transition-colors">Fast Selling/Best Seller</Link>
                </div>
              </div>
            </div>

            {/* Right Column (Earrings, Bangles & Bracelets, Silver Collection) */}
            <div className="space-y-5">
              {/* Earrings */}
              <div>
                <h6 className="font-bold text-stone-900 text-xs mb-1.5 uppercase tracking-wider">
                  Earrings
                </h6>
                <div className="text-stone-600 space-x-1.5 font-light leading-loose">
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Halo Earrings</Link>
                  <span>|</span>
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Toi et Moi Earrings</Link>
                  <span>|</span>
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Nature Inspired Earrings</Link>
                  <span>|</span>
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Dangle Earrings</Link>
                  <span>|</span>
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Bridal Earrings</Link>
                  <span>|</span>
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Classical Earrings</Link>
                  <span>|</span>
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Drop Earrings</Link>
                  <span>|</span>
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Solitaire Studs</Link>
                  <span>|</span>
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Lab Diamond Earring</Link>
                  <span>|</span>
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Lab Gemstone Earrings</Link>
                </div>
              </div>

              <div className="border-b border-stone-300/70" />

              {/* Bangles & Bracelets */}
              <div>
                <h6 className="font-bold text-stone-900 text-xs mb-1.5 uppercase tracking-wider">
                  Bangles &amp; Bracelets
                </h6>
                <div className="text-stone-600 space-x-1.5 font-light leading-loose">
                  <Link to="/shop?category=bangles-bracelets" className="hover:text-black transition-colors">Delicate Bracelets</Link>
                  <span>|</span>
                  <Link to="/shop?category=bangles-bracelets" className="hover:text-black transition-colors">Chain Bracelets</Link>
                  <span>|</span>
                  <Link to="/shop?category=bangles-bracelets" className="hover:text-black transition-colors">Bangles</Link>
                  <span>|</span>
                  <Link to="/shop?category=bangles-bracelets" className="hover:text-black transition-colors">Tennis Bracelets</Link>
                  <span>|</span>
                  <Link to="/shop?category=bangles-bracelets" className="hover:text-black transition-colors">Lab Diamond Bangles</Link>
                  <span>|</span>
                  <Link to="/shop?category=bangles-bracelets" className="hover:text-black transition-colors">Lab Diamond Bracelets</Link>
                </div>
              </div>

              <div className="border-b border-stone-300/70" />

              {/* Silver Collection */}
              <div>
                <h6 className="font-bold text-stone-900 text-xs mb-1.5 uppercase tracking-wider">
                  Silver Collection
                </h6>
                <div className="text-stone-600 space-x-1.5 font-light leading-loose">
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Rudraksha Mala</Link>
                  <span>|</span>
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Rudraksha Bracelet</Link>
                  <span>|</span>
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Karungali Mala</Link>
                  <span>|</span>
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Karungali Bracelet</Link>
                  <span>|</span>
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Silver Coin</Link>
                  <span>|</span>
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Silver Frame</Link>
                  <span>|</span>
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Silver Other</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. FLOATING ACTION BUTTONS (Scroll-to-top & WhatsApp) ───── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
        {/* Scroll-to-top Button */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-[#1c1917] text-white shadow-xl flex items-center justify-center hover:bg-black transition-all cursor-pointer animate-fade-in border border-white/10"
            aria-label="Scroll to top"
          >
            <HiChevronUp className="w-5 h-5" />
          </button>
        )}

        {/* WhatsApp Floating Button */}
        <a
          href="https://wa.me/918460091955?text=Hi%20Neirah%20Jewels,%20I%20would%20like%20to%20inquire%20about%20your%20jewellery"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-[#25D366] text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
          aria-label="Chat on WhatsApp"
        >
          <FaWhatsapp className="w-7 h-7" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
