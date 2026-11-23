import api from '../../api/axios';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineAdjustments, HiOutlineX, HiOutlineTrash, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineTag, HiOutlineCheck, HiOutlineInformationCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import ProductCard from '../../components/product/ProductCard';
import FilterSidebar from '../../components/product/FilterSidebar';
import Dropdown from '../../components/common/Dropdown';
import LuxuryDivider from '../../components/common/LuxuryDivider';
import { categoriesAPI, productsAPI, bannersAPI, couponsAPI } from '../../api/services';

const slugify = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const aliases = { necklaces: 'pendant', bracelets: 'bangles-bracelets' };
const getItems = (response) => Array.isArray(response?.data?.data) ? response.data.data : response?.data?.data?.items || [];

export default function Shop({ defaultCategory = '' }) {
  const { settings, theme } = useStoreSettings();
  const themeColor = settings?.themeColors?.buttonColor || settings?.buttonColor || theme?.colors?.primary || '#8b6f4e';
  const themeTextColor = settings?.themeColors?.buttonTextColor || settings?.buttonTextColor || '#ffffff';
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
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [couponIndex, setCouponIndex] = useState(0);
  const [copiedCouponCode, setCopiedCouponCode] = useState(null);

  // Fetch all active promotional coupons (displayed one by one)
  useEffect(() => {
    let current = true;
    couponsAPI
      .getLookup()
      .then((res) => {
        if (!current) return;
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setActiveCoupons(list);
        setCouponIndex(0);
      })
      .catch(() => {
        if (current) setActiveCoupons([]);
      });
    return () => {
      current = false;
    };
  }, []);

  // Auto-rotate multiple coupons every 5 seconds
  useEffect(() => {
    if (activeCoupons.length <= 1) return;
    const timer = setInterval(() => {
      setCouponIndex((prev) => (prev + 1) % activeCoupons.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeCoupons.length]);

  const handleCopyCoupon = (code) => {
    if (!code) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCouponCode(code);
    toast.success(`Coupon "${code}" copied to clipboard!`);
    setTimeout(() => {
      setCopiedCouponCode((prev) => (prev === code ? null : prev));
    }, 2500);
  };

  const currentCoupon = activeCoupons[couponIndex] || null;

  const getCouponDisplayText = (item) => {
    if (!item) return { code: '', discountPhrase: '' };
    const code = item.coupon?.code || item.code || '';
    const desc = item.coupon?.description || item.description || '';
    const discountType = item.discount?.type || 'Fixed';
    const discountVal = item.discount?.value || 0;
    const minOrder = item.discount?.minimumOrderAmount || 0;

    let discountPhrase = '';
    if (discountType === 'Fixed') {
      discountPhrase = `GET ${discountVal} RS OFF`;
    } else if (discountType === 'Percentage') {
      discountPhrase = `GET ${discountVal}% OFF`;
    } else if (desc) {
      discountPhrase = desc.toUpperCase();
    }

    let minOrderPhrase = '';
    if (minOrder && Number(minOrder) > 0) {
      minOrderPhrase = ` ON ORDERS ABOVE ₹${Number(minOrder).toLocaleString('en-IN')}`;
    }

    return {
      code,
      discountPhrase: `${discountPhrase}${minOrderPhrase}`,
    };
  };

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
  const promoBanner = params.get('promoBanner') || '';
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
  const selectedGemstone = params.get('gemstone') || params.get('stone_names') || '';
  const selectedGemstoneShape = params.get('gemstoneShape') || params.get('stone_shapes') || '';
  const selectedBirthMonth = params.get('birthMonth') || '';
  const sort = params.get('sort') || 'newest';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const limit = [12, 24, 48].includes(Number(params.get('limit'))) ? Number(params.get('limit')) : 12;

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch {
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
        const items = getItems(catsRes);
        const sorted = [...(items || [])].sort((a, b) => {
          const diff = (Number(a.order) || 0) - (Number(b.order) || 0);
          if (diff !== 0) return diff;
          return String(a.name || a.title || '').localeCompare(String(b.name || b.title || ''));
        });
        setCategories(sorted);
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
            'promoBanner',
            'search',
            'sort',
            'page',
            'minPrice',
            'maxPrice',
            'birthMonth',
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
      forweb: true,
      page,
      limit,
      sort,
      includeFacets: true,
      includeGroups: true,
    };
    if (featuredParam) query.featured = featuredParam;
    if (categoryId || categoryParam) query.category = categoryId || categoryParam;
    if (promoBanner) query.promoBanner = promoBanner;
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
    if (selectedGemstone) query.gemstone = selectedGemstone;
    if (selectedGemstoneShape) query.gemstoneShape = selectedGemstoneShape;
    if (selectedBirthMonth) {
      query.birthMonth = selectedBirthMonth.split(',').map((s) => s.trim()).filter(Boolean);
    }

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
    promoBanner,
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
    selectedGemstone,
    selectedGemstoneShape,
    selectedBirthMonth,
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
    !!promoBanner ||
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
    !!selectedStockStatus ||
    !!selectedGemstone ||
    !!selectedGemstoneShape ||
    !!selectedBirthMonth;

  const featuredTitle = featuredData?.name || titleParam || '';

  // Active chips array
  const activeChips = [];
  if (featuredParam) {
    activeChips.push({
      label: featuredTitle || 'Showcase',
      onRemove: () => updateFilters({ featured: '', title: '' }),
    });
  }
  if (category?.name) {
    activeChips.push({
      label: category.name,
      onRemove: () => updateFilters({ category: '', menuItem: '', promoBanner: '', title: '' }),
    });
  }
  if (promoBanner) {
    const bannerObj = (category?.promoBanners || []).find((b) => String(b._id) === String(promoBanner));
    activeChips.push({
      label: bannerObj?.title ? `Promo: ${bannerObj.title}` : 'Promo Banner',
      onRemove: () => updateFilters({ promoBanner: '' }),
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
    'birthMonth',
    'shopFor',
    'diamondType',
    'clarity',
    'carat',
    'collection',
    'metal',
    'stockStatus',
    'gemstone',
    'gemstoneShape',
  ];

  multiFilterKeys.forEach((key) => {
    const raw = params.get(key) || '';
    if (!raw) return;
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    parts.forEach((val) => {
      activeChips.push({
        label: key === 'birthMonth' ? `Month: ${val}` : val,
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
      const isGoldA = (a.productType || '').toLowerCase() === 'gold' ? 0 : 1;
      const isGoldB = (b.productType || '').toLowerCase() === 'gold' ? 0 : 1;
      return isGoldA - isGoldB;
    });
  }, [displayedProducts, sort]);

  // Page title: When nothing in filter, display 'All Jewellery'
  const pageTitle =
    featuredTitle ||
    titleParam ||
    category?.name ||
    (selectedBirthMonth ? `Birthstone: ${selectedBirthMonth}` : '') ||
    (search ? `Search: "${search}"` : (selectedCollection || 'All Jewellery'));

  return (
    <div className="min-h-[75vh] bg-white">
      {/* ─── Top Category Banner Image (Exact Match: 100% full width, max-h-[360px], object-cover, bg-[#FAF7F2]) ─── */}
      {displayBanner && (
        <div className="w-full relative overflow-hidden bg-[#FAF7F2]">
          {displayBanner.image?.mediaType === 'video' ? (
            <video
              src={displayBanner.image?.url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto block max-h-[360px] object-cover"
            />
          ) : (
            <img
              src={displayBanner.image?.url}
              className="w-full h-auto block max-h-[360px] object-cover"
              alt={displayBanner.content?.title || category?.name || pageTitle || 'Category Banner'}
            />
          )}
        </div>
      )}

      {/* ─── Category Coupon Code Strip (Styled with active storefront dark header theme) ─── */}
      {currentCoupon && (
        <div
          style={{
            backgroundColor: 'var(--storefront-header-bg, #201e1b)',
            color: 'var(--storefront-header-text, #ffffff)',
          }}
          className="w-full py-1 sm:py-1.5 px-4 shadow-xs border-t border-b border-white/10 select-none flex items-center justify-center transition-colors"
        >
          <div className="max-w-7xl w-full mx-auto flex items-center justify-between sm:justify-center relative">
            {activeCoupons.length > 1 && (
              <button
                type="button"
                onClick={() => setCouponIndex((prev) => (prev - 1 + activeCoupons.length) % activeCoupons.length)}
                className="p-0.5 text-white/70 hover:text-[#d2b18a] transition-colors mr-2 sm:absolute sm:left-4"
                title="Previous coupon"
                aria-label="Previous coupon"
              >
                <HiOutlineChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {(() => {
              const { code, discountPhrase } = getCouponDisplayText(currentCoupon);
              return (
                <button
                  type="button"
                  onClick={() => handleCopyCoupon(code)}
                  className="group inline-flex items-center justify-center gap-1.5 text-[9.5px] sm:text-[10.5px] md:text-[11px] tracking-[0.16em] uppercase font-normal text-white/95 hover:text-white transition-all cursor-pointer focus:outline-none leading-tight"
                  title="Click to copy coupon code"
                >
                  <HiOutlineTag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#d2b18a] group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="truncate">
                    USE CODE <strong className="font-bold underline decoration-dotted underline-offset-2 tracking-[0.18em] text-[#d2b18a] group-hover:text-amber-200 transition-colors">'{code}'</strong> {discountPhrase}
                  </span>
                  {copiedCouponCode === code && (
                    <span className="inline-flex items-center gap-0.5 text-[9.5px] font-semibold bg-[#d2b18a] text-stone-900 px-1.5 py-0.5 rounded-full ml-1.5 normal-case tracking-normal flex-shrink-0 shadow-xs">
                      <HiOutlineCheck className="w-2.5 h-2.5 text-stone-900" /> Copied!
                    </span>
                  )}
                </button>
              );
            })()}

            {activeCoupons.length > 1 && (
              <button
                type="button"
                onClick={() => setCouponIndex((prev) => (prev + 1) % activeCoupons.length)}
                className="p-0.5 text-white/70 hover:text-[#d2b18a] transition-colors ml-2 sm:absolute sm:right-4"
                title="Next coupon"
                aria-label="Next coupon"
              >
                <HiOutlineChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="px-4 pb-16 pt-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
        {/* ─── Category Header Title (Centered) ─── */}
        <div className="py-2.5 sm:py-3 text-center">
          <h1 className="font-serif text-xl sm:text-2xl lg:text-[26px] text-stone-900 tracking-tight capitalize">
            {pageTitle}
          </h1>
          <LuxuryDivider
            lineWidth="w-10 sm:w-16"
            starSize="w-2.5 h-2.5 sm:w-3 sm:h-3"
            className="mt-1.5 sm:mt-2"
          />
        </div>

        {/* ─── Top Meta Toolbar (Results Count & Sort) ─── */}
        <div className="flex items-center justify-between py-3.5 mb-6 border-b border-stone-200/80">
          <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-stone-600 font-medium">
            <span>
              {displayCount} {displayCount === 1 ? 'product' : 'products'} found
            </span>
            <span
              title="Count of jewellery matching current selection"
              className="inline-flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-help transition-colors"
            >
              <HiOutlineInformationCircle className="w-4 h-4" />
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
                  updateFilters({ category: value, menuItem: '', promoBanner: '' });
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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 sm:gap-x-3.5 gap-y-3 sm:gap-y-6">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="animate-pulse rounded-lg sm:rounded-xl border border-gray-100 bg-white p-2 sm:p-2.5">
                    <div className="aspect-square rounded-md sm:rounded-lg bg-stone-100" />
                    <div className="mt-2.5 h-3 w-4/5 bg-stone-100 rounded" />
                    <div className="mt-1.5 h-3 w-1/2 bg-stone-100 rounded" />
                    <div className="mt-2.5 h-3.5 w-1/3 bg-stone-100 rounded" />
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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 sm:gap-x-3.5 gap-y-3 sm:gap-y-6">
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
