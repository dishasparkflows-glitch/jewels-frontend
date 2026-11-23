import PropTypes from 'prop-types';
import { HiOutlineX } from 'react-icons/hi';

/**
 * Category Size Chart Download & Preview Modal
 */
export default function ProductSizeGuideModal({
  isOpen = false,
  onClose,
  sizeChart = null,
  categoryName = 'Jewelry',
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-100 text-center animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Circular Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition cursor-pointer"
          aria-label="Close"
        >
          <HiOutlineX className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Title */}
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight mb-5">
          {sizeChart?.categoryName || categoryName || 'Jewelry'} Size Chart
        </h3>

        {/* Center PDF / Guide Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative flex flex-col items-center justify-center">
            <svg
              className="w-16 h-20 text-stone-800"
              viewBox="0 0 48 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4C4 1.79086 5.79086 0 8 0H32L44 12V56C44 58.2091 42.2091 60 40 60H8C5.79086 60 4 58.2091 4 56V4Z"
                fill="white"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M32 0V12H44"
                fill="#E7E5E4"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <rect
                x="9"
                y="22"
                width="30"
                height="15"
                rx="3"
                fill="#FEE2E2"
                stroke="#DC2626"
                strokeWidth="1.5"
              />
              <text
                x="24"
                y="33"
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#DC2626"
                fontFamily="sans-serif"
              >
                PDF
              </text>
              <path
                d="M24 43V51M24 51L20 47M24 51L28 47"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Document Title & Description */}
        <h4 className="text-sm font-bold text-stone-900 tracking-tight">
          Download {sizeChart?.categoryName || categoryName || 'Jewelry'} Size Guide
          {sizeChart?.isPdf ? ' PDF' : ''}
        </h4>
        <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
          Click to download the practical Size Guide for this category.
        </p>

        {/* Image Preview if Size Chart is an Image */}
        {!sizeChart?.isPdf && sizeChart?.url && (
          <div className="mt-4 max-h-52 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center p-2">
            <img
              src={sizeChart.url}
              alt={`${sizeChart.categoryName || 'Size'} Guide`}
              className="max-h-48 w-auto object-contain rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* CLICK HERE Action Button */}
        <div className="mt-6 flex justify-center">
          <a
            href={sizeChart?.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            download
            onClick={(e) => {
              if (!sizeChart?.url) {
                e.preventDefault();
                return;
              }
              window.open(sizeChart.url, '_blank');
              onClose();
            }}
            className="inline-flex items-center justify-center px-10 py-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            CLICK HERE
          </a>
        </div>
      </div>
    </div>
  );
}

ProductSizeGuideModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  sizeChart: PropTypes.object,
  categoryName: PropTypes.string,
};
