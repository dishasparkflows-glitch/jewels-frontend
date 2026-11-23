import PropTypes from 'prop-types';
import { HiOutlineEye } from 'react-icons/hi';

/**
 * Trust badges (Global Jeweller, BIS Hallmark, 4.7/5 Rating, Neirah Certified, Free Shipping)
 * and optional Gold/Diamond Authenticity Certificate thumbnail preview
 */
export default function ProductTrustBadges({
  isGold = false,
  certificateUrl = '',
  onOpenCertificate,
}) {
  return (
    <div className="pt-4 flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-stone-200">
      {/* Left side: Trust Badges (Matches Reference Design) */}
      <div className="flex-1 w-full grid grid-cols-3 gap-y-6 gap-x-2 sm:gap-x-4">
        {/* Badge 1: Global Online Jeweller */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full border border-stone-200 bg-stone-50 flex items-center justify-center text-[#144b44] shrink-0 shadow-2xs">
            <svg
              className="w-5 h-5 text-[#144b44]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="5" />
              <path d="M8.5 12.5L7 21l5-2.5L17 21l-1.5-8.5" />
            </svg>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-700 leading-tight mt-2 font-normal">
            Global Online<br />Jeweller
          </span>
        </div>

        {/* Badge 2: BIS Hallmark */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full border border-stone-200 bg-stone-50 flex items-center justify-center text-[#144b44] shrink-0 shadow-2xs">
            <svg
              className="w-5 h-5 text-[#144b44]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-700 leading-tight mt-2 font-normal">
            BIS Hallmark
          </span>
        </div>

        {/* Badge 3: Rated 4.7/5 Globally */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full border border-stone-200 bg-stone-50 flex items-center justify-center shrink-0 shadow-2xs">
            <span className="text-[13px] font-semibold text-[#144b44] tracking-tight flex items-center gap-0.5 font-sans">
              4.7 <span className="text-[10px]">★</span>
            </span>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-700 leading-tight mt-2 font-normal">
            Rated 4.7/5<br />Globally
          </span>
        </div>

        {/* Badge 4: Neirah Certified */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full border border-stone-200 bg-stone-50 flex items-center justify-center text-[#144b44] shrink-0 shadow-2xs">
            <svg
              className="w-5 h-5 text-[#144b44]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-700 leading-tight mt-2 font-normal">
            Neirah<br />Certified
          </span>
        </div>

        {/* Badge 5: Free Secure Shipping */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full border border-stone-200 bg-stone-50 flex items-center justify-center text-[#144b44] shrink-0 shadow-2xs">
            <svg
              className="w-5 h-5 text-[#144b44]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1" y="3" width="15" height="13" rx="1" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-700 leading-tight mt-2 font-normal">
            Free Secure<br />Shipping
          </span>
        </div>
      </div>

      {/* Right side: Certificate Preview (Only for Gold / Diamond items) */}
      {isGold && (
        <div className="w-full md:w-[150px] shrink-0 pt-4 md:pt-0 md:pl-6 flex flex-col items-center justify-center">
          <div
            onClick={onOpenCertificate}
            className="border border-stone-200 bg-white p-1.5 rounded shadow-xs hover:shadow-md transition-all cursor-pointer group max-w-[130px]"
            title="Click to view full certificate"
          >
            <img
              src={certificateUrl}
              alt="Certificate Preview"
              className="w-full h-auto max-h-[85px] object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <button
            type="button"
            onClick={onOpenCertificate}
            className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-stone-800 hover:text-[#92704E] transition-colors cursor-pointer"
          >
            <HiOutlineEye className="w-3.5 h-3.5 text-stone-600" />
            <span>View Certificate</span>
          </button>
        </div>
      )}
    </div>
  );
}

ProductTrustBadges.propTypes = {
  isGold: PropTypes.bool,
  certificateUrl: PropTypes.string,
  onOpenCertificate: PropTypes.func,
};
