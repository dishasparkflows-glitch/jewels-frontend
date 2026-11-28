import { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
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
  const isPointerDownRef = useRef(false);
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

  // Autofocus search input when opened (without scrolling parent modals)
  useEffect(() => {
    if (isOpen && searchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  // Compute dropdown direction detecting viewport, modal, and overflowing ancestor bounds
  const updateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;
    if (direction === 'down') {
      setDropUp(false);
      return;
    }
    if (direction === 'up') {
      setDropUp(true);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    let availableBelow = window.innerHeight - rect.bottom;
    let availableAbove = rect.top;
    const estimatedMenuHeight = 250;

    let parent = buttonRef.current.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY || '';
      const overflow = style.overflow || '';
      const isModal =
        parent.getAttribute('role') === 'dialog' ||
        parent.getAttribute('aria-modal') === 'true' ||
        parent.classList.contains('modal');
      const isScrollableOrClipped =
        overflowY === 'auto' ||
        overflowY === 'scroll' ||
        overflowY === 'hidden' ||
        overflow === 'auto' ||
        overflow === 'scroll' ||
        overflow === 'hidden';

      if (isModal || isScrollableOrClipped) {
        const parentRect = parent.getBoundingClientRect();
        availableBelow = Math.min(availableBelow, parentRect.bottom - rect.bottom);
        availableAbove = Math.min(availableAbove, rect.top - parentRect.top);
      }
      if (isModal) break;
      parent = parent.parentElement;
    }

    setDropUp(availableBelow < estimatedMenuHeight && availableAbove > availableBelow);
  }, [direction]);

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
  }, [isOpen, updateDropdownPosition]);

  // Auto-scroll highlighted/selected option ONLY inside listRef (never scrolling ancestors)
  useEffect(() => {
    if (isOpen && listRef.current) {
      const targetIndex = highlightedIndex >= 0 ? highlightedIndex : selectedIndex;
      if (targetIndex >= 0) {
        const listEl = listRef.current;
        const optionEls = listEl.querySelectorAll('[role="option"]');
        const targetEl = optionEls[targetIndex];
        if (targetEl) {
          const elTop = targetEl.offsetTop;
          const elBottom = elTop + targetEl.offsetHeight;
          if (elTop < listEl.scrollTop) {
            listEl.scrollTop = elTop;
          } else if (elBottom > listEl.scrollTop + listEl.clientHeight) {
            listEl.scrollTop = elBottom - listEl.clientHeight;
          }
        }
      }
    }
  }, [isOpen, highlightedIndex, selectedIndex]);

  // Close on outside click or touch; reposition cleanly on window resize/scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        (!menuRef.current || !menuRef.current.contains(event.target))
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = (event) => {
      if (menuRef.current && event?.target && menuRef.current.contains(event.target)) {
        return;
      }
      updateDropdownPosition();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updateDropdownPosition]);

  const openedOnFocusAtRef = useRef(0);

  const handleTriggerPointerDown = () => {
    isPointerDownRef.current = true;
  };

  const handleClick = () => {
    if (disabled) return;
    isPointerDownRef.current = false;
    // If focus just opened the menu during this same tap/click gesture, keep it open
    if (Date.now() - openedOnFocusAtRef.current < 150) {
      openedOnFocusAtRef.current = 0;
      return;
    }
    setIsOpen((prev) => !prev);
  };

  // Focus handler: Opens dropdown when focused via keyboard Tab
  const handleFocus = () => {
    if (disabled) return;
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false;
      return;
    }

    if (!isOpen) {
      openedOnFocusAtRef.current = Date.now();
      setIsOpen(true);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  };

  // Blur handler: When focus leaves the dropdown container, cleanly close it
  const handleBlur = (e) => {
    if (
      e.relatedTarget &&
      (containerRef.current?.contains(e.relatedTarget) || menuRef.current?.contains(e.relatedTarget))
    ) {
      return;
    }
    if (!e.relatedTarget) {
      return;
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

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
      setHighlightedIndex(-1);
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
        onClick={handleClick}
        onPointerDown={handleTriggerPointerDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full flex items-center justify-between gap-2.5 text-left transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          buttonClassName
            ? buttonClassName
            : `border border-stone-200 bg-white text-stone-800 font-medium shadow-2xs hover:border-stone-300 hover:bg-stone-50/50 focus:outline-none input-theme-focus ${
                sizeClasses.button
              }`
        } ${isOpen ? 'border-[var(--btn-primary-bg,#8b6f4e)] ring-2 ring-[var(--btn-primary-bg,#8b6f4e)]/15' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {prefixIcon && (
            <span
              className="shrink-0 flex items-center justify-center"
              style={{ color: 'var(--btn-primary-bg, #8b6f4e)' }}
            >
              {prefixIcon}
            </span>
          )}
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
                isOpen ? 'rotate-180' : ''
              }`}
              style={isOpen ? { color: 'var(--btn-primary-bg, #8b6f4e)' } : undefined}
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
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none input-theme-focus transition-all"
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
                    style={
                      isSelected
                        ? { backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, white)' }
                        : isHighlighted
                        ? { backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 7%, white)' }
                        : undefined
                    }
                    className={`relative flex items-center justify-between gap-1.5 cursor-pointer transition-colors duration-150 select-none ${
                      sizeClasses.menuItem
                    } ${
                      option.disabled
                        ? 'opacity-40 cursor-not-allowed text-stone-400'
                        : isSelected
                        ? 'text-stone-900 font-semibold'
                        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <span className="truncate">{option.label}</span>
                    </div>

                    {/* Theme Checkmark (✓) for Selected Item */}
                    {isSelected && (
                      <HiCheck
                        style={{ color: 'var(--btn-primary-bg, #8b6f4e)' }}
                        className={`${sizeClasses.check} stroke-[2.5] shrink-0`}
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
