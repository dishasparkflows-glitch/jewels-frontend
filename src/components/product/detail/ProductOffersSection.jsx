import { useState } from 'react';
import PropTypes from 'prop-types';
import { HiOutlineTag, HiChevronDown, HiOutlineDuplicate } from 'react-icons/hi';
import { FaCheck } from 'react-icons/fa6';
import toast from 'react-hot-toast';

/**
 * Luxury ticket-styled Available Offers accordion with coupon copying
 */
export default function ProductOffersSection({ coupons = [], defaultOpen = true }) {
  const [offersOpen, setOffersOpen] = useState(defaultOpen);
  const [copiedCode, setCopiedCode] = useState(null);

  if (!coupons || coupons.length === 0) return null;

  const handleCopyCoupon = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success(`Coupon code "${code}" copied to clipboard!`);
      setTimeout(() => setCopiedCode(null), 3000);
    }).catch(() => {
      toast.error('Failed to copy coupon code');
    });
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#E8DEC9] bg-gradient-to-br from-[#FCFAF6] via-[#FDFCF9] to-[#F7F2E8] p-2.5 sm:p-3 shadow-[0_2px_10px_rgba(139,111,78,0.05)] transition-all">
      {/* Celestial 8-Point Diamond Starburst Watermark */}
      <svg
        className="absolute -top-2 -right-2 w-14 h-14 text-[#C19B65]/30 pointer-events-none select-none"
        viewBox="0 0 100 100"
        fill="none"
      >
        <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <polygon
          points="50,26 55,45 74,50 55,55 50,74 45,55 26,50 45,45"
          fill="currentColor"
          fillOpacity="0.28"
        />
        <circle cx="50" cy="50" r="2.5" fill="currentColor" fillOpacity="0.7" />
      </svg>

      {/* Header Row: Tag Icon + Title + Toggle */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setOffersOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className="w-5 h-5 rounded-full border flex items-center justify-center shadow-2xs"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 10%, #ffffff)',
              borderColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 22%, #ffffff)',
              color: 'var(--btn-primary-bg, #8c6536)',
            }}
          >
            <HiOutlineTag className="w-3 h-3 -rotate-12 stroke-[1.8]" />
          </div>
          <span
            className="text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[0.14em] font-poppins"
            style={{ color: 'var(--btn-primary-bg, #8c6536)' }}
          >
            AVAILABLE OFFERS
          </span>
          {coupons.length > 1 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-[8.5px] font-bold"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8c6536) 12%, #ffffff)',
                color: 'var(--btn-primary-bg, #8c6536)',
              }}
            >
              {coupons.length} Offers
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" style={{ color: 'var(--btn-primary-bg, #8c6536)' }}>
          <span className="text-[10px] font-medium text-stone-500 hidden sm:inline">
            {offersOpen ? 'Hide' : 'View Offers'}
          </span>
          <div className="w-4 h-4 rounded flex items-center justify-center transition-colors">
            <HiChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                offersOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Offers List */}
      <div className={`accordion-collapse ${offersOpen ? 'open' : ''}`}>
        <div className="accordion-collapse-inner">
          <div className="mt-2 sm:mt-2.5 space-y-1.5 sm:space-y-2">
            {coupons.map((c, idx) => {
              const code = c.coupon?.code || c.code || '';
              if (!code) return null;
              const isPercentage = c.discount?.type === 'Percentage';
              const discountVal = Number(c.discount?.value || 0);
              const discountText = isPercentage
                ? `${discountVal}% Off`
                : `₹${discountVal.toLocaleString('en-IN')} Off`;

              const isCopied = copiedCode === code;

              return (
                <div
                  key={c._id || code || idx}
                  className="relative group bg-white/95 hover:bg-white rounded-lg border border-[#EDE3D3] hover:border-[#8b6f4e]/50 px-2.5 py-2 transition-all duration-200 shadow-2xs hover:shadow-xs"
                >
                  {/* Perforated Voucher Ticket Notches (Left & Right) */}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#f8f3ea] border-r border-[#EDE3D3] pointer-events-none" />
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#f8f3ea] border-l border-[#EDE3D3] pointer-events-none" />

                  <div className="flex items-center justify-between gap-2.5 px-0.5">
                    {/* Left: Code badge + Discount value + optional Min Order / Description */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Dashed Code Badge */}
                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(code)}
                          className="group/badge relative inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-[#C5A880] bg-[#FAF5EE] hover:bg-[#F3EAD9] text-[#785934] font-mono font-bold text-[11px] tracking-wider cursor-pointer hover:border-[#8b6f4e] transition-all select-all shadow-2xs shrink-0"
                          title="Click to copy coupon code"
                        >
                          <span>{code}</span>
                          <HiOutlineDuplicate className="w-3 h-3 text-[#8b6f4e] opacity-60 group-hover/badge:opacity-100 transition-opacity" />
                        </button>

                        {/* Discount Highlight */}
                        <span className="text-xs sm:text-[12.5px] font-bold text-stone-900 tracking-tight font-poppins">
                          {discountText}
                        </span>
                      </div>

                      {/* Minimum Order / Description (Sub-label if exists) */}
                      {(c.discount?.minimumOrderAmount > 0 || c.description) && (
                        <p className="mt-0.5 text-[10px] text-stone-400 font-medium truncate">
                          {c.discount?.minimumOrderAmount > 0
                            ? `Min. order ₹${Number(c.discount.minimumOrderAmount).toLocaleString('en-IN')}`
                            : c.description}
                        </p>
                      )}
                    </div>

                    {/* Right: Action Button - ALWAYS right aligned and vertically centered */}
                    <button
                      type="button"
                      onClick={() => handleCopyCoupon(code)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10.5px] sm:text-[11px] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 ${
                        isCopied
                          ? 'bg-[#1b4332] text-white shadow-2xs'
                          : 'btn-theme-primary shadow-2xs hover:shadow-xs'
                      }`}
                      title={isCopied ? 'Code copied!' : 'Copy code to clipboard'}
                    >
                      {isCopied ? (
                        <>
                          <FaCheck className="w-2.5 h-2.5 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <span>Copy Code</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

ProductOffersSection.propTypes = {
  coupons: PropTypes.array,
};
