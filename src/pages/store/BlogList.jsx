import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HiOutlineClock, HiOutlineSearch, HiOutlineArrowRight } from 'react-icons/hi';
import { blogsAPI, blogCategoriesAPI } from '../../api/services';

export default function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const categorySectionRef = useRef(null);

  const activeCategory = searchParams.get('category') || 'all';

  const scrollToArticles = (smooth = true) => {
    if (categorySectionRef.current) {
      const navbar = document.querySelector('header');
      const navHeight = navbar ? navbar.offsetHeight : 120;
      const top = categorySectionRef.current.getBoundingClientRect().top + window.pageYOffset - (navHeight + 20);
      window.scrollTo({
        top: Math.max(0, top),
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  useEffect(() => {
    const hasFilter = searchParams.get('category') || searchParams.get('search');
    if (hasFilter && !loading) {
      const timer = setTimeout(() => scrollToArticles(true), 120);
      return () => clearTimeout(timer);
    }
  }, [searchParams, loading]);

  useEffect(() => {
    let current = true;
    setLoading(true);

    Promise.all([
      blogsAPI.getAll({ status: 'active', limit: 50 }),
      blogCategoriesAPI.getLookup(),
    ])
      .then(([blogsRes, catsRes]) => {
        if (!current) return;
        setBlogs(blogsRes.data?.data || []);
        setCategories(catsRes.data?.data || []);
      })
      .catch((err) => {
        console.error('Failed to load journal:', err);
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, []);

  // Filter blogs
  const filteredBlogs = blogs.filter((blog) => {
    const blogTitle = blog.basicInfo?.title || blog.title || '';
    const blogDesc = blog.basicInfo?.description || blog.description || '';
    const blogShortDesc = blog.basicInfo?.shortDescription || blog.shortDescription || '';

    const matchesCategory =
      activeCategory === 'all' ||
      (blog.blogCategory?.slug === activeCategory || blog.blogCategory?._id === activeCategory);

    const matchesSearch =
      !searchQuery ||
      blogTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blogShortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blogDesc.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleCategoryClick = (catSlug) => {
    const newParams = new URLSearchParams(searchParams);
    if (catSlug === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catSlug);
    }
    setSearchParams(newParams);
    setTimeout(() => scrollToArticles(true), 50);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
    setTimeout(() => scrollToArticles(true), 50);
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
                    setSearchParams(p);
                  }}
                  className="absolute right-3 text-xs text-stone-400 hover:text-white px-2 py-1"
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
                ? 'bg-[#1c1917] text-[#d4af37] shadow-sm font-semibold border border-[#d4af37]/40'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
            }`}
          >
            All Stories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => handleCategoryClick(cat.slug || cat._id)}
              className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all shrink-0 cursor-pointer ${
                activeCategory === cat.slug || activeCategory === cat._id
                  ? 'bg-[#1c1917] text-[#d4af37] shadow-sm font-semibold border border-[#d4af37]/40'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Main Content Area ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-stone-500 font-serif">Curating luxury articles...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-stone-200/80 p-8 max-w-xl mx-auto space-y-3">
            <p className="text-xl font-serif text-stone-800">No Articles Found</p>
            <p className="text-xs text-stone-500">
              There are currently no articles under this filter. Try clearing your search or switching categories.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchParams({});
              }}
              className="mt-3 px-5 py-2 text-xs font-semibold bg-[#1c1917] text-[#d4af37] rounded-full hover:bg-black transition-colors"
            >
              View All Articles
            </button>
          </div>
        ) : (
          <div>
            {/* ─── Grid of Articles (Small Box / Card View) ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((blog) => {
                const title = blog.basicInfo?.title || blog.title || '';
                const slug = blog.basicInfo?.slug || blog.slug || blog._id;
                const shortDesc = blog.basicInfo?.shortDescription || blog.shortDescription || (blog.basicInfo?.description || blog.description)?.replace(/<[^>]+>/g, '').substring(0, 130) + '...';

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
                        src={blog.image?.url || blog.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                              ? new Date(blog.basicInfo?.publishDate || blog.publishDate || blog.createdAt || blog.meta.createdAt).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : ''}
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-[#8b6f4e] transition-colors leading-snug line-clamp-2">
                          <Link to={`/blog/${slug}`}>
                            {title}
                          </Link>
                        </h3>

                        <p className="text-stone-600 text-xs font-light leading-relaxed line-clamp-3">
                          {shortDesc}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-[11px] text-stone-400">By {blog.basicInfo?.author || blog.author || 'Neirah'}</span>
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
