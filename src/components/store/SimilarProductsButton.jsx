/* eslint-disable react/prop-types */
import { useState } from 'react';
import { HiSparkles } from 'react-icons/hi';
import SimilarProductsDrawer from './SimilarProductsDrawer';

/**
 * Common reusable trigger + bottom drawer for viewing similar products.
 * Supports:
 * - variant="icon": compact floating icon button for product cards
 * - variant="pill": labeled pill button with tooltip for product detail pages
 */
export default function SimilarProductsButton({
  product,
  variant = 'icon',
  className = '',
  stopPropagation = true,
}) {
  const [open, setOpen] = useState(false);
  const productId = product?._id || product?.id;

  if (!productId) return null;

  const handleClick = (e) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOpen(true);
  };

  return (
    <>
      {variant === 'pill' ? (
        <div className={`relative group ${className}`}>
          <button
            type="button"
            onClick={handleClick}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-stone-200 hover:border-[color-mix(in_srgb,var(--btn-primary-bg,#8b6f4e)_60%,transparent)] bg-stone-50/80 hover:bg-[color-mix(in_srgb,var(--btn-primary-bg,#8b6f4e)_8%,#ffffff)] text-stone-700 hover:text-[var(--btn-primary-bg,#8b6f4e)] transition-all cursor-pointer text-xs font-medium active:scale-95 shadow-2xs"
            aria-label="View similar products"
            title="View Similar Products"
          >
            <HiSparkles
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: 'var(--btn-primary-bg, #8b6f4e)' }}
            />
            <span className="text-[11px] sm:text-[11.5px] font-semibold tracking-wide">Similar</span>
          </button>
          <div className="absolute bottom-full right-0 mb-2 hidden md:group-hover:flex flex-col items-end pointer-events-none z-30">
            <div className="bg-black text-white text-[11px] font-medium px-2.5 py-1 rounded shadow-lg whitespace-nowrap">
              View Similar Products
            </div>
            <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-black mr-4" />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          aria-label="View similar products"
          title="View Similar Products"
          style={{ color: 'var(--btn-primary-bg, #8b6f4e)' }}
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all z-20 bg-white/90 backdrop-blur-xs shadow-xs border border-gray-100 hover:bg-white hover:border-[color-mix(in_srgb,var(--btn-primary-bg,#8b6f4e)_50%,transparent)] cursor-pointer active:scale-95 ${className}`}
        >
          <HiSparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      )}

      {open && (
        <SimilarProductsDrawer
          open={open}
          onClose={() => setOpen(false)}
          productId={productId}
          currentProduct={product}
        />
      )}
    </>
  );
}
