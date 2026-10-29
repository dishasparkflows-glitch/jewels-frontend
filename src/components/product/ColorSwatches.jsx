/* eslint-disable react/prop-types */

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
          activeColorName && entry.name?.toLowerCase() === activeColorName.toLowerCase()
        );
        const bg = entry.colorCodeEnd
          ? `linear-gradient(135deg, ${entry.hex || entry.colorCode}, ${entry.colorCodeEnd})`
          : entry.hex || entry.colorCode || '#ccc';

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
            className={`${sizeClass} rounded-full border transition-all cursor-pointer ${
              isSelected ? 'ring-1 ring-black scale-110' : 'border-gray-200'
            }`}
            style={{ background: bg }}
          />
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
