import { useEffect } from 'react';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';

/**
 * Helper to update or create a <meta> tag in <head>
 */
function setMetaTag(selectorKey, selectorValue, content, isProperty = false) {
  if (typeof document === 'undefined') return;
  const attribute = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attribute}="${selectorValue}"]`);

  if (!content) {
    if (el) el.remove();
    return;
  }

  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, selectorValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Helper to update or create a <link rel="..."> tag in <head>
 */
function setLinkTag(rel, href) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`link[rel="${rel}"]`);

  if (!href) {
    if (el) el.remove();
    return;
  }

  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Helper to set or update Schema.org JSON-LD in <head>
 */
function setJsonLd(schemaData, id = 'seo-jsonld-schema') {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(id);

  if (!schemaData) {
    if (el) el.remove();
    return;
  }

  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  try {
    el.textContent = JSON.stringify(schemaData);
  } catch (err) {
    console.warn('Failed to serialize Schema.org JSON-LD:', err);
  }
}

const DEFAULT_BRAND = 'Jewels';
const buildDefaultTitle = (brandName) => `${brandName} | Fine Handcrafted Jewellery & Certified Diamonds`;
const buildDefaultDescription = (brandName) =>
  `Discover handcrafted luxury fine jewellery, certified lab-grown diamonds, and bespoke gemstone collections at ${brandName}.`;

/**
 * Comprehensive SEO Head Manager Component
 *
 * Supports:
 * - Title with automatic brand suffixing
 * - Meta description & keywords
 * - Robots indexing (e.g. noindex for checkout / cart / auth)
 * - Canonical link
 * - Open Graph (og:title, og:description, og:image, og:url, og:type, og:site_name)
 * - Product-specific Open Graph (price, currency, availability, sku)
 * - Twitter Cards (summary_large_image)
 * - Schema.org JSON-LD Structured Data (Product, Article, Organization, CollectionPage, etc.)
 */
export default function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noindex = false,
  canonical,
  // Product-specific props
  price,
  currency = 'INR',
  availability = 'in stock',
  sku,
  brand,
  // Schema.org structured data object
  schema,
}) {
  const { brandName } = useStoreSettings();
  const activeBrand = String(brand || brandName || DEFAULT_BRAND).trim() || DEFAULT_BRAND;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // 1. Title formatting
    let fullTitle = title ? title.trim() : buildDefaultTitle(activeBrand);
    if (title && !title.toLowerCase().includes(activeBrand.toLowerCase())) {
      fullTitle = `${title.trim()} | ${activeBrand}`;
    }
    document.title = fullTitle;

    // 2. Meta description & keywords
    const metaDesc = description ? description.trim().replace(/\s+/g, ' ') : buildDefaultDescription(activeBrand);
    setMetaTag('name', 'description', metaDesc);

    if (keywords) {
      const keywordsString = Array.isArray(keywords) ? keywords.join(', ') : keywords;
      setMetaTag('name', 'keywords', keywordsString);
    } else {
      setMetaTag('name', 'keywords', null);
    }

    // 3. Robots
    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
    setMetaTag('name', 'robots', robotsContent);

    // 4. Canonical URL
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const canonicalHref = canonical || currentUrl;
    if (canonicalHref) {
      setLinkTag('canonical', canonicalHref);
    }

    // 5. Open Graph tags
    setMetaTag('property', 'og:site_name', activeBrand, true);
    setMetaTag('property', 'og:type', type, true);
    setMetaTag('property', 'og:title', fullTitle, true);
    setMetaTag('property', 'og:description', metaDesc, true);
    if (currentUrl) setMetaTag('property', 'og:url', currentUrl, true);
    if (image) {
      // Ensure image URL is absolute
      const absoluteImage =
        image.startsWith('http://') || image.startsWith('https://')
          ? image
          : `${window.location.origin}${image.startsWith('/') ? '' : '/'}${image}`;
      setMetaTag('property', 'og:image', absoluteImage, true);
      setMetaTag('name', 'twitter:image', absoluteImage);
    } else {
      setMetaTag('property', 'og:image', null, true);
      setMetaTag('name', 'twitter:image', null);
    }

    // 6. Product-specific Open Graph
    if (type === 'product') {
      if (price !== undefined && price !== null) {
        setMetaTag('property', 'product:price:amount', String(price), true);
        setMetaTag('property', 'product:price:currency', currency || 'INR', true);
      }
      if (availability) {
        setMetaTag('property', 'product:availability', availability, true);
      }
      if (sku) {
        setMetaTag('property', 'product:retailer_item_id', sku, true);
      }
    } else {
      setMetaTag('property', 'product:price:amount', null, true);
      setMetaTag('property', 'product:price:currency', null, true);
      setMetaTag('property', 'product:availability', null, true);
      setMetaTag('property', 'product:retailer_item_id', null, true);
    }

    // 7. Twitter Card tags
    setMetaTag('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', metaDesc);

    // 8. Schema.org JSON-LD Structured Data
    if (schema) {
      setJsonLd(schema);
    } else if (type === 'product' && title) {
      // Automatic fallback Product schema if none explicitly provided
      const productSchema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: title,
        image: image ? [image] : undefined,
        description: metaDesc,
        sku: sku || undefined,
        brand: {
          '@type': 'Brand',
          name: activeBrand,
        },
        offers: {
          '@type': 'Offer',
          url: currentUrl,
          priceCurrency: currency || 'INR',
          price: price !== undefined && price !== null ? price : 0,
          availability:
            availability === 'out of stock'
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      };
      setJsonLd(productSchema);
    } else {
      setJsonLd(null);
    }
  }, [
    title,
    description,
    keywords,
    image,
    url,
    type,
    noindex,
    canonical,
    price,
    currency,
    availability,
    sku,
    brand,
    activeBrand,
    schema,
  ]);

  return null;
}
