/* eslint-disable react/prop-types */
import { useState, useMemo } from 'react';
import { HiOutlineTrash, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import FilterGroup from './FilterGroup';

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
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-stone-700 shrink-0">
      {path}
    </svg>
  );
}

/**
 * Filter Group Content with Search, Active Pills, and Visual Swatches
 */
function FilterOptionsList({ filter, params, isOptionSelected, handleToggleOption }) {
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
      const name = (opt.name || opt.value || '').toLowerCase();
      return name.includes(q);
    });
  }, [filter.options, searchTerm]);

  const showSearch =
    filter.key === 'gemstone' ||
    filter.key === 'gemstoneShape' ||
    filter.options.length > 7;

  return (
    <div className="space-y-2">
      {/* 1. Selected Active Tag Pills (Matching Angara screenshot) */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-1">
          {selectedOptions.map((opt) => {
            const optVal = opt.value || opt.name || opt._id;
            const optName = opt.name || opt.value || opt._id;
            return (
              <button
                key={opt._id || optVal}
                type="button"
                onClick={() => handleToggleOption(filter.key, optVal, optName)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#faf6f0] text-[#8b6f4e] border border-[#ebdcc8] hover:bg-[#f3ebe0] transition-colors cursor-pointer"
                title={`Remove ${optName}`}
              >
                <span>{optName}</span>
                <HiOutlineX className="w-3 h-3 text-[#8b6f4e]" />
              </button>
            );
          })}
        </div>
      )}

      {/* 2. In-group Search input (Matching Angara screenshot) */}
      {showSearch && (
        <div className="relative mb-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${filter.title}`}
            className="w-full h-8 pl-3 pr-8 rounded-lg border border-stone-200/90 bg-stone-50/60 text-[11px] placeholder:text-stone-400 text-stone-800 focus:outline-none focus:border-[#8b6f4e] focus:bg-white transition-all"
          />
          <HiOutlineSearch className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
        </div>
      )}

      {/* 3. Scrollable Checkbox List */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {displayedOptions.length === 0 ? (
          <div className="py-2 text-[11px] text-stone-400 italic">No matches found</div>
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
                className="flex cursor-pointer items-center justify-between text-xs text-stone-700 hover:text-stone-900 py-0.5 group/item select-none"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleOption(filter.key, optVal, optName)}
                    className="h-3.5 w-3.5 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] cursor-pointer"
                  />

                  {/* Gemstone Swatch Badge (Screenshot 1) */}
                  {filter.key === 'gemstone' && (
                    <span
                      style={{ background: swatchBg }}
                      className="w-3.5 h-3.5 rounded-full border border-stone-300/80 shadow-2xs shrink-0 group-hover/item:scale-110 transition-transform"
                    />
                  )}

                  {/* Gemstone Shape Silhouette Icon (Screenshot 2) */}
                  {filter.key === 'gemstoneShape' && (
                    <ShapeSilhouette name={optName} code={opt.code || optVal} />
                  )}

                  <span className={isChecked ? 'font-semibold text-stone-900' : 'text-stone-700'}>
                    {optName}
                  </span>
                </span>

                {typeof opt.count === 'number' && (
                  <span className="text-[11px] text-stone-400 font-normal">({opt.count})</span>
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
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';

  // Local state for price inputs to prevent premature submission while typing
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

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
      const activeCat = params.get('category') || '';
      return activeCat === optionValue || activeCat === optionName;
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
      const current = params.get('category') || '';
      const isCurrent = current === optionValue || current === optionName;
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
        <h2 className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-stone-900">
          Filters
        </h2>
        {filtersActive && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#d6c7b2] hover:border-[#8b6f4e] bg-white hover:bg-[#FAF7F2] text-[#8b6f4e] text-xs font-medium transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
          >
            <HiOutlineTrash className="w-3.5 h-3.5 text-[#8b6f4e]" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div id="catalogue-filters" className="space-y-0">
        {loading ? (
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
              // Range Filter (Price Range)
              if (filter.type === 'range' || filter.key === 'price') {
                const hasPriceActive = !!(minPrice || maxPrice);
                return (
                  <FilterGroup
                    key={filter.id || filter.key}
                    title={filter.title || 'Price Range'}
                    defaultOpen={hasPriceActive}
                  >
                    <form onSubmit={handlePriceSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="space-y-1 text-[11px] text-stone-600">
                          Min (₹)
                          <input
                            name="minPrice"
                            type="number"
                            min="0"
                            step="1"
                            value={localMin}
                            onChange={(e) => setLocalMin(e.target.value)}
                            placeholder="0"
                            className="w-full rounded border border-stone-300 p-2 text-xs focus:outline-none focus:border-[#8b6f4e]"
                          />
                        </label>
                        <label className="space-y-1 text-[11px] text-stone-600">
                          Max (₹)
                          <input
                            name="maxPrice"
                            type="number"
                            min="0"
                            step="1"
                            value={localMax}
                            onChange={(e) => setLocalMax(e.target.value)}
                            placeholder="Any"
                            className="w-full rounded border border-stone-300 p-2 text-xs focus:outline-none focus:border-[#8b6f4e]"
                          />
                        </label>
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded border border-stone-300 py-1.5 text-xs font-semibold hover:bg-stone-50 cursor-pointer transition-colors"
                      >
                        Apply Price
                      </button>
                    </form>
                  </FilterGroup>
                );
              }

              // Checkbox Filter Groups (Including Gemstones & Gemstone Shapes)
              const activeVal = params.get(filter.key) || '';
              const isGroupActive =
                filter.key === 'category' ? !!currentCategoryParam : !!activeVal;

              return (
                <FilterGroup
                  key={filter.id || filter.key}
                  title={filter.title}
                  defaultOpen={isGroupActive}
                >
                  <FilterOptionsList
                    filter={filter}
                    params={params}
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
