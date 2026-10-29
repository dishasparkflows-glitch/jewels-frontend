import { useState, useRef, useEffect, useId } from 'react';
import { HiOutlineChevronDown, HiOutlineCheck } from 'react-icons/hi';

/**
 * Common Luxury Dropdown Component for Frontend Storefront
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
    const estimatedMenuHeight = 220;

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
          `w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm text-stone-800 hover:border-stone-300 focus:outline-none focus:border-[#8f6d43] focus:ring-1 focus:ring-[#8f6d43]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isOpen ? 'border-[#8f6d43] ring-1 ring-[#8f6d43]/20' : ''
          }`
        }
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {prefixIcon && <span className="shrink-0">{prefixIcon}</span>}
          {selectedOption ? (
            <span className="truncate text-stone-800 font-medium">
              {selectedOption.label}
            </span>
          ) : (
            <span className="truncate text-stone-400 font-normal">
              {placeholder}
            </span>
          )}
        </div>

        <HiOutlineChevronDown
          className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-stone-700' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 z-[80] bg-white border border-stone-200/90 rounded-xl shadow-xl overflow-y-auto max-h-56 py-1.5 animate-fadeIn scrollbar-thin scrollbar-thumb-stone-200 ${
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3.5 py-2.5 text-xs text-stone-400 text-center">
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
                  className={`px-3.5 py-2.5 text-xs sm:text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    option.disabled
                      ? 'opacity-40 cursor-not-allowed text-stone-400'
                      : isSelected
                      ? 'bg-[#fbf7f2] text-[#8f6d43] font-semibold'
                      : isHighlighted
                      ? 'bg-stone-50 text-stone-900'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>

                  {isSelected && (
                    <HiOutlineCheck className="w-4 h-4 text-[#8f6d43] shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
