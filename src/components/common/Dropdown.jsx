import { useState, useRef, useEffect, useId, useMemo } from 'react';
import { HiOutlineChevronDown, HiCheck, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

/**
 * Common Luxury Dropdown Component for Frontend Storefront
 *
 * Matches the refined luxury jewelry ERP aesthetic:
 * - Rounded-xl trigger with subtle bronze-beige border (#e7ded3)
 * - Vertical subtle divider (|) before the dropdown chevron
 * - Rounded-2xl popover menu with warm ambient shadow
 * - Selected item highlighted in soft warm champagne tint (#f7efe5) with bronze checkmark (✓)
 * - Smooth scrollable options list with luxury scrollbar
 * - Smart auto-flip detecting both viewport and container boundaries (e.g. modals)
 * - Optional instant search filter for long lists (e.g. states, cities)
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
 * @param {boolean} [searchable=false] - Whether to show a search filter at the top of the menu
 * @param {string} [searchPlaceholder='Search...'] - Search input placeholder
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
  searchable = false,
  searchPlaceholder = 'Search...',
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(direction === 'up');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');

  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const listRef = useRef(null);
  const searchInputRef = useRef(null);
  const generatedId = useId();
  const dropdownId = id || generatedId;

  // Normalize options into a consistent { value, label, ... } structure
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
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
  }, [options]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q) || String(opt.value).toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  // Find currently selected option
  const selectedIndex = filteredOptions.findIndex(
    (opt) => String(opt.value) === String(value)
  );
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Sync highlightedIndex when dropdown opens or search changes
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else {
      setHighlightedIndex(-1);
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchQuery) {
      setHighlightedIndex(0);
    }
  }, [searchQuery, isOpen]);

  // Autofocus search input when opened
  useEffect(() => {
    if (isOpen && searchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  // Handle smart auto-flip (open upward if near screen bottom or container bottom)
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
    const spaceBelowWindow = window.innerHeight - rect.bottom;
    const spaceAboveWindow = rect.top;
    const estimatedMenuHeight = 240;

    // Check if dropdown is inside a modal or dialog container
    const modalParent = buttonRef.current.closest('[role="dialog"], [aria-modal="true"], .modal');
    if (modalParent) {
      const parentRect = modalParent.getBoundingClientRect();
      const parentSpaceBelow = parentRect.bottom - rect.bottom;
      const parentSpaceAbove = rect.top - parentRect.top;

      if (parentSpaceBelow < estimatedMenuHeight && parentSpaceAbove > parentSpaceBelow) {
        setDropUp(true);
        return;
      }
    }

    if (spaceBelowWindow < estimatedMenuHeight && spaceAboveWindow > spaceBelowWindow) {
      setDropUp(true);
    } else {
      setDropUp(false);
    }
  }, [isOpen, direction]);

  // Auto-scroll selected/highlighted option into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const targetIndex = highlightedIndex >= 0 ? highlightedIndex : selectedIndex;
      if (targetIndex >= 0) {
        const optionEls = listRef.current.querySelectorAll('[role="option"]');
        if (optionEls[targetIndex]) {
          optionEls[targetIndex].scrollIntoView({ block: 'nearest' });
        }
      }
    }
  }, [isOpen, highlightedIndex, selectedIndex]);

  // Close on outside click or ancestor scroll
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleScroll = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll, true);
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
          while (next < filteredOptions.length && filteredOptions[next].disabled) {
            next += 1;
          }
          return next < filteredOptions.length ? next : prev;
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && filteredOptions[next].disabled) {
            next -= 1;
          }
          return next >= 0 ? next : prev;
        });
      }
    } else if (e.key === 'Enter') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      } else if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        e.preventDefault();
        const opt = filteredOptions[highlightedIndex];
        if (!opt.disabled) {
          onChange?.(opt.value);
          setIsOpen(false);
        }
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const handleSelect = (option, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (option.disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
  };

  // Sizing styles
  const sizeClasses = {
    sm: {
      button: 'h-9 px-2.5 sm:px-3 text-xs rounded-xl',
      menuItem: 'px-2.5 py-1.5 text-xs rounded-lg',
      divider: 'h-3.5',
      chevron: 'w-3.5 h-3.5',
      check: 'w-3 h-3',
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
      {/* ─── Trigger Button ─── */}
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
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
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

      {/* ─── Dropdown Popover Menu ─── */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          onMouseDown={(e) => e.stopPropagation()}
          className={`absolute left-0 right-0 z-[80] bg-white border border-[#efe7dd] rounded-2xl shadow-xl shadow-stone-900/10 overflow-hidden animate-fadeIn flex flex-col ${
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${menuClassName}`}
        >
          {/* Optional Search Bar */}
          {searchable && (
            <div className="p-2 border-b border-[#efe7dd] bg-[#faf7f3]/70 shrink-0">
              <div className="relative flex items-center">
                <HiOutlineSearch className="absolute left-2.5 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-[#e7ded3] rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      setIsOpen(false);
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                  >
                    <HiOutlineX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scrollable Options List */}
          <div
            ref={listRef}
            className="overflow-y-auto overflow-x-hidden p-1.5 space-y-0.5 max-h-56 luxury-scrollbar overscroll-contain flex-1 min-h-0"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-xs text-stone-400 text-center italic">
                {searchQuery ? 'No matches found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = String(option.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={String(option.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={(e) => handleSelect(option, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`relative flex items-center justify-between gap-1.5 cursor-pointer transition-colors duration-150 select-none ${
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
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
