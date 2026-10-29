import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HiOutlineClock, HiOutlineSearch, HiOutlineArrowRight } from 'react-icons/hi';
import { blogsAPI, blogCategoriesAPI } from '../../api/services';

export default function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const activeCategory = searchParams.get('category') || 'all';

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
    const matchesCategory =
      activeCategory === 'all' ||
      (blog.blogCategory?.slug === activeCategory || blog.blogCategory?._id === activeCategory);

    const matchesSearch =
      !searchQuery ||
      blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const featuredBlog = filteredBlogs[0];
  const regularBlogs = filteredBlogs.slice(1);

  const handleCategoryClick = (catSlug) => {
    const newParams = new URLSearchParams(searchParams);
    if (catSlug === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catSlug);
    }
    setSearchParams(newParams);
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
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
          <div className="space-y-12">
            {/* ─── Featured Article (Top Large Card) ─── */}
            {featuredBlog && !searchQuery && activeCategory === 'all' && (
              <article className="group bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-auto overflow-hidden bg-stone-100">
                  <img
                    src={featuredBlog.image?.url || featuredBlog.image || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80'}
                    alt={featuredBlog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-black/70 backdrop-blur-md text-[#d4af37] text-[11px] font-bold uppercase tracking-wider rounded-full border border-[#d4af37]/30">
                      Featured Story
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
                      <span className="text-[#8b6f4e] font-semibold uppercase tracking-wider text-[11px]">
                        {featuredBlog.blogCategory?.name || 'Journal'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <HiOutlineClock className="w-3.5 h-3.5" />
                        {featuredBlog.readTime || '3 min read'}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 group-hover:text-[#8b6f4e] transition-colors leading-tight">
                      <Link to={`/blog/${featuredBlog.slug || featuredBlog._id}`}>
                        {featuredBlog.title}
                      </Link>
                    </h2>

                    <p className="text-stone-600 text-xs sm:text-sm font-light leading-relaxed line-clamp-3">
                      {featuredBlog.shortDescription || featuredBlog.description?.replace(/<[^>]+>/g, '').substring(0, 160) + '...'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-400">
                      {featuredBlog.meta?.createdAt
                        ? new Date(featuredBlog.meta.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''}
                    </span>
                    <Link
                      to={`/blog/${featuredBlog.slug || featuredBlog._id}`}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-[#8b6f4e] group-hover:text-black group-hover:translate-x-1 transition-all"
                    >
                      <span>Read Story</span>
                      <HiOutlineArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* ─── Grid of Regular Articles ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(searchQuery || activeCategory !== 'all' ? filteredBlogs : regularBlogs).map((blog) => (
                <article
                  key={blog._id}
                  className="group bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Thumbnail */}
                  <Link
                    to={`/blog/${blog.slug || blog._id}`}
                    className="relative block h-56 overflow-hidden bg-stone-100 shrink-0"
                  >
                    <img
                      src={blog.image?.url || blog.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'}
                      alt={blog.title}
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
                          {blog.readTime || '3 min read'}
                        </span>
                        <span>•</span>
                        <span>
                          {blog.meta?.createdAt
                            ? new Date(blog.meta.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-[#8b6f4e] transition-colors leading-snug line-clamp-2">
                        <Link to={`/blog/${blog.slug || blog._id}`}>
                          {blog.title}
                        </Link>
                      </h3>

                      <p className="text-stone-600 text-xs font-light leading-relaxed line-clamp-3">
                        {blog.shortDescription || blog.description?.replace(/<[^>]+>/g, '').substring(0, 130) + '...'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[11px] text-stone-400">By {blog.author || 'Neirah'}</span>
                      <Link
                        to={`/blog/${blog.slug || blog._id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8b6f4e] group-hover:translate-x-1 transition-transform"
                      >
                        <span>Read</span>
                        <HiOutlineArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
