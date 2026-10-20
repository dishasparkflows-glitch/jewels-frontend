import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineArrowLeft,
  HiOutlineShare,
  HiOutlineEye,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { blogsAPI } from '../../api/services';

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');

    blogsAPI
      .getBySlug(slug)
      .then((res) => {
        if (!current) return;
        setBlog(res.data?.data);
      })
      .catch((err) => {
        if (!current) return;
        console.error('Failed to load article:', err);
        setError('Article not found or has been moved.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    // Also fetch recent blogs for the footer recommendation
    blogsAPI
      .getRecent(3)
      .then((res) => {
        if (!current) return;
        const items = res.data?.data || [];
        setRecentBlogs(items.filter((b) => b.slug !== slug));
      })
      .catch(() => {});

    return () => {
      current = false;
    };
  }, [slug]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Article link copied to clipboard!');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Read "${blog?.title}" on Neirah: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-serif text-stone-500">Unveiling the story...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-4 shadow-sm">
          <h2 className="text-2xl font-serif font-bold text-stone-900">Article Unavailable</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            {error || 'This article could not be loaded.'}
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#1c1917] text-[#d4af37] rounded-full hover:bg-black transition-colors"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            <span>Return to Journal</span>
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = blog.blogCategory?.name || 'Editorial';
  const categorySlug = blog.blogCategory?.slug || '';
  const imageUrl = blog.image?.url || (typeof blog.image === 'string' ? blog.image : '');
  const publishDate = blog.meta?.createdAt
    ? new Date(blog.meta.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <article className="min-h-screen bg-[#faf8f5] text-stone-900 pb-24">
      {/* ─── Breadcrumb Navigation ─── */}
      <div className="border-b border-stone-200/80 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-stone-500 font-medium overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-stone-900 transition-colors">Home</Link>
          <HiOutlineChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
          <Link to="/blog" className="hover:text-stone-900 transition-colors">Neirah Journal</Link>
          {categorySlug && (
            <>
              <HiOutlineChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
              <Link to={`/blog?category=${categorySlug}`} className="hover:text-stone-900 transition-colors">
                {categoryName}
              </Link>
            </>
          )}
          <HiOutlineChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
          <span className="text-stone-800 truncate max-w-xs">{blog.title}</span>
        </div>
      </div>

      {/* ─── Article Header ─── */}
      <header className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center space-y-5">
        <Link
          to={`/blog?category=${categorySlug}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#faf5ee] text-[#8b6f4e] border border-[#e8d9c2] hover:bg-[#f3ece0] transition-colors"
        >
          <HiOutlineTag className="w-3.5 h-3.5" />
          <span>{categoryName}</span>
        </Link>

        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-950 tracking-tight leading-[1.2] max-w-3xl mx-auto">
          {blog.title}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500 font-medium pt-2">
          <span>By <strong className="text-stone-800 font-semibold">{blog.author || 'Neirah Editorial'}</strong></span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <HiOutlineClock className="w-3.5 h-3.5 text-[#8b6f4e]" />
            {blog.readTime || '3 min read'}
          </span>
          <span>•</span>
          <span>{publishDate}</span>
          {blog.views > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-stone-400">
                <HiOutlineEye className="w-3.5 h-3.5" />
                {blog.views} views
              </span>
            </>
          )}
        </div>
      </header>

      {/* ─── Featured Hero Image ─── */}
      {imageUrl && (
        <div className="max-w-5xl mx-auto px-4 mb-10">
          <div className="relative rounded-3xl overflow-hidden shadow-xl max-h-[540px] bg-stone-100">
            <img
              src={imageUrl}
              alt={blog.image?.alt || blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* ─── Main Content Container ─── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Short excerpt / lead paragraph */}
        {blog.shortDescription && (
          <div className="p-6 my-6 rounded-2xl bg-[#faf5ee] border-l-4 border-[#8b6f4e] text-base sm:text-lg font-serif italic text-stone-800 leading-relaxed">
            &ldquo;{blog.shortDescription}&rdquo;
          </div>
        )}

        {/* Rich HTML Description */}
        <div
          className="prose prose-stone max-w-none text-stone-800 leading-relaxed text-base sm:text-lg pt-4 font-sans article-body"
          dangerouslySetInnerHTML={{ __html: blog.description }}
        />

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="pt-8 mt-10 border-t border-stone-200/90 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Tags:</span>
            {blog.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700 text-xs font-medium"
              >
                #{typeof tag === 'string' ? tag.trim() : tag}
              </span>
            ))}
          </div>
        )}

        {/* Share Bar */}
        <div className="my-10 p-5 rounded-2xl bg-white border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-2">
            <HiOutlineShare className="w-5 h-5 text-[#8b6f4e]" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Share This Story</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Copy Link
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              WhatsApp
            </button>
            <Link
              to="/blog"
              className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
            >
              All Articles
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Related Articles Section ─── */}
      {recentBlogs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 border-t border-stone-200/90 mt-16">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <p className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">More from Neirah</p>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              Related Editorial Stories
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentBlogs.map((item) => (
              <article
                key={item._id}
                className="group bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <Link
                  to={`/blog/${item.slug || item._id}`}
                  className="relative block h-48 overflow-hidden bg-stone-100 shrink-0"
                >
                  <img
                    src={item.image?.url || item.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 bg-white/90 backdrop-blur-md text-[#8b6f4e] text-[10px] font-bold uppercase tracking-wider rounded-full shadow-2xs border border-stone-200">
                      {item.blogCategory?.name || 'Journal'}
                    </span>
                  </div>
                </Link>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-stone-400">{item.readTime || '3 min read'}</span>
                    <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-[#8b6f4e] transition-colors leading-snug line-clamp-2">
                      <Link to={`/blog/${item.slug || item._id}`}>
                        {item.title}
                      </Link>
                    </h3>
                  </div>
                  <Link
                    to={`/blog/${item.slug || item._id}`}
                    className="text-xs font-semibold text-[#8b6f4e] hover:underline"
                  >
                    Read Story →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Embedded CSS for styled HTML content */}
      <style>{`
        .article-body h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1c1917;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          font-family: serif;
        }
        .article-body h2 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #1c1917;
          margin-top: 1.75rem;
          margin-bottom: 0.65rem;
          font-family: serif;
        }
        .article-body h3 {
          font-size: 1.3rem;
          font-weight: 600;
          color: #292524;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .article-body p {
          margin-top: 1rem;
          margin-bottom: 1rem;
          line-height: 1.8;
          color: #292524;
        }
        .article-body blockquote {
          border-left: 4px solid #8b6f4e;
          padding-left: 1.25rem;
          margin: 1.75rem 0;
          font-style: italic;
          color: #44403c;
          background: #faf8f5;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          border-radius: 0 12px 12px 0;
        }
        .article-body ul {
          list-style-type: disc;
          padding-left: 1.75rem;
          margin: 1rem 0;
        }
        .article-body ol {
          list-style-type: decimal;
          padding-left: 1.75rem;
          margin: 1rem 0;
        }
        .article-body li {
          margin-bottom: 0.4rem;
          line-height: 1.7;
        }
        .article-body img {
          border-radius: 16px;
          margin: 2rem auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.06);
          max-width: 100%;
        }
        .article-body hr {
          border: none;
          border-top: 1px solid #e7e5e4;
          margin: 2.5rem 0;
        }
      `}</style>
    </article>
  );
}
