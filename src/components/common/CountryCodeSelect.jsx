import { useState, useRef, useEffect, useMemo, useId } from 'react';
import { defaultCountries, parseCountry } from 'react-international-phone';
import { HiOutlineSearch, HiChevronDown, HiCheck, HiX } from 'react-icons/hi';

const POPULAR_ISO_CODES = ['in', 'us', 'gb', 'ae', 'ca', 'au', 'sg'];

export default function CountryCodeSelect({
  value = '+91',
  onChange,
  defaultCountry = 'in',
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIso, setSelectedIso] = useState(defaultCountry.toLowerCase());

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Process all countries from react-international-phone
  const allCountries = useMemo(() => {
    return defaultCountries.map((c) => {
      const parsed = parseCountry(c);
      return {
        name: parsed.name,
        iso2: parsed.iso2.toLowerCase(),
        dialCode: `+${parsed.dialCode}`,
        rawDialCode: parsed.dialCode,
      };
    });
  }, []);

  // Sync selectedIso if value changes externally
  useEffect(() => {
    if (!value) return;
    const cleanValue = value.startsWith('+') ? value : `+${value}`;
    // If current selectedIso already matches this dialCode, keep it (e.g. CA vs US)
    const currentMatch = allCountries.find((c) => c.iso2 === selectedIso);
    if (currentMatch && currentMatch.dialCode === cleanValue) {
      return;
    }
    // Otherwise find the first country matching this dialCode
    const match = allCountries.find((c) => c.dialCode === cleanValue);
    if (match) {
      setSelectedIso(match.iso2);
    }
  }, [value, allCountries, selectedIso]);

  // Current active country
  const currentCountry = useMemo(() => {
    return (
      allCountries.find((c) => c.iso2 === selectedIso) ||
      allCountries.find((c) => c.iso2 === 'in') ||
      allCountries[0]
    );
  }, [allCountries, selectedIso]);

  // Popular list
  const popularCountries = useMemo(() => {
    return POPULAR_ISO_CODES.map((iso) =>
      allCountries.find((c) => c.iso2 === iso)
    ).filter(Boolean);
  }, [allCountries]);

  // Filtered countries based on search
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCountries;

    const cleanDialQuery = q.replace(/^\+/, '');
    return allCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso2.includes(q) ||
        c.rawDialCode.includes(cleanDialQuery)
    );
  }, [allCountries, searchQuery]);

  // Handle outside click & escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    // Auto-focus search input when opened
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 50);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen]);

  const handleSelect = (country) => {
    setSelectedIso(country.iso2);
    setIsOpen(false);
    setSearchQuery('');
    if (onChange) {
      onChange(country.dialCode, country);
    }
  };

  const getFlagEmoji = (iso2) => {
    if (!iso2 || iso2.length !== 2) return '';
    try {
      const codePoints = [...iso2.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return iso2.toUpperCase();
    }
  };

  const renderFlag = (iso2, name, size = 'md') => {
    const isSmall = size === 'sm';
    return (
      <span className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[2px] shadow-2xs border border-stone-200/80 bg-stone-100">
        <img
          src={`https://flagcdn.com/w40/${iso2}.png`}
          srcSet={`https://flagcdn.com/w80/${iso2}.png 2x`}
          alt={`${name} flag`}
          className={`${isSmall ? 'h-3 w-4' : 'h-3.5 w-5'} object-cover block`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'inline-block';
            }
          }}
        />
        <span
          style={{ display: 'none' }}
          className="text-[10px] leading-none select-none px-0.5"
          aria-hidden="true"
        >
          {getFlagEmoji(iso2)}
        </span>
      </span>
    );
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Country calling code, currently ${currentCountry.name} (${currentCountry.dialCode})`}
        className={
          buttonClassName ||
          'flex h-full items-center gap-1.5 px-2.5 text-stone-800 transition hover:bg-stone-50 border-r border-[#e9dfd3] outline-none cursor-pointer select-none'
        }
      >
        {renderFlag(currentCountry.iso2, currentCountry.name)}
        <span className="text-xs font-semibold tracking-wide text-stone-800 sm:text-sm">
          {currentCountry.dialCode}
        </span>
        <HiChevronDown
          className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#92704e]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 top-full z-50 mt-1.5 w-72 sm:w-80 rounded-xl border border-stone-200 bg-white shadow-2xl overflow-hidden transition-all duration-150 animate-in fade-in zoom-in-95 ${menuClassName}`}
        >
          {/* Search Bar Header */}
          <div className="sticky top-0 z-10 border-b border-stone-100 bg-stone-50/90 p-2.5 backdrop-blur-xs">
            <div className="relative flex items-center">
              <HiOutlineSearch className="pointer-events-none absolute left-3 h-4 w-4 text-stone-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code..."
                className="h-9 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-8 text-xs sm:text-sm text-stone-800 outline-none placeholder:text-stone-400 transition focus:border-[#92704e] focus:ring-1 focus:ring-[#92704e]/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <HiX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Countries List */}
          <div
            ref={listRef}
            className="max-h-64 overflow-y-auto overscroll-contain py-1 text-xs sm:text-sm"
          >
            {/* If searching, display flat filtered list */}
            {searchQuery.trim() ? (
              filteredCountries.length > 0 ? (
                filteredCountries.map((country) => {
                  const isSelected = country.iso2 === selectedIso;
                  return (
                    <button
                      key={country.iso2}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(country)}
                      className={`flex w-full items-center justify-between gap-2.5 px-3.5 py-2 text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#f7efe6] text-[#92704e] font-semibold'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {renderFlag(country.iso2, country.name)}
                        <span className="truncate">{country.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 font-mono text-xs text-stone-500">
                        <span>{country.dialCode}</span>
                        {isSelected && (
                          <HiCheck className="h-4 w-4 text-[#92704e]" />
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-stone-400">
                  No countries matching "{searchQuery}"
                </div>
              )
            ) : (
              /* If not searching, display Popular Section + All Countries */
              <>
                {/* Popular Group */}
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Popular Countries
                </div>
                {popularCountries.map((country) => {
                  const isSelected = country.iso2 === selectedIso;
                  return (
                    <button
                      key={`pop-${country.iso2}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(country)}
                      className={`flex w-full items-center justify-between gap-2.5 px-3.5 py-2 text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#f7efe6] text-[#92704e] font-semibold'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {renderFlag(country.iso2, country.name)}
                        <span className="truncate">{country.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 font-mono text-xs text-stone-500">
                        <span>{country.dialCode}</span>
                        {isSelected && (
                          <HiCheck className="h-4 w-4 text-[#92704e]" />
                        )}
                      </div>
                    </button>
                  );
                })}

                <div className="my-1 border-t border-stone-100" />

                {/* All Countries Group */}
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  All Countries ({allCountries.length})
                </div>
                {allCountries.map((country) => {
                  const isSelected = country.iso2 === selectedIso;
                  return (
                    <button
                      key={country.iso2}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(country)}
                      className={`flex w-full items-center justify-between gap-2.5 px-3.5 py-2 text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#f7efe6] text-[#92704e] font-semibold'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {renderFlag(country.iso2, country.name)}
                        <span className="truncate">{country.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 font-mono text-xs text-stone-500">
                        <span>{country.dialCode}</span>
                        {isSelected && (
                          <HiCheck className="h-4 w-4 text-[#92704e]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
