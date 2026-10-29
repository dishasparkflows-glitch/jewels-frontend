import { useState, useRef, useEffect, useId } from 'react';
import { HiOutlineChevronDown } from 'react-icons/hi';

/**
 * Common Luxury Dropdown Component for Frontend Storefront
 *
 * Matches the refined luxury jewelry ERP aesthetic:
 * - Rounded-2xl trigger with subtle bronze-gold border (#9c7a4b)
 * - Refined editorial serif typography
 * - Rounded-2xl popover menu with warm ambient shadow
 * - Selected item highlighted in soft warm champagne tint (#f4eae0) with a left gold accent bar
 *
 * @param {any} value - Currently selected value
 * @param {Function} onChange - Handler called on selection: (value) => void
 * @param {Array<string|number|object>} options - List of options. Can be primitives or { value, label, icon, disabled }
 * @param {string} [placeholder='Select an option'] - Placeholder text
 * @param {boolean} [disabled=false] - Disable interaction
 * @param {'auto'|'down'|'up'} [direction='auto'] - Direction to open the dropdown menu
 * @param {string} [className=''] - Container class name
 * @param {string} [buttonClassName=''] - Button trigger custom styling
 * @param {string} [menuClassName=''] - Menu popover custom styling
 * @param {React.ReactNode} [prefixIcon] - Icon to show at the start of the button
 * @param {boolean} [showChevron=true] - Show sleek dropdown chevron
 * @param {string} [id] - Input id
 */
export default function Dropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  direction = 'auto',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  prefixIcon,
  showChevron = true,
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

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
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
          `w-full flex items-center justify-between gap-3 px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl border-[1.5px] border-[#9c7a4b] bg-white text-stone-900 font-serif text-[15px] sm:text-base tracking-wide transition-all duration-200 cursor-pointer shadow-2xs hover:border-[#86663a] focus:outline-none focus:ring-2 focus:ring-[#9c7a4b]/20 disabled:opacity-50 disabled:cursor-not-allowed ${
            isOpen ? 'border-[#9c7a4b] ring-2 ring-[#9c7a4b]/20' : ''
          }`
        }
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {prefixIcon && <span className="shrink-0 text-[#9c7a4b]">{prefixIcon}</span>}
          {selectedOption ? (
            <span className="truncate text-stone-900 font-serif font-normal">
              {selectedOption.label}
            </span>
          ) : (
            <span className="truncate text-stone-400 font-serif font-normal">
              {placeholder}
            </span>
          )}
        </div>

        {showChevron && (
          <HiOutlineChevronDown
            className={`w-4 h-4 text-[#9c7a4b] shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#7a5a2e]' : ''
            }`}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 z-[80] bg-white border border-[#e8ded4] rounded-2xl shadow-[0_16px_40px_rgba(40,30,20,0.08)] overflow-hidden max-h-64 py-0 animate-fadeIn scrollbar-thin scrollbar-thumb-stone-200 ${
            dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-5 py-3.5 text-xs text-stone-400 font-serif text-center italic">
              No options available
            </div>
          ) : (
            normalizedOptions.map((option, idx) => {
              const isSelected = String(option.value) === String(value);
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={String(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`relative px-5 py-3 sm:px-6 sm:py-3.5 text-[15px] sm:text-base font-serif flex items-center justify-between gap-2 cursor-pointer transition-colors duration-150 ${
                    option.disabled
                      ? 'opacity-40 cursor-not-allowed text-stone-400'
                      : isSelected
                      ? 'bg-[#f4eae0] text-stone-900 font-normal'
                      : isHighlighted
                      ? 'bg-[#faf5ee] text-stone-900 font-normal'
                      : 'bg-white text-stone-800 font-normal hover:bg-[#faf5ee]'
                  }`}
                >
                  {/* Left Gold Accent Bar on Selected Item */}
                  {isSelected && (
                    <span className="absolute left-0 inset-y-0 w-1.5 bg-[#9c7a4b] rounded-r-xs" />
                  )}

                  <div className="flex items-center gap-2.5 min-w-0">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
