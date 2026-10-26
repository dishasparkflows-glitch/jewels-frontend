import api from '../../api/axios';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineAdjustments, HiOutlineX } from 'react-icons/hi';
import ProductCard from '../../components/product/ProductCard';
import FilterGroup from '../../components/product/FilterGroup';
import Dropdown from '../../components/common/Dropdown';
import { categoriesAPI, productsAPI } from '../../api/services';

const slugify = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const aliases = { necklaces: 'pendant', bracelets: 'bangles-bracelets' };
const getItems = (response) => Array.isArray(response?.data?.data) ? response.data.data : response?.data?.data?.items || [];

export default function Shop() {
  const { websiteConfig } = useStoreSettings();
  const [params, setParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [diamondTypes, setDiamondTypes] = useState([]);
  const [diamondClarities, setDiamondClarities] = useState([]);
  const [caratWeights, setCaratWeights] = useState([]);
  const [collections, setCollections] = useState([]);
  const [birthstones, setBirthstones] = useState([]);
  const [shopForOptions, setShopForOptions] = useState([
    { value: 'Women', label: 'Women' },
    { value: 'Men', label: 'Men' },
    { value: 'Kids', label: 'Kids' },
    { value: 'Unisex', label: 'Unisex' },
  ]);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ totalDocs: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [navigationError, setNavigationError] = useState(false);
  const [navigationReady, setNavigationReady] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [retry, setRetry] = useState(0);

  // URL Params
  const categoryParam = params.get('category') || '';
  const category = categories.find((entry) => entry._id === categoryParam || slugify(entry.slug || entry.name) === (aliases[categoryParam] || categoryParam));
  const categoryId = category?._id || (/^[a-f0-9]{24}$/i.test(categoryParam) ? categoryParam : '');

  const menuItem = params.get('menuItem') || '';
  const shopFor = params.get('shopFor') || '';
  const selectedAudiences = shopFor.split(',').filter(Boolean);
  const search = params.get('search') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const selectedDiamondType = params.get('diamondType') || '';
  const selectedClarity = params.get('clarity') || '';
  const selectedCarat = params.get('carat') || '';
  const selectedCollection = params.get('collection') || '';
  const selectedBirthstone = params.get('birthstone') || '';
  const sort = params.get('sort') || 'newest';
  const page = Math.max(1, Number(params.get('page')) || 1);

  // 1. Fetch Navigation & Common Filters in parallel (Single common API returning needed value & _id)
  useEffect(() => {
    let current = true;

    Promise.allSettled([
      categoriesAPI.getNavigation(),
      api.get('/products/filters'),
    ]).then(([catsRes, filtersRes]) => {
      if (!current) return;

      if (catsRes.status === 'fulfilled') {
        setCategories(getItems(catsRes.value));
        setNavigationError(false);
      } else {
        setNavigationError(true);
      }

      if (filtersRes.status === 'fulfilled') {
        const filtersData = filtersRes.value?.data?.data;
        if (Array.isArray(filtersData)) {
          // If returned as an array of filter groups
          filtersData.forEach((group) => {
            if ((group.key === 'diamondType' || group.id === 'diamond-types') && Array.isArray(group.options)) {
              setDiamondTypes(group.options);
            }
            if ((group.key === 'clarity' || group.id === 'diamond-clarities') && Array.isArray(group.options)) {
              setDiamondClarities(group.options);
            }
            if ((group.key === 'carat' || group.id === 'carat-weights') && Array.isArray(group.options)) {
              setCaratWeights(group.options);
            }
            if ((group.key === 'collection' || group.id === 'collections') && Array.isArray(group.options)) {
              setCollections(group.options);
            }
          });
        } else if (filtersData && typeof filtersData === 'object') {
          // If returned as an object with arrays
          if (Array.isArray(filtersData.diamondTypes)) setDiamondTypes(filtersData.diamondTypes);
          if (Array.isArray(filtersData.diamondClarities)) setDiamondClarities(filtersData.diamondClarities);
          if (Array.isArray(filtersData.caratWeights)) setCaratWeights(filtersData.caratWeights);
          if (Array.isArray(filtersData.collections)) setCollections(filtersData.collections);
        }
      }
    }).finally(() => {
      if (current) setNavigationReady(true);
    });

    return () => { current = false; };
  }, [retry]);

  // 2. Fetch Products
  useEffect(() => {
    if (!navigationReady) return;
    let current = true;
    setLoading(true);
    setError('');

    const query = { status: 'approved', page, limit: 24, sort, includeFacets: true, includeGroups: true };
    if (shopFor) query.shopFor = shopFor;
    if (categoryId) query.category = categoryId;
    if (menuItem) query.menuItem = menuItem;
    if (search) query.search = search;
    if (minPrice) query.minPrice = minPrice;
    if (maxPrice) query.maxPrice = maxPrice;

    productsAPI.getAll(query).then((response) => {
      if (current) {
        setProducts(getItems(response));
        if (response.data?.facets?.shopFor?.length) {
          setShopForOptions(response.data.facets.shopFor);
        }
        setPagination(response.data?.pagination || { totalDocs: getItems(response).length, totalPages: 1 });
      }
    }).catch(() => {
      if (current) {
        setError('We could not load the jewellery collection. Please try again.');
        setProducts([]);
      }
    }).finally(() => {
      if (current) setLoading(false);
    });

    return () => { current = false; };
  }, [navigationReady, categoryId, menuItem, search, minPrice, maxPrice, sort, page, retry, shopFor]);

  function updateFilters(changes) {
    const next = new URLSearchParams(params);
    next.delete('page');
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setParams(next);
  }

  function applyPrice(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const min = data.get('minPrice');
    const max = data.get('maxPrice');
    if (min && max && Number(min) > Number(max)) {
      event.currentTarget.elements.maxPrice.setCustomValidity('Maximum price must be greater than minimum price.');
      event.currentTarget.elements.maxPrice.reportValidity();
      return;
    }
    updateFilters({ minPrice: min, maxPrice: max });
  }

  // Active filters check
  const filtersActive =
    categoryParam ||
    menuItem ||
    search ||
    minPrice ||
    maxPrice ||
    shopFor ||
    selectedDiamondType ||
    selectedClarity ||
    selectedCarat ||
    selectedCollection ||
    selectedBirthstone;

  // Client-side attribute refinement for granular master filters
  const displayedProducts = products.filter((prod) => {
    const text = `${prod.basicInfo?.title || prod.name || ''} ${prod.basicInfo?.description || ''}`.toLowerCase();
    if (selectedDiamondType) {
      const dtLower = selectedDiamondType.toLowerCase();
      const matchInText = text.includes(dtLower) || (dtLower.includes('lab') && text.includes('lab'));
      const matchInRows = prod.centerDiamondRows?.some((r) => r.diamondTypeId?.name?.toLowerCase() === dtLower);
      if (!matchInText && !matchInRows) return false;
    }
    if (selectedClarity) {
      const clarityLower = selectedClarity.toLowerCase();
      const matchInText = text.includes(clarityLower);
      const matchInRows = prod.centerDiamondRows?.some((r) => r.diamondClarityId?.name?.toLowerCase() === clarityLower);
      if (!matchInText && !matchInRows) return false;
    }
    if (selectedCarat) {
      const numMatch = selectedCarat.match(/[\d.]+/);
      if (numMatch) {
        const val = parseFloat(numMatch[0]);
        const caratInProd = prod.pricing?.baseCarat || prod.specifications?.metalWeight;
        if (caratInProd && Math.abs(caratInProd - val) > 0.3) {
          // Keep if text matches
          if (!text.includes(numMatch[0])) return false;
        }
      }
    }
    if (selectedBirthstone) {
      if (!text.includes(selectedBirthstone.toLowerCase())) return false;
    }
    if (selectedCollection) {
      const matchFeatured = prod.featuredIds?.some((f) => (f.name || f.title || f).toLowerCase() === selectedCollection.toLowerCase());
      if (!text.includes(selectedCollection.toLowerCase()) && !matchFeatured) return false;
    }
    return true;
  });

  const displayCount = (selectedDiamondType || selectedClarity || selectedCarat || selectedCollection || selectedBirthstone)
    ? displayedProducts.length
    : (pagination.totalDocs || products.length);

  // Active chips array
  const activeChips = [
    category?.name && { label: category.name, onRemove: () => updateFilters({ category: '', menuItem: '' }) },
    search && { label: `Search: ${search}`, onRemove: () => updateFilters({ search: '' }) },
    (minPrice || maxPrice) && {
      label: `₹${minPrice || '0'} – ${maxPrice ? `₹${maxPrice}` : 'Any'}`,
      onRemove: () => updateFilters({ minPrice: '', maxPrice: '' }),
    },
    ...selectedAudiences.map((aud) => ({
      label: aud,
      onRemove: () =>
        updateFilters({
          shopFor: selectedAudiences.filter((v) => v !== aud).join(','),
        }),
    })),
    selectedDiamondType && { label: selectedDiamondType, onRemove: () => updateFilters({ diamondType: '' }) },
    selectedClarity && { label: selectedClarity, onRemove: () => updateFilters({ clarity: '' }) },
    selectedCarat && { label: selectedCarat, onRemove: () => updateFilters({ carat: '' }) },
    selectedCollection && { label: selectedCollection, onRemove: () => updateFilters({ collection: '' }) },
    selectedBirthstone && { label: selectedBirthstone, onRemove: () => updateFilters({ birthstone: '' }) },
  ].filter(Boolean);

  // 1st display gold products, then silver products (unless explicit price sort)
  const sortedDisplayedProducts = useMemo(() => {
    const isPriceSorted = sort === 'price-low' || sort === 'price-high';
    if (isPriceSorted) return displayedProducts;
    return [...displayedProducts].sort((a, b) => {
      const isGoldA = (a.productType || a.representative?.productType || '').toLowerCase() === 'gold' ? 0 : 1;
      const isGoldB = (b.productType || b.representative?.productType || '').toLowerCase() === 'gold' ? 0 : 1;
      return isGoldA - isGoldB;
    });
  }, [displayedProducts, sort]);

  // Page title: When nothing in filter, display 'All Jewellery'
  const pageTitle = category?.name || (search ? `Search: "${search}"` : (selectedCollection || 'All Jewellery'));

  return (
    <div className="min-h-[75vh] bg-white px-4 pb-16 pt-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        {/* ─── Category Header Title (Centered) ─── */}
        <div className="py-4 sm:py-6 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[40px] text-stone-900 tracking-tight capitalize">
            {pageTitle}
          </h1>
        </div>

        {/* ─── Top Meta Toolbar (Results Count & Sort) ─── */}
        <div className="flex items-center justify-between py-3.5 mb-6 border-b border-stone-200/80">
          <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-stone-600 font-medium">
            <span>{displayCount} Results Found</span>
            <span
              title="Count of jewellery matching current selection"
              className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[10px] text-stone-400 hover:text-stone-700 cursor-help"
            >
              ⓘ
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFilters(!mobileFilters)}
              className="flex items-center gap-1.5 rounded border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 lg:hidden cursor-pointer"
            >
              <HiOutlineAdjustments className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider text-stone-500">
              SORT BY:
            </span>
            <Dropdown
              value={sort}
              onChange={(val) => updateFilters({ sort: val })}
              options={[
                { value: 'newest', label: 'Newest' },
                { value: 'price-low', label: 'Price: Low to High' },
                { value: 'price-high', label: 'Price: High to Low' },
              ]}
              buttonClassName="h-8 px-2.5 rounded border border-stone-200 bg-white text-xs font-medium text-stone-800 flex items-center gap-2 hover:border-stone-300 focus:outline-none cursor-pointer"
              menuClassName="z-[40] w-44"
            />
          </div>
        </div>

        {/* ─── Main Grid: Left Filters & Right Products ─── */}
        <div className="grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-12">
          {/* Left Filter Sidebar */}
          <aside aria-label="Product filters" className="min-w-0">
            {/* Header: Filters + CLEAR ALL */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
              <h2 className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-stone-900">
                Filters
              </h2>
              {filtersActive && (
                <button
                  type="button"
                  onClick={() => setParams({})}
                  className="text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 underline underline-offset-2 cursor-pointer"
                >
                  CLEAR ALL
                </button>
              )}
            </div>

            <div id="catalogue-filters" className={`${mobileFilters ? 'block' : 'hidden'} lg:block`}>
              {/* 1. JEWELLERY TYPES */}
              <FilterGroup title="Jewellery Types" defaultOpen={!!category}>
                {navigationError ? (
                  <button onClick={() => setRetry((v) => v + 1)} className="text-xs text-red-600 underline">
                    Retry loading
                  </button>
                ) : (
                  categories.map((entry) => {
                    const isChecked = categoryId === entry._id || categoryParam === entry.slug;
                    return (
                      <label key={entry._id} className="flex cursor-pointer items-center justify-between text-xs text-stone-700 hover:text-stone-900 py-1">
                        <span className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              updateFilters({
                                category: isChecked ? '' : (entry.slug || entry._id),
                                menuItem: '',
                              })
                            }
                            className="h-3.5 w-3.5 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] cursor-pointer"
                          />
                          <span>{entry.name}</span>
                        </span>
                      </label>
                    );
                  })
                )}
              </FilterGroup>

              {/* 2. PRICE RANGE */}
              <FilterGroup title="Price Range" defaultOpen={!!(minPrice || maxPrice)}>
                <form key={`${minPrice}-${maxPrice}`} onSubmit={applyPrice} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1 text-[11px] text-stone-600">
                      Min (₹)
                      <input
                        name="minPrice"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={minPrice}
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
                        defaultValue={maxPrice}
                        placeholder="Any"
                        className="w-full rounded border border-stone-300 p-2 text-xs focus:outline-none focus:border-[#8b6f4e]"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded border border-stone-300 py-1.5 text-xs font-semibold hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    Apply price
                  </button>
                </form>
              </FilterGroup>

              {/* 3. DIAMOND WEIGHT */}
              <FilterGroup title="Diamond Weight" defaultOpen={!!selectedCarat}>
                {caratWeights.length ? (
                  caratWeights.map((cw) => {
                    const label = cw.name || cw.weight || cw.range || (typeof cw === 'string' ? cw : '');
                    if (!label) return null;
                    const isChecked = selectedCarat === label;
                    return (
                      <label key={label} className="flex cursor-pointer items-center justify-between text-xs text-stone-700 hover:text-stone-900 py-1">
                        <span className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => updateFilters({ carat: isChecked ? '' : label })}
                            className="h-3.5 w-3.5 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] cursor-pointer"
                          />
                          <span>{label}</span>
                        </span>
                      </label>
                    );
                  })
                ) : (
                  ['0.50 Carat', '0.75 Carat', '1.00 Carat', '1.50 Carat', '2.00 Carat'].map((label) => {
                    const isChecked = selectedCarat === label;
                    return (
                      <label key={label} className="flex cursor-pointer items-center justify-between text-xs text-stone-700 hover:text-stone-900 py-1">
                        <span className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => updateFilters({ carat: isChecked ? '' : label })}
                            className="h-3.5 w-3.5 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] cursor-pointer"
                          />
                          <span>{label}</span>
                        </span>
                      </label>
                    );
                  })
                )}
              </FilterGroup>

              {/* 4. DIAMOND TYPE */}
              <FilterGroup title="Diamond Type" defaultOpen={!!selectedDiamondType}>
                {(diamondTypes.length ? diamondTypes : [{ name: 'Natural Diamond' }, { name: 'Lab Grown Diamond' }]).map((dt) => {
                  const label = dt.name || (typeof dt === 'string' ? dt : '');
                  if (!label) return null;
                  const isChecked = selectedDiamondType === label;
                  return (
                    <label key={label} className="flex cursor-pointer items-center justify-between text-xs text-stone-700 hover:text-stone-900 py-1">
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => updateFilters({ diamondType: isChecked ? '' : label })}
                          className="h-3.5 w-3.5 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] cursor-pointer"
                        />
                        <span>{label}</span>
                      </span>
                    </label>
                  );
                })}
              </FilterGroup>

              {/* 5. COLLECTIONS */}
              <FilterGroup title="Collections" defaultOpen={!!selectedCollection || !!menuItem}>
                {(collections.length ? collections : [{ name: 'Solitaire Jewellery' }, { name: 'Eternal Sparkle' }, { name: 'Heart Jewellery' }]).map((coll) => {
                  const label = coll.name || coll.title || (typeof coll === 'string' ? coll : '');
                  if (!label) return null;
                  const isChecked = selectedCollection === label;
                  return (
                    <label key={label} className="flex cursor-pointer items-center justify-between text-xs text-stone-700 hover:text-stone-900 py-1">
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => updateFilters({ collection: isChecked ? '' : label })}
                          className="h-3.5 w-3.5 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] cursor-pointer"
                        />
                        <span>{label}</span>
                      </span>
                    </label>
                  );
                })}
              </FilterGroup>

              {/* 6. DIAMOND CLARITIES */}
              <FilterGroup title="Diamond Clarities" defaultOpen={!!selectedClarity}>
                {(diamondClarities.length ? diamondClarities : [{ name: 'SI' }, { name: 'VS' }, { name: 'VVS' }, { name: 'FL-IF' }]).map((dc) => {
                  const label = dc.name || (typeof dc === 'string' ? dc : '');
                  if (!label) return null;
                  const isChecked = selectedClarity === label;
                  return (
                    <label key={label} className="flex cursor-pointer items-center justify-between text-xs text-stone-700 hover:text-stone-900 py-1">
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => updateFilters({ clarity: isChecked ? '' : label })}
                          className="h-3.5 w-3.5 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] cursor-pointer"
                        />
                        <span>{label}</span>
                      </span>
                    </label>
                  );
                })}
              </FilterGroup>

              {/* 7. BIRTHSTONES (Disabled for now as requested) */}
              {/*
              <FilterGroup title="Birthstones" defaultOpen={!!selectedBirthstone}>
                {birthstones.length ? (
                  birthstones.map((bs) => {
                    const label = bs.stoneName ? `${bs.stoneName} (${bs.month})` : (bs.name || '');
                    const val = bs.stoneName || bs.name || '';
                    if (!val) return null;
                    const isChecked = selectedBirthstone === val;
                    return (
                      <label key={val} className="flex cursor-pointer items-center justify-between text-xs text-stone-700 hover:text-stone-900 py-1">
                        <span className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => updateFilters({ birthstone: isChecked ? '' : val })}
                            className="h-3.5 w-3.5 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] cursor-pointer"
                          />
                          <span>{label}</span>
                        </span>
                      </label>
                    );
                  })
                ) : (
                  ['Aquamarine (March)', 'Diamond (April)', 'Emerald (May)', 'Ruby (July)', 'Sapphire (September)'].map((label) => {
                    const isChecked = selectedBirthstone === label;
                    return (
                      <label key={label} className="flex cursor-pointer items-center justify-between text-xs text-stone-700 hover:text-stone-900 py-1">
                        <span className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => updateFilters({ birthstone: isChecked ? '' : label })}
                            className="h-3.5 w-3.5 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] cursor-pointer"
                          />
                          <span>{label}</span>
                        </span>
                      </label>
                    );
                  })
                )}
              </FilterGroup>
              */}

              {/* 8. GENDER */}
              <FilterGroup title="Gender" defaultOpen={!!selectedAudiences.length}>
                {shopForOptions.map((option) => (
                  <label key={option.value} className="flex cursor-pointer items-center justify-between text-xs text-stone-700 hover:text-stone-900 py-1">
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={selectedAudiences.includes(option.value)}
                        onChange={() =>
                          updateFilters({
                            shopFor: selectedAudiences.includes(option.value)
                              ? selectedAudiences.filter((v) => v !== option.value).join(',')
                              : [...selectedAudiences, option.value].join(','),
                          })
                        }
                        className="h-3.5 w-3.5 rounded border-stone-300 text-[#8b6f4e] accent-[#8b6f4e] cursor-pointer"
                      />
                      <span>{option.label}</span>
                    </span>
                    {typeof option.count === 'number' && (
                      <span className="text-[11px] text-stone-400">({option.count})</span>
                    )}
                  </label>
                ))}
              </FilterGroup>
            </div>
          </aside>

          {/* Right Product Grid Column */}
          <section aria-label="Jewellery catalogue" aria-busy={loading} className="min-w-0">
            {/* Active Filter Chips */}
            {activeChips.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {activeChips.map(({ label, onRemove }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={onRemove}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700 hover:border-stone-400 transition-colors cursor-pointer"
                    aria-label={`Remove ${label} filter`}
                  >
                    <span>{label}</span>
                    <HiOutlineX className="w-3.5 h-3.5 text-stone-400 hover:text-stone-700" />
                  </button>
                ))}
              </div>
            )}

            {/* Products Grid / Skeletons / Empty */}
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="animate-pulse rounded-2xl border border-stone-100 bg-white p-3.5">
                    <div className="aspect-square rounded-xl bg-stone-100" />
                    <div className="mt-4 h-3 w-4/5 bg-stone-100 rounded" />
                    <div className="mt-2 h-3 w-1/2 bg-stone-100 rounded" />
                    <div className="mt-4 h-4 w-1/3 bg-stone-100 rounded" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div role="alert" className="py-20 text-center">
                <p className="text-sm text-stone-600">{error}</p>
                <button
                  onClick={() => setRetry((v) => v + 1)}
                  className="mt-5 rounded border border-stone-300 px-5 py-2 text-sm hover:bg-stone-50 cursor-pointer"
                >
                  Try again
                </button>
              </div>
            ) : sortedDisplayedProducts.length ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {sortedDisplayedProducts.map((product) => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <h2 className="text-xl text-stone-800 font-serif">No products available</h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-stone-500">
                  {filtersActive
                    ? 'No published products match these filters. Try clearing your filters or choosing another category.'
                    : 'Our collection will appear here as products become available.'}
                </p>
                {filtersActive && (
                  <button
                    onClick={() => setParams({})}
                    className="mt-6 rounded border border-stone-300 px-5 py-2.5 text-sm hover:bg-stone-50 cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && !error && pagination.totalPages > 1 && (
              <nav aria-label="Product pages" className="mt-12 flex items-center justify-center gap-5 text-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => setParams({ ...Object.fromEntries(params), page: String(page - 1) })}
                  className="rounded border border-stone-200 px-4 py-2 hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-stone-600">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setParams({ ...Object.fromEntries(params), page: String(page + 1) })}
                  className="rounded border border-stone-200 px-4 py-2 hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </nav>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
