import { useState } from 'react';
import PropTypes from 'prop-types';
import { HiOutlineShare, HiOutlineX } from 'react-icons/hi';
import {
  FaWhatsapp,
  FaFacebookF,
  FaXTwitter,
  FaPinterestP,
  FaEnvelope,
  FaLink,
  FaCheck,
} from 'react-icons/fa6';
import toast from 'react-hot-toast';

/**
 * Luxury Social & Direct Link Sharing Modal
 */
export default function ProductShareModal({
  isOpen = false,
  onClose,
  product = {},
  galleryImages = [],
  currentPrice = 0,
  formatPrice,
}) {
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const productTitle = product?.basicInfo?.title || product?.name || 'Neirah Jewellery';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setLinkCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2500);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-stone-200 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <HiOutlineShare className="w-5 h-5 text-[#8b6f4e]" />
            <h3 className="font-serif text-lg font-bold text-stone-900 tracking-wide">
              Share
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close share dialog"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Product Summary */}
        <div className="flex items-center gap-3.5 my-4 p-3 rounded-xl bg-stone-50 border border-stone-200/80">
          {galleryImages?.[0] ? (
            <img
              src={galleryImages[0]}
              alt={productTitle}
              className="w-14 h-14 object-cover rounded-lg border border-stone-200 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-stone-200 flex items-center justify-center text-stone-400 shrink-0">
              <HiOutlineShare className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-stone-900 truncate">
              {productTitle}
            </h4>
            {typeof formatPrice === 'function' && currentPrice ? (
              <p className="text-xs font-bold text-[#8b6f4e] mt-0.5">
                {formatPrice(currentPrice)}
              </p>
            ) : null}
          </div>
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-1.5 mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Link
          </label>
          <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl border border-stone-200 bg-stone-50/70 focus-within:border-[#8b6f4e] focus-within:bg-white transition-colors">
            <FaLink className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="w-full text-xs text-stone-700 bg-transparent outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                linkCopied
                  ? 'bg-[#162b20] text-white'
                  : 'btn-theme-primary active:scale-95'
              }`}
            >
              {linkCopied ? (
                <>
                  <FaCheck className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <span>Copy</span>
              )}
            </button>
          </div>
        </div>

        {/* Social Share Options */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-3 text-center">
            Share directly via
          </p>
          <div className="grid grid-cols-5 gap-2 text-center">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(productTitle + '\n' + currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-emerald-50 text-stone-600 hover:text-emerald-600 transition-colors group cursor-pointer"
              title="Share on WhatsApp"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <FaWhatsapp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium truncate w-full">WhatsApp</span>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-blue-50 text-stone-600 hover:text-blue-600 transition-colors group cursor-pointer"
              title="Share on Facebook"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <FaFacebookF className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium truncate w-full">Facebook</span>
            </a>

            {/* Twitter / X */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(productTitle)}&url=${encodeURIComponent(currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-stone-100 text-stone-600 hover:text-black transition-colors group cursor-pointer"
              title="Share on X"
            >
              <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                <FaXTwitter className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium truncate w-full">Twitter / X</span>
            </a>

            {/* Pinterest */}
            <a
              href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}&media=${encodeURIComponent(galleryImages?.[0] || '')}&description=${encodeURIComponent(productTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-rose-50 text-stone-600 hover:text-rose-600 transition-colors group cursor-pointer"
              title="Share on Pinterest"
            >
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                <FaPinterestP className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium truncate w-full">Pinterest</span>
            </a>

            {/* Email */}
            <a
              href={`mailto:?subject=${encodeURIComponent(productTitle)}&body=${encodeURIComponent('Check out this exquisite piece:\n' + currentUrl)}`}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-amber-50 text-stone-600 hover:text-amber-700 transition-colors group cursor-pointer"
              title="Share via Email"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
                <FaEnvelope className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium truncate w-full">Email</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

ProductShareModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  product: PropTypes.object,
  galleryImages: PropTypes.array,
  currentPrice: PropTypes.number,
  formatPrice: PropTypes.func,
};
