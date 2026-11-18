import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HiOutlineClock, HiOutlineSearch, HiOutlineArrowRight } from 'react-icons/hi';
import { blogsAPI, blogCategoriesAPI } from '../../api/services';

// ─── Module-level Persistent Cache ─────────────────────────────────────
// Keeps fetched blog data and categories warm in memory so switching
// categories is instantaneous (0ms) and silky smooth without layout shifts or spinners.
const blogCache = {
  allBlogs: null,          // Complete pool of active blogs
  byCategory: new Map(),   // Category key -> blogs array
  categories: null,        // Categories lookup array
};

export default function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('blogCategory') || searchParams.get('category') || 'all';
  const categorySectionRef = useRef(null);
  const activeFetchAbortRef = useRef(null);

  // Initialize state with in-memory cache if available
  const [blogs, setBlogs] = useState(() => blogCache.allBlogs || []);
  const [categories, setCategories] = useState(() => blogCache.categories || []);
  const [initialLoading, setInitialLoading] = useState(() => !blogCache.allBlogs && !blogCache.byCategory.has(activeCategory));
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Helper to gently adjust scroll only if categories are hidden above header
  const maybeScrollToArticles = (force = false) => {
    if (!categorySectionRef.current) return;
    const navbar = document.querySelector('header');
    const navHeight = navbar ? navbar.offsetHeight : 120;
    const rect = categorySectionRef.current.getBoundingClientRect();
    if (force || rect.top < 0 || rect.top > window.innerHeight) {
      window.scrollTo({
        top: Math.max(0, window.pageYOffset + rect.top - (navHeight + 20)),
        behavior: 'smooth',
      });
    }
  };

  // ─── Load category lookup once on mount ────────────────────────────
  useEffect(() => {
    if (blogCache.categories) {
      setCategories(blogCache.categories);
      return;
    }
    let current = true;
    blogCategoriesAPI.getLookup()
      .then((catsRes) => {
        if (!current) return;
        const cats = catsRes.data?.data || [];
        blogCache.categories = cats;
        setCategories(cats);
      })
      .catch((err) => {
        console.error('Failed to load blog categories:', err);
      });

    return () => {
      current = false;
    };
  }, []);

  // ─── SWR Data Fetching: Instant local reflection + background sync ───
  useEffect(() => {
    let current = true;

    // Check what is already cached
    const hasCategoryCached = blogCache.byCategory.has(activeCategory);
    const hasAllCached = Boolean(blogCache.allBlogs && blogCache.allBlogs.length > 0);

    // If we have data cached, set it immediately so the UI reflects instantly
    if (hasCategoryCached) {
      setBlogs(blogCache.byCategory.get(activeCategory));
      setInitialLoading(false);
    } else if (hasAllCached) {
      setBlogs(blogCache.allBlogs);
      setInitialLoading(false);
    } else {
      setInitialLoading(true);
    }

    // Cancel previous in-flight network request to avoid double-fetching / race conditions
    if (activeFetchAbortRef.current) {
      activeFetchAbortRef.current.abort();
    }
    const abortController = new AbortController();
    activeFetchAbortRef.current = abortController;

    const params = {
      status: 'active',
      limit: 100,
    };
    if (activeCategory && activeCategory !== 'all') {
      params.blogCategory = activeCategory;
    }

    blogsAPI.getAll(params, { signal: abortController.signal })
      .then((blogsRes) => {
        if (!current) return;
        const freshBlogs = blogsRes.data?.data || [];

        if (activeCategory === 'all') {
          blogCache.allBlogs = freshBlogs;
          setBlogs(freshBlogs);
        } else {
          blogCache.byCategory.set(activeCategory, freshBlogs);
          if (!blogCache.allBlogs) {
            blogCache.allBlogs = freshBlogs;
          } else {
            // Merge into allBlogs pool so client filter stays synchronized
            const existingIds = new Set(blogCache.allBlogs.map((b) => String(b._id)));
            const newItems = freshBlogs.filter((b) => !existingIds.has(String(b._id)));
            if (newItems.length > 0) {
              blogCache.allBlogs = [...blogCache.allBlogs, ...newItems];
            }
          }
          setBlogs(blogCache.allBlogs || freshBlogs);
        }
      })
      .catch((err) => {
        if (err?.name !== 'CanceledError' && err?.name !== 'AbortError' && err?.code !== 'ERR_CANCELED') {
          console.error('Failed to load blogs:', err);
        }
      })
      .finally(() => {
        if (current) {
          setInitialLoading(false);
        }
      });

    return () => {
      current = false;
      abortController.abort();
    };
  }, [activeCategory]);

  // ─── Instant Client-Side Filter (0ms response time) ────────────────
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const blogTitle = blog.basicInfo?.title || blog.title || '';
      const blogDesc = blog.basicInfo?.description || blog.description || '';
      const blogShortDesc = blog.basicInfo?.shortDescription || blog.shortDescription || '';

      const blogCatId = blog.blogCategory?._id || blog.blogCategory;
      const blogCatSlug = blog.blogCategory?.slug;
      const blogCatName = blog.blogCategory?.name;

      const matchesCategory =
        activeCategory === 'all' ||
        String(blogCatId) === String(activeCategory) ||
        (blogCatSlug && blogCatSlug.toLowerCase() === String(activeCategory).toLowerCase()) ||
        (blogCatName && blogCatName.toLowerCase() === String(activeCategory).toLowerCase());

      const matchesSearch =
        !searchQuery ||
        blogTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blogShortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blogDesc.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [blogs, activeCategory, searchQuery]);

  const handleCategoryClick = (catId) => {
    // 1. Immediately update URL
    const newParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      newParams.delete('blogCategory');
      newParams.delete('category');
    } else {
      newParams.set('blogCategory', catId);
      newParams.delete('category');
    }
    setSearchParams(newParams, { replace: true });

    // 2. Only gently scroll if category tabs are scrolled off screen
    maybeScrollToArticles(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams, { replace: true });
    maybeScrollToArticles(true);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 pb-20">
      {/* ─── Hero Header ─── */}
      <section className="relative bg-[#1c1917] text-white py-16 sm:py-24 px-4 overflow-hidden border-b border-stone-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-[#d4af37] font-medium">
            Editorial & Insights
          </p>
          <h1 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-[#f5f0eb]">
            The Neirah Journal
          </h1>
          <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
            Discover captivating stories behind our rare gems, diamond curation guides, and timeless jewellery styling.
          </p>

          {/* Search bar inside hero */}
          <form onSubmit={handleSearchSubmit} className="pt-4 max-w-md mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search articles, diamond guides, styling..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-stone-900/90 border border-stone-700/80 rounded-full text-white placeholder:text-stone-400 focus:outline-none focus:border-[#d4af37] transition-all"
              />
              <HiOutlineSearch className="w-5 h-5 text-stone-400 absolute left-4 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    const p = new URLSearchParams(searchParams);
                    p.delete('search');
                    setSearchParams(p, { replace: true });
                  }}
                  className="absolute right-3 text-xs text-stone-400 hover:text-white px-2 py-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ─── Category Filter Navigation ─── */}
      <section
        ref={categorySectionRef}
        id="journal-categories"
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4 scroll-mt-36"
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
          <button
            type="button"
            onClick={() => handleCategoryClick('all')}
            className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all shrink-0 cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-[#1c1917] text-[#d4af37] shadow-sm font-semibold border border-[#d4af37]/40 ring-1 ring-[#d4af37]/20'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
            }`}
          >
            All Stories
          </button>
          {categories.map((cat) => {
            const isSelected =
              activeCategory !== 'all' &&
              (activeCategory === cat._id ||
                String(activeCategory) === String(cat._id) ||
                activeCategory === cat.slug ||
                (cat.name && activeCategory.toLowerCase() === cat.name.toLowerCase()));
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => handleCategoryClick(cat._id)}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1c1917] text-[#d4af37] shadow-sm font-semibold border border-[#d4af37]/40 ring-1 ring-[#d4af37]/20'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Main Content Area ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 min-h-[500px]">
        {initialLoading ? (
          /* Luxury Shimmer Skeleton Grid (Preserves exact layout dimensions with 0 layout shift) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs flex flex-col"
              >
                <div className="h-56 bg-stone-200/70" />
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-3 w-28 bg-stone-200/70 rounded-full" />
                    <div className="h-5 w-3/4 bg-stone-200/80 rounded-md" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-full bg-stone-100 rounded" />
                      <div className="h-3 w-5/6 bg-stone-100 rounded" />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="h-3 w-16 bg-stone-100 rounded" />
                    <div className="h-3 w-12 bg-stone-200/60 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-stone-200/80 p-8 max-w-xl mx-auto space-y-3 animate-fadeIn">
            <p className="text-xl font-serif text-stone-800">No Articles Found</p>
            <p className="text-xs text-stone-500">
              There are currently no articles under this filter. Try clearing your search or switching categories.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchParams({}, { replace: true });
              }}
              className="mt-3 px-5 py-2 text-xs font-semibold bg-[#1c1917] text-[#d4af37] rounded-full hover:bg-black transition-colors cursor-pointer"
            >
              View All Articles
            </button>
          </div>
        ) : (
          <div key={activeCategory} className="animate-fadeIn">
            {/* ─── Grid of Articles (Small Box / Card View) ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((blog) => {
                const title = blog.basicInfo?.title || blog.title || '';
                const slug = blog.basicInfo?.slug || blog.slug || blog._id;
                const shortDesc =
                  blog.basicInfo?.shortDescription ||
                  blog.shortDescription ||
                  (blog.basicInfo?.description || blog.description)?.replace(/<[^>]+>/g, '').substring(0, 130) + '...';

                return (
                  <article
                    key={blog._id}
                    className="group bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    {/* Thumbnail */}
                    <Link
                      to={`/blog/${slug}`}
                      className="relative block h-56 overflow-hidden bg-stone-100 shrink-0"
                    >
                      <img
                        src={
                          blog.image?.url ||
                          blog.image ||
                          'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-[#8b6f4e] text-[10px] font-bold uppercase tracking-wider rounded-full shadow-2xs border border-stone-200">
                          {blog.blogCategory?.name || 'Journal'}
                        </span>
                      </div>
                    </Link>

                    {/* Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium">
                          <span className="flex items-center gap-1">
                            <HiOutlineClock className="w-3.5 h-3.5 text-stone-400" />
                            {blog.basicInfo?.readTime || blog.readTime || '3 min read'}
                          </span>
                          <span>•</span>
                          <span>
                            {blog.basicInfo?.publishDate || blog.publishDate || blog.createdAt || blog.meta?.createdAt
                              ? new Date(
                                  blog.basicInfo?.publishDate ||
                                    blog.publishDate ||
                                    blog.createdAt ||
                                    blog.meta.createdAt
                                ).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : ''}
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-[#8b6f4e] transition-colors leading-snug line-clamp-2">
                          <Link to={`/blog/${slug}`}>{title}</Link>
                        </h3>

                        <p className="text-stone-600 text-xs font-light leading-relaxed line-clamp-3">
                          {shortDesc}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-[11px] text-stone-400">
                          By {blog.basicInfo?.author || blog.author || 'Neirah'}
                        </span>
                        <Link
                          to={`/blog/${slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8b6f4e] group-hover:translate-x-1 transition-transform"
                        >
                          <span>Read</span>
                          <HiOutlineArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
