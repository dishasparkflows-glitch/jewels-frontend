import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { footerAPI } from '../../api/services';
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
  FaGooglePlay,
  FaApple,
  FaPaypal,
  FaGooglePay,
  FaApplePay,
  FaCcVisa,
  FaCcMastercard,
} from 'react-icons/fa';

const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [footerData, setFooterData] = useState({
    phone: '+919726237723',
    email: 'info@neirah.in',
    address: 'Sanskrit - 1 GH Road G-1, 1/2 Sector 3D plot no.1162 G-1, near Hi-Tech hospital, Gandhinagar, Gujarat , India 382008',
    copyright: `© ${new Date().getFullYear()} Neirah · Shine your way`,
    socialLinks: [],
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch footer settings from API (/api/footer-settings)
  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const res = await footerAPI.get();
        const data = res?.data?.data || res?.data;
        if (data) {
          setFooterData((prev) => ({
            ...prev,
            phone: data.phone || prev.phone,
            email: data.email || prev.email,
            address: data.address || prev.address,
            copyright: data.copyright || prev.copyright,
            socialLinks: Array.isArray(data.socialLinks) && data.socialLinks.length > 0 ? data.socialLinks : prev.socialLinks,
          }));
        }
      } catch (err) {
        console.error('Footer API error:', err);
      }
    };
    fetchFooter();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full font-sans select-none">
      {/* ─── 1. MAIN DARK LUXURY FOOTER SECTION (#0d0b09) ─────────────────── */}
      <div className="bg-[#0e0c0a] text-stone-300 relative overflow-hidden pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t border-black/40">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* 4 Columns Top Grid matching Screenshot 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-12">
            {/* Column 1: NEIRAH */}
            <div>
              <h4 className="text-white text-xs font-semibold uppercase tracking-[0.2em] mb-5">
                NEIRAH
              </h4>
              <ul className="space-y-2.5 text-xs text-stone-400 font-light">
                <li>
                  <Link to="/" className="hover:text-white transition-colors">Our Story</Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">Jewellery Care</Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">Neirah Blog</Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">Reviews</Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-white transition-colors">FAQ&apos;s</Link>
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
              <h4 className="text-white text-xs font-semibold uppercase tracking-[0.2em] mb-5">
                CATEGORY
              </h4>
              <ul className="space-y-2.5 text-xs text-stone-400 font-light">
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
                <li>
                  <Link to="/shop?category=silver-collection" className="hover:text-white transition-colors">Silver Collection</Link>
                </li>
              </ul>
            </div>

            {/* Column 3: GET IN TOUCH */}
            <div className="space-y-4 text-xs text-stone-400 font-light">
              <h4 className="text-white text-xs font-semibold uppercase tracking-[0.2em] mb-5">
                GET IN TOUCH
              </h4>

              {/* Phone */}
              <div className="flex items-center gap-2.5">
                <HiOutlinePhone className="w-4 h-4 text-stone-400 shrink-0" />
                <a href={`tel:${footerData.phone}`} className="hover:text-white transition-colors">
                  {footerData.phone}
                </a>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2.5">
                <HiOutlineMail className="w-4 h-4 text-stone-400 shrink-0" />
                <a href={`mailto:${footerData.email}`} className="hover:text-white transition-colors">
                  {footerData.email}
                </a>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-2.5">
                <HiOutlineChatAlt2 className="w-4 h-4 text-stone-400 shrink-0" />
                <a
                  href={`https://wa.me/${footerData.phone.replace(/[^0-9]/g, '')}?text=Hi%20Neirah%20Jewels`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors text-amber-300/90 hover:underline"
                >
                  Chat on WhatsApp
                </a>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2.5 pt-1">
                <HiOutlineLocationMarker className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[11px] text-stone-400">
                  {footerData.address}
                </span>
              </div>

              {/* FOLLOW US */}
              <div className="pt-2">
                <span className="block text-[11px] font-semibold text-stone-200 uppercase tracking-widest mb-2.5">
                  FOLLOW US
                </span>
                <div className="flex items-center gap-2.5">
                  <a
                    href="https://facebook.com/neirahjewels"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full border border-stone-700 flex items-center justify-center text-stone-300 hover:text-white hover:border-white transition-colors"
                    aria-label="Facebook"
                  >
                    <FaFacebookF className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://instagram.com/neirahjewelsofficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full border border-stone-700 flex items-center justify-center text-stone-300 hover:text-white hover:border-white transition-colors"
                    aria-label="Instagram"
                  >
                    <FaInstagram className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Column 4: DOWNLOAD OUR MOBILE APP (Screenshot 2 Match) */}
            <div>
              <h4 className="text-white text-xs font-semibold uppercase tracking-[0.2em] mb-5">
                DOWNLOAD OUR MOBILE APP
              </h4>
              <div className="space-y-3">
                {/* Google Play Button */}
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-stone-700 bg-black/60 hover:bg-black/90 hover:border-stone-500 transition-all text-white w-48 shadow-sm group"
                >
                  <FaGooglePlay className="w-5 h-5 text-stone-300 group-hover:text-white transition-colors shrink-0" />
                  <div className="text-left leading-tight">
                    <span className="block text-[9px] uppercase tracking-wider text-stone-400">
                      GET IT ON
                    </span>
                    <span className="block text-xs font-bold text-white tracking-wide">
                      Google Play
                    </span>
                  </div>
                </a>

                {/* App Store Button */}
                <a
                  href="https://www.apple.com/app-store/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-stone-700 bg-black/60 hover:bg-black/90 hover:border-stone-500 transition-all text-white w-48 shadow-sm group"
                >
                  <FaApple className="w-6 h-6 text-stone-300 group-hover:text-white transition-colors shrink-0" />
                  <div className="text-left leading-tight">
                    <span className="block text-[8px] uppercase tracking-wider text-stone-400">
                      DOWNLOAD ON THE
                    </span>
                    <span className="block text-xs font-bold text-white tracking-wide">
                      App Store
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Secondary Policy Links (Screenshot 2 match) */}
          <div className="border-t border-stone-800/80 pt-6 pb-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] text-stone-400 font-light">
              <Link to="/shop" className="hover:text-white transition-colors">Resizing Policy</Link>
              <Link to="/profile" className="hover:text-white transition-colors">Track your order</Link>
              <Link to="/cart" className="hover:text-white transition-colors">Payment Options</Link>
              <Link to="/shop" className="hover:text-white transition-colors">Corporate</Link>
            </div>
          </div>

          {/* Bottom Dark Strip: Brand Logo, Copyright & Payment Badges */}
          <div className="border-t border-stone-800/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-400">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <span className="font-cinzel text-xl font-medium tracking-[0.25em] text-[#f2ede6] group-hover:text-white transition-colors">
                NEIRAH
              </span>
            </Link>

            {/* Copyright */}
            <div className="text-[11px] text-stone-400 text-center font-light">
              © {currentYear} Neirah · Shine your way
            </div>

            {/* Payment Gateway Badges (Screenshot match) */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-white text-[#003087] font-bold text-[10px] flex items-center gap-1 shadow-xs" title="PayPal">
                <FaPaypal className="w-3.5 h-3.5 text-[#0079C1]" />
                <span className="tracking-tight font-sans">PayPal</span>
              </span>
              <span className="px-2 py-1 rounded bg-white text-stone-800 text-[10px] font-semibold flex items-center gap-1 shadow-xs" title="Visa & Mastercard">
                <FaCcVisa className="w-4 h-4 text-[#1A1F71]" />
                <FaCcMastercard className="w-4 h-4 text-[#EB001B]" />
              </span>
              <span className="px-2.5 py-1 rounded bg-white text-stone-800 text-[10px] font-semibold flex items-center gap-1 shadow-xs" title="Google Pay">
                <FaGooglePay className="w-5 h-5 text-stone-800" />
              </span>
              <span className="px-2.5 py-1 rounded bg-white text-stone-900 text-[10px] font-semibold flex items-center gap-0.5 shadow-xs" title="Apple Pay">
                <FaApplePay className="w-5 h-5 text-black" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. POPULAR JEWELRY DIRECTORY SECTION (Screenshot 2 Match #f3ede5) ─ */}
      <div className="bg-[#f3ede5] border-t border-stone-300 text-stone-700 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center pb-5 mb-8 border-b border-stone-300/80">
            <h5 className="font-serif text-base sm:text-lg text-stone-900 font-medium tracking-wide">
              Popular Jewelry
            </h5>
          </div>

          {/* 2-Column Grid Directory matching Screenshot 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 text-[11px] leading-relaxed">
            {/* Left Column (Rings, Pendant, Collection) */}
            <div className="space-y-6">
              {/* Rings */}
              <div>
                <h6 className="font-bold text-stone-900 text-xs mb-1.5 uppercase tracking-wider">
                  Rings
                </h6>
                <div className="text-stone-600 space-x-2 font-light leading-loose">
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
                  <Link to="/shop?category=rings" className="hover:text-black transition-colors">Engagement & Anniversary Rings</Link>
                  <span>|</span>
                  <Link to="/shop?category=rings" className="hover:text-black transition-colors">Promise Rings</Link>
                  <span>|</span>
                  <Link to="/shop?category=rings" className="hover:text-black transition-colors">Lab Diamond Rings</Link>
                </div>
              </div>

              {/* Pendant */}
              <div>
                <h6 className="font-bold text-stone-900 text-xs mb-1.5 uppercase tracking-wider">
                  Pendant
                </h6>
                <div className="text-stone-600 space-x-2 font-light leading-loose">
                  <Link to="/shop?category=pendant" className="hover:text-black transition-colors">Delicate Necklaces</Link>
                  <span>|</span>
                  <Link to="/shop?category=pendant" className="hover:text-black transition-colors">Y-Necklaces & Lariats</Link>
                  <span>|</span>
                  <Link to="/shop?category=pendant" className="hover:text-black transition-colors">Delicate Pendants</Link>
                  <span>|</span>
                  <Link to="/shop?category=pendant" className="hover:text-black transition-colors">Lab Diamond Necklaces</Link>
                </div>
              </div>

              {/* Collection */}
              <div>
                <h6 className="font-bold text-stone-900 text-xs mb-1.5 uppercase tracking-wider">
                  Collection
                </h6>
                <div className="text-stone-600 space-x-2 font-light leading-loose">
                  <Link to="/shop?category=collection" className="hover:text-black transition-colors">Convertible Jewellery</Link>
                  <span>|</span>
                  <Link to="/shop?category=collection" className="hover:text-black transition-colors">Stackable Jewellery</Link>
                  <span>|</span>
                  <Link to="/shop?category=collection" className="hover:text-black transition-colors">Mother&apos;s Day</Link>
                  <span>|</span>
                  <Link to="/shop?category=collection" className="hover:text-black transition-colors">Valentine&apos;s day</Link>
                  <span>|</span>
                  <Link to="/shop?category=collection" className="hover:text-black transition-colors">Fast Selling/Best Seller</Link>
                </div>
              </div>
            </div>

            {/* Right Column (Earrings, Bangles & Bracelets, Silver Collection) */}
            <div className="space-y-6">
              {/* Earrings */}
              <div>
                <h6 className="font-bold text-stone-900 text-xs mb-1.5 uppercase tracking-wider">
                  Earrings
                </h6>
                <div className="text-stone-600 space-x-2 font-light leading-loose">
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
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Hoop Earrings</Link>
                  <span>|</span>
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Solitaire Studs</Link>
                  <span>|</span>
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Lab Diamond Earring</Link>
                  <span>|</span>
                  <Link to="/shop?category=earrings" className="hover:text-black transition-colors">Lab Gemstone Earrings</Link>
                </div>
              </div>

              {/* Bangles & Bracelets */}
              <div>
                <h6 className="font-bold text-stone-900 text-xs mb-1.5 uppercase tracking-wider">
                  Bangles & Bracelets
                </h6>
                <div className="text-stone-600 space-x-2 font-light leading-loose">
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

              {/* Silver Collection */}
              <div>
                <h6 className="font-bold text-stone-900 text-xs mb-1.5 uppercase tracking-wider">
                  Silver Collection
                </h6>
                <div className="text-stone-600 space-x-2 font-light leading-loose">
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Rudraksha Mala</Link>
                  <span>|</span>
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Rudraksha Bracelet</Link>
                  <span>|</span>
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Karungali Mala</Link>
                  <span>|</span>
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Karungali Bracelet</Link>
                  <span>|</span>
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Gift Coins</Link>
                  <span>|</span>
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">Precious Art</Link>
                  <span>|</span>
                  <Link to="/shop?category=silver-collection" className="hover:text-black transition-colors">More Gift Articles</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-[#1c1917] border border-amber-600/30 text-amber-300/90 shadow-xl flex items-center justify-center hover:bg-black transition-all cursor-pointer group hover:scale-105 active:scale-95"
          aria-label="Scroll to top"
        >
          <HiChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}
    </footer>
  );
};

export default Footer;
