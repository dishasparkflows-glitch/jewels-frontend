import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineAdjustments, HiOutlineX } from 'react-icons/hi';
import ProductCard from '../../components/product/ProductCard';
import FilterGroup from '../../components/product/FilterGroup';
import { categoriesAPI, productsAPI } from '../../api/services';

const slugify = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const aliases = { necklaces: 'pendant', bracelets: 'bangles-bracelets' };
const getItems = (response) => Array.isArray(response.data.data) ? response.data.data : response.data.data?.items || [];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [shopForOptions, setShopForOptions] = useState([]);
  const [pagination, setPagination] = useState({ totalDocs: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [navigationError, setNavigationError] = useState(false);
  const [navigationReady, setNavigationReady] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [retry, setRetry] = useState(0);
  const categoryParam = params.get('category') || '';
  const category = categories.find((entry) => entry._id === categoryParam || slugify(entry.slug || entry.name) === (aliases[categoryParam] || categoryParam));
  const categoryId = category?._id || (/^[a-f0-9]{24}$/i.test(categoryParam) ? categoryParam : '');
  const menuItem = params.get('menuItem') || '';
  const selectedItem = categories.flatMap((entry) => entry.menuSections || []).flatMap((section) => section.menuItems || []).find((item) => item._id === menuItem);
  const shopFor = params.get('shopFor') || '';
  const selectedAudiences = shopFor.split(',').filter(Boolean);
  const search = params.get('search') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const sort = params.get('sort') || 'newest';
  const page = Math.max(1, Number(params.get('page')) || 1);

  useEffect(() => {
    let current = true;
    categoriesAPI.getNavigation().then((response) => {
      if (current) { setCategories(getItems(response)); setNavigationError(false); }
    }).catch(() => { if (current) setNavigationError(true); })
      .finally(() => { if (current) setNavigationReady(true); });
    return () => { current = false; };
  }, [retry]);

  useEffect(() => {
    if (!navigationReady) return;
    let current = true;
    setLoading(true);
    setError('');
    const query = { status: 'active', page, limit: 24, sort, includeFacets: true, includeGroups: true };
    if (shopFor) query.shopFor = shopFor;
    if (categoryId) query.category = categoryId;
    if (menuItem) query.menuItem = menuItem;
    if (search) query.search = search;
    if (minPrice) query.minPrice = minPrice;
    if (maxPrice) query.maxPrice = maxPrice;
    productsAPI.getAll(query).then((response) => {
      if (current) {
        setProducts(getItems(response));
        setShopForOptions(response.data.facets?.shopFor || []);
        setPagination(response.data.pagination || { totalDocs: getItems(response).length, totalPages: 1 });
      }
    }).catch(() => {
      if (current) { setError('We could not load the jewellery collection. Please try again.'); setProducts([]); }
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [navigationReady, categoryId, menuItem, search, minPrice, maxPrice, sort, page, retry, shopFor]);

  function updateFilters(changes) {
    const next = new URLSearchParams(params);
    next.delete('page');
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
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
  const sections = category?.menuSections || [];
  const filtersActive = categoryParam || menuItem || search || minPrice || maxPrice || shopFor;

  return (
    <div className="min-h-[75vh] bg-white px-4 pb-16 pt-8 sm:px-8 lg:pt-12">
      <div className="mx-auto max-w-[1380px]">
        <div className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <button onClick={() => setParams({})} className="hover:text-stone-900">All Jewellery</button>
          {category && <><span>/</span><span>{category.name}</span></>}
          {selectedItem && <><span>/</span><span>{selectedItem.name}</span></>}
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-14">
          <aside aria-label="Product filters" className="min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="hidden text-xl font-medium lg:block">Filters</h2>
              <button type="button" onClick={() => setMobileFilters(!mobileFilters)} aria-expanded={mobileFilters} aria-controls="catalogue-filters" className="flex items-center gap-2 rounded border border-stone-200 px-4 py-2 text-sm lg:hidden"><HiOutlineAdjustments /> Filters</button>
              {filtersActive && <button onClick={() => setParams({})} className="text-xs text-stone-500 underline underline-offset-4">Clear all</button>}
            </div>
            <div id="catalogue-filters" className={`${mobileFilters ? 'block' : 'hidden'} mt-3 lg:block`}>
              <FilterGroup title="Jewellery Types" defaultOpen={!!category}>
                {navigationError ? <button onClick={() => setRetry((value) => value + 1)} className="underline">Retry loading filters</button> : categories.map((entry) => <label key={entry._id} className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={categoryId === entry._id} onChange={() => updateFilters({ category: categoryId === entry._id ? '' : entry._id, menuItem: '' })} className="h-4 w-4 accent-[#8b6f4e]" />{entry.name}</label>)}
              </FilterGroup>
              <FilterGroup title="Price Range" defaultOpen={!!(minPrice || maxPrice)}>
                <form key={`${minPrice}-${maxPrice}`} onSubmit={applyPrice} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1 text-xs">Min (₹)<input name="minPrice" type="number" min="0" step="0.01" defaultValue={minPrice} placeholder="0" className="w-full rounded border border-stone-300 p-2" /></label>
                    <label className="space-y-1 text-xs">Max (₹)<input name="maxPrice" type="number" min="0" step="0.01" defaultValue={maxPrice} placeholder="Any" onInput={(event) => event.target.setCustomValidity('')} className="w-full rounded border border-stone-300 p-2" /></label>
                  </div>
                  <button type="submit" className="w-full rounded border border-stone-300 py-2 text-xs hover:bg-stone-50">Apply price</button>
                </form>
              </FilterGroup>
              <FilterGroup title="Shop For" defaultOpen>
                {loading && !shopForOptions.length ? <p className="text-xs text-stone-400">Loading options…</p> : !shopForOptions.length ? <p className="text-xs text-stone-500">Filter options are temporarily unavailable.</p> : shopForOptions.map((option) => <label key={option.value} className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={selectedAudiences.includes(option.value)} onChange={() => updateFilters({ shopFor: (selectedAudiences.includes(option.value) ? selectedAudiences.filter((value) => value !== option.value) : [...selectedAudiences, option.value]).join(',') })} className="h-4 w-4 accent-[#8b6f4e]" />
                  <span>{option.label} <span className="text-stone-500">({loading ? '…' : option.count.toLocaleString('en-IN')})</span></span>
                </label>)}
              </FilterGroup>
              {sections.filter((section) => section.menuItems?.length).map((section) => <FilterGroup key={section._id} title={section.name} defaultOpen={section.menuItems.some((item) => item._id === menuItem)}>{section.menuItems.map((item) => <label key={item._id} className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={menuItem === item._id} onChange={() => updateFilters({ menuItem: menuItem === item._id ? '' : item._id })} className="h-4 w-4 accent-[#8b6f4e]" />{item.name}</label>)}</FilterGroup>)}
            </div>
          </aside>
          <section aria-label="Jewellery catalogue" aria-busy={loading} className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 lg:mb-8">
              <h1 className="text-lg font-medium sm:text-xl">{loading ? 'Loading products…' : error ? 'Jewellery' : `${pagination.totalDocs} Products`}</h1>
              <label className="flex items-center gap-3 text-xs text-stone-500">Sort by:
                <select value={sort} onChange={(event) => updateFilters({ sort: event.target.value })} className="max-w-[180px] border-0 bg-white py-2 pr-6 text-sm text-stone-900 focus:outline-[#8b6f4e]">
                  <option value="newest">Newest</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option>
                </select>
              </label>
            </div>
            {filtersActive && <div className="mb-6 flex flex-wrap gap-2">{[...shopForOptions.filter((option) => selectedAudiences.includes(option.value)).map((option) => [option.label, { shopFor: selectedAudiences.filter((value) => value !== option.value).join(',') }]), [category?.name, { category: '', menuItem: '' }], [selectedItem?.name, { menuItem: '' }], [search && `Search: ${search}`, { search: '' }], [(minPrice || maxPrice) && `₹${minPrice || '0'} – ${maxPrice ? `₹${maxPrice}` : 'Any'}`, { minPrice: '', maxPrice: '' }]].filter(([label]) => label).map(([label, changes]) => <button key={label} onClick={() => updateFilters(changes)} className="flex items-center gap-2 rounded-full border border-stone-200 px-3 py-1.5 text-xs text-stone-600" aria-label={`Remove ${label} filter`}>{label}<HiOutlineX /></button>)}</div>}
            {loading ? <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 sm:gap-4">{Array.from({ length: 6 }, (_, index) => <div key={index} className="animate-pulse rounded-2xl border border-stone-100 p-3"><div className="aspect-square rounded-xl bg-stone-100" /><div className="mt-4 h-3 w-full bg-stone-100" /><div className="mt-3 h-3 w-2/3 bg-stone-100" /><div className="mt-4 h-4 w-1/3 bg-stone-100" /></div>)}</div>
              : error ? <div role="alert" className="py-20 text-center"><p className="text-sm text-stone-600">{error}</p><button onClick={() => setRetry((value) => value + 1)} className="mt-5 rounded border border-stone-300 px-5 py-2 text-sm">Try again</button></div>
              : products.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 xl:grid-cols-3">{products.map((product) => <ProductCard key={product._id || product.id} product={product} />)}</div>
              : <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><h2 className="text-xl text-stone-800">No products available</h2><p className="mt-3 max-w-sm text-sm leading-6 text-stone-500">{filtersActive ? 'No published products match these filters. Try another category or clear your filters.' : 'Our collection will appear here as products become available.'}</p>{filtersActive && <button onClick={() => setParams({})} className="mt-6 rounded border border-stone-300 px-5 py-2.5 text-sm hover:bg-stone-50">Clear filters</button>}</div>}
            {!loading && !error && pagination.totalPages > 1 && <nav aria-label="Product pages" className="mt-10 flex items-center justify-center gap-5 text-sm"><button disabled={page <= 1} onClick={() => setParams({ ...Object.fromEntries(params), page: String(page - 1) })} className="rounded border px-3 py-2 disabled:opacity-40">Previous</button><span>Page {page} of {pagination.totalPages}</span><button disabled={page >= pagination.totalPages} onClick={() => setParams({ ...Object.fromEntries(params), page: String(page + 1) })} className="rounded border px-3 py-2 disabled:opacity-40">Next</button></nav>}
          </section>
        </div>
      </div>
    </div>
  );
}
