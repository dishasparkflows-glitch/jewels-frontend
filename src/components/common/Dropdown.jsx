import { useState, useRef, useEffect, useId } from 'react';
import { HiOutlineChevronDown, HiCheck } from 'react-icons/hi';

/**
 * Common Luxury Dropdown Component for Frontend Storefront
 *
 * Matches the refined luxury jewelry ERP aesthetic:
 * - Rounded-xl trigger with subtle bronze-beige border (#e7ded3)
 * - Vertical subtle divider (|) before the dropdown chevron
 * - Rounded-2xl popover menu with warm ambient shadow
 * - Selected item highlighted in soft warm champagne tint (#f7efe5) with bronze checkmark (✓)
 *
 * @param {any} value - Currently selected value
 * @param {Function} onChange - Handler called on selection: (value) => void
 * @param {Array<string|number|object>} options - List of options. Can be primitives or { value, label, icon, disabled }
 * @param {string} [placeholder='Select an option'] - Placeholder text
 * @param {boolean} [disabled=false] - Disable interaction
 * @param {'auto'|'down'|'up'} [direction='auto'] - Direction to open the dropdown menu
 * @param {'sm'|'md'|'lg'} [size='md'] - Sizing preset (sm for compact bars, md for standard, lg for spacious)
 * @param {string} [className=''] - Container class name
 * @param {string} [buttonClassName=''] - Button trigger custom styling
 * @param {string} [menuClassName=''] - Menu popover custom styling
 * @param {React.ReactNode} [prefixIcon] - Icon to show at the start of the button
 * @param {boolean} [showChevron=true] - Show sleek dropdown chevron
 * @param {boolean} [showDivider=true] - Show vertical divider before chevron
 * @param {string} [id] - Input id
 */
export default function Dropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  direction = 'auto',
  size = 'md',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  prefixIcon,
  showChevron = true,
  showDivider = true,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(direction === 'up');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const generatedId = useId();
  const dropdownId = id || generatedId;

  // Normalize options into a consistent { value, label, ... } structure
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.id,
        label: opt.label !== undefined ? opt.label : (opt.name || String(opt.value)),
        icon: opt.icon,
        disabled: Boolean(opt.disabled),
        raw: opt,
      };
    }
    return {
      value: opt,
      label: String(opt),
      disabled: false,
      raw: opt,
    };
  });

  // Find currently selected option
  const selectedIndex = normalizedOptions.findIndex(
    (opt) => String(opt.value) === String(value)
  );
  const selectedOption = selectedIndex >= 0 ? normalizedOptions[selectedIndex] : null;

  // Sync highlightedIndex when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, selectedIndex]);

  // Handle smart auto-flip (open upward if near screen bottom)
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    if (direction === 'down') {
      setDropUp(false);
      return;
    }
    if (direction === 'up') {
      setDropUp(true);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedMenuHeight = 240;

    if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
      setDropUp(true);
    } else {
      setDropUp(false);
    }
  }, [isOpen, direction]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < normalizedOptions.length && normalizedOptions[next].disabled) {
            next += 1;
          }
          return next < normalizedOptions.length ? next : prev;
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && normalizedOptions[next].disabled) {
            next -= 1;
          }
          return next >= 0 ? next : prev;
        });
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
        const opt = normalizedOptions[highlightedIndex];
        if (!opt.disabled) {
          onChange?.(opt.value);
          setIsOpen(false);
        }
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const handleSelect = (option) => {
    if (option.disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
  };

  // Sizing styles
  const sizeClasses = {
    sm: {
      button: 'h-9 px-3 text-xs rounded-xl',
      menuItem: 'px-3 py-2 text-xs rounded-lg',
      divider: 'h-3.5',
      chevron: 'w-3.5 h-3.5',
      check: 'w-3.5 h-3.5',
    },
    md: {
      button: 'h-10 sm:h-11 px-3.5 sm:px-4 text-xs sm:text-[13px] rounded-xl sm:rounded-2xl',
      menuItem: 'px-3.5 py-2.5 text-xs sm:text-[13px] rounded-xl',
      divider: 'h-4',
      chevron: 'w-4 h-4',
      check: 'w-4 h-4',
    },
    lg: {
      button: 'h-12 px-5 text-sm sm:text-base rounded-2xl',
      menuItem: 'px-4 py-3 text-sm sm:text-base rounded-xl',
      divider: 'h-5',
      chevron: 'w-4 h-4',
      check: 'w-4 h-4',
    },
  }[size] || {
    button: 'h-10 px-3.5 text-xs rounded-xl',
    menuItem: 'px-3.5 py-2.5 text-xs rounded-xl',
    divider: 'h-4',
    chevron: 'w-4 h-4',
    check: 'w-4 h-4',
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* ─── Trigger Button Matching Screenshot ─── */}
      <button
        ref={buttonRef}
        type="button"
        id={dropdownId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={
          buttonClassName ||
          `w-full flex items-center justify-between gap-2.5 border border-[#e7ded3] bg-white text-stone-800 font-medium transition-all duration-200 cursor-pointer shadow-2xs hover:border-[#8b6f4e]/60 hover:bg-[#faf7f3]/40 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/15 disabled:opacity-50 disabled:cursor-not-allowed ${
            sizeClasses.button
          } ${isOpen ? 'border-[#8b6f4e] ring-2 ring-[#8b6f4e]/15' : ''}`
        }
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {prefixIcon && <span className="shrink-0 text-[#8b6f4e]">{prefixIcon}</span>}
          {selectedOption ? (
            <span className="truncate text-stone-900 font-medium">
              {selectedOption.label}
            </span>
          ) : (
            <span className="truncate text-stone-400 font-normal">
              {placeholder}
            </span>
          )}
        </div>

        {/* Right Section: Optional vertical divider + Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {showChevron && showDivider && (
            <span className={`w-[1px] bg-[#e7ded3] ${sizeClasses.divider}`} />
          )}

          {showChevron && (
            <HiOutlineChevronDown
              className={`${sizeClasses.chevron} text-stone-600 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#8b6f4e]' : ''
              }`}
            />
          )}
        </div>
      </button>

      {/* ─── Dropdown Menu Matching Screenshot ─── */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 z-[80] bg-white border border-[#efe7dd] rounded-2xl shadow-xl shadow-stone-900/5 p-1.5 overflow-hidden max-h-64 animate-fadeIn scrollbar-thin scrollbar-thumb-stone-200 ${
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-stone-400 text-center italic">
              No options available
            </div>
          ) : (
            <div className="space-y-0.5">
              {normalizedOptions.map((option, idx) => {
                const isSelected = String(option.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={String(option.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`relative flex items-center justify-between gap-2.5 cursor-pointer transition-colors duration-150 ${
                      sizeClasses.menuItem
                    } ${
                      option.disabled
                        ? 'opacity-40 cursor-not-allowed text-stone-400'
                        : isSelected
                        ? 'bg-[#f7efe5] text-stone-900 font-semibold'
                        : isHighlighted
                        ? 'bg-[#faf5ee] text-stone-900'
                        : 'text-stone-700 hover:bg-[#faf5ee] hover:text-stone-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <span className="truncate">{option.label}</span>
                    </div>

                    {/* Brown/Gold Checkmark (✓) for Selected Item */}
                    {isSelected && (
                      <HiCheck
                        className={`${sizeClasses.check} text-[#8b6f4e] stroke-[2.5] shrink-0`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
