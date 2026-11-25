import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { categoriesAPI } from '../../api/services';
import { slugify, CATEGORY_ALIASES as aliases, getResponseItems as getItems } from '../../utils/common';
import Shop from './Shop';
import StaticPageView from './StaticPageView';

/**
 * DynamicSlugView handles single-segment root routes like /:slug dynamically.
 * It automatically checks against all active categories from the database.
 * If the slug is a category (e.g. /silver-collection, /rings, /earrings, or any new category added in admin),
 * it renders the Shop catalog filtered to that category.
 * Otherwise, it falls back to rendering StaticPageView (e.g. /our-story, /privacy-policy).
 * This eliminates the need to hardcode category routes in App.jsx.
 */
export default function DynamicSlugView() {
  const { slug } = useParams();
  const [resolution, setResolution] = useState({
    loading: true,
    type: null,
    category: null,
  });

  useEffect(() => {
    let isCurrent = true;
    setResolution({ loading: true, type: null, category: null });

    if (!slug) {
      setResolution({ loading: false, type: 'static', category: null });
      return;
    }

    const normalizedSlug = slug.toLowerCase().trim();
    const resolvedSlug = aliases[normalizedSlug] || normalizedSlug;

    categoriesAPI
      .getNavigation()
      .then((res) => {
        if (!isCurrent) return;
        const categories = getItems(res);

        const matchedCategory = categories.find((cat) => {
          const catSlug = (cat.slug || '').toLowerCase().trim();
          const catNameSlug = slugify(cat.name || '');
          const catId = String(cat._id || '');
          return (
            catSlug === resolvedSlug ||
            catNameSlug === resolvedSlug ||
            catSlug === normalizedSlug ||
            catNameSlug === normalizedSlug ||
            catId === normalizedSlug
          );
        });

        if (matchedCategory) {
          setResolution({
            loading: false,
            type: 'category',
            category: matchedCategory.slug || matchedCategory._id,
          });
        } else {
          setResolution({
            loading: false,
            type: 'static',
            category: null,
          });
        }
      })
      .catch(() => {
        if (!isCurrent) return;
        setResolution({
          loading: false,
          type: 'static',
          category: null,
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [slug]);

  if (resolution.loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-stone-200 border-t-[#8b6f4e] rounded-full animate-spin" />
      </div>
    );
  }

  if (resolution.type === 'category') {
    return <Shop defaultCategory={resolution.category} />;
  }

  return <StaticPageView />;
}
