/* eslint-disable react/prop-types */
import { useState } from 'react';
import { HiOutlineTrash } from 'react-icons/hi';
import FilterGroup from './FilterGroup';

export default function FilterSidebar({
  filters = [],
  loading = false,
  params,
  onFilterChange,
  onPriceChange,
  onClearAll,
  filtersActive = false,
  categories = [],
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
      // Switching category
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
              // Hide empty checkbox filters or disabled filters
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

              // Checkbox Filter Groups
              const activeVal = params.get(filter.key) || '';
              const isGroupActive = filter.key === 'category'
                ? !!currentCategoryParam
                : !!activeVal;

              return (
                <FilterGroup
                  key={filter.id || filter.key}
                  title={filter.title}
                  defaultOpen={isGroupActive}
                >
                  {filter.options.map((opt) => {
                    const optVal = opt.value || opt.name || opt._id;
                    const optName = opt.name || opt.value || opt._id;
                    const isChecked = isOptionSelected(filter.key, optVal, optName);

                    return (
                      <label
                        key={opt._id || optVal}
                        className="flex cursor-pointer items-center justify-between text-xs text-stone-700 hover:text-stone-900 py-1"
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleOption(filter.key, optVal, optName)}
                            className="h-3.5 w-3.5 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] cursor-pointer"
                          />
                          <span>{optName}</span>
                        </span>
                        {typeof opt.count === 'number' && (
                          <span className="text-[11px] text-stone-400">({opt.count})</span>
                        )}
                      </label>
                    );
                  })}
                </FilterGroup>
              );
            })
        )}
      </div>
    </aside>
  );
}

