/* eslint-disable react/prop-types */
import { useState, useMemo, useEffect } from 'react';
import { HiOutlineTrash, HiOutlineSearch, HiOutlineX, HiOutlinePlus, HiOutlineMinus } from 'react-icons/hi';
import FilterGroup from './FilterGroup';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatPrice } from '../../utils/currency';

/**
 * Shape Silhouette Line-Art Icon matching Angara Reference
 */
function ShapeSilhouette({ name = '', code = '' }) {
  const lower = (code || name).toLowerCase();
  let path = null;

  if (lower.includes('heart')) {
    path = (
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    );
  } else if (lower.includes('round')) {
    path = <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.5" />;
  } else if (lower.includes('oval')) {
    path = <ellipse cx="12" cy="12" rx="5.5" ry="8" fill="none" stroke="currentColor" strokeWidth="1.5" />;
  } else if (lower.includes('cushion') && lower.includes('rectangular')) {
    path = <rect x="5" y="4" width="14" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />;
  } else if (lower.includes('cushion')) {
    path = <rect x="4.5" y="4.5" width="15" height="15" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />;
  } else if (lower.includes('emerald') || lower.includes('rectangular')) {
    path = <rect x="5.5" y="3.5" width="13" height="17" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />;
  } else if (lower.includes('pear')) {
    path = (
      <path
        d="M12 3.5C9.5 8 6 12.5 6 16a6 6 0 0012 0c0-3.5-3.5-8-6-12.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    );
  } else if (lower.includes('marquise')) {
    path = (
      <path
        d="M12 2.5C7.5 7 4 12 4 12s3.5 5 8 9.5c4.5-4.5 8-9.5 8-9.5s-3.5-5-8-9.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    );
  } else if (lower.includes('princess')) {
    path = <rect x="4.5" y="4.5" width="15" height="15" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.5" />;
  } else if (lower.includes('melon')) {
    path = (
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4v16M4 12h16" strokeWidth="1" strokeDasharray="1 1" />
      </g>
    );
  }

  if (!path) return null;

  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-stone-700 shrink-0">
      {path}
    </svg>
  );
}

const formatStoneName = (name) => {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Filter Group Content with Search, Active Pills, and Visual Swatches
 */
function FilterOptionsList({ filter, isOptionSelected, handleToggleOption }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Selected options for this group
  const selectedOptions = useMemo(() => {
    return filter.options.filter((opt) => {
      const optVal = opt.value || opt.name || opt._id;
      const optName = opt.name || opt.value || opt._id;
      return isOptionSelected(filter.key, optVal, optName);
    });
  }, [filter, isOptionSelected]);

  // Filtered list matching search term
  const displayedOptions = useMemo(() => {
    if (!searchTerm.trim()) return filter.options;
    const q = searchTerm.toLowerCase().trim();
    return filter.options.filter((opt) => {
      const name = (opt.name || opt.value || opt.title || '').toLowerCase();
      const stone = (opt.stoneName || '').toLowerCase();
      return name.includes(q) || stone.includes(q);
    });
  }, [filter.options, searchTerm]);

  const showSearch =
    filter.key === 'gemstone' ||
    filter.key === 'gemstoneShape' ||
    filter.key === 'birthMonth' ||
    filter.options.length > 7;

  return (
    <div className="space-y-2">
      {/* 1. Selected Active Tag Pills (Matching Angara screenshot) */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5 pt-0.5">
          {selectedOptions.map((opt) => {
            const optVal = opt.value || opt.name || opt._id;
            const optName = opt.name || opt.value || opt._id;
            return (
              <button
                key={opt._id || optVal}
                type="button"
                onClick={() => handleToggleOption(filter.key, optVal, optName)}
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 10%, white)',
                  color: 'var(--btn-primary-bg, #8b6f4e)',
                  borderColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 28%, transparent)',
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border hover:opacity-85 transition-opacity cursor-pointer"
                title={`Remove ${optName}`}
              >
                <span>
                  {optName}
                  {filter.key === 'birthMonth' && opt.stoneName ? ` (${formatStoneName(opt.stoneName)})` : ''}
                </span>
                <HiOutlineX className="w-3.5 h-3.5" style={{ color: 'var(--btn-primary-bg, #8b6f4e)' }} />
              </button>
            );
          })}
        </div>
      )}

      {/* 2. In-group Search input */}
      {showSearch && (
        <div className="relative mb-3 flex items-center">
          <HiOutlineSearch className="absolute left-3 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${filter.title}...`}
            className="w-full h-9 pl-9 pr-8 rounded-lg border border-stone-200 bg-white text-xs sm:text-[13px] placeholder:text-stone-400 text-stone-800 shadow-2xs hover:border-stone-300 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              title="Clear search"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 3. Checkbox List (Scrollbar removed for luxury styling) */}
      <div
        className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-none no-scrollbar [&::-webkit-scrollbar]:hidden pr-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayedOptions.length === 0 ? (
          <div className="py-2 text-xs text-stone-400 italic">No matches found</div>
        ) : (
          displayedOptions.map((opt) => {
            const optVal = opt.value || opt.name || opt._id;
            const optName = opt.name || opt.value || opt._id;
            const isChecked = isOptionSelected(filter.key, optVal, optName);

            // Gemstone swatch background
            const isGradient = opt.colorCode && opt.colorCodeEnd && opt.colorCode !== opt.colorCodeEnd;
            const swatchBg = isGradient
              ? `linear-gradient(135deg, ${opt.colorCode} 0%, ${opt.colorCodeEnd} 100%)`
              : opt.colorCode || '#8A4F7D';

            return (
              <label
                key={opt._id || optVal}
                className="flex cursor-pointer items-center justify-between text-[13.5px] sm:text-sm text-stone-700 hover:text-stone-950 py-1 group/item select-none transition-colors"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleOption(filter.key, optVal, optName)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleToggleOption(filter.key, optVal, optName);
                      }
                    }}
                    style={{ accentColor: 'var(--btn-primary-bg, #8b6f4e)' }}
                    className="h-4 w-4 rounded border-stone-300 cursor-pointer shrink-0"
                  />

                  {/* Gemstone Swatch Badge (Screenshot 1) */}
                  {filter.key === 'gemstone' && (
                    <span
                      style={{ background: swatchBg }}
                      className="w-4 h-4 rounded-full border border-stone-300/80 shadow-2xs shrink-0 group-hover/item:scale-110 transition-transform"
                    />
                  )}

                  {/* Gemstone Shape Silhouette Icon (Screenshot 2) */}
                  {filter.key === 'gemstoneShape' && (
                    <ShapeSilhouette name={optName} code={opt.code || optVal} />
                  )}

                  {/* Birthstone Gem Swatch / Image */}
                  {filter.key === 'birthMonth' && (
                    <span className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden border border-stone-200/80 group-hover/item:scale-110 transition-transform">
                      {opt.imageUrl ? (
                        <img
                          src={opt.imageUrl}
                          alt={optName}
                          className="w-full h-full object-contain mix-blend-multiply"
                          loading="lazy"
                        />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                      )}
                    </span>
                  )}

                  <span className={`text-[13.5px] sm:text-sm truncate ${isChecked ? 'font-semibold text-stone-900' : 'text-stone-700'}`}>
                    {optName}
                    {filter.key === 'birthMonth' && opt.stoneName && (
                      <span className="text-xs text-stone-500 font-normal ml-1.5">
                        ({formatStoneName(opt.stoneName)})
                      </span>
                    )}
                  </span>
                </span>

                {typeof opt.count === 'number' && (
                  <span className="text-xs text-stone-400 font-normal shrink-0 ml-2">({opt.count})</span>
                )}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function FilterSidebar({
  filters = [],
  loading = false,
  params,
  onFilterChange,
  onPriceChange,
  onClearAll,
  filtersActive = false,
  currentCategoryParam = '',
}) {
  const { selectedCurrency } = useCurrency();
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const priceRangesParam = params.get('priceRanges') || '';

  const selectedPriceRanges = useMemo(
    () =>
      priceRangesParam
        ? priceRangesParam
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    [priceRangesParam]
  );

  // Local state for price inputs to prevent premature submission while typing
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const [showCustomPrice, setShowCustomPrice] = useState(Boolean(minPrice || maxPrice));

  useEffect(() => {
    setLocalMin(minPrice);
  }, [minPrice]);

  useEffect(() => {
    setLocalMax(maxPrice);
  }, [maxPrice]);

  useEffect(() => {
    if (minPrice || maxPrice) {
      setShowCustomPrice(true);
    }
  }, [minPrice, maxPrice]);

  const handleTogglePricePreset = (rangeVal) => {
    const val = String(rangeVal || '').trim();
    if (!val) return;
    const exists = selectedPriceRanges.includes(val);
    const next = exists
      ? selectedPriceRanges.filter((item) => item !== val)
      : [...selectedPriceRanges, val];
    onFilterChange('priceRanges', next.join(','));
  };

  const formatPresetRangeLabel = (opt) => {
    if (opt?.label) return opt.label;
    const hasMin = opt?.min !== null && opt?.min !== undefined && opt?.min !== '';
    const hasMax = opt?.max !== null && opt?.max !== undefined && opt?.max !== '';
    if (!hasMin && hasMax) return `Below ${formatPrice(opt.max)}`;
    if (hasMin && !hasMax) return `Above ${formatPrice(opt.min)}`;
    if (hasMin && hasMax) return `${formatPrice(opt.min)} - ${formatPrice(opt.max)}`;
    return opt?.name || opt?.value || '';
  };

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    if (localMin && localMax && Number(localMin) > Number(localMax)) {
      alert('Maximum price must be greater than minimum price.');
      return;
    }
    onPriceChange(localMin, localMax);
  };

  // Helper to check if a checkbox option is selected
  const isOptionSelected = (filterKey, optionValue, optionName) => {
    if (filterKey === 'category') {
      const activeCat = (params.get('category') || currentCategoryParam || '').toLowerCase();
      const val = String(optionValue || '').toLowerCase();
      const name = String(optionName || '').toLowerCase();
      return activeCat === val || activeCat === name;
    }
    const rawVal = params.get(filterKey) || '';
    if (!rawVal) return false;
    const parts = rawVal.split(',').map((s) => s.trim().toLowerCase());
    return (
      parts.includes(String(optionValue).toLowerCase()) ||
      parts.includes(String(optionName).toLowerCase())
    );
  };

  // Toggle option selection
  const handleToggleOption = (filterKey, optionValue, optionName) => {
    const val = optionValue || optionName;
    if (filterKey === 'category') {
      const current = (params.get('category') || currentCategoryParam || '').toLowerCase();
      const valLower = String(val || '').toLowerCase();
      const nameLower = String(optionName || '').toLowerCase();
      const isCurrent = current === valLower || current === nameLower;
      onFilterChange('category', isCurrent ? '' : val, true);
      return;
    }

    const rawVal = params.get(filterKey) || '';
    const parts = rawVal ? rawVal.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const lowerVal = String(val).toLowerCase();
    const existingIndex = parts.findIndex((p) => p.toLowerCase() === lowerVal);

    let nextParts;
    if (existingIndex >= 0) {
      nextParts = parts.filter((_, idx) => idx !== existingIndex);
    } else {
      nextParts = [...parts, val];
    }
    onFilterChange(filterKey, nextParts.join(','));
  };

  return (
    <aside aria-label="Product filters" className="min-w-0">
      {/* Header: Filters + CLEAR ALL */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
        <h2 className="text-[13px] sm:text-sm font-bold uppercase tracking-wider text-stone-900">
          Filters
        </h2>
        {filtersActive && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              borderColor: 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 40%, transparent)',
              color: 'var(--btn-primary-bg, #8b6f4e)',
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border bg-white hover:bg-stone-50 text-xs font-medium transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
          >
            <HiOutlineTrash className="w-3.5 h-3.5" style={{ color: 'var(--btn-primary-bg, #8b6f4e)' }} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div id="catalogue-filters" className="space-y-0">
        {loading && (!filters || filters.length === 0) ? (
          <div className="py-6 space-y-4">
            <div className="h-6 bg-stone-100 rounded animate-pulse" />
            <div className="h-6 bg-stone-100 rounded animate-pulse" />
            <div className="h-6 bg-stone-100 rounded animate-pulse" />
          </div>
        ) : (
          filters
            .filter((f) => {
              if (f.enabled === false) return false;
              if (f.type === 'checkbox' && (!f.options || f.options.length === 0)) return false;
              return true;
            })
            .map((filter) => {
              // Range Filter (Price Range: Preset Checkboxes + Custom Min/Max)
              if (filter.type === 'range' || filter.key === 'price') {
                const presetOptions =
                  Array.isArray(filter.options) && filter.options.length > 0
                    ? filter.options
                    : Array.isArray(filter.priceRanges)
                    ? filter.priceRanges
                    : [];
                const hasPriceActive = !!(minPrice || maxPrice || selectedPriceRanges.length > 0);
                const rawTitle = String(filter.title || '').trim();
                const rangeTitle = /price|budget|cost/i.test(rawTitle) ? rawTitle : 'Price Range';
                return (
                  <FilterGroup
                    key={filter.id || filter.key}
                    title={rangeTitle}
                    defaultOpen={Boolean(hasPriceActive)}
                  >
                    <div className="space-y-3 pt-1" data-currency={selectedCurrency?.code || 'INR'}>
                      {presetOptions.length > 0 && (
                        <div className="space-y-1.5">
                          {presetOptions.map((opt, idx) => {
                            const optMin = opt.min === undefined || opt.min === '' ? null : opt.min;
                            const optMax = opt.max === undefined || opt.max === '' ? null : opt.max;
                            const optVal = opt.value || `${optMin ?? ''}-${optMax ?? ''}`;
                            const isChecked = selectedPriceRanges.includes(optVal);
                            const displayLabel = formatPresetRangeLabel(opt);

                            return (
                              <label
                                key={opt._id || optVal || idx}
                                className="flex cursor-pointer items-center gap-2.5 text-[13.5px] sm:text-sm text-stone-700 hover:text-stone-950 py-1 select-none transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePricePreset(optVal)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleTogglePricePreset(optVal);
                                    }
                                  }}
                                  style={{ accentColor: 'var(--btn-primary-bg, #8b6f4e)' }}
                                  className="h-4 w-4 rounded border-stone-300 cursor-pointer shrink-0"
                                />
                                <span
                                  className={`text-[13.5px] sm:text-sm truncate ${
                                    isChecked ? 'font-semibold text-stone-900' : 'text-stone-700'
                                  }`}
                                >
                                  {displayLabel}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {presetOptions.length > 0 && (
                        <div className="pt-2 border-t border-stone-100">
                          <button
                            type="button"
                            onClick={() => setShowCustomPrice((prev) => !prev)}
                            className="flex w-full items-center justify-between py-1 text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors cursor-pointer select-none"
                            aria-expanded={showCustomPrice}
                          >
                            <span>Custom Min / Max Price</span>
                            {showCustomPrice ? (
                              <HiOutlineMinus className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                            ) : (
                              <HiOutlinePlus className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                            )}
                          </button>
                        </div>
                      )}

                      {(showCustomPrice || presetOptions.length === 0) && (
                        <form
                          onSubmit={handlePriceSubmit}
                          className="space-y-3 pt-1 animate-fadeIn"
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label
                                htmlFor="filter-price-min"
                                className="block text-xs font-medium text-stone-600 mb-1.5"
                              >
                                Min (₹)
                              </label>
                              <input
                                id="filter-price-min"
                                name="minPrice"
                                type="number"
                                min="0"
                                step="1"
                                value={localMin}
                                onChange={(e) => setLocalMin(e.target.value)}
                                placeholder="0"
                                className="w-full h-9 rounded-lg border border-stone-200 bg-white px-2.5 text-xs sm:text-sm text-stone-900 shadow-2xs hover:border-stone-300 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 transition-all"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="filter-price-max"
                                className="block text-xs font-medium text-stone-600 mb-1.5"
                              >
                                Max (₹)
                              </label>
                              <input
                                id="filter-price-max"
                                name="maxPrice"
                                type="number"
                                min="0"
                                step="1"
                                value={localMax}
                                onChange={(e) => setLocalMax(e.target.value)}
                                placeholder="Any"
                                className="w-full h-9 rounded-lg border border-stone-200 bg-white px-2.5 text-xs sm:text-sm text-stone-900 shadow-2xs hover:border-stone-300 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/20 transition-all"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full h-9 rounded-lg border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-xs sm:text-sm font-semibold text-stone-800 shadow-2xs cursor-pointer transition-all active:scale-[0.99]"
                          >
                            Apply Price
                          </button>
                        </form>
                      )}
                    </div>
                  </FilterGroup>
                );
              }

              // Checkbox Filter Groups (Including Gemstones & Gemstone Shapes)
              const activeVal = params.get(filter.key) || '';
              const isCategoryGroup = filter.key === 'category' || filter.id === 'jewellery-types';
              const isGroupActive = isCategoryGroup ? true : !!activeVal;

              return (
                <FilterGroup
                  key={filter.id || filter.key}
                  title={filter.title}
                  defaultOpen={isGroupActive}
                >
                  <FilterOptionsList
                    filter={filter}
                    isOptionSelected={isOptionSelected}
                    handleToggleOption={handleToggleOption}
                  />
                </FilterGroup>
              );
            })
        )}
      </div>
    </aside>
  );
}
