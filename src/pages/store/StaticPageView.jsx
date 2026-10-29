import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineChevronRight } from 'react-icons/hi';
import { staticPagesAPI } from '../../api/services';

export default function StaticPageView() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPage = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const res = await staticPagesAPI.getBySlug(slug);
        const data = res.data?.data || res.data;
        if (!isMounted) return;
        if (data) {
          setPage(data);
          // Set document title
          document.title = data.seoTitle || `${data.title} | Neirah Fine Jewellery`;
          // Set meta description if present
          if (data.metaDescription) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.name = 'description';
              document.head.appendChild(metaDesc);
            }
            metaDesc.content = data.metaDescription;
          }
        } else {
          setError('Page not found');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load page:', err);
        setError('Page not found');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPage();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-[#fbfaf8] py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
          <div className="h-4 w-48 bg-stone-200 rounded" />
          <div className="h-10 w-72 bg-stone-300 rounded mx-auto" />
          <div className="h-28 bg-stone-200 rounded-2xl" />
          <div className="h-40 bg-stone-200 rounded-2xl" />
          <div className="h-40 bg-stone-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[60vh] bg-[#fbfaf8] flex flex-col items-center justify-center py-20 px-4 text-center">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-3">Page Not Found</h1>
        <p className="text-sm text-stone-500 mb-6 max-w-md">
          The requested page could not be found or is currently unavailable.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#1c1917] text-white text-xs font-semibold tracking-wider uppercase hover:bg-stone-800 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-[#1c1917] pb-24">
      {/* ─── Breadcrumb ────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-400">
          <Link to="/" className="hover:text-stone-700 transition-colors">
            Home
          </Link>
          <HiOutlineChevronRight className="w-3 h-3 text-stone-300" />
          <span className="text-stone-800 font-medium">{page.title}</span>
        </nav>
      </div>

      {/* ─── Page Title Header ──────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-8 sm:pb-12 text-center">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-stone-900">
          {page.title}
        </h1>
        <div className="w-12 h-0.5 bg-[#d2b18a] mx-auto mt-4" />
      </div>

      {/* ─── Page Content Body ──────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <article
          className="prose prose-stone max-w-none text-sm sm:text-base leading-relaxed text-stone-700
            prose-headings:font-serif prose-headings:font-normal prose-headings:text-stone-900
            prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
            prose-p:my-4 prose-p:leading-relaxed
            prose-a:text-[#b58838] prose-a:underline hover:prose-a:text-[#8b6f4e]
            prose-strong:text-stone-900 prose-strong:font-semibold
            prose-img:rounded-2xl prose-img:shadow-md"
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />
      </div>
    </div>
  );
}
