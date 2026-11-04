/* eslint-disable react/prop-types */
import { getMetallicColorStyle } from '../../utils/productCard';

/**
 * Reusable color swatch buttons for product cards and details.
 */
export default function ColorSwatches({
  colors = [],
  activeColorName = '',
  onSelectColor,
  maxVisible = 5,
  sizeClass = 'w-2.5 h-2.5 sm:w-3.5 sm:h-3.5',
  className = 'flex justify-center items-center gap-1 sm:gap-1.5',
  extraBadgeClass = 'text-[9px] sm:text-[10px] text-gray-400 self-center',
}) {
  if (!colors || colors.length === 0) return null;

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      {colors.slice(0, maxVisible).map((entry) => {
        const isSelected = Boolean(
          activeColorName &&
          entry?.name &&
          entry.name.toLowerCase().trim() === activeColorName.toLowerCase().trim()
        );
        const metallic = getMetallicColorStyle(
          entry.name,
          entry.hex || entry.colorCode,
          entry.colorCodeEnd
        );

        return (
          <button
            key={entry.id || entry.name}
            type="button"
            title={entry.name}
            aria-label={`Select ${entry.name}`}
            aria-pressed={isSelected}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelectColor?.(entry.name);
            }}
            className={`${sizeClass} rounded-full transition-all cursor-pointer relative ${
              isSelected
                ? 'ring-2 ring-black ring-offset-2 ring-offset-white scale-110 shadow-sm z-10'
                : 'hover:scale-110 opacity-90 hover:opacity-100'
            }`}
            style={{
              background: metallic.background,
              border: metallic.border,
              boxShadow: isSelected
                ? '0 0 0 1.5px #ffffff, 0 0 0 3px #000000'
                : metallic.boxShadow,
            }}
          >
            <span
              className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
              style={{
                background:
                  'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 28%, rgba(255,255,255,0) 55%)',
              }}
              aria-hidden="true"
            />
          </button>
        );
      })}
      {colors.length > maxVisible && (
        <span className={extraBadgeClass}>
          +{colors.length - maxVisible}
        </span>
      )}
    </div>
  );
}
