import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { categoriesAPI } from '../../api/services';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { slugify, CATEGORY_ALIASES as aliases, getResponseItems as getItems } from '../../utils/common';
import Shop from './Shop';
import StaticPageView from './StaticPageView';

function findMatchingCategory(categories, slug) {
  if (!slug || !Array.isArray(categories) || categories.length === 0) return null;
  const normalizedSlug = slug.toLowerCase().trim();
  const resolvedSlug = aliases[normalizedSlug] || normalizedSlug;
  return categories.find((cat) => {
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
  }) || null;
}

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
  const { navigation: bootstrapNav } = useStoreSettings();

  const bootstrapMatch = useMemo(() => {
    if (!Array.isArray(bootstrapNav) || bootstrapNav.length === 0 || !slug) return undefined;
    return findMatchingCategory(bootstrapNav, slug);
  }, [bootstrapNav, slug]);

  const [resolution, setResolution] = useState({
    loading: true,
    type: null,
    category: null,
  });

  useEffect(() => {
    if (!slug) {
      setResolution({ loading: false, type: 'static', category: null });
      return;
    }

    if (bootstrapMatch !== undefined) {
      setResolution(
        bootstrapMatch
          ? { loading: false, type: 'category', category: bootstrapMatch.slug || bootstrapMatch._id }
          : { loading: false, type: 'static', category: null }
      );
      return;
    }

    let isCurrent = true;
    setResolution({ loading: true, type: null, category: null });

    categoriesAPI
      .getNavigation()
      .then((res) => {
        if (!isCurrent) return;
        const matchedCategory = findMatchingCategory(getItems(res), slug);
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
  }, [slug, bootstrapMatch]);

  const effectiveResolution =
    bootstrapMatch !== undefined
      ? bootstrapMatch
        ? { loading: false, type: 'category', category: bootstrapMatch.slug || bootstrapMatch._id }
        : { loading: false, type: 'static', category: null }
      : resolution;

  if (effectiveResolution.loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-stone-200 border-t-[#8b6f4e] rounded-full animate-spin" />
      </div>
    );
  }

  if (effectiveResolution.type === 'category') {
    return <Shop defaultCategory={effectiveResolution.category} />;
  }

  return <StaticPageView />;
}
