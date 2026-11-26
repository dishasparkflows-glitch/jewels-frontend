/**
 * LuxuryDivider - A delicate luxury jewellery ornament divider
 * featuring horizontal lines flanking a 4-point diamond sparkle motif.
 */
export default function LuxuryDivider({
  className = '',
  color = 'var(--btn-primary-bg, #8b6f4e)',
  lineWidth = 'w-16 sm:w-24 md:w-28',
  starSize = 'w-3.5 h-3.5 sm:w-4 sm:h-4',
  withDots = false,
}) {
  const softColor = `color-mix(in srgb, ${color} 40%, transparent)`;

  return (
    <div
      className={`flex items-center justify-center gap-2.5 sm:gap-3 text-stone-400 select-none ${className}`}
      aria-hidden="true"
    >
      {/* Left Line with soft gradient taper */}
      <span
        className={`h-[1px] ${lineWidth}`}
        style={{
          backgroundImage: `linear-gradient(to right, transparent, ${softColor}, ${color})`,
        }}
      />

      {withDots && (
        <span
          className="w-1 h-1 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Center 4-Point Diamond Sparkle Star */}
      <svg
        className={`${starSize} shrink-0 transition-transform duration-300 hover:rotate-45`}
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color }}
      >
        <path d="M12 2 C12 7.5 16.5 12 22 12 C16.5 12 12 16.5 12 22 C12 16.5 7.5 12 2 12 C7.5 12 12 7.5 12 2 Z" />
      </svg>

      {withDots && (
        <span
          className="w-1 h-1 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Right Line with soft gradient taper */}
      <span
        className={`h-[1px] ${lineWidth}`}
        style={{
          backgroundImage: `linear-gradient(to left, transparent, ${softColor}, ${color})`,
        }}
      />
    </div>
  );
}
