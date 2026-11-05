import api from '../../api/axios';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineAdjustments, HiOutlineX, HiOutlineTrash, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import ProductCard from '../../components/product/ProductCard';
import FilterSidebar from '../../components/product/FilterSidebar';
import Dropdown from '../../components/common/Dropdown';
import LuxuryDivider from '../../components/common/LuxuryDivider';
import { categoriesAPI, productsAPI, bannersAPI } from '../../api/services';

const slugify = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const aliases = { necklaces: 'pendant', bracelets: 'bangles-bracelets' };
const getItems = (response) => Array.isArray(response?.data?.data) ? response.data.data : response?.data?.data?.items || [];

export default function Shop({ defaultCategory = '' }) {
  useStoreSettings();
  const [params, setParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [dynamicFilters, setDynamicFilters] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ totalDocs: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [navigationReady, setNavigationReady] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [retry, setRetry] = useState(0);

  // URL Params
  const categoryParam = params.get('category') || defaultCategory || '';
  const category = categories.find((entry) => entry._id === categoryParam || slugify(entry.slug || entry.name) === (aliases[categoryParam] || categoryParam));
  const categoryId = category?._id || (/^[a-f0-9]{24}$/i.test(categoryParam) ? categoryParam : '');

  const featuredParam = params.get('featured') || '';
  const titleParam = params.get('title') || '';
  const [featuredData, setFeaturedData] = useState(null);
  const [displayBanner, setDisplayBanner] = useState(null);

  // Fetch Category Display Banner when category is selected
  useEffect(() => {
    const targetCat = categoryId || category?._id || categoryParam;
    if (!targetCat) {
      setDisplayBanner(null);
      return;
    }
    let current = true;
    bannersAPI
      .getCategoryDisplay({ category: targetCat, platform: 'web' })
      .then((res) => {
        if (!current) return;
        const bannerData = res?.data?.data?.banner || null;
        setDisplayBanner(bannerData);
      })
      .catch(() => {
        if (current) setDisplayBanner(null);
      });
    return () => { current = false; };
  }, [categoryId, category?._id, categoryParam]);

  // Fetch featured showcase details when featuredParam is present
  useEffect(() => {
    if (!featuredParam) {
      setFeaturedData(null);
      return;
    }
    let current = true;
    api
      .get(`/featured/${featuredParam}`)
      .then((res) => {
        if (!current) return;
        setFeaturedData(res.data?.data || null);
      })
      .catch(() => {});
    return () => { current = false; };
  }, [featuredParam]);

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
  const limit = [12, 24, 48].includes(Number(params.get('limit'))) ? Number(params.get('limit')) : 12;

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch (_) {
      window.scrollTo(0, 0);
    }
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    scrollToTop();
    const timer = setTimeout(scrollToTop, 60);
    return () => clearTimeout(timer);
  }, [page, limit]);

  const goToPage = (newPage) => {
    if (newPage < 1 || (pagination.totalPages && newPage > pagination.totalPages)) return;
    const next = new URLSearchParams(params);
    if (newPage <= 1) {
      next.delete('page');
    } else {
      next.set('page', String(newPage));
    }
    setParams(next);
    scrollToTop();
    requestAnimationFrame(scrollToTop);
  };

  const getPageNumbers = (current, total) => {
    if (!total || total <= 1) return [1];
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // 1. Fetch Categories for navigation
  useEffect(() => {
    let current = true;
    categoriesAPI
      .getNavigation()
      .then((catsRes) => {
        if (!current) return;
        setCategories(getItems(catsRes));
      })
      .catch(() => {})
      .finally(() => {
        if (current) setNavigationReady(true);
      });

    return () => { current = false; };
  }, [retry]);

  // 2. Fetch Category-Specific Filters Dynamically
  useEffect(() => {
    let current = true;
    setLoadingFilters(true);
    const featCatId = featuredData?.categoryId?._id || featuredData?.categoryId;
    const catQuery = categoryId || categoryParam || featCatId;

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
            'featured',
            'title',
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
  }, [categoryParam, categoryId, featuredData]);

  // 3. Fetch Products with all active filters executed on backend
  useEffect(() => {
    if (!navigationReady) return;
    let current = true;
    setLoading(true);
    setError('');

    const query = {
      status: 'approved',
      page,
      limit,
      sort,
      includeFacets: true,
      includeGroups: true,
    };
    if (featuredParam) query.featured = featuredParam;
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
    featuredParam,
    categoryId,
    categoryParam,
    menuItem,
    search,
    minPrice,
    maxPrice,
    sort,
    page,
    limit,
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

  // Active filters check
  const filtersActive =
    !!featuredParam ||
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

  // Formatted fallback title for featured slug (e.g. "necklace" -> "Necklace", "solitaire-jewellery" -> "Solitaire Jewellery")
  const formattedFeaturedTitle =
    featuredData?.name ||
    (featuredParam && !/^[a-f0-9]{24}$/i.test(featuredParam)
      ? featuredParam
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : '');

  // Active chips array
  const activeChips = [];
  if (featuredParam) {
    activeChips.push({
      label: titleParam || formattedFeaturedTitle || 'Showcase',
      onRemove: () => updateFilters({ featured: '', title: '' }),
    });
  }
  if (category?.name) {
    activeChips.push({
      label: category.name,
      onRemove: () => updateFilters({ category: '', menuItem: '', title: '' }),
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
  const pageTitle =
    titleParam ||
    formattedFeaturedTitle ||
    category?.name ||
    (search ? `Search: "${search}"` : (selectedCollection || 'All Jewellery'));

  return (
    <div className="min-h-[75vh] bg-white">
      {/* ─── Top Category Banner Image (Exact Match: 100% full width, max-h-[360px], object-cover, bg-[#FAF7F2]) ─── */}
      {displayBanner && (
        <div className="w-full relative overflow-hidden bg-[#FAF7F2]">
          {displayBanner.mediaType === 'video' ? (
            <video
              src={displayBanner.video?.url || displayBanner.image?.url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto block max-h-[360px] object-cover"
            />
          ) : (
            <img
              src={displayBanner.image?.url || displayBanner.video?.url}
              className="w-full h-auto block max-h-[360px] object-cover"
              alt={displayBanner.title || category?.name || pageTitle || 'Category Banner'}
            />
          )}
        </div>
      )}

      <div className="px-4 pb-16 pt-4 sm:px-8 lg:px-12">
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-2 sm:gap-x-4 gap-y-3 sm:gap-y-8">
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
            {!loading && !error && pagination.totalDocs > 0 && (
              <nav
                aria-label="Product pagination"
                className="mt-12 sm:mt-16 pt-8 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                {/* Product count summary */}
                <div className="text-xs sm:text-sm text-stone-500 font-medium order-2 sm:order-1">
                  Showing{' '}
                  <span className="font-semibold text-stone-800">
                    {Math.min((page - 1) * limit + 1, pagination.totalDocs)}
                  </span>
                  {' '}–{' '}
                  <span className="font-semibold text-stone-800">
                    {Math.min(page * limit, pagination.totalDocs)}
                  </span>
                  {' '}of{' '}
                  <span className="font-semibold text-stone-800">
                    {pagination.totalDocs}
                  </span>
                  {' '}{pagination.totalDocs === 1 ? 'product' : 'products'}
                </div>

                {/* Page Buttons */}
                <div className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2">
                  {/* Previous Page Button */}
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-[#FAF7F2] hover:border-[#8b6f4e] hover:text-[#8b6f4e] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-stone-200 disabled:hover:text-stone-700 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                    aria-label="Previous page"
                    title="Previous page"
                  >
                    <HiOutlineChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Numbered Page Buttons */}
                  {getPageNumbers(page, pagination.totalPages).map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 py-1 text-xs sm:text-sm text-stone-400 select-none"
                        >
                          …
                        </span>
                      );
                    }
                    const isActive = pageNum === page;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => goToPage(pageNum)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`min-w-[36px] h-9 px-3 flex items-center justify-center text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-[#8b6f4e] text-white border border-[#8b6f4e] shadow-xs font-semibold'
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-[#FAF7F2] hover:border-[#8b6f4e] hover:text-[#8b6f4e]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next Page Button */}
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => goToPage(page + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-[#FAF7F2] hover:border-[#8b6f4e] hover:text-[#8b6f4e] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-stone-200 disabled:hover:text-stone-700 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                    aria-label="Next page"
                    title="Next page"
                  >
                    <HiOutlineChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Per Page Dropdown Selector */}
                <div className="flex items-center gap-2 text-xs text-stone-500 font-medium order-3">
                  <span className="hidden sm:inline">Items:</span>
                  <Dropdown
                    value={limit}
                    onChange={(val) => {
                      const next = new URLSearchParams(params);
                      next.delete('page');
                      next.set('limit', String(val));
                      setParams(next);
                      scrollToTop();
                      requestAnimationFrame(scrollToTop);
                    }}
                    options={[
                      { value: 12, label: '12' },
                      { value: 24, label: '24' },
                      { value: 48, label: '48' },
                    ]}
                    size="sm"
                    direction="up"
                    className="w-24 sm:w-28 text-xs"
                    menuClassName="min-w-[6rem]"
                    showDivider={false}
                  />
                </div>
              </nav>
            )}
          </section>
        </div>
        </div>
      </div>
    </div>
  );
}
