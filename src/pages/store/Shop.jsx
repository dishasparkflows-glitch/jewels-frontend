import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { products, categories } from '../../data/products';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { HiStar, HiOutlineShoppingBag, HiOutlineAdjustments, HiOutlineHeart, HiHeart } from 'react-icons/hi';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const [sortBy, setSortBy] = useState('featured');
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory =
          activeCategory === 'all' || product.category === activeCategory;
        const matchesSearch =
          !searchQuery ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [activeCategory, searchQuery, sortBy]);

  const handleCategoryChange = (catId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', catId);
    }
    setSearchParams(nextParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* ─── Header & Breadcrumb ────────────────────────────── */}
      <div className="text-center space-y-3">
        <span className="text-xs uppercase tracking-[0.25em] text-gold-400 font-semibold">
          High Jewelry Catalogue
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white">
          {activeCategory === 'all'
            ? 'All Masterpiece Collections'
            : categories.find((c) => c.id === activeCategory)?.name || 'Jewelry Collection'}
        </h1>
        {searchQuery && (
          <p className="text-sm text-surface-400">
            Showing results for <span className="text-gold-300 font-semibold">"{searchQuery}"</span>
            <button
              onClick={() => {
                const nextParams = new URLSearchParams(searchParams);
                nextParams.delete('search');
                setSearchParams(nextParams);
              }}
              className="ml-2 text-xs text-red-400 underline hover:text-red-300"
            >
              Clear search
            </button>
          </p>
        )}
      </div>

      {/* ─── Controls: Category Tabs & Sort ─────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-surface-800">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-surface-950 shadow-md shadow-gold-500/20'
                    : 'bg-surface-900 text-surface-300 hover:text-white hover:bg-surface-800 border border-surface-800'
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Sort & Count */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <span className="text-xs text-surface-400 whitespace-nowrap">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'} found
          </span>
          <div className="flex items-center gap-2">
            <HiOutlineAdjustments className="w-4 h-4 text-surface-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-900 border border-surface-800 text-surface-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-gold-500"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Product Grid ───────────────────────────────────── */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-surface-900/30 rounded-3xl border border-surface-800 space-y-4">
          <span className="text-4xl">💎</span>
          <h3 className="font-serif text-2xl text-white">No creations found</h3>
          <p className="text-sm text-surface-400 max-w-sm mx-auto">
            Try adjusting your search criteria or explore another high jewelry category.
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="btn-gold-outline text-xs uppercase tracking-wider"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-surface-900/40 rounded-3xl border border-surface-800/80 overflow-hidden hover:border-gold-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gold-500/10 flex flex-col"
            >
              {/* Product Image */}
              <div className="relative h-72 overflow-hidden bg-surface-950">
                <Link to={`/product/${product.id}`} className="block w-full h-full">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                </Link>
                <div className="absolute top-3 left-3 bg-surface-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-gold-300 border border-gold-500/20 pointer-events-none">
                  {product.category}
                </div>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-surface-950/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-rose-500 transition-colors cursor-pointer"
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
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <HiStar className="w-4 h-4 fill-amber-400" />
                    <span className="font-semibold text-white">{product.rating}</span>
                    <span className="text-surface-500">({product.reviewsCount} reviews)</span>
                  </div>
                  <Link
                    to={`/product/${product.id}`}
                    className="block font-serif text-xl font-bold text-white group-hover:text-gold-300 transition-colors"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-surface-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-surface-800 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-white tracking-tight">
                      ${product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-surface-500 line-through ml-2">
                        ${product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold-500/10 hover:bg-gold-500 text-gold-300 hover:text-surface-950 border border-gold-500/30 text-xs font-semibold uppercase tracking-wider transition-all duration-200"
                  >
                    <HiOutlineShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;
