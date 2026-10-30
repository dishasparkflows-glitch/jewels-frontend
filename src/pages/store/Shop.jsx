import api from '../../api/axios';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineAdjustments, HiOutlineX } from 'react-icons/hi';
import ProductCard from '../../components/product/ProductCard';
import FilterSidebar from '../../components/product/FilterSidebar';
import Dropdown from '../../components/common/Dropdown';
import LuxuryDivider from '../../components/common/LuxuryDivider';
import { categoriesAPI, productsAPI } from '../../api/services';

const slugify = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const aliases = { necklaces: 'pendant', bracelets: 'bangles-bracelets' };
const getItems = (response) => Array.isArray(response?.data?.data) ? response.data.data : response?.data?.data?.items || [];

export default function Shop() {
  useStoreSettings();
  const [params, setParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [dynamicFilters, setDynamicFilters] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

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
  const search = params.get('search') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const selectedDiamondType = params.get('diamondType') || '';
  const selectedClarity = params.get('clarity') || '';
  const selectedCarat = params.get('carat') || '';
  const selectedCollection = params.get('collection') || '';
  const selectedMetal = params.get('metal') || '';
  const selectedStockStatus = params.get('stockStatus') || '';
  const sort = params.get('sort') || 'newest';
  const page = Math.max(1, Number(params.get('page')) || 1);

  // 1. Fetch Categories for navigation
  useEffect(() => {
    let current = true;
    categoriesAPI
      .getNavigation()
      .then((catsRes) => {
        if (!current) return;
        setCategories(getItems(catsRes));
        setNavigationError(false);
      })
      .catch(() => {
        if (current) setNavigationError(true);
      })
      .finally(() => {
        if (current) setNavigationReady(true);
      });

    return () => { current = false; };
  }, [retry]);

  // 2. Fetch Category-Specific Filters Dynamically
  useEffect(() => {
    let current = true;
    setLoadingFilters(true);
    const catQuery = categoryId || categoryParam;

    api
      .get('/filters', { params: catQuery ? { category: catQuery } : {} })
      .then((res) => {
        if (!current) return;
        const data = res.data?.data;
        const filterList = Array.isArray(data) ? data : (data?.filters || []);
        setDynamicFilters(filterList);

        // When switching category, prune incompatible filter keys from URL params
        if (catQuery && filterList.length > 0) {
          const validKeys = new Set([
            'category',
            'menuItem',
            'search',
            'sort',
            'page',
            'minPrice',
            'maxPrice',
            ...filterList.map((f) => f.key),
          ]);
          const next = new URLSearchParams(params);
          let changed = false;
          for (const key of Array.from(next.keys())) {
            if (!validKeys.has(key)) {
              next.delete(key);
              changed = true;
            }
          }
          if (changed) {
            setParams(next, { replace: true });
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load category filters:', err);
      })
      .finally(() => {
        if (current) setLoadingFilters(false);
      });

    return () => { current = false; };
  }, [categoryParam, categoryId]);

  // 3. Fetch Products with all active filters executed on backend
  useEffect(() => {
    if (!navigationReady) return;
    let current = true;
    setLoading(true);
    setError('');

    const query = {
      status: 'approved',
      page,
      limit: 24,
      sort,
      includeFacets: true,
      includeGroups: true,
    };
    if (categoryId || categoryParam) query.category = categoryId || categoryParam;
    if (menuItem) query.menuItem = menuItem;
    if (shopFor) query.shopFor = shopFor;
    if (search) query.search = search;
    if (minPrice) query.minPrice = minPrice;
    if (maxPrice) query.maxPrice = maxPrice;
    if (selectedDiamondType) query.diamondType = selectedDiamondType;
    if (selectedClarity) query.clarity = selectedClarity;
    if (selectedCarat) query.carat = selectedCarat;
    if (selectedCollection) query.collection = selectedCollection;
    if (selectedMetal) query.metal = selectedMetal;
    if (selectedStockStatus) query.stockStatus = selectedStockStatus;

    productsAPI
      .getAll(query)
      .then((response) => {
        if (current) {
          setProducts(getItems(response));
          setPagination(response.data?.pagination || { totalDocs: getItems(response).length, totalPages: 1 });
        }
      })
      .catch(() => {
        if (current) {
          setError('We could not load the jewellery collection. Please try again.');
          setProducts([]);
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => { current = false; };
  }, [
    navigationReady,
    categoryId,
    categoryParam,
    menuItem,
    search,
    minPrice,
    maxPrice,
    sort,
    page,
    retry,
    shopFor,
    selectedDiamondType,
    selectedClarity,
    selectedCarat,
    selectedCollection,
    selectedMetal,
    selectedStockStatus,
  ]);

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
    !!categoryParam ||
    !!menuItem ||
    !!search ||
    !!minPrice ||
    !!maxPrice ||
    !!shopFor ||
    !!selectedDiamondType ||
    !!selectedClarity ||
    !!selectedCarat ||
    !!selectedCollection ||
    !!selectedMetal ||
    !!selectedStockStatus;

  // Active chips array
  const activeChips = [];
  if (category?.name) {
    activeChips.push({
      label: category.name,
      onRemove: () => updateFilters({ category: '', menuItem: '' }),
    });
  }
  if (search) {
    activeChips.push({
      label: `Search: ${search}`,
      onRemove: () => updateFilters({ search: '' }),
    });
  }
  if (minPrice || maxPrice) {
    activeChips.push({
      label: `₹${minPrice || '0'} – ${maxPrice ? `₹${maxPrice}` : 'Any'}`,
      onRemove: () => updateFilters({ minPrice: '', maxPrice: '' }),
    });
  }

  const multiFilterKeys = [
    'shopFor',
    'diamondType',
    'clarity',
    'carat',
    'collection',
    'metal',
    'stockStatus',
  ];

  multiFilterKeys.forEach((key) => {
    const raw = params.get(key) || '';
    if (!raw) return;
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    parts.forEach((val) => {
      activeChips.push({
        label: val,
        onRemove: () => {
          const nextParts = parts.filter((p) => p !== val);
          updateFilters({ [key]: nextParts.join(',') });
        },
      });
    });
  });

  const displayedProducts = products;
  const displayCount = pagination.totalDocs || products.length;

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
          <LuxuryDivider className="mt-2.5 sm:mt-3" />
        </div>

        {/* ─── Top Meta Toolbar (Results Count & Sort) ─── */}
        <div className="flex items-center justify-between py-3.5 mb-6 border-b border-stone-200/80">
          <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-stone-600 font-medium">
            <span>
              {displayCount} {displayCount === 1 ? 'product' : 'products'} found
            </span>
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
              size="sm"
              className="w-44 sm:w-48"
              menuClassName="z-[40] w-48 sm:w-52 right-0 left-auto"
            />
          </div>
        </div>

        {/* ─── Main Grid: Left Filters & Right Products ─── */}
        <div className="grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-12">
          {/* Left Filter Sidebar */}
          <div className={`${mobileFilters ? 'block' : 'hidden'} lg:block`}>
            <FilterSidebar
              filters={dynamicFilters}
              loading={loadingFilters}
              params={params}
              onFilterChange={(key, value, isCategory) => {
                if (isCategory) {
                  updateFilters({ category: value, menuItem: '' });
                } else {
                  updateFilters({ [key]: value });
                }
              }}
              onPriceChange={(min, max) => updateFilters({ minPrice: min, maxPrice: max })}
              onClearAll={() => setParams({})}
              filtersActive={filtersActive}
              categories={categories}
              currentCategoryParam={categoryParam}
            />
          </div>

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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-2 sm:gap-x-4 gap-y-3 sm:gap-y-8">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="animate-pulse rounded-lg sm:rounded-xl border border-gray-100 bg-white p-2 sm:p-3.5">
                    <div className="aspect-square rounded-md sm:rounded-lg bg-stone-100" />
                    <div className="mt-3 h-3 w-4/5 bg-stone-100 rounded" />
                    <div className="mt-2 h-3 w-1/2 bg-stone-100 rounded" />
                    <div className="mt-3 h-4 w-1/3 bg-stone-100 rounded" />
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-2 sm:gap-x-4 gap-y-3 sm:gap-y-8">
                {sortedDisplayedProducts.map((product) => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <h2 className="text-xl text-stone-800 font-serif">No products available</h2>
                {filtersActive && (
                  <button
                    onClick={() => setParams({})}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#d6c7b2] hover:border-[#8b6f4e] px-4 py-2 text-xs sm:text-[13px] font-medium text-[#8b6f4e] bg-white hover:bg-[#FAF7F2] transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                  >
                    <HiOutlineTrash className="w-4 h-4 text-[#8b6f4e]" />
                    <span>Clear All Filters</span>
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
