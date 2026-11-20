/* eslint-disable react/prop-types */

/**
 * Reusable luxury specification grid and diamond badge component.
 * Used across CartDrawer, Cart, Checkout, and Profile order items.
 */
export default function ItemSpecsDisplay({ specs, className = '' }) {
  if (!specs) return null;

  const {
    isSilver,
    diamondType,
    metalDisplay,
    metalColor,
    clarityDisplay,
    diamondShape,
    caratWeight,
    sizeDisplay,
    hasRightCol,
    hasSpecs,
  } = specs;

  if (!diamondType && !hasSpecs) return null;

  return (
    <div className={className}>
      {/* Diamond Type Pill Badge */}
      {diamondType && (
        <div className="mt-1.5">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-[#faf5ee] text-[#8b6f4e] border border-[#e8d9c2]">
            {diamondType}
          </span>
        </div>
      )}

      {/* Attributes Grid */}
      {hasSpecs && (
        <div className={`mt-2 ${hasRightCol ? 'grid grid-cols-2' : 'flex'} text-[9px] sm:text-[10px] tracking-wide uppercase font-sans border-b border-stone-200/70 pb-2`}>
          {/* Left Column */}
          <div className={`${hasRightCol ? 'border-r border-stone-200/70 pr-2' : ''} space-y-1`}>
            {metalDisplay && (
              <p className="text-stone-600 font-semibold">
                METAL: <span className="text-stone-900 font-bold">{isSilver ? 'SILVER' : metalDisplay}</span>
              </p>
            )}
            {clarityDisplay && (
              <p className="text-stone-600 font-semibold">
                CLARITY: <span className="text-stone-900 font-bold">{clarityDisplay}</span>
              </p>
            )}
            {diamondShape && (
              <p className="text-stone-600 font-semibold">
                DIAMOND SHAPE: <span className="text-stone-900 font-bold">{diamondShape}</span>
              </p>
            )}
            {!metalDisplay && sizeDisplay && (
              <p className="text-stone-600 font-semibold">
                SIZE: <span className="text-stone-900 font-bold">{sizeDisplay}</span>
              </p>
            )}
          </div>

          {/* Right Column */}
          {hasRightCol && (
            <div className="pl-2.5 space-y-1">
              {metalColor && (
                <p className="text-stone-600 font-semibold">
                  COLOR: <span className="text-stone-900 font-bold">{metalColor}</span>
                </p>
              )}
              {caratWeight != null && (
                <p className="text-stone-600 font-semibold">
                  CARAT: <span className="text-stone-900 font-bold">{caratWeight}</span>
                </p>
              )}
              {metalDisplay && sizeDisplay && (
                <p className="text-stone-600 font-semibold">
                  SIZE: <span className="text-stone-900 font-bold">{sizeDisplay}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
