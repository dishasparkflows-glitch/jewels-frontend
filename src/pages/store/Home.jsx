import ProductCard from '../../components/product/ProductCard';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  bannersAPI,
  featuredAPI,
  productsAPI,
  reviewsAPI,
  instagramAPI,
  categoriesAPI,
} from '../../api/services';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiStar,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import { FaInstagram, FaGooglePlay, FaApple } from 'react-icons/fa';

// Helper to normalize media URL from Cloudflare R2 / S3 / API or relative paths
const getMediaUrl = (url) => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(
    /\/api\/?$/,
    ''
  );
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

const Home = () => {
  const { settings: storeSettings, theme: themeConfig } = useStoreSettings();

  const activeTrustBadges = useMemo(() => {
    if (!Array.isArray(storeSettings?.trustBadges)) return [];
    return [...storeSettings.trustBadges]
      .filter((badge) => badge?.title && badge.title.trim())
      .sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0));
  }, [storeSettings?.trustBadges]);

  // ─── 100% Dynamic API State (No Static Fallback Content) ────────────
  const [heroBanners, setHeroBanners] = useState([]);
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);

  const [celebrateItems, setCelebrateItems] = useState([]);

  const [platinumProducts, setPlatinumProducts] = useState([]);
  const [silverProducts, setSilverProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);

  const [collectionBanners, setCollectionBanners] = useState([]);

  const [giftItems, setGiftItems] = useState([]);

  const [mobileAppBanner, setMobileAppBanner] = useState(null);

  const [bookAppointBanner, setBookAppointBanner] = useState(null);

  const [customBanner, setCustomBanner] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  const [instagramPosts, setInstagramPosts] = useState([]);
  const [storeCategories, setStoreCategories] = useState([]);

  const hasThemeBannerSelections = (themeConfig?.bannerSelections || []).length > 0;
  const themeBanners = hasThemeBannerSelections ? [] : (themeConfig?.banners || []).filter((banner) => banner.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
  const themeHeroBanners = themeBanners.filter((banner) => banner.placement === 'hero').map((banner) => ({
    image: banner.desktopImage?.url || '',
    mobileImage: banner.mobileImage?.url || '',
  }));
  const effectiveHeroBanners = themeHeroBanners.length ? themeHeroBanners : heroBanners;
  const themeCollectionBanners = themeBanners.filter((banner) => banner.placement === 'collection').map((banner) => ({
    id: banner._id || banner.code,
    title: banner.title || 'Collection',
    images: (banner.collectionImages || []).map((item) => {
      const categoryId = String(item.categoryId?._id || item.categoryId || '');
      const category = storeCategories.find((entry) => entry._id === categoryId);
      const categoryKey = category?.slug || categoryId;
      return {
        url: item.image?.url || '',
        categoryName: category?.name || item.image?.alt || '',
        link: item.link || (categoryKey ? `/shop?category=${encodeURIComponent(categoryKey)}` : banner.link || '/shop'),
      };
    }).filter((image) => image.url),
  }));
  const effectiveCollectionBanners = themeCollectionBanners.length ? themeCollectionBanners : collectionBanners;
  const themePromo = themeBanners.find((banner) => banner.placement === 'promo');
  const effectiveCustomBanner = themePromo ? {
    title: themePromo.title, subtitle: themePromo.subtitle, image: themePromo.desktopImage?.url || '',
    buttonText: themePromo.buttonText, link: themePromo.link,
  } : customBanner;
  const themeCategoryItems = (themeConfig?.categoryAppearances || [])
    .filter((entry) => entry.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((entry) => {
      const categoryId = String(entry.categoryId?._id || entry.categoryId || '');
      const category = storeCategories.find((item) => item._id === categoryId);
      return {
        _id: categoryId,
        name: entry.displayName || category?.name || '',
        image: entry.icon?.url || category?.icon?.url || '',
        link: category ? `/shop?category=${encodeURIComponent(category.slug || category._id)}` : `/shop?category=${encodeURIComponent(categoryId)}`,
      };
    })
    .filter((item) => item.name && item.image);
  const effectiveCategoryItems = themeCategoryItems.length ? themeCategoryItems : celebrateItems;
  const sectionConfig = themeConfig?.sections || [];
  const sectionStyle = (key, offset = 0) => {
    const section = sectionConfig.find((item) => item.key === key);
    const defaultOrder = ['hero', 'categories', 'products', 'collections', 'trustBadges', 'customBanner', 'reviews', 'instagram'].indexOf(key) + 1;
    return {
      display: section?.visible === false ? 'none' : undefined,
      order: (section?.order || defaultOrder) * 10 + offset,
    };
  };

  // Load both banner platforms; the public theme config chooses the records shown on this storefront.
  useEffect(() => {
    let mounted = true;
    Promise.all([bannersAPI.getActive({ platform: 'web' }), bannersAPI.getActive({ platform: 'mobile' })])
      .then((responses) => {
        if (!mounted) return;
        const rawList = [...new Map(responses.flatMap((res) => (Array.isArray(res?.data?.data) ? res.data.data : []))
          .map((banner) => [String(banner._id), banner])).values()];
        const selectionGroups = new Map();
        const themeSelectionOrder = new Map();
        for (const selection of themeConfig?.bannerSelections || []) {
          const platform = selection.platform || 'web';
          const scope = `${selection.type}:${platform}`;
          if (!selectionGroups.has(scope)) selectionGroups.set(scope, new Set());
          const bannerId = String(selection.bannerId?._id || selection.bannerId || '');
          if (selection.visible !== false && bannerId) {
            selectionGroups.get(scope).add(bannerId);
            themeSelectionOrder.set(bannerId, Number(selection.order) || 0);
          }
        }
        const list = rawList.filter((banner) => {
          const type = banner.display?.type || banner.type || '';
          const platform = banner.display?.platform || 'web';
          const selectedIds = selectionGroups.get(`${type}:${platform}`);
          return !selectedIds || selectedIds.has(String(banner._id));
        }).sort((left, right) => {
          const leftOrder = themeSelectionOrder.get(String(left._id));
          const rightOrder = themeSelectionOrder.get(String(right._id));
          return leftOrder === undefined || rightOrder === undefined ? 0 : leftOrder - rightOrder;
        });
        const typeOf = (banner) => banner.display?.type || banner.type || '';
        const contentOf = (banner) => banner.content || {};
        const platformOf = (banner) => banner.display?.platform || 'web';
        const mediaOf = (banner) => ({
          image: banner.image?.url || '',
          video: banner.video?.url || '',
          mediaType: banner.mediaType || 'image',
        });
        const selectType = (type) => list.filter((banner) => typeOf(banner) === type && platformOf(banner) === (type === 'mobileappbanner' ? 'mobile' : 'web'));
        const firstType = (type) => selectType(type)[0];

        setHeroBanners(selectType('herobanner').map((banner) => ({
          _id: banner._id,
          ...mediaOf(banner),
        })));
        setCollectionBanners(selectType('collectionbanner').map((banner) => ({
          id: banner._id,
          title: contentOf(banner).title || banner.title || '',
          subtitle: contentOf(banner).subtitle || banner.subtitle || '',
          images: (Array.isArray(banner.collectionImages) && banner.collectionImages.length
            ? banner.collectionImages
            : (banner.image?.url ? [banner.image] : [])).map((image) => {
              const category = image.categoryId || banner.display?.categoryId;
              const categoryKey = category?.slug || category?._id || (typeof category === 'string' ? category : '');
              return { url: image.url || '', categoryName: category?.name || '', link: categoryKey ? `/shop?category=${encodeURIComponent(categoryKey)}` : banner.link || '/shop' };
            }).filter((image) => image.url),
          ...mediaOf(banner),
          link: banner.link || '/shop',
          position: banner.display?.position || banner.position || 'none',
          collectionGroup: banner.display?.collectionGroup || '',
        })));

        const mobileBanner = firstType('mobileappbanner');
        if (mobileBanner) setMobileAppBanner({
          title: contentOf(mobileBanner).title || mobileBanner.title || '',
          subtitle: contentOf(mobileBanner).subtitle || mobileBanner.subtitle || '',
          image: mobileBanner.image?.url || '',
          link: mobileBanner.link || '',
          appStoreUrl: mobileBanner.appStoreUrl || 'https://www.apple.com/app-store/',
          googlePlayUrl: mobileBanner.googlePlayUrl || 'https://play.google.com/store',
        });
        else setMobileAppBanner(null);

        const appointmentBanner = firstType('bookappointbanner');
        if (appointmentBanner) setBookAppointBanner({
          title: contentOf(appointmentBanner).title || appointmentBanner.title || '',
          subtitle: contentOf(appointmentBanner).subtitle || appointmentBanner.subtitle || '',
          image: appointmentBanner.image?.url || '',
          buttonText: contentOf(appointmentBanner).buttonText || 'SCHEDULE APPOINTMENT',
        });
        else setBookAppointBanner(null);

        const customBannerData = list.find((banner) => banner.display?.bannerKey === 'custom_jewellery' && platformOf(banner) === 'web');
        if (customBannerData) setCustomBanner({
          title: contentOf(customBannerData).title || customBannerData.title || '',
          subtitle: contentOf(customBannerData).subtitle || customBannerData.subtitle || '',
          image: customBannerData.image?.url || '',
          buttonText: contentOf(customBannerData).buttonText || 'START CUSTOMISING',
        });
        else setCustomBanner(null);
      })
      .catch((err) => console.error('Failed to load banners:', err));
    return () => { mounted = false; };
  }, [themeConfig?.bannerSelections, themeConfig?.mediaOverrides]);

  useEffect(() => {
    let mounted = true;
    categoriesAPI.getLookup({ status: 'active' })
      .then((res) => {
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        if (mounted) setStoreCategories(list);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [themeConfig?.mediaOverrides]);

  // Carousel auto-slide when multiple banners exist
  useEffect(() => {
    if (effectiveHeroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveHeroIdx((prev) => (prev + 1) % effectiveHeroBanners.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [effectiveHeroBanners.length]);

  // ─── 2. FETCH CELEBRATE ITEMS (/api/featured?placement=Celebrate) ───
  useEffect(() => {
    const fetchCelebrate = async () => {
      try {
        const res = await featuredAPI.getCelebrate();
        const list = res?.data?.data?.items || res?.data?.data || [];
        if (Array.isArray(list)) {
          const formatted = list.map((item) => ({
            _id: item._id,
            name: item.name || '',
            image: item.image?.url || '',
            link: `/shop?category=${encodeURIComponent((item.name || '').toLowerCase().replace(/\s+/g, '-'))}`,
          }));
          setCelebrateItems(formatted);
        }
      } catch (err) {
        console.error('Failed to load celebrate section:', err);
      }
    };
    fetchCelebrate();
  }, [themeConfig?.mediaOverrides]);

  // ─── 3. FETCH PRODUCTS FOR HOME (/api/product/home) ─────────────────
  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        const res = await productsAPI.getHomeProducts();
        const data = res?.data?.data || {};

        if (data.sections) {
          setPlatinumProducts(data.sections.platinum || []);
          setSilverProducts(data.sections.silver || []);
          setTrendingProducts(data.sections.trending || []);
        } else if (Array.isArray(data.items)) {
          setPlatinumProducts(data.items.slice(0, 5));
          setSilverProducts(data.items.slice(5, 10));
          setTrendingProducts(data.items.slice(10, 15));
        }
      } catch (err) {
        console.error('Failed to load home products:', err);
      }
    };
    fetchHomeProducts();
  }, []);

  // ─── 5. FETCH GIFTS (/api/featured?placement=Gifts) ─────────────────
  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const res = await featuredAPI.getGifts();
        const list = res?.data?.data?.items || res?.data?.data || [];
        if (Array.isArray(list)) {
          const formatted = list.map((item) => ({
            _id: item._id,
            name: item.name || '',
            image: item.image?.url || '',
            link: `/shop?category=${encodeURIComponent((item.name || '').toLowerCase().replace(/\s+/g, '-'))}`,
          }));
          setGiftItems(formatted);
        }
      } catch (err) {
        console.error('Failed to load gifts:', err);
      }
    };
    fetchGifts();
  }, [themeConfig?.mediaOverrides]);

  // ─── 9. FETCH REVIEWS (/api/reviews?status=approved) ─────────────────
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await reviewsAPI.getApproved();
        const list = res?.data?.data?.items || res?.data?.data || [];
        if (Array.isArray(list)) {
          const formatted = list.map((r, idx) => ({
            id: r._id || `rev-${idx}`,
            clientName: r.customer?.name || r.clientName || 'Client',
            location: '',
            rating: r.review?.rating || r.rating || 5,
            comment: r.review?.comment || r.comment || '',
          }));
          setReviews(formatted);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      }
    };
    fetchReviews();
  }, []);

  // ─── 10. FETCH INSTAGRAM POSTS (/api/instagram-posts/lookup) ─────────
  useEffect(() => {
    const fetchInstagram = async () => {
      try {
        const res = await instagramAPI.getLookup();
        const list = res?.data?.data || res?.data?.items || res?.data || [];
        if (Array.isArray(list)) {
          const formatted = list.map((p, idx) => ({
            id: p._id || `insta-${idx}`,
            handle: '@neirahjewels',
            image: p.image?.url || p.mediaUrl || '',
            url: p.url || 'https://instagram.com/neirahjewelsofficial',
            title: p.title || '',
          }));
          setInstagramPosts(formatted);
        }
      } catch (err) {
        console.error('Failed to load instagram posts:', err);
      }
    };
    fetchInstagram();
  }, []);

  const openAppointmentModal = () => {
    window.dispatchEvent(new CustomEvent('open-virtual-appointment'));
  };

  const currentHero = effectiveHeroBanners[activeHeroIdx] || effectiveHeroBanners[0];
  const currentReview = reviews[activeReviewIdx] || reviews[0];

  return (
    <div className="flex flex-col bg-white text-stone-900 font-sans antialiased overflow-x-hidden" style={{ minHeight: '100%', backgroundColor: themeConfig?.colors?.background || undefined, color: themeConfig?.colors?.text || undefined, fontFamily: themeConfig?.typography?.bodyFont || undefined }}>
      {/* ─────────────────────────────────────────────────────────────────
          1. HERO BANNER (Selected from the shared active-banners response)
      ─────────────────────────────────────────────────────────────────── */}
      {effectiveHeroBanners.length > 0 && currentHero && (
        <section style={sectionStyle('hero')} className="relative isolate min-h-[280px] sm:min-h-[420px] lg:min-h-[560px] overflow-hidden bg-[#d6bea1] text-[#29231d]">
          {currentHero.image && <picture><source media="(max-width: 767px)" srcSet={getMediaUrl(currentHero.mobileImage || currentHero.image)} /><img src={getMediaUrl(currentHero.image)} alt="" className="absolute inset-0 h-full w-full object-cover" /></picture>}
          {currentHero.video && !currentHero.image && <video src={getMediaUrl(currentHero.video)} className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline />}

          {/* Carousel Chevrons (only shown when multiple API banners exist) */}
          {effectiveHeroBanners.length > 1 && (
            <>
              <button
                onClick={() => setActiveHeroIdx((prev) => (prev - 1 + effectiveHeroBanners.length) % effectiveHeroBanners.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer"
                aria-label="Previous hero banner"
              >
                <HiOutlineChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveHeroIdx((prev) => (prev + 1) % effectiveHeroBanners.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer"
                aria-label="Next hero banner"
              >
                <HiOutlineChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          2. CELEBRATE WITH NEIRAH (Dynamic from /api/featured?placement=Celebrate)
      ─────────────────────────────────────────────────────────────────── */}
      {effectiveCategoryItems.length > 0 && (
        <section style={sectionStyle('categories')} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-stone-900 font-normal tracking-wide">
              Celebrate With Neirah
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {effectiveCategoryItems.map((item) => (
              <Link
                key={item._id}
                to={item.link}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#0c241c] border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-end"
              >
                {item.image && (
                  <img
                    src={getMediaUrl(item.image)}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10 p-4 text-center">
                  <span className="text-xs sm:text-sm font-medium text-white tracking-wide block drop-shadow-md">
                    {item.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          3. PRODUCTS SECTION (Dynamic from /api/product/home)
      ─────────────────────────────────────────────────────────────────── */}
      <section style={sectionStyle('products')} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {/* Platinum Sub-Section */}
        {platinumProducts.length > 0 && (
          <div>
            <div className="text-center mb-8">
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-stone-400 block mb-1">
                EXCLUSIVE ATELIER
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-wide">
                100% SOLID PLATINUM
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {platinumProducts.map((product) => <ProductCard key={product.id || product._id} product={product} />)}
            </div>
          </div>
        )}

        {/* Silver Jewellery Sub-Section */}
        {silverProducts.length > 0 && (
          <div>
            <div className="text-center mb-8">
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-stone-400 block mb-1">
                925 STERLING PURITY
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-wide">
                Silver Jewellery
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {silverProducts.map((product) => <ProductCard key={product.id || product._id} product={product} />)}
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          4. CURATED COLLECTION BANNERS (Dynamic Bento Grid from /api/banners)
      ─────────────────────────────────────────────────────────────────── */}
      {effectiveCollectionBanners.length > 0 && (
        <section style={sectionStyle('collections')} className="mx-auto max-w-[1440px] space-y-8 px-4 py-12 sm:px-6 lg:px-8">
          {effectiveCollectionBanners.map((collection) => {
            const [image1, image2, image3, image4] = collection.images || [];
            if (!image1 || !image2 || !image3 || !image4) return null;
            const tileClass = 'group relative block overflow-hidden bg-stone-100';
            const tileImageClass = 'h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]';
            return (
              <div key={collection.id} className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Link to={image1.link} className={`${tileClass} aspect-square`} aria-label={`${collection.title} image 1`}>
                    <img src={getMediaUrl(image1.url)} alt={image1.categoryName || `${collection.title} 1`} loading="lazy" className={tileImageClass} />
                  </Link>
                  <Link to={image2.link} className={`${tileClass} aspect-square`} aria-label={`${collection.title} image 2`}>
                    <img src={getMediaUrl(image2.url)} alt={image2.categoryName || `${collection.title} 2`} loading="lazy" className={tileImageClass} />
                  </Link>
                  <Link to={image3.link} className={`${tileClass} aspect-[2/1] sm:col-span-2`} aria-label={`${collection.title} image 3`}>
                    <img src={getMediaUrl(image3.url)} alt={image3.categoryName || `${collection.title} 3`} loading="lazy" className={tileImageClass} />
                  </Link>
                </div>
                <Link to={image4.link} className={`${tileClass} aspect-square lg:aspect-auto lg:min-h-full`} aria-label={`${collection.title} image 4`}>
                  <img src={getMediaUrl(image4.url)} alt={image4.categoryName || `${collection.title} 4`} loading="lazy" className={tileImageClass} />
                </Link>
              </div>
            );
          })}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          5. TRUST BADGES ROW (Dynamic from Settings)
      ─────────────────────────────────────────────────────────────────── */}
      {activeTrustBadges.length > 0 && (
        <section style={sectionStyle('trustBadges')} className="border-y border-stone-200/70 bg-[#faf9f7] py-6 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center sm:justify-around gap-6 text-center">
            {activeTrustBadges.map((item, index) => {
              const imageUrl = item.image?.url ? getMediaUrl(item.image.url) : null;
              return (
                <div key={item._id || index} className="flex flex-col items-center justify-center gap-1.5 text-stone-600 px-3 py-1">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="h-6 w-6 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-800 text-center">
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          6. CUSTOM JEWELLERY BANNER (Selected from the shared active-banners response)
      ─────────────────────────────────────────────────────────────────── */}
      {effectiveCustomBanner && (
        <section style={sectionStyle('customBanner')} className="bg-gradient-to-r from-[#292622] via-[#39332d] to-[#292622] text-white py-14 px-4 sm:px-6 lg:px-8 border-y border-stone-700 relative overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
            <div className="w-full lg:w-5/12 bg-[#f4ede4] text-stone-900 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-5 border border-amber-100">
              <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight leading-snug">
                {effectiveCustomBanner.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
                {effectiveCustomBanner.subtitle}
              </p>
              <div>
                <button
                  type="button"
                  onClick={openAppointmentModal}
                  className="px-7 py-3 rounded-full bg-[#d4af37] hover:bg-[#c39e2d] text-stone-900 text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {effectiveCustomBanner.buttonText || 'START CUSTOMISING'}
                </button>
              </div>
            </div>

            <div className="w-full lg:w-3/12 space-y-5 text-sm">
              <div className="flex items-center gap-3 text-amber-200">
                <IoDiamondOutline className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="font-medium text-stone-100">100% Purity Certified</span>
              </div>
              <div className="flex items-center gap-3 text-amber-200">
                <HiOutlineCheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="font-medium text-stone-100">Transparent Pricing</span>
              </div>
              <div className="flex items-center gap-3 text-amber-200">
                <HiOutlineCheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="font-medium text-stone-100">Custom 3D CAD Preview</span>
              </div>
            </div>

            <div className="w-full lg:w-4/12 flex justify-center lg:justify-end">
              {effectiveCustomBanner.image && (
                <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/30 aspect-[4/3] w-full max-w-sm">
                  <img
                    src={getMediaUrl(effectiveCustomBanner.image)}
                    alt={effectiveCustomBanner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          7. GIFTS SECTION (Dynamic from /api/featured?placement=Gifts)
      ─────────────────────────────────────────────────────────────────── */}
      {giftItems.length > 0 && (
        <section style={sectionStyle('categories', 1)} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-stone-900 font-normal tracking-wide">
              Gifts That Say A Lot
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {giftItems.map((gift) => (
              <Link
                key={gift._id}
                to={gift.link}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#0c241c] border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-end"
              >
                {gift.image && (
                  <img
                    src={getMediaUrl(gift.image)}
                    alt={gift.name}
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10 p-4 text-center">
                  <span className="text-xs sm:text-sm font-medium text-white tracking-wide block drop-shadow-md">
                    {gift.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          8. MOBILE APP BANNER (Selected from the shared active-banners response)
      ─────────────────────────────────────────────────────────────────── */}
      {mobileAppBanner && (
        <section style={sectionStyle('customBanner', 1)} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-3xl bg-gradient-to-r from-[#292622] via-[#39332d] to-[#292622] text-white p-8 sm:p-12 relative overflow-hidden shadow-xl border border-stone-700 flex flex-col md:flex-row items-center justify-between gap-10">
            {mobileAppBanner.image && (
              <div className="w-full md:w-5/12 flex items-center justify-center">
                <div className="w-52 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-stone-700">
                  <img
                    src={getMediaUrl(mobileAppBanner.image)}
                    alt="Neirah Mobile App"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="w-full md:w-7/12 text-center md:text-left space-y-5">
              <h3 className="font-serif text-2xl sm:text-4xl text-[#f5f1eb] font-normal leading-tight">
                {mobileAppBanner.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 font-light max-w-lg leading-relaxed">
                {mobileAppBanner.subtitle}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <a
                  href={mobileAppBanner.googlePlayUrl || "https://play.google.com/store"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-stone-600 bg-black/60 hover:bg-black/90 transition-all text-white shadow-md group"
                >
                  <FaGooglePlay className="w-5 h-5 text-stone-300 group-hover:text-white transition-colors" />
                  <div className="text-left leading-tight">
                    <span className="block text-[8px] uppercase tracking-wider text-stone-400">GET IT ON</span>
                    <span className="block text-xs font-bold text-white tracking-wide">Google Play</span>
                  </div>
                </a>

                <a
                  href={mobileAppBanner.appStoreUrl || "https://www.apple.com/app-store/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-stone-600 bg-black/60 hover:bg-black/90 transition-all text-white shadow-md group"
                >
                  <FaApple className="w-6 h-6 text-stone-300 group-hover:text-white transition-colors" />
                  <div className="text-left leading-tight">
                    <span className="block text-[8px] uppercase tracking-wider text-stone-400">DOWNLOAD ON THE</span>
                    <span className="block text-xs font-bold text-white tracking-wide">App Store</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          9. TRENDING JEWELLERY SECTION (Dynamic from /api/product/home)
      ─────────────────────────────────────────────────────────────────── */}
      <section style={sectionStyle('products', 1)} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h3 className="font-serif text-lg sm:text-xl text-stone-800 font-light mb-8">
          Trending jewellery, fitting your demands.
        </h3>

        {trendingProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 text-left">
            {trendingProducts.map((product) => <ProductCard key={product.id || product._id} product={product} />)}
          </div>
        ) : (
          <div className="py-8 space-y-3">
            <span className="text-xs text-stone-400 font-light block">No Products Found</span>
            <div className="w-24 h-[1px] bg-stone-300 mx-auto" />
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          10. BOOK A VIRTUAL APPOINTMENT BANNER (Selected from the shared active-banners response)
      ─────────────────────────────────────────────────────────────────── */}
      {bookAppointBanner && (
        <section style={sectionStyle('customBanner', 2)} className="bg-gradient-to-r from-[#292622] via-[#39332d] to-[#292622] text-white py-14 px-4 sm:px-6 lg:px-8 border-y border-stone-700 relative overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
            <div className="w-full lg:w-5/12 bg-[#f4ede4] text-stone-900 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-5 border border-amber-100">
              <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight leading-snug">
                {bookAppointBanner.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
                {bookAppointBanner.subtitle}
              </p>
              <div>
                <button
                  type="button"
                  onClick={openAppointmentModal}
                  className="px-7 py-3 rounded-full bg-[#d4af37] hover:bg-[#c39e2d] text-stone-900 text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {bookAppointBanner.buttonText || 'SCHEDULE APPOINTMENT'}
                </button>
              </div>
            </div>

            <div className="w-full lg:w-6/12 flex justify-center lg:justify-end">
              {bookAppointBanner.image && (
                <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/30 aspect-[16/9] w-full max-w-lg">
                  <img
                    src={getMediaUrl(bookAppointBanner.image)}
                    alt={bookAppointBanner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          11. WHAT OUR CLIENTS ARE SAYING (Dynamic from /api/reviews)
      ─────────────────────────────────────────────────────────────────── */}
      {reviews.length > 0 && currentReview && (
        <section style={sectionStyle('reviews')} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-stone-400 block mb-2">
            TESTIMONIALS
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-wide mb-10">
            WHAT OUR CLIENTS ARE SAYING
          </h2>

          <div className="bg-[#fcfaf7] border border-stone-200/90 rounded-3xl p-8 sm:p-12 shadow-sm relative">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-4">
              {Array.from({ length: currentReview.rating || 5 }).map((_, i) => (
                <HiStar key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>

            <p className="font-serif italic text-base sm:text-lg text-stone-700 leading-relaxed max-w-2xl mx-auto mb-6">
              &ldquo;{currentReview.comment}&rdquo;
            </p>

            <div className="font-sans">
              <span className="text-xs font-bold tracking-widest uppercase text-stone-900 block">
                {currentReview.clientName}
              </span>
            </div>

            {reviews.length > 1 && (
              <>
                <button
                  onClick={() => setActiveReviewIdx((prev) => (prev - 1 + reviews.length) % reviews.length)}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-stone-600 hover:text-black transition-colors cursor-pointer"
                  aria-label="Previous review"
                >
                  <HiOutlineChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveReviewIdx((prev) => (prev + 1) % reviews.length)}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-stone-600 hover:text-black transition-colors cursor-pointer"
                  aria-label="Next review"
                >
                  <HiOutlineChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          12. FOLLOW US ON INSTAGRAM (Dynamic from /api/instagram-posts)
      ─────────────────────────────────────────────────────────────────── */}
      {instagramPosts.length > 0 && (
        <section style={sectionStyle('instagram')} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-wide">
              Follow Us On Instagram
            </h2>
            <a
              href="https://instagram.com/neirahjewelsofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stone-500 hover:text-black transition-colors mt-1 inline-block"
            >
              @neirahjewels
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {instagramPosts.map((post) => (
              <a
                key={post.id}
                href={post.url || 'https://instagram.com/neirahjewelsofficial'}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-2xl overflow-hidden aspect-[9/16] bg-stone-900 border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between p-3.5"
              >
                {post.image ? (
                  <img
                    src={getMediaUrl(post.image)}
                    alt={post.title || 'Instagram post'}
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-stone-800 text-stone-500">
                    <FaInstagram className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />

                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 flex items-center justify-center">
                      <FaInstagram className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[10px] text-white font-medium drop-shadow-xs">neirahjewels</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-blue-600 px-2 py-0.5 rounded-full shadow-xs">
                    Follow
                  </span>
                </div>

                <div className="relative z-10 flex items-center justify-between text-white/90">
                  <span className="text-[10px] font-light tracking-wide">Watch Reel</span>
                  <FaInstagram className="w-4 h-4 text-white drop-shadow-xs" />
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
