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

const DEFAULT_REVIEWS = [
  {
    id: 'def-1',
    clientName: 'Keval Patel',
    rating: 5,
    title: 'Stylish Bracelet with a Unique Design',
    comment: 'I really like the combination of black beads and silver detailing on this bracelet. The design looks elegant yet masculine, making it a great accessory for everyday we...',
    image: '',
  },
  {
    id: 'def-2',
    clientName: 'Richa Jha',
    rating: 5,
    title: 'Elegant Movement and Detail',
    comment: 'The drop style creates a graceful look that can complement evening and festive outfits.',
    image: '',
  },
  {
    id: 'def-3',
    clientName: 'Siddhraj Rathod',
    rating: 5,
    title: 'A Unique Traditional Design',
    comment: 'The combination of Rudraksha beads and silver detailing gives this bracelet a distinctive traditional look.',
    image: '',
  },
  {
    id: 'def-4',
    clientName: 'Aditi',
    rating: 5,
    title: 'Small Details, Beautiful Style',
    comment: 'The stud design is simple and elegant. A lovely style for anyone who appreciates understated jewellery.',
    image: '',
  },
];

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
  const mostLovedScrollRef = useRef(null);
  const [isMostLovedHovered, setIsMostLovedHovered] = useState(false);

  const [collectionBanners, setCollectionBanners] = useState([]);

  const [giftItems, setGiftItems] = useState([]);

  const [mobileAppBanner, setMobileAppBanner] = useState(null);

  const [bookAppointBanner, setBookAppointBanner] = useState(null);

  const [customBanner, setCustomBanner] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  const displayReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return DEFAULT_REVIEWS;
    if (reviews.length >= 4) return reviews.slice(0, 4);
    const needed = 4 - reviews.length;
    return [...reviews, ...DEFAULT_REVIEWS.slice(0, needed)];
  }, [reviews]);

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
    const gap = window.innerWidth >= 640 ? 24 : 16;
    const scrollAmount = card ? card.offsetWidth + gap : el.clientWidth * 0.5;
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
          const gap = window.innerWidth >= 640 ? 24 : 16;
          const scrollAmount = card ? card.offsetWidth + gap : el.clientWidth * 0.5;
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
          setGoldProducts(gold.length > 0 ? gold.slice(0, 8) : data.items.slice(0, 8));
          setPlatinumProducts(data.items.slice(0, 8));
          setSilverProducts(data.items.slice(8, 16));
          setTrendingProducts(data.items.slice(16, 24));
        }
      } catch (err) {
        console.error('Failed to load home products:', err);
      }
    };
    fetchHomeProducts();
  }, []);

  // Auto scroll for Most Loved on Neirah
  useEffect(() => {
    const list = goldProducts.length > 0 ? goldProducts : platinumProducts;
    if (list.length <= 1) return;
    let timer;

    const startTimer = () => {
      timer = setInterval(() => {
        const el = mostLovedScrollRef.current;
        if (!el) return;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const card = el.querySelector('.product-card-container');
          const scrollAmount = card ? card.offsetWidth + 24 : 310;
          el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }, 3000);
    };

    if (!isMostLovedHovered) {
      startTimer();
    }

    return () => clearInterval(timer);
  }, [goldProducts.length, platinumProducts.length, isMostLovedHovered]);


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
            title: r.review?.title || r.title || '',
            comment: r.review?.comment || r.comment || '',
            image: r.image?.url || (typeof r.image === 'string' ? r.image : ''),
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
        <section style={sectionStyle('categories')} className="w-full max-w-[95%] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-stone-900 font-normal tracking-wide">
              Celebrate With Neirah
            </h2>
          </div>

          {effectiveCategoryItems.length <= 4 ? (
            <div
              className="grid grid-cols-2 lg:grid-cols-4 w-full gap-4 sm:gap-6"
            >
              {effectiveCategoryItems.map((item) => (
                <Link
                  key={item._id}
                  to={item.link}
                  style={{ borderRadius: '22px' }}
                  className="group relative overflow-hidden aspect-[3/4] w-full min-w-0 bg-stone-100 border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-end cursor-pointer isolate"
                >
                  {item.image && (
                    <img
                      src={getMediaUrl(item.image)}
                      alt={item.name}
                      style={{ borderRadius: '22px' }}
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                  )}
                  <div
                    style={{ borderBottomLeftRadius: '22px', borderBottomRightRadius: '22px' }}
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/85 pointer-events-none"
                  />
                  <div className="relative z-10 p-4 sm:p-5 text-left">
                    <span className="text-sm sm:text-base font-medium text-white tracking-wide block drop-shadow-sm truncate">
                      {item.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
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
                className="absolute -left-2 sm:-left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-md border border-stone-200/90 transition-all hover:bg-stone-50 hover:scale-110 active:scale-95 cursor-pointer"
              >
                <HiOutlineChevronLeft className="h-5 w-5" />
              </button>

              {/* Scrollable Container */}
              <div
                ref={celebrateScrollRef}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="flex items-center overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 [&::-webkit-scrollbar]:hidden w-full gap-4 sm:gap-6"
              >
                {effectiveCategoryItems.map((item) => (
                  <Link
                    key={item._id}
                    to={item.link}
                    style={{ borderRadius: '22px' }}
                    className="celebrate-card group relative overflow-hidden aspect-[3/4] w-[calc(50%-8px)] sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] min-w-0 bg-stone-100 border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-500 shrink-0 snap-start flex flex-col justify-end cursor-pointer isolate"
                  >
                    {item.image && (
                      <img
                        src={getMediaUrl(item.image)}
                        alt={item.name}
                        style={{ borderRadius: '22px' }}
                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                    )}
                    <div
                      style={{ borderBottomLeftRadius: '22px', borderBottomRightRadius: '22px' }}
                      className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/85 pointer-events-none"
                    />
                    <div className="relative z-10 p-4 sm:p-5 text-left">
                      <span className="text-sm sm:text-base font-medium text-white tracking-wide block drop-shadow-sm truncate">
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
                className="absolute -right-2 sm:-right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-md border border-stone-200/90 transition-all hover:bg-stone-50 hover:scale-110 active:scale-95 cursor-pointer"
              >
                <HiOutlineChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          3. PRODUCTS SECTION (Dynamic from /api/products/home)
      ─────────────────────────────────────────────────────────────────── */}
      <section style={sectionStyle('products')} className="w-full max-w-[95%] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
        {/* Most Loved on Neirah - Gold Products Sub-Section */}
        {(goldProducts.length > 0 || platinumProducts.length > 0) && (
          <div>
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-wide">
                Most Loved on Neirah
              </h3>
            </div>

            <div
              ref={mostLovedScrollRef}
              onMouseEnter={() => setIsMostLovedHovered(true)}
              onMouseLeave={() => setIsMostLovedHovered(false)}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden snap-x snap-mandatory scroll-smooth"
            >
              {(goldProducts.length > 0 ? goldProducts : platinumProducts).slice(0, 8).map((product) => (
                <div key={product.id || product._id} className="product-card-container flex-shrink-0 w-[240px] sm:w-[270px] lg:w-[290px] xl:w-[310px] snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* DISCOVER Button Matching Screenshot */}
            <div className="text-center mt-8 sm:mt-10">
              <Link
                to="/shop"
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
              <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-wide">
                Silver Jewellery
              </h3>
            </div>

            <div
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
            >
              {silverProducts.map((product) => (
                <div key={product.id || product._id} className="flex-shrink-0 w-[240px] sm:w-[270px] lg:w-[290px] xl:w-[310px] snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          4. CURATED COLLECTION BANNERS (Dynamic Bento Grid from /api/banners)
      ─────────────────────────────────────────────────────────────────── */}
      {effectiveCollectionBanners.length > 0 && (
        <section style={sectionStyle('collections')} className="w-full max-w-[95%] 2xl:max-w-[1720px] mx-auto space-y-8 px-4 py-12 sm:px-6 lg:px-8">
          {effectiveCollectionBanners.map((collection) => {
            const [image1, image2, image3, image4] = collection.images || [];
            if (!image1 || !image2 || !image3 || !image4) return null;
            const tileClass = 'group relative block overflow-hidden rounded-2xl sm:rounded-[22px] bg-stone-100 shadow-2xs hover:shadow-md transition-shadow duration-300';
            const tileImageClass = 'h-full w-full object-cover rounded-2xl sm:rounded-[22px] transition-transform duration-700 group-hover:scale-[1.02]';
            return (
              <div key={collection.id} className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
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
        <section style={sectionStyle('trustBadges')} className="bg-white py-10 sm:py-12 lg:py-14 px-4 sm:px-6 lg:px-8 border-y border-stone-100">
          <div className="w-full max-w-[95%] 2xl:max-w-[1720px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 items-start justify-items-center gap-y-8 gap-x-4 sm:gap-x-6 lg:gap-x-4 text-center">
            {activeTrustBadges.map((item, index) => {
              const imageUrl = item.image?.url ? getMediaUrl(item.image.url) : null;
              return (
                <div key={item._id || index} className="flex flex-col items-center justify-start text-center group w-full max-w-[160px]">
                  {imageUrl && (
                    <div className="h-12 sm:h-14 lg:h-16 w-full flex items-center justify-center mb-3 sm:mb-3.5">
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="h-10 sm:h-12 lg:h-14 w-auto max-w-[62px] object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <span className="text-[11px] sm:text-xs lg:text-[13px] font-semibold uppercase tracking-[0.12em] text-[#1a1815] text-center leading-snug">
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
        <section style={sectionStyle('gifts')} className="w-full max-w-[95%] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-stone-900 font-normal tracking-wide">
              Gifts That Say It All
            </h2>
          </div>

          <div
            className="grid grid-cols-2 lg:grid-cols-4 w-full gap-4 sm:gap-6"
          >
            {giftItems.map((gift) => (
              <Link
                key={gift._id}
                to={gift.link}
                style={{ borderRadius: '22px' }}
                className="group relative overflow-hidden aspect-[3/4] w-full min-w-0 bg-stone-100 border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-end cursor-pointer isolate"
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
                  <span className="text-sm sm:text-base font-medium text-white tracking-wide block drop-shadow-sm truncate">
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
          <div className="w-full max-w-[95%] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Desktop view */}
            <div className="hidden md:block relative w-full aspect-[1440/420] rounded-[24px] lg:rounded-[30px] overflow-hidden shadow-sm border border-[#F0E6D8]/80 bg-[#FBF3EB]">
              {mobileAppBanner.link ? (
                <a
                  href={mobileAppBanner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full cursor-pointer"
                >
                  <img
                    src={getMediaUrl(mobileAppBanner.image)}
                    alt="NEIRAH Mobile App"
                    className="w-full h-full object-cover object-left lg:object-center select-none"
                  />
                </a>
              ) : (
                <img
                  src={getMediaUrl(mobileAppBanner.image)}
                  alt="NEIRAH Mobile App"
                  className="w-full h-full object-cover object-left lg:object-center select-none"
                />
              )}

              {/* Clickable hotspots for Google Play and App Store buttons in banner artwork */}
              <div className="absolute right-4 sm:right-8 md:right-12 lg:right-16 bottom-5 sm:bottom-7 lg:bottom-9 z-10 flex items-center gap-2 sm:gap-3">
                <a
                  href={mobileAppBanner.googlePlayUrl || 'https://play.google.com/store'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-28 sm:w-32 lg:w-36 h-9 sm:h-10 lg:h-12 cursor-pointer"
                  title="Get it on Google Play"
                  aria-label="Google Play"
                />
                <a
                  href={mobileAppBanner.appStoreUrl || 'https://www.apple.com/app-store/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-28 sm:w-32 lg:w-36 h-9 sm:h-10 lg:h-12 cursor-pointer"
                  title="Download on the App Store"
                  aria-label="App Store"
                />
              </div>
            </div>

            {/* Mobile view */}
            <div className="block md:hidden relative w-full rounded-[20px] overflow-hidden bg-[#FBF3EB] border border-[#EADAC8]/70 shadow-sm">
              {mobileAppBanner.link ? (
                <a
                  href={mobileAppBanner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full cursor-pointer"
                >
                  <img
                    src={getMediaUrl(mobileAppBanner.mobileImage || mobileAppBanner.image)}
                    alt="NEIRAH Mobile App"
                    className="w-full h-auto object-cover"
                  />
                </a>
              ) : (
                <img
                  src={getMediaUrl(mobileAppBanner.mobileImage || mobileAppBanner.image)}
                  alt="NEIRAH Mobile App"
                  className="w-full h-auto object-cover"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          9. TRENDING JEWELLERY SECTION (Dynamic from /api/products/home)
      ─────────────────────────────────────────────────────────────────── */}
      <section style={sectionStyle('products')} className="w-full max-w-[95%] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h3 className="font-serif text-xl sm:text-2xl text-stone-900 font-normal mb-8">
          Trending jewellery in lab grown diamond
        </h3>

        {trendingProducts.length > 0 ? (
          <div
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden snap-x snap-mandatory text-left"
          >
            {trendingProducts.map((product) => (
              <div key={product.id || product._id} className="flex-shrink-0 w-[240px] sm:w-[270px] lg:w-[290px] xl:w-[310px] snap-start">
                <ProductCard product={product} />
              </div>
            ))}
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
          <div className="hidden md:block relative w-full aspect-[2400/720]">
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
      <section style={sectionStyle('reviews')} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-stone-900 font-normal tracking-wide text-center mb-10 sm:mb-12">
          What Customers are Saying
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayReviews.map((rev, idx) => (
            <div
              key={rev.id || idx}
              className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Top Area: Image or Warm Champagne Container with Quote Icon */}
              <div className="h-44 sm:h-48 bg-[#f5efe6] relative overflow-hidden flex items-center justify-center shrink-0">
                {rev.image ? (
                  <img
                    src={rev.image}
                    alt={rev.title || rev.clientName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#8b6f4e] text-lg font-serif">
                    “
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div className="p-5 sm:p-6 flex flex-col flex-1 text-center justify-between">
                {/* 5 Stars */}
                <div className="flex items-center justify-center gap-1 text-amber-400 mb-2.5">
                  {Array.from({ length: Number(rev.rating) || 5 }).map((_, i) => (
                    <HiStar key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                {/* Review Headline / Title */}
                {rev.title && (
                  <h3 className="font-bold text-stone-900 text-sm sm:text-[14px] leading-snug mb-2 line-clamp-2">
                    {rev.title}
                  </h3>
                )}

                {/* Review Comment / Testimonial Text */}
                <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed mb-4 flex-1 line-clamp-3">
                  {rev.comment}
                </p>

                {/* Client Name */}
                <div className="mt-auto pt-1">
                  <span className="font-bold text-xs sm:text-[13px] text-stone-900 tracking-wide block">
                    {rev.clientName}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

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
