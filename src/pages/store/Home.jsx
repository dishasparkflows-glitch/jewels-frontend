import ProductCard from '../../components/product/ProductCard';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import InstagramEmbed from '../../components/common/InstagramEmbed';

const DEFAULT_INSTAGRAM_POSTS = [
  {
    _id: 'default-insta-1',
    url: 'https://www.instagram.com/p/DeTf9dWIewJ/',
    title: 'Neirah Launch',
  },
  {
    _id: 'default-insta-2',
    url: 'https://www.instagram.com/p/DXYuCgeApvk/',
    title: 'Neirah Jewellery Collection',
  },
  {
    _id: 'default-insta-3',
    url: 'https://www.instagram.com/p/DePpbOfM5TJ/',
    title: 'Royal Diamond Atelier',
  },
  {
    _id: 'default-insta-4',
    url: 'https://www.instagram.com/p/DaKA3qsjxrS/',
    title: 'Sparkle in Every Detail',
  },
];

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
  const celebrateScrollRef = useRef(null);
  const [isCelebrateHovered, setIsCelebrateHovered] = useState(false);

  const [goldProducts, setGoldProducts] = useState([]);
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

  const [instagramPosts, setInstagramPosts] = useState(DEFAULT_INSTAGRAM_POSTS);
  const [storeCategories, setStoreCategories] = useState([]);

  const effectiveHeroBanners = heroBanners;
  const effectiveCollectionBanners = collectionBanners;
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
  const sectionStyle = (key) => {
    const section = sectionConfig.find((item) => item.key === key);
    return {
      display: section?.visible === false ? 'none' : undefined,
    };
  };

  // ─── Direct Call Banner API (Single web call, filtered by display.type) ───
  useEffect(() => {
    let mounted = true;
    bannersAPI.getActive({ platform: 'web' })
      .then((webRes) => {
        if (!mounted) return;
        const allBanners = Array.isArray(webRes?.data?.data) ? webRes.data.data : [];

        const typeOf = (b) => b.display?.type || b.type || '';
        const contentOf = (b) => b.content || {};
        const mediaOf = (b) => ({
          image: b.image?.url || '',
          video: b.video?.url || '',
          mediaType: b.mediaType || 'image',
        });

        // 1. Hero banners
        const heroList = allBanners.filter((b) => typeOf(b) === 'herobanner');
        setHeroBanners(
          heroList.map((banner) => ({
            _id: banner._id,
            ...mediaOf(banner),
          }))
        );

        // 2. Curated collection banners
        const collectionList = allBanners.filter((b) => typeOf(b) === 'collectionbanner');
        setCollectionBanners(
          collectionList.map((banner) => ({
            id: banner._id,
            title: contentOf(banner).title || banner.title || '',
            subtitle: contentOf(banner).subtitle || banner.subtitle || '',
            images: (Array.isArray(banner.collectionImages) && banner.collectionImages.length
              ? banner.collectionImages
              : (banner.image?.url ? [banner.image] : [])).map((image) => {
                const category = image.categoryId || banner.display?.categoryId;
                const categoryKey = category?.slug || category?._id || (typeof category === 'string' ? category : '');
                return {
                  url: image.url || '',
                  categoryName: category?.name || '',
                  link: categoryKey ? `/shop?category=${encodeURIComponent(categoryKey)}` : banner.link || '/shop',
                };
              }).filter((img) => img.url),
            ...mediaOf(banner),
            link: banner.link || '/shop',
            position: banner.display?.position || banner.position || 'none',
            collectionGroup: banner.display?.collectionGroup || '',
          }))
        );

        // 3. Customize banner
        const customBannerData = allBanners.find(
          (b) => typeOf(b) === 'customizebanner' || b.display?.bannerKey === 'custom_jewellery'
        );
        if (customBannerData && (customBannerData.image?.url || customBannerData.image)) {
          setCustomBanner({
            title: contentOf(customBannerData).title && contentOf(customBannerData).title !== 'Customize Banner'
              ? contentOf(customBannerData).title
              : 'Custom Jewellery, Crafted for You',
            subtitle: contentOf(customBannerData).subtitle || 'Bring your vision to life with a one-of-a-kind piece, designed and handcrafted to reflect your unique style.',
            image: customBannerData.image?.url || (typeof customBannerData.image === 'string' ? customBannerData.image : ''),
            buttonText: contentOf(customBannerData).buttonText || 'CUSTOMIZE NOW',
            link: customBannerData.link || '/custom',
          });
        } else {
          setCustomBanner(null);
        }

        // 4. Mobile app banner (filtered by display.type: mobileappbanner)
        const mobileBanner = allBanners.find((b) => typeOf(b) === 'mobileappbanner');
        if (mobileBanner && (mobileBanner.image?.url || mobileBanner.image)) {
          setMobileAppBanner({
            title: contentOf(mobileBanner).title && contentOf(mobileBanner).title !== 'App Banner'
              ? contentOf(mobileBanner).title
              : "Discover NEIRAH's exquisite\njewelry collection anytime.\nanywhere",
            subtitle: contentOf(mobileBanner).subtitle || 'Download the NEIRAH App\ntoday on',
            image: mobileBanner.image?.url || (typeof mobileBanner.image === 'string' ? mobileBanner.image : ''),
            link: mobileBanner.link || '',
            appStoreUrl: mobileBanner.appStoreUrl || storeSettings?.appStoreUrl || 'https://www.apple.com/app-store/',
            googlePlayUrl: mobileBanner.googlePlayUrl || storeSettings?.googlePlayUrl || 'https://play.google.com/store',
          });
        } else {
          setMobileAppBanner(null);
        }

        // 5. Book appointment banner
        const appointmentBanner = allBanners.find((b) => typeOf(b) === 'bookappointbanner');
        if (appointmentBanner && (appointmentBanner.image?.url || appointmentBanner.image)) {
          setBookAppointBanner({
            title: contentOf(appointmentBanner).title && contentOf(appointmentBanner).title !== 'Appointment Banner'
              ? contentOf(appointmentBanner).title
              : 'Book A Virtual Appointment',
            subtitle: contentOf(appointmentBanner).subtitle || 'Book a personalized appointment to explore designs that match your style. Let our experts guide you in finding or creating something truly special.',
            image: appointmentBanner.image?.url || (typeof appointmentBanner.image === 'string' ? appointmentBanner.image : ''),
            buttonText: contentOf(appointmentBanner).buttonText || 'SCHEDULE APPOINTMENT',
          });
        } else {
          setBookAppointBanner(null);
        }
      })
      .catch((err) => console.error('Failed to load banners:', err));

    return () => { mounted = false; };
  }, [storeSettings?.appStoreUrl, storeSettings?.googlePlayUrl]);

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

  // ─── 2. FETCH ALL FEATURED SHOWCASES (Celebrate & Gifts in a single API call) ───
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await featuredAPI.getAll({ status: 'active', limit: 100 });
        const list = res?.data?.data?.items || res?.data?.data || [];
        if (Array.isArray(list)) {
          const featuredSelections = themeConfig?.featuredSelections || [];

          // Process Celebrate items
          const celebrateSelections = featuredSelections.filter((s) => (s.placement || 'Celebrate') === 'Celebrate' && s.visible !== false);
          let rawCelebrate = list.filter((item) => (item.placement || '').toLowerCase() === 'celebrate');
          if (celebrateSelections.length > 0) {
            const orderMap = new Map(celebrateSelections.map((s) => [String(s.featuredId?._id || s.featuredId || ''), s.order || 0]));
            rawCelebrate = rawCelebrate
              .filter((item) => orderMap.has(String(item._id)))
              .sort((a, b) => (orderMap.get(String(a._id)) || 0) - (orderMap.get(String(b._id)) || 0));
          }
          setCelebrateItems(rawCelebrate.map((item) => ({
            _id: item._id,
            name: item.name || '',
            image: item.image?.url || '',
            link: `/shop?category=${encodeURIComponent((item.name || '').toLowerCase().replace(/\s+/g, '-'))}`,
          })));

          // Process Gifts items
          const giftSelections = featuredSelections.filter((s) => (s.placement || '').toLowerCase() === 'gifts' && s.visible !== false);
          let rawGifts = list.filter((item) => (item.placement || '').toLowerCase() === 'gifts');
          if (giftSelections.length > 0) {
            const orderMap = new Map(giftSelections.map((s) => [String(s.featuredId?._id || s.featuredId || ''), s.order || 0]));
            rawGifts = rawGifts
              .filter((item) => orderMap.has(String(item._id)))
              .sort((a, b) => (orderMap.get(String(a._id)) || 0) - (orderMap.get(String(b._id)) || 0));
          }
          setGiftItems(rawGifts.map((item) => ({
            _id: item._id,
            name: item.name || '',
            image: item.image?.url || '',
            link: `/shop?category=${encodeURIComponent((item.name || '').toLowerCase().replace(/\s+/g, '-'))}`,
          })));
        }
      } catch (err) {
        console.error('Failed to load featured showcases:', err);
      }
    };
    fetchFeatured();
  }, [themeConfig?.mediaOverrides, themeConfig?.featuredSelections]);

  const scrollCelebrate = useCallback((direction) => {
    const el = celebrateScrollRef.current;
    if (!el) return;
    const card = el.querySelector('.celebrate-card');
    const scrollAmount = card ? card.offsetWidth + 20 : el.clientWidth * 0.5;
    el.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  // Auto scroll for Celebrate With Neirah side by side
  useEffect(() => {
    if (effectiveCategoryItems.length <= 1) return;
    let timer;

    const startTimer = () => {
      timer = setInterval(() => {
        const el = celebrateScrollRef.current;
        if (!el) return;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const card = el.querySelector('.celebrate-card');
          const scrollAmount = card ? card.offsetWidth + 20 : el.clientWidth * 0.5;
          el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }, 3500);
    };

    if (!isCelebrateHovered) {
      startTimer();
    }

    return () => clearInterval(timer);
  }, [effectiveCategoryItems.length, isCelebrateHovered]);

  // ─── 3. FETCH PRODUCTS FOR HOME (/api/products/home) ─────────────────
  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        const res = await productsAPI.getHomeProducts();
        const data = res?.data?.data || {};

        if (data.sections) {
          setGoldProducts(data.sections.gold || data.sections.mostLoved || []);
          setPlatinumProducts(data.sections.platinum || []);
          setSilverProducts(data.sections.silver || []);
          setTrendingProducts(data.sections.trending || []);
        } else if (Array.isArray(data.items)) {
          const gold = data.items.filter((p) => p.productType === 'gold');
          setGoldProducts(gold.length > 0 ? gold.slice(0, 5) : data.items.slice(0, 5));
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
        if (Array.isArray(list) && list.length > 0) {
          const valid = list.filter((p) => p.url && p.url.trim());
          if (valid.length > 0) {
            setInstagramPosts(
              valid.map((p, idx) => ({
                _id: p._id || `insta-${idx}`,
                url: p.url.trim(),
                title: p.title || '',
              }))
            );
          }
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
        <section style={sectionStyle('categories')} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-wide">
              Celebrate With Neirah
            </h2>
          </div>

          <div
            className="relative group/celebrate px-1"
            onMouseEnter={() => setIsCelebrateHovered(true)}
            onMouseLeave={() => setIsCelebrateHovered(false)}
          >
            {/* Left Chevron Button */}
            <button
              type="button"
              onClick={() => scrollCelebrate('prev')}
              aria-label="Previous categories"
              className="absolute -left-2 sm:-left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-md border border-stone-200/90 transition-all hover:bg-stone-50 hover:scale-110 active:scale-95 cursor-pointer"
            >
              <HiOutlineChevronLeft className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </button>

            {/* Scrollable Container with exact box size and hidden scrollbar */}
            <div
              ref={celebrateScrollRef}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex items-center gap-3 sm:gap-4 lg:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 [&::-webkit-scrollbar]:hidden"
            >
              {effectiveCategoryItems.map((item) => (
                <Link
                  key={item._id}
                  to={item.link}
                  className="celebrate-card group relative rounded-2xl overflow-hidden aspect-[4/5] bg-stone-100 border border-stone-200/80 shadow-xs hover:shadow-lg transition-all duration-500 shrink-0 snap-start flex flex-col justify-end w-[65vw] sm:w-[calc(50%-10px)] md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)]"
                >
                  {item.image && (
                    <img
                      src={getMediaUrl(item.image)}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="relative z-10 p-3 sm:p-4 text-left">
                    <span className="text-xs sm:text-[13px] font-medium text-white tracking-wide block drop-shadow-md truncate">
                      {item.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Right Chevron Button */}
            <button
              type="button"
              onClick={() => scrollCelebrate('next')}
              aria-label="Next categories"
              className="absolute -right-2 sm:-right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-md border border-stone-200/90 transition-all hover:bg-stone-50 hover:scale-110 active:scale-95 cursor-pointer"
            >
              <HiOutlineChevronRight className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          3. PRODUCTS SECTION (Dynamic from /api/products/home)
      ─────────────────────────────────────────────────────────────────── */}
      <section style={sectionStyle('products')} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {/* Most Loved on Neirah - Gold Products Sub-Section */}
        {(goldProducts.length > 0 || platinumProducts.length > 0) && (
          <div>
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-wide">
                Most Loved on Neirah
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
              {(goldProducts.length > 0 ? goldProducts : platinumProducts).map((product) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))}
            </div>

            {/* DISCOVER Button Matching Screenshot */}
            <div className="text-center mt-8 sm:mt-10">
              <Link
                to="/shop?productType=gold"
                className="inline-flex items-center justify-center border border-stone-800 text-stone-900 text-[11px] sm:text-xs font-medium tracking-[0.2em] px-10 py-2.5 uppercase hover:bg-stone-900 hover:text-white transition-all duration-300"
              >
                DISCOVER
              </Link>
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
          6. CUSTOM JEWELLERY BANNER (Direct from /api/banners/lookup)
      ─────────────────────────────────────────────────────────────────── */}
      {customBanner?.image && (
        <section style={sectionStyle('customBanner')} className="pt-6 sm:pt-10 relative overflow-hidden">
          {/* Desktop view */}
          <div className="hidden md:block relative w-full">
            <img
              src={getMediaUrl(customBanner.image)}
              alt={customBanner.title || 'Custom Jewellery Journey'}
              className="w-full h-auto block"
            />
            <div className="absolute z-10 left-[5%] lg:left-[6%] xl:left-[8%] top-1/2 -translate-y-1/2 w-[38%] lg:w-[35%] xl:w-[34%] border border-[#E8E0D8]/40 rounded-[12px] lg:rounded-[18px] xl:rounded-[24px] bg-[#F0EBE4]/95 backdrop-blur-md p-[3%] xl:p-[2.5%] text-[#1A1815] shadow-lg transition-all duration-300">
              <h2 className="unna-font font-serif text-[18px] lg:text-2xl xl:text-3xl font-normal mb-[3%] leading-tight text-[#1A1815]">
                {customBanner.title}
              </h2>
              <p className="text-[11px] lg:text-xs xl:text-sm mb-[6%] font-normal text-[#6B6460] leading-relaxed">
                {customBanner.subtitle}
              </p>
              <div>
                {customBanner.link && customBanner.link !== '/custom' ? (
                  <Link
                    to={customBanner.link}
                    className="inline-block w-auto bg-[#F4594B] text-white px-6 py-2.5 text-[10px] lg:text-[11px] xl:text-[12px] font-bold tracking-[0.2em] uppercase rounded-xl shadow-md hover:bg-[#F4594B]/95 hover:transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {customBanner.buttonText || 'CUSTOMIZE NOW'}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openAppointmentModal}
                    className="inline-block w-auto bg-[#F4594B] text-white px-6 py-2.5 text-[10px] lg:text-[11px] xl:text-[12px] font-bold tracking-[0.2em] uppercase rounded-xl shadow-md hover:bg-[#F4594B]/95 hover:transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    {customBanner.buttonText || 'CUSTOMIZE NOW'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile view */}
          <div className="block md:hidden px-3 sm:px-4">
            <div className="relative w-full h-[220px] sm:h-[260px] rounded-[20px] sm:rounded-[24px] overflow-hidden border border-[#E8E0D8]/80 shadow-md bg-[#FAF6F0]">
              <img
                src={getMediaUrl(customBanner.image)}
                alt={customBanner.title || 'Custom Jewellery Journey'}
                className="absolute inset-0 w-full h-full object-cover object-[80%_center]"
              />
              <div className="absolute z-10 left-3 sm:left-4 top-1/2 -translate-y-1/2 w-[58%] sm:w-[50%] bg-[#F0EBE4]/95 backdrop-blur-md rounded-xl sm:rounded-2xl border border-[#E8E0D8]/80 p-3 sm:p-4 shadow-lg transition-all">
                <h2 className="unna-font font-serif text-xs sm:text-base font-normal text-[#1A1815] mb-1 sm:mb-1.5 leading-tight">
                  {customBanner.title}
                </h2>
                <p className="text-[8px] sm:text-[10px] text-[#6B6460] font-normal leading-relaxed line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-2.5">
                  {customBanner.subtitle}
                </p>
                <div>
                  {customBanner.link && customBanner.link !== '/custom' ? (
                    <Link
                      to={customBanner.link}
                      className="inline-block w-auto bg-[#F4594B] text-white px-3 sm:px-4 py-1.5 sm:py-2 text-[8px] sm:text-[9px] font-bold tracking-[0.2em] uppercase rounded-lg shadow-md hover:bg-[#F4594B]/95 transition-all"
                    >
                      {customBanner.buttonText || 'CUSTOMIZE NOW'}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={openAppointmentModal}
                      className="inline-block w-auto bg-[#F4594B] text-white px-3 sm:px-4 py-1.5 sm:py-2 text-[8px] sm:text-[9px] font-bold tracking-[0.2em] uppercase rounded-lg shadow-md hover:bg-[#F4594B]/95 transition-all cursor-pointer"
                    >
                      {customBanner.buttonText || 'CUSTOMIZE NOW'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          7. GIFTS SECTION (Dynamic from /api/featured?placement=Gifts)
      ─────────────────────────────────────────────────────────────────── */}
      {giftItems.length > 0 && (
        <section style={sectionStyle('gifts')} className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-stone-900 font-normal tracking-wide">
              Gifts That Say It All
            </h2>
          </div>

          <div
            className="grid grid-cols-2 lg:grid-cols-4 w-full"
            style={{ gap: '24px' }}
          >
            {giftItems.map((gift) => (
              <Link
                key={gift._id}
                to={gift.link}
                style={{ borderRadius: '22px' }}
                className="group relative overflow-hidden aspect-[3/4] min-h-[360px] sm:min-h-[390px] lg:min-h-[415px] bg-stone-100 border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-end cursor-pointer isolate"
              >
                {gift.image && (
                  <img
                    src={getMediaUrl(gift.image)}
                    alt={gift.name}
                    style={{ borderRadius: '22px' }}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                )}
                <div
                  style={{ borderBottomLeftRadius: '22px', borderBottomRightRadius: '22px' }}
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/85 pointer-events-none"
                />
                <div className="relative z-10 p-4 sm:p-5 text-left">
                  <span className="text-sm sm:text-base font-medium text-white tracking-wide block drop-shadow-sm">
                    {gift.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          8. MOBILE APP BANNER (Direct from /api/banners/lookup)
      ─────────────────────────────────────────────────────────────────── */}
      {mobileAppBanner?.image && (
        <section style={sectionStyle('mobileApp')} className="pt-8 sm:pt-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Desktop view */}
            <div className="hidden md:flex relative w-full aspect-[1440/420] min-h-[360px] lg:min-h-[420px] rounded-[24px] lg:rounded-[30px] overflow-hidden shadow-sm items-center border border-[#F0E6D8]/80 bg-[#FBF3EB]">
              <img
                src={getMediaUrl(mobileAppBanner.image)}
                alt="NEIRAH Mobile App"
                className="absolute inset-0 w-full h-full object-cover object-left lg:object-center select-none pointer-events-none"
              />
              <div className="relative z-10 w-full md:w-[54%] lg:w-[50%] xl:w-[48%] ml-auto flex flex-col items-center text-center px-4 md:px-6 lg:px-12 py-4">
                <h2 className="unna-font font-serif text-[#5C3617] text-2xl md:text-[26px] lg:text-[34px] xl:text-[38px] font-normal leading-[1.22] tracking-tight whitespace-pre-line">
                  {mobileAppBanner.title}
                </h2>
                <p className="font-sans text-[#8C461E] font-medium text-xs md:text-sm lg:text-[16px] mt-3 lg:mt-4 mb-4 lg:mb-5 leading-snug whitespace-pre-line">
                  {mobileAppBanner.subtitle}
                </p>
                <div className="flex items-center justify-center gap-3 lg:gap-4 flex-wrap">
                  <a
                    href={mobileAppBanner.googlePlayUrl || 'https://play.google.com/store'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3.5 py-2 lg:px-4 lg:py-2.5 bg-black hover:bg-neutral-900 border border-neutral-700 hover:border-neutral-500 rounded-xl transition-all duration-200 text-left cursor-pointer shrink-0 shadow-sm hover:scale-[1.03]"
                  >
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 shrink-0" viewBox="0 0 512 512">
                      <path fill="#410593" d="M92.1 40.7L276.8 225.5 92.1 410.3c-4.4-4.8-7.1-11.2-7.1-18.4V60.1c0-7.2 2.7-13.6 7.1-19.4z" />
                      <path fill="#00e5ff" d="M366.1 176.2L120.2 34.2c-7.9-4.5-17.3-4.3-24.9.4l181.5 181.5 89.3-40z" />
                      <path fill="#ff1053" d="M95.3 477.4c7.6 4.7 17 .4 24.9-4.1l245.9-142-89.3-39.9L95.3 477.4z" />
                      <path fill="#ffc200" d="M428.4 235.1l-62.3-36-79.3 56.9 79.3 56.9 62.3-36c11.6-6.7 18.6-18.8 18.6-32s-7-25.2-18.6-31.8z" />
                    </svg>
                    <div className="flex flex-col text-left">
                      <span className="text-[8px] lg:text-[9px] text-gray-300 font-medium uppercase leading-tight">GET IT ON</span>
                      <span className="text-[12px] lg:text-[14px] text-white font-bold leading-tight">Google Play</span>
                    </div>
                  </a>
                  <a
                    href={mobileAppBanner.appStoreUrl || 'https://www.apple.com/app-store/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3.5 py-2 lg:px-4 lg:py-2.5 bg-black hover:bg-neutral-900 border border-neutral-700 hover:border-neutral-500 rounded-xl transition-all duration-200 text-left cursor-pointer shrink-0 shadow-sm hover:scale-[1.03]"
                  >
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 fill-current text-white shrink-0" viewBox="0 0 384 512">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-13.7 69.5-34.3z" />
                    </svg>
                    <div className="flex flex-col text-left">
                      <span className="text-[8px] lg:text-[9px] text-gray-300 font-medium leading-tight">Download on the</span>
                      <span className="text-[12px] lg:text-[14px] text-white font-bold leading-tight">App Store</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Mobile view */}
            <div className="block md:hidden relative w-full rounded-[20px] overflow-hidden bg-gradient-to-b from-[#FBF2EA] via-[#F8EAE0] to-[#F5DFCC] border border-[#EADAC8]/70 shadow-sm">
              <div className="w-full h-52 sm:h-64 relative overflow-hidden bg-[#FBF3EB]">
                <img
                  src={getMediaUrl(mobileAppBanner.image)}
                  alt="NEIRAH Mobile App"
                  className="w-full h-full object-cover object-left"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FBF2EA]" />
              </div>
              <div className="p-6 pt-3 text-center flex flex-col items-center -mt-4 relative z-10">
                <h2 className="unna-font font-serif text-[#5C3617] text-2xl sm:text-3xl font-normal leading-snug tracking-tight whitespace-pre-line">
                  {mobileAppBanner.title}
                </h2>
                <p className="font-sans text-[#8C461E] font-medium text-xs sm:text-sm mt-2 mb-4 leading-snug whitespace-pre-line">
                  {mobileAppBanner.subtitle}
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <a
                    href={mobileAppBanner.googlePlayUrl || 'https://play.google.com/store'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-black rounded-lg text-left shadow-sm"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 512 512">
                      <path fill="#410593" d="M92.1 40.7L276.8 225.5 92.1 410.3c-4.4-4.8-7.1-11.2-7.1-18.4V60.1c0-7.2 2.7-13.6 7.1-19.4z" />
                      <path fill="#00e5ff" d="M366.1 176.2L120.2 34.2c-7.9-4.5-17.3-4.3-24.9.4l181.5 181.5 89.3-40z" />
                      <path fill="#ff1053" d="M95.3 477.4c7.6 4.7 17 .4 24.9-4.1l245.9-142-89.3-39.9L95.3 477.4z" />
                      <path fill="#ffc200" d="M428.4 235.1l-62.3-36-79.3 56.9 79.3 56.9 62.3-36c11.6-6.7 18.6-18.8 18.6-32s-7-25.2-18.6-31.8z" />
                    </svg>
                    <div className="flex flex-col text-left">
                      <span className="text-[7px] text-gray-300 font-medium uppercase leading-tight">GET IT ON</span>
                      <span className="text-[11px] text-white font-bold leading-tight">Google Play</span>
                    </div>
                  </a>
                  <a
                    href={mobileAppBanner.appStoreUrl || 'https://www.apple.com/app-store/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-black rounded-lg text-left shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 384 512">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-13.7 69.5-34.3z" />
                    </svg>
                    <div className="flex flex-col text-left">
                      <span className="text-[7px] text-gray-300 font-medium leading-tight">Download on the</span>
                      <span className="text-[11px] text-white font-bold leading-tight">App Store</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          9. TRENDING JEWELLERY SECTION (Dynamic from /api/products/home)
      ─────────────────────────────────────────────────────────────────── */}
      <section style={sectionStyle('products')} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h3 className="font-serif text-xl sm:text-2xl text-stone-900 font-normal mb-8">
          Trending jewellery in lab grown diamond
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
          10. BOOK A VIRTUAL APPOINTMENT BANNER (Direct from /api/banners/lookup)
      ─────────────────────────────────────────────────────────────────── */}
      {bookAppointBanner?.image && (
        <section style={sectionStyle('appointment')} className="pt-10 sm:pt-16 relative overflow-hidden">
          {/* Desktop view */}
          <div className="hidden md:block relative w-full aspect-[2400/720] min-h-[320px]">
            <div className="absolute inset-0 z-0 w-full h-full">
              <img
                src={getMediaUrl(bookAppointBanner.image)}
                alt={bookAppointBanner.title || 'Book A Virtual Appointment'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            </div>
            <div className="absolute z-10 left-[5%] lg:left-[6%] xl:left-[8%] top-1/2 -translate-y-1/2 w-[44%] lg:w-[42%] xl:w-[46%] border border-[#E8E0D8]/40 rounded-[12px] lg:rounded-[18px] xl:rounded-[24px] bg-[#F0EBE4]/95 backdrop-blur-md p-[3%] xl:p-[2.5%] text-[#1A1815] shadow-lg transition-all duration-300">
              <h2 className="unna-font font-serif text-[18px] lg:text-3xl xl:text-4xl font-normal mb-[3%] leading-tight text-[#1A1815]">
                {bookAppointBanner.title}
              </h2>
              <p className="text-[11px] lg:text-sm xl:text-base mb-[5%] font-normal text-[#6B6460] leading-relaxed">
                {bookAppointBanner.subtitle}
              </p>
              <div>
                <button
                  type="button"
                  onClick={openAppointmentModal}
                  className="inline-block w-auto bg-[#F4594B] text-white px-7 py-3 text-[10px] lg:text-[12px] xl:text-[13px] font-bold tracking-[0.2em] uppercase rounded-xl shadow-md hover:bg-[#F4594B]/95 hover:transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                >
                  {bookAppointBanner.buttonText || 'SCHEDULE APPOINTMENT'}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile view */}
          <div className="block md:hidden px-3 sm:px-4">
            <div className="relative w-full h-[220px] sm:h-[260px] rounded-[20px] sm:rounded-[24px] overflow-hidden border border-[#E8E0D8]/80 shadow-md bg-[#FAF6F0]">
              <img
                src={getMediaUrl(bookAppointBanner.image)}
                alt={bookAppointBanner.title || 'Book A Virtual Appointment'}
                className="absolute inset-0 w-full h-full object-cover object-[75%_center]"
              />
              <div className="absolute z-10 left-3 sm:left-4 top-1/2 -translate-y-1/2 w-[58%] sm:w-[50%] bg-[#F0EBE4]/95 backdrop-blur-md rounded-xl sm:rounded-2xl border border-[#E8E0D8]/80 p-3 sm:p-4 shadow-lg transition-all">
                <h2 className="unna-font font-serif text-xs sm:text-base font-normal text-[#1A1815] mb-1 sm:mb-1.5 leading-tight">
                  {bookAppointBanner.title}
                </h2>
                <p className="text-[8px] sm:text-[10px] text-[#6B6460] font-normal leading-relaxed line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-2.5">
                  {bookAppointBanner.subtitle}
                </p>
                <div>
                  <button
                    type="button"
                    onClick={openAppointmentModal}
                    className="inline-block w-auto bg-[#F4594B] text-white px-3 sm:px-4 py-1.5 sm:py-2 text-[8px] sm:text-[9px] font-bold tracking-wider uppercase rounded-md sm:rounded-lg shadow-sm hover:bg-[#F4594B]/95 active:scale-95 transition-all cursor-pointer"
                  >
                    {bookAppointBanner.buttonText || 'SCHEDULE APPOINTMENT'}
                  </button>
                </div>
              </div>
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
          12. FOLLOW US ON INSTAGRAM (Matches neirah.in)
      ─────────────────────────────────────────────────────────────────── */}
      <section style={sectionStyle('instagram')} className="pt-16 pb-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl text-gray-900 leading-tight mb-2 font-normal">
              Follow Us on Instagram
            </h2>
            <a
              href="https://www.instagram.com/neirah.officials/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-gray-600 hover:text-[#8B6B42] hover:underline font-medium text-sm md:text-base transition-colors"
            >
              @neirah.officials
            </a>
          </div>

          {instagramPosts.length > 0 ? (
            <div className="flex flex-row overflow-x-auto lg:grid lg:grid-cols-4 gap-6 justify-start lg:justify-items-center w-full pb-4 scroll-smooth snap-x snap-mandatory scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-2">
              {instagramPosts.slice(0, 4).map((post, idx) => (
                <div key={post._id || idx} className="snap-center shrink-0 flex justify-center w-auto lg:w-full">
                  <div className="w-[280px] h-[380px] relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-[329px] h-[435px] scale-[0.85] origin-top-left">
                      <InstagramEmbed url={post.url} width="100%" captioned={false} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Stay tuned! Our Instagram feed is coming soon.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
