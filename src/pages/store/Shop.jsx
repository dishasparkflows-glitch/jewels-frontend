import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { HiStar, HiOutlineShoppingBag, HiOutlineAdjustments, HiOutlineHeart, HiHeart } from 'react-icons/hi';
import { getPrimaryProductImage } from '../../utils/productImages';
import { productsAPI, categoriesAPI } from '../../api/services';

const CATEGORY_ALIASES = {
  pendant: 'necklaces',
  pendants: 'necklaces',
  'pendant-necklaces': 'necklaces',
  'bangles-bracelets': 'bracelets',
  bangles: 'bracelets',
};

const slugify = (value = '') => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const normalizeCategory = (value = 'all') => {
  const slug = slugify(value);
  return CATEGORY_ALIASES[slug] || slug;
};
const asArray = (value) => (Array.isArray(value) ? value : value == null ? [] : [value]);
const referenceId = (value) => {
  if (value && typeof value === 'object') return String(value._id || value.id || '');
  return String(value || '');
};

const formatPrice = (price) => {
  const amount = Number(price);
  return amount > 0 ? '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '';
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = normalizeCategory(searchParams.get('category') || 'all');
  const activeSubcategory = searchParams.get('subcategory') || '';
  const searchQuery = searchParams.get('search') || '';
  const [sortBy, setSortBy] = useState('featured');
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [shopCategories, setShopCategories] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  useEffect(() => {
    let isCurrent = true;
    const loadCatalog = async () => {
      setCatalogLoading(true);
      try {
        const categoryResponse = await categoriesAPI.getLookup({ status: 'active' });
        const categoryData = categoryResponse?.data?.data;
        const apiCategories = Array.isArray(categoryData?.items) ? categoryData.items : Array.isArray(categoryData) ? categoryData : [];
        const selectedCategory = apiCategories.find((category) =>
          String(category._id || category.id) === activeCategory
          || normalizeCategory(category.slug || category.name) === activeCategory
        );
        const productParams = { status: 'active', page: 1, limit: 100 };
        if (activeCategory !== 'all' && selectedCategory) {
          productParams.category = String(selectedCategory._id || selectedCategory.id);
        }
        const productResponse = await productsAPI.getAll(productParams);
        const productData = productResponse?.data?.data;
        const categoryById = new Map(apiCategories.map((category) => [String(category._id || category.id), category]));
        const subcategoryById = new Map();
        apiCategories.forEach((category) => {
          asArray(category.subTypes).forEach((subcategory) => {
            subcategoryById.set(String(subcategory._id || subcategory.id), subcategory);
          });
        });
        const apiProducts = Array.isArray(productData?.items) ? productData.items : Array.isArray(productData) ? productData : [];

        if (!isCurrent) return;
        setShopCategories([
            { id: 'all', slug: 'all', name: 'All Jewellery', icon: '✦', subTypes: [] },
            ...apiCategories.map((category) => ({
              id: category.slug || slugify(category.name),
              slug: category.slug || slugify(category.name),
              categoryId: String(category._id || category.id),
              name: category.name,
              icon: category.icon || '✦',
              subTypes: asArray(category.subTypes),
            })),
          ]);
        setCatalogProducts(apiProducts.map((product) => {
          const categoryRefs = [
            ...asArray(product.category),
            ...asArray(product.categoryId),
            ...asArray(product.categoryIds),
          ];
          const productCategories = [...new Set(categoryRefs.map((categoryRef) => {
            if (categoryRef && typeof categoryRef === 'object') {
              const category = categoryById.get(referenceId(categoryRef)) || categoryRef;
              return normalizeCategory(category.slug || category.name || '');
            }
            const category = categoryById.get(referenceId(categoryRef));
            return normalizeCategory(category?.slug || category?.name || categoryRef || '');
          }).filter(Boolean))];
          const rawSubcategory = product.subType || product.subTypeId;
          const subcategoryRef = rawSubcategory && typeof rawSubcategory === 'object'
            ? rawSubcategory
            : subcategoryById.get(referenceId(rawSubcategory));
          const subcategoryName = subcategoryRef?.name || product.subTypeName || product.subcategory || '';
          const name = product.basicInfo?.title || product.title || product.name || product.itemName || '';
          return {
            ...product,
            id: String(product._id || product.id),
            name,
            description: product.basicInfo?.description || product.description || '',
            categoryIds: [...new Set(categoryRefs.map(referenceId).filter(Boolean))],
            categories: productCategories,
            category: productCategories[0] || normalizeCategory(product.categoryName || ''),
            subcategoryId: referenceId(rawSubcategory),
            subcategorySlug: slugify(subcategoryName),
            price: Number(product.salePrice || product.pricing?.salePrice || product.displayPrice || product.price || 0),
            originalPrice: Number(product.mrp || product.pricing?.mrp || product.originalPrice || 0),
            rating: Number(product.rating ?? product.averageRating ?? 0),
            reviewsCount: Number(product.reviewsCount || product.reviewCount || 0),
            image: getPrimaryProductImage(product),
            featured: Boolean(product.featured || product.isFeatured),
          };
        }));
      } catch (error) {
        console.error('Could not load the live product catalogue.', error);
        if (isCurrent) {
          setCatalogProducts([]);
          setShopCategories([{ id: 'all', slug: 'all', name: 'All Jewellery', icon: '✦', subTypes: [] }]);
        }
      } finally {
        if (isCurrent) setCatalogLoading(false);
      }
    };
    loadCatalog();
    return () => { isCurrent = false; };
  }, [activeCategory]);

  const filteredProducts = useMemo(() => {
    return catalogProducts
      .filter((product) => {
        const matchesCategory = activeCategory === 'all'
          || product.categoryIds?.includes(activeCategory)
          || (product.categories || [product.category]).some((category) => normalizeCategory(category) === activeCategory);
        const matchesSubcategory = !activeSubcategory
          || product.subcategoryId === activeSubcategory
          || product.subcategorySlug === slugify(activeSubcategory);
        const matchesSearch =
          !searchQuery ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSubcategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [activeCategory, activeSubcategory, searchQuery, sortBy, catalogProducts]);

  const activeCategoryEntry = shopCategories.find((category) =>
    category.categoryId === activeCategory || normalizeCategory(category.slug || category.id) === activeCategory
  );
  const activeSubcategories = asArray(activeCategoryEntry?.subTypes);

  const handleCategoryChange = (catId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', catId);
    }
    nextParams.delete('subcategory');
    setSearchParams(nextParams);
  };

  const handleSubcategoryChange = (subcategory) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!subcategory) nextParams.delete('subcategory');
    else nextParams.set('subcategory', slugify(subcategory.name));
    setSearchParams(nextParams);
  };

  return (
    <div className="min-h-[70vh] bg-[#fbfaf8] py-8 sm:py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
      {/* ─── Header & Breadcrumb ────────────────────────────── */}
      <div className="text-center space-y-3">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#9b7951] font-semibold">
          Neirah · Fine Jewellery
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#26221e]">
          {activeCategory === 'all'
            ? 'Find a piece to treasure'
            : activeCategoryEntry?.name || 'Jewellery Collection'}
        </h1>
        <p className="text-sm text-stone-500 max-w-xl mx-auto">Thoughtfully made jewellery, designed to become part of your story.</p>
        {searchQuery && (
          <p className="text-sm text-stone-500">
            Showing results for <span className="text-[#8b6b47] font-semibold">"{searchQuery}"</span>
            <button
              onClick={() => {
                const nextParams = new URLSearchParams(searchParams);
                nextParams.delete('search');
                setSearchParams(nextParams);
              }}
              className="ml-2 text-xs text-[#8b6b47] underline hover:text-[#604d39]"
            >
              Clear search
            </button>
          </p>
        )}
      </div>

      {/* ─── Controls: Category Tabs & Sort ─────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-stone-200">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {shopCategories.map((cat) => {
            const isActive = activeCategory === normalizeCategory(cat.slug || cat.id) || activeCategory === cat.categoryId;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-200 ${
                  isActive
                  ? 'bg-[#8b6b47] text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:text-[#2c2722] hover:bg-[#f7f3ed] border border-stone-200'
                }`}
              >
                <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center align-middle">
                  {typeof cat.icon === 'string'
                    ? cat.icon
                    : cat.icon?.url
                      ? <img src={cat.icon.url} alt="" className="h-full w-full object-contain" />
                      : '✦'}
                </span>
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Sort & Count */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <span className="text-xs text-stone-500 whitespace-nowrap">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'} found
          </span>
          <div className="flex items-center gap-2">
            <HiOutlineAdjustments className="w-4 h-4 text-stone-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-stone-200 text-stone-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#9b7951]"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {activeSubcategories.length > 0 && (
        <nav aria-label={`${activeCategoryEntry?.name || 'Category'} subcategories`} className="-mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => handleSubcategoryChange(null)}
            aria-pressed={!activeSubcategory}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs transition-colors ${!activeSubcategory ? 'border-[#8b6b47] bg-[#8b6b47] text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-[#c9b08b]'}`}
          >
            All {activeCategoryEntry?.name}
          </button>
          {activeSubcategories.map((subcategory) => {
            const selected = activeSubcategory === String(subcategory._id || subcategory.id) || activeSubcategory === slugify(subcategory.name);
            return (
              <button
                key={subcategory._id || subcategory.id || subcategory.name}
                type="button"
                onClick={() => handleSubcategoryChange(subcategory)}
                aria-pressed={selected}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs transition-colors ${selected ? 'border-[#8b6b47] bg-[#8b6b47] text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-[#c9b08b]'}`}
              >
                {subcategory.name}
              </button>
            );
          })}
        </nav>
      )}

      {/* ─── Product Grid ───────────────────────────────────── */}
      {catalogLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6" aria-label="Loading jewellery">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="animate-pulse rounded-2xl bg-white border border-stone-200 overflow-hidden"><div className="aspect-square bg-[#f0ece6]" /><div className="p-4 space-y-3"><div className="h-3 w-2/3 rounded bg-stone-100" /><div className="h-4 w-full rounded bg-stone-100" /><div className="h-8 w-full rounded bg-stone-100" /></div></div>)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 space-y-4 shadow-sm">
          <span className="text-4xl">💎</span>
          <h3 className="font-serif text-2xl text-[#26221e]">No creations found</h3>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">
            Try adjusting your search criteria or explore another high jewelry category.
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="inline-flex items-center justify-center rounded-full border border-[#8b6b47] px-5 py-2.5 text-xs uppercase tracking-wider text-[#745735] hover:bg-[#8b6b47] hover:text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden hover:border-[#c9b08b] transition-all duration-300 hover:shadow-[0_14px_34px_rgba(65,48,29,0.10)] flex flex-col"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-[#f4f0eb]">
                <Link to={`/product/${product.id}`} className="block w-full h-full">
                  <img
                    src={getPrimaryProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                </Link>
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase text-[#765c3b] border border-white/60 pointer-events-none">
                  {product.category}
                </div>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-stone-200 flex items-center justify-center text-stone-600 hover:text-rose-600 transition-colors cursor-pointer"
                  aria-label="Toggle Wishlist"
                >
                  {isWishlisted(product.id) ? (
                    <HiHeart className="w-4 h-4 text-rose-500" />
                  ) : (
                    <HiOutlineHeart className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Product Info */}
              <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between gap-3 sm:gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-[#a07a46] text-[10px] sm:text-xs">
                    <HiStar className="w-3.5 h-3.5 fill-[#a07a46]" />
                    <span className="font-semibold text-stone-700">{product.rating}</span>
                    <span className="text-stone-400">({product.reviewsCount} reviews)</span>
                  </div>
                  <Link
                    to={`/product/${product.id}`}
                    className="block font-serif text-sm sm:text-lg font-medium leading-snug text-[#2c2722] group-hover:text-[#8b6b47] transition-colors line-clamp-2"
                  >
                    {product.name}
                  </Link>
                  <p className="hidden sm:block text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-sm sm:text-lg font-semibold text-[#2c2722] tracking-tight">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[10px] sm:text-xs text-stone-400 line-through ml-1">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg bg-[#f6f1e9] hover:bg-[#8b6b47] text-[#705638] hover:text-white border border-[#e9dfd0] text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider transition-all duration-200"
                  >
                    <HiOutlineShoppingBag className="w-4 h-4" />
                    <span className="hidden sm:inline">Add to Bag</span><span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div></div>
  );
};

export default Shop;
