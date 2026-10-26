import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOnce } from '../../api/axios';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import {
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineChatAlt2,
  HiChevronUp,
} from 'react-icons/hi';
import { FaFacebookF, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [footerData, setFooterData] = useState({
    phone: '+919726237723',
    email: 'info@neirah.in',
    address: 'Sanskrut - 1 GH Road G-1. 1/2 Sector 3D plot no.1182 G-1, near Hi-Tech hospital, Gandhinagar, Gujarat 382006',
    copyright: `© ${new Date().getFullYear()} Neirah · Shine your way`,
    socialLinks: [],
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { footerSettings } = useStoreSettings();

  // Populate footer settings from common StoreSettingsContext (no separate API call)
  useEffect(() => {
    if (footerSettings && Object.keys(footerSettings).length > 0) {
      setFooterData((prev) => ({
        ...prev,
        phone: footerSettings.phone || footerSettings.mobile || prev.phone,
        email: footerSettings.email || prev.email,
        address: footerSettings.address || prev.address,
        copyright: footerSettings.copyright || prev.copyright,
        socialLinks: Array.isArray(footerSettings.socialLinks) && footerSettings.socialLinks.length > 0 ? footerSettings.socialLinks : prev.socialLinks,
      }));
    }
  }, [footerSettings]);

  // Fetch categories & navigation items from API - shared cache with Navbar
  useEffect(() => {
    let active = true;
    getOnce('/categories/navigation')
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : (res?.data?.data?.items || []);
        if (Array.isArray(list)) {
          setCategories(list);
        }
      })
      .catch((err) => {
        console.error('Failed to load navigation categories in footer:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full font-sans select-none">
      {/* ─── 1. MAIN DARK LUXURY FOOTER SECTION (Matches neirah.in exactly) ───────────── */}
      <div className="bg-[#0F0D0B] text-[#C8B89E] pt-10 pb-8 px-4 relative overflow-hidden">
        {/* Background Stylized Watermark (Matches neirah.in) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none">
          <img
            src="/images/logo.svg"
            alt=""
            className="w-[600px] h-[600px] grayscale brightness-0 invert"
          />
        </div>

        <div className="max-w-[1320px] mx-auto px-4 md:px-8 relative z-10">
          {/* 5-Column Grid exactly matching neirah.in */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-8 mb-16">
            {/* Column 1: NEIRAH */}
            <div>
              <h4 className="text-[16px] md:text-[17px] font-bold tracking-[0.1em] mb-6 uppercase text-[#F3EAD8]">
                NEIRAH
              </h4>
              <ul className="space-y-3.5">
                {[
                  { name: 'Our Story', path: '/our-story' },
                  { name: 'Jewellery Care', path: '/jewellery-care' },
                  { name: 'Neirah Blog', path: '/blog' },
                  { name: 'Reviews', path: '/reviews' },
                  { name: "FAQ's", path: '/faqs' },
                  { name: 'Track Your Order', path: '/track-your-order' },
                  { name: 'Corporate', path: '/corporate' },
                  { name: 'Contact Us', path: '/contact-us', isContact: true },
                ].map((item) => (
                  <li key={item.name}>
                    {item.isContact ? (
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-virtual-appointment'))}
                        className="text-[14px] sm:text-[15px] opacity-85 hover:opacity-100 hover:underline transition-all text-[#C8B89E] text-left cursor-pointer"
                      >
                        {item.name}
                      </button>
                    ) : (
                      <Link
                        to={item.path}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-[14px] sm:text-[15px] opacity-85 hover:opacity-100 hover:underline transition-all text-[#C8B89E]"
                      >
                        {item.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: OUR POLICIES (Matches neirah.in) */}
            <div>
              <h4 className="text-[16px] md:text-[17px] font-bold tracking-[0.1em] mb-6 uppercase text-[#F3EAD8]">
                OUR POLICIES
              </h4>
              <ul className="space-y-3.5">
                {[
                  { name: 'Shipping Policy', path: '/shipping-policy' },
                  { name: 'Return & Refund Policy', path: '/return-refund-policy' },
                  { name: 'Cancellation Policy', path: '/cancellation-policy' },
                  { name: 'Terms & Conditions', path: '/terms-conditions' },
                  { name: 'Privacy Policy', path: '/privacy-policy' },
                  { name: 'Pricing Policy', path: '/pricing-policy' },
                  { name: 'Payment Options', path: '/payment-options' },
                  { name: 'Exchange Policy', path: '/exchange-policy' },
                  { name: 'BIS Compliance & Certification', path: '/bis-compliance-certification' },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-[14px] sm:text-[15px] opacity-85 hover:opacity-100 hover:underline transition-all text-[#C8B89E]"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: CATEGORY */}
            <div>
              <h4 className="text-[16px] md:text-[17px] font-bold tracking-[0.1em] mb-6 uppercase text-[#F3EAD8]">
                CATEGORY
              </h4>
              <ul className="space-y-3.5">
                {categories.length > 0 ? (
                  categories.map((cat) => {
                    const nameLower = (cat.name || cat.title || '').toLowerCase();
                    const isSilver = nameLower.includes('silver');
                    const isDiamond = nameLower.includes('diamond');
                    const isCustom = nameLower.includes('custom');
                    const path = isCustom
                      ? '/shop'
                      : isSilver
                      ? '/shop?category=silver-collection'
                      : isDiamond
                      ? '/shop?category=diamond'
                      : `/shop?category=${encodeURIComponent(cat.slug || cat._id)}`;
                    return (
                      <li key={cat._id || cat.name}>
                        <Link
                          to={path}
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="text-[14px] sm:text-[15px] opacity-85 hover:opacity-100 hover:underline transition-all text-[#C8B89E]"
                        >
                          {cat.name || cat.title}
                        </Link>
                      </li>
                    );
                  })
                ) : (
                  [
                    { name: 'Rings', path: '/shop?category=rings' },
                    { name: 'Earrings', path: '/shop?category=earrings' },
                    { name: 'Pendant', path: '/shop?category=pendant' },
                    { name: 'Bangles & Bracelets', path: '/shop?category=bangles-bracelets' },
                    { name: 'Collection', path: '/shop' },
                    { name: 'Silver Collection', path: '/shop?category=silver-collection' },
                  ].map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-[14px] sm:text-[15px] opacity-85 hover:opacity-100 hover:underline transition-all text-[#C8B89E]"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Column 4: GET IN TOUCH */}
            <div>
              <h4 className="text-[16px] md:text-[17px] font-bold tracking-[0.1em] mb-6 uppercase text-[#F3EAD8]">
                GET IN TOUCH
              </h4>
              <div className="space-y-4">
                {/* Phone */}
                <a
                  href={`tel:${footerData.phone}`}
                  className="flex items-center gap-3 text-[14px] sm:text-[15px] opacity-90 hover:opacity-100 group transition-all text-[#C8B89E]"
                >
                  <HiOutlinePhone className="w-5 h-5 border border-white/20 p-1 rounded-sm group-hover:bg-white group-hover:text-[#8B6B42] shrink-0 transition-colors" />
                  <span>{footerData.phone}</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${footerData.email}`}
                  className="flex items-center gap-3 text-[14px] sm:text-[15px] opacity-90 hover:opacity-100 group transition-all underline text-[#C8B89E]"
                >
                  <HiOutlineMail className="w-5 h-5 border border-white/20 p-1 rounded-sm group-hover:bg-white group-hover:text-[#8B6B42] shrink-0 transition-colors" />
                  <span>{footerData.email}</span>
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${footerData.phone.replace(/[^0-9]/g, '')}?text=Hi%20Neirah%20Jewels`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[14px] sm:text-[15px] opacity-90 hover:opacity-100 group transition-all underline text-[#C8B89E]"
                >
                  <HiOutlineChatAlt2 className="w-5 h-5 border border-white/20 p-1 rounded-sm group-hover:bg-white group-hover:text-[#8B6B42] shrink-0 transition-colors" />
                  <span>Chat on WhatsApp</span>
                </a>

                {/* Address */}
                <div className="flex gap-3 text-[13px] sm:text-[14px] opacity-85 leading-relaxed group text-[#C8B89E]">
                  <HiOutlineLocationMarker className="w-5 h-5 shrink-0 border border-white/20 p-1 rounded-sm mt-0.5" />
                  <div className="whitespace-pre-line leading-relaxed">{footerData.address}</div>
                </div>
              </div>

              {/* FOLLOW US */}
              <div className="mt-6">
                <h4 className="text-[14px] sm:text-[15px] font-bold tracking-[0.1em] mb-3 uppercase text-[#F3EAD8]">
                  FOLLOW US
                </h4>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.facebook.com/share/1Cosh9cg8h/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-[#8B6B42]/40 rounded-full hover:bg-[#8B6B42] hover:text-[#F0E8DA] transition-all flex items-center justify-center text-[#C8B89E]"
                    aria-label="Facebook"
                  >
                    <FaFacebookF className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://www.instagram.com/neirah.officials?igsh=MWRrcDE3YnlhaTd6eg%3D%3D&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-[#8B6B42]/40 rounded-full hover:bg-[#8B6B42] hover:text-[#F0E8DA] transition-all flex items-center justify-center text-[#C8B89E]"
                    aria-label="Instagram"
                  >
                    <FaInstagram className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Column 5: DOWNLOAD OUR MOBILE APP (Exact buttons matching neirah.in) */}
            <div>
              <h4 className="text-[16px] md:text-[17px] font-bold tracking-[0.1em] mb-6 uppercase text-[#F3EAD8]">
                DOWNLOAD OUR MOBILE APP
              </h4>
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
                {/* Google Play */}
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3.5 py-2.5 bg-black border border-gray-600 hover:border-gray-400 rounded-lg transition-all text-left cursor-pointer shrink-0"
                >
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 512 512">
                    <path fill="#410593" d="M92.1 40.7L276.8 225.5 92.1 410.3c-4.4-4.8-7.1-11.2-7.1-18.4V60.1c0-7.2 2.7-13.6 7.1-19.4z" />
                    <path fill="#00e5ff" d="M366.1 176.2L120.2 34.2c-7.9-4.5-17.3-4.3-24.9.4l181.5 181.5 89.3-40z" />
                    <path fill="#ff1053" d="M95.3 477.4c7.6 4.7 17 .4 24.9-4.1l245.9-142-89.3-39.9L95.3 477.4z" />
                    <path fill="#ffc200" d="M428.4 235.1l-62.3-36-79.3 56.9 79.3 56.9 62.3-36c11.6-6.7 18.6-18.8 18.6-32s-7-25.2-18.6-31.8z" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-300 font-medium uppercase leading-tight">GET IT ON</span>
                    <span className="text-[14px] text-white font-bold leading-tight">Google Play</span>
                  </div>
                </a>

                {/* App Store */}
                <a
                  href="https://www.apple.com/app-store/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3.5 py-2.5 bg-black border border-gray-600 hover:border-gray-400 rounded-lg transition-all text-left cursor-pointer shrink-0"
                >
                  <svg className="w-6 h-6 fill-current text-white shrink-0" viewBox="0 0 384 512">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-13.7 69.5-34.3z" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-300 font-medium uppercase leading-tight">DOWNLOAD ON THE</span>
                    <span className="text-[14px] text-white font-bold leading-tight">App Store</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Dark Strip: Brand Logo, Copyright & Payment Badges (Matches neirah.in) */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-white/10">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img
                src="/images/logo.svg"
                alt="Neirah"
                className="h-12 brightness-0 invert opacity-90"
              />
            </div>

            {/* Copyright */}
            <div className="text-[13px] sm:text-[14px] text-[#C8B89E] opacity-90 text-center">
              {footerData.copyright || `© ${currentYear} Neirah · Shine your way`}
            </div>

            {/* Payment Gateway Badges (Exact icons matching neirah.in) */}
            <div className="flex items-center gap-2">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                className="h-4 md:h-6 bg-white px-2 py-1 rounded shadow-xs"
                alt="PayPal"
              />
              <img
                src="/images/visa.svg"
                className="h-4 md:h-6 bg-white px-2 py-1 rounded shadow-xs"
                alt="Visa"
              />
              <img
                src="/images/mastercard.svg"
                className="h-4 md:h-6 bg-white px-2 py-1 rounded shadow-xs"
                alt="Mastercard"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Pay_Logo_%282020%29.svg"
                className="h-4 md:h-6 bg-white px-2 py-1 rounded shadow-xs"
                alt="GPay"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg"
                className="h-4 md:h-6 bg-white px-2 py-1 rounded shadow-xs"
                alt="ApplePay"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. POPULAR JEWELRY DIRECTORY SECTION (Matches neirah.in) ─ */}
      {categories.length > 0 && (
        <div className="bg-white border-t border-gray-100">
          <div className="bg-[#F0E8D8] py-4 mb-10">
            <h2 className="text-[17px] sm:text-[19px] font-semibold text-center text-gray-800 tracking-wider">
              Popular Jewelry
            </h2>
          </div>
          <div className="w-full px-4 md:px-10 pb-20">
            {(() => {
              const leftCategories = categories.filter((_, idx) => idx % 2 === 0);
              const rightCategories = categories.filter((_, idx) => idx % 2 !== 0);

              const renderCategoryBlock = (cat) => {
                const nameLower = (cat.name || '').toLowerCase();
                const isSilver = nameLower.includes('silver');

                // Extract items from menuSections
                const items = [];
                const seen = new Set();
                (cat.menuSections || []).forEach((section) => {
                  (section.menuItems || []).forEach((item) => {
                    if (item?._id && !seen.has(String(item._id))) {
                      seen.add(String(item._id));
                      items.push(item);
                    }
                  });
                });

                return (
                  <div key={cat._id} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                    <h4 className="text-[15px] sm:text-[16px] font-semibold text-gray-900 mb-3">
                      {cat.name}
                    </h4>
                    <div className="flex flex-wrap items-center text-[13px] sm:text-[14px] leading-relaxed text-gray-600">
                      {items.length > 0 ? (
                        items.map((item, idx) => {
                          const link = isSilver
                            ? `/shop?category=silver-collection&menuItem=${item._id}`
                            : `/shop?category=${encodeURIComponent(cat.slug || cat._id)}&menuItem=${item._id}`;
                          return (
                            <span key={item._id || idx} className="inline-flex items-center">
                              <Link
                                to={link}
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="hover:text-[#8B6B42] transition-colors"
                              >
                                {item.name || item.title}
                              </Link>
                              {idx < items.length - 1 && (
                                <span className="text-gray-300 mx-2 select-none">|</span>
                              )}
                            </span>
                          );
                        })
                      ) : (
                        <Link
                          to={`/shop?category=${encodeURIComponent(cat.slug || cat._id)}`}
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="hover:text-[#8B6B42] transition-colors"
                        >
                          Explore {cat.name}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto gap-x-16 gap-y-10 relative">
                  <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2" />
                  <div className="space-y-10 md:pr-8">
                    {leftCategories.map(renderCategoryBlock)}
                  </div>
                  <div className="space-y-10 md:pl-8">
                    {rightCategories.map(renderCategoryBlock)}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1c1917] border border-amber-600/30 text-amber-300/90 shadow-xl flex items-center justify-center hover:bg-black transition-all cursor-pointer group hover:scale-105 active:scale-95"
          aria-label="Scroll to top"
        >
          <HiChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}
    </footer>
  );
};

export default Footer;
