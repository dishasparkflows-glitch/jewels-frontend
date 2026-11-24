import HomeProductCard from '../../components/product/HomeProductCard';
import BirthstonesSection from '../../components/home/BirthstonesSection';
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
} from 'react-icons/hi';
import InstagramEmbed from '../../components/common/InstagramEmbed';
import LuxuryDivider from '../../components/common/LuxuryDivider';

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
      .filter((badge) => badge?.title?.trim())
      .sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0));
  }, [storeSettings?.trustBadges]);

  // ─── Dynamic API State ──────────────────────────────────────────────
  const [heroBanners, setHeroBanners] = useState([]);
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);

  const [celebrateItems, setCelebrateItems] = useState([]);
  const celebrateScrollRef = useRef(null);
  const [isCelebrateHovered, setIsCelebrateHovered] = useState(false);

  const [goldProducts, setGoldProducts] = useState([]);
  const [platinumProducts, setPlatinumProducts] = useState([]);
  const [silverProducts, setSilverProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [homeSections, setHomeSections] = useState([]);
  const mostLovedScrollRef = useRef(null);
  const [isMostLovedHovered, setIsMostLovedHovered] = useState(false);

  const [collectionBanners, setCollectionBanners] = useState([]);

  const [giftItems, setGiftItems] = useState([]);
  const giftsScrollRef = useRef(null);
  const [isGiftsHovered, setIsGiftsHovered] = useState(false);

  const [mobileAppBanner, setMobileAppBanner] = useState(null);
  const [bookAppointBanner, setBookAppointBanner] = useState(null);
  const [customBanner, setCustomBanner] = useState(null);

  const [reviews, setReviews] = useState([]);
  const displayReviews = useMemo(() => reviews.slice(0, 4), [reviews]);

  const [instagramPosts, setInstagramPosts] = useState([]);
  const [storeCategories, setStoreCategories] = useState([]);

  const themeCategoryItems = useMemo(() => {
    return (themeConfig?.categoryAppearances || [])
      .filter((entry) => entry.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((entry) => {
        const categoryId = String(entry.categoryId?._id || entry.categoryId || '');
        const category = storeCategories.find((item) => item._id === categoryId);
        return {
          _id: categoryId,
          name: entry.displayName || category?.name || '',
          image: entry.icon?.url || category?.icon?.url || '',
          link: category
            ? `/shop?category=${encodeURIComponent(category.slug || category._id)}`
            : `/shop?category=${encodeURIComponent(categoryId)}`,
        };
      })
      .filter((item) => item.name && item.image);
  }, [themeConfig?.categoryAppearances, storeCategories]);

  const effectiveCategoryItems = celebrateItems.length > 0 ? celebrateItems : themeCategoryItems;

  const sectionConfig = themeConfig?.sections || [];
  const sectionStyle = (key) => {
    const section = sectionConfig.find((item) => item.key === key);
    return {
      display: section?.visible === false ? 'none' : undefined,
    };
  };

  // ─── 1. BANNERS API (Single web call, filtered by display.type) ─────
  useEffect(() => {
    let mounted = true;
    bannersAPI.getActive({ platform: 'web' })
      .then((webRes) => {
        if (!mounted) return;
        const allBanners = Array.isArray(webRes?.data?.data) ? webRes.data.data : [];

        // 1. Hero banners
        const heroList = allBanners.filter((b) => b.display?.type === 'herobanner');
        setHeroBanners(
          heroList.map((banner) => {
            const url = banner.image?.url || '';
            const isVid = banner.image?.mediaType === 'video' || /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(url);
            return {
              _id: banner._id,
              title: banner.content?.title || '',
              link: banner.link || banner.appStoreUrl || '',
              image: !isVid ? url : '',
              video: isVid ? url : '',
              mediaType: isVid ? 'video' : 'image',
              mobileImage: banner.mobileImage?.url || '',
            };
          })
        );

        // 2. Curated collection banners
        const collectionList = allBanners.filter((b) => b.display?.type === 'collectionbanner');
        setCollectionBanners(
          collectionList.map((banner) => ({
            id: banner._id,
            title: banner.content?.title || '',
            images: (banner.collectionImages || []).map((img, idx) => {
              const cat = img.categoryId || banner.display?.categoryId;
              const catKey = cat?.slug || cat?._id || '';
              return {
                url: img.url || '',
                categoryName: cat?.name || '',
                link: catKey ? `/shop?category=${encodeURIComponent(catKey)}` : banner.link || '/shop',
                order: img.order ?? idx + 1,
              };
            }).filter((img) => img.url),
            link: banner.link || '/shop',
          }))
        );

        // 3. Customize banner
        const customData = allBanners.find((b) => b.display?.type === 'customizebanner');
        setCustomBanner(
          customData?.image?.url
            ? {
                title: customData.content?.title || '',
                image: customData.image.url,
                mobileImage: customData.mobileImage?.url || '',
                buttonText: customData.content?.buttonText || '',
                link: customData.link || '/custom-jewellery',
              }
            : null
        );

        // 4. Mobile app banner
        const mobileData = allBanners.find((b) => b.display?.type === 'mobileappbanner');
        setMobileAppBanner(
          mobileData?.image?.url
            ? {
                title: mobileData.content?.title || '',
                image: mobileData.image.url,
                mobileImage: mobileData.mobileImage?.url || mobileData.image.url,
                link: mobileData.link || '',
                appStoreUrl: mobileData.appStoreUrl || storeSettings?.appStoreUrl || '',
                googlePlayUrl: mobileData.googlePlayUrl || storeSettings?.googlePlayUrl || '',
              }
            : null
        );

        // 5. Book appointment banner
        const appointData = allBanners.find((b) => b.display?.type === 'bookappointbanner');
        setBookAppointBanner(
          appointData?.image?.url
            ? {
                title: appointData.content?.title || '',
                image: appointData.image.url,
                mobileImage: appointData.mobileImage?.url || '',
                buttonText: appointData.content?.buttonText || '',
                link: appointData.link || '',
              }
            : null
        );
      })
      .catch((err) => console.error('Failed to load banners:', err));

    return () => { mounted = false; };
  }, [storeSettings?.appStoreUrl, storeSettings?.googlePlayUrl]);

  // ─── Category Lookup ───────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    categoriesAPI.getLookup({ status: 'active' })
      .then((res) => {
        if (mounted && Array.isArray(res?.data?.data)) {
          setStoreCategories(res.data.data);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Carousel auto-slide when multiple hero banners exist
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveHeroIdx((prev) => (prev + 1) % heroBanners.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  // ─── 2. FETCH FEATURED SHOWCASES (Celebrate & Gifts) ───────────────
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await featuredAPI.getLookup({ status: 'active' });
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        if (!list.length) return;

        const featuredSelections = themeConfig?.featuredSelections || [];

        const getFeaturedItemLink = (item) => {
          if (Array.isArray(item.productIds) && item.productIds.length > 0) {
            return `/shop?featured=${encodeURIComponent(item._id)}`;
          }
          const cat = item.categoryId;
          if (cat?.slug || cat?._id) {
            return `/shop?category=${encodeURIComponent(cat.slug || cat._id)}`;
          }
          return '/shop';
        };

        // Process Celebrate items
        const celebrateSelections = featuredSelections.filter(
          (s) => (s.display?.type || 'Celebrate') === 'Celebrate' && s.visible !== false
        );
        let rawCelebrate = list.filter((item) => item.display?.type === 'Celebrate');
        if (celebrateSelections.length > 0) {
          const orderMap = new Map(
            celebrateSelections.map((s) => [String(s.featuredId?._id || s.featuredId || ''), s.order || 0])
          );
          rawCelebrate = rawCelebrate
            .filter((item) => orderMap.has(String(item._id)))
            .sort((a, b) => (orderMap.get(String(a._id)) || 0) - (orderMap.get(String(b._id)) || 0));
        }
        setCelebrateItems(
          rawCelebrate.map((item) => ({
            _id: item._id,
            name: item.name || '',
            image: item.image?.url || '',
            link: getFeaturedItemLink(item),
          }))
        );

        // Process Gifts items
        const giftSelections = featuredSelections.filter(
          (s) => s.display?.type === 'Gifts' && s.visible !== false
        );
        let rawGifts = list.filter((item) => item.display?.type === 'Gifts');
        if (giftSelections.length > 0) {
          const orderMap = new Map(
            giftSelections.map((s) => [String(s.featuredId?._id || s.featuredId || ''), s.order || 0])
          );
          rawGifts = rawGifts
            .filter((item) => orderMap.has(String(item._id)))
            .sort((a, b) => (orderMap.get(String(a._id)) || 0) - (orderMap.get(String(b._id)) || 0));
        }
        setGiftItems(
          rawGifts.map((item) => ({
            _id: item._id,
            name: item.name || '',
            image: item.image?.url || '',
            link: getFeaturedItemLink(item),
          }))
        );
      } catch (err) {
        console.error('Failed to load featured showcases:', err);
      }
    };
    fetchFeatured();
  }, [themeConfig?.featuredSelections]);

  const scrollCelebrate = useCallback((direction) => {
    const el = celebrateScrollRef.current;
    if (!el) return;
    const card = el.querySelector('.celebrate-card');
    const width = window.innerWidth;
    const gap = width >= 1280 ? 20 : width >= 1024 ? 18 : width >= 768 ? 16 : width >= 480 ? 12 : 10;
    const scrollAmount = card ? card.offsetWidth + gap : el.clientWidth * 0.5;
    el.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  // Auto scroll for Celebrate With Neirah
  useEffect(() => {
    if (effectiveCategoryItems.length <= 1) return;
    let timer;

    const startTimer = () => {
      timer = setInterval(() => {
        const el = celebrateScrollRef.current;
        if (!el) return;
        if (el.scrollWidth <= el.clientWidth + 10) return;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const card = el.querySelector('.celebrate-card');
          const width = window.innerWidth;
          const gap = width >= 1280 ? 20 : width >= 1024 ? 18 : width >= 768 ? 16 : width >= 480 ? 12 : 10;
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

  const scrollGifts = useCallback((direction) => {
    const el = giftsScrollRef.current;
    if (!el) return;
    const card = el.querySelector('.gifts-card');
    const width = window.innerWidth;
    const gap = width >= 1280 ? 20 : width >= 1024 ? 18 : width >= 768 ? 16 : width >= 480 ? 12 : 10;
    const scrollAmount = card ? card.offsetWidth + gap : el.clientWidth * 0.5;
    el.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  // Auto scroll for Gifts That Say It All
  useEffect(() => {
    if (giftItems.length <= 1) return;
    let timer;

    const startTimer = () => {
      timer = setInterval(() => {
        const el = giftsScrollRef.current;
        if (!el) return;
        if (el.scrollWidth <= el.clientWidth + 10) return;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const card = el.querySelector('.gifts-card');
          const width = window.innerWidth;
          const gap = width >= 1280 ? 20 : width >= 1024 ? 18 : width >= 768 ? 16 : width >= 480 ? 12 : 10;
          const scrollAmount = card ? card.offsetWidth + gap : el.clientWidth * 0.5;
          el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }, 3500);
    };

    if (!isGiftsHovered) {
      startTimer();
    }

    return () => clearInterval(timer);
  }, [giftItems.length, isGiftsHovered]);

  // ─── 3. FETCH PRODUCTS FOR HOME (/api/products/home) ─────────────────
  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        const res = await productsAPI.getHomeProducts();
        const sections = res?.data?.data?.sections;
        if (sections) {
          setGoldProducts(sections.gold || sections.mostLoved || []);
          setPlatinumProducts(sections.platinum || []);
          setSilverProducts(sections.silver || []);
          setTrendingProducts(sections.trending || []);
        }
      } catch (err) {
        console.error('Failed to load home products:', err);
      }
    };
    fetchHomeProducts();
  }, []);

  // ─── FETCH DYNAMIC HOME SECTIONS (/api/products/home-sections) ─────
  useEffect(() => {
    let mounted = true;
    const fetchHomeSections = async () => {
      try {
        const res = await productsAPI.getHomeSections();
        if (mounted && Array.isArray(res?.data?.data)) {
          setHomeSections(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dynamic home sections:', err);
      }
    };
    fetchHomeSections();
    return () => {
      mounted = false;
    };
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

  // ─── 4. FETCH REVIEWS (/api/reviews?status=approved) ─────────────────
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await reviewsAPI.getApproved();
        const list = res?.data?.data?.items || [];
        setReviews(
          list.map((r) => ({
            id: r._id,
            clientName: r.customer?.name || 'Client',
            rating: r.review?.rating || 5,
            title: r.review?.title || '',
            comment: r.review?.comment || '',
            image: r.image?.url || '',
          }))
        );
      } catch (err) {
        console.error('Failed to load reviews:', err);
      }
    };
    fetchReviews();
  }, []);

  // ─── 5. FETCH INSTAGRAM POSTS (/api/instagram-posts/lookup) ─────────
  useEffect(() => {
    const fetchInstagram = async () => {
      try {
        const res = await instagramAPI.getLookup();
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setInstagramPosts(
          list
            .filter((p) => p.url?.trim())
            .map((p) => ({
              _id: p._id,
              url: p.url.trim(),
              title: p.title || '',
            }))
        );
      } catch (err) {
        console.error('Failed to load instagram posts:', err);
      }
    };
    fetchInstagram();
  }, []);

  const openAppointmentModal = () => {
    window.dispatchEvent(new CustomEvent('open-virtual-appointment'));
  };

  const instagramHandle = useMemo(() => {
    const instaUrl = storeSettings?.socialMedia?.instagram || 'https://www.instagram.com/neirah.officials/';
    try {
      const handle = instaUrl.split('?')[0].replace(/\/+$/, '').split('/').filter(Boolean).pop();
      return handle ? `@${handle}` : '@neirah.officials';
    } catch {
      return '@neirah.officials';
    }
  }, [storeSettings?.socialMedia?.instagram]);

  const currentHero = heroBanners[activeHeroIdx] || heroBanners[0];

  return (
    <div
      className="flex flex-col bg-white text-stone-900 font-sans antialiased overflow-x-hidden"
      style={{
        minHeight: '100%',
        backgroundColor: themeConfig?.colors?.background || undefined,
        color: themeConfig?.colors?.text || undefined,
        fontFamily: themeConfig?.typography?.bodyFont || undefined,
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────
          1. HERO BANNER
      ─────────────────────────────────────────────────────────────────── */}
      {heroBanners.length > 0 && currentHero && (
        <section style={sectionStyle('hero')} className="relative isolate w-full overflow-hidden bg-[#FAF6F0] text-[#29231d]">
          <div className="relative w-full">
            {(() => {
              const mediaContent = currentHero.mediaType === 'video' ? (
                <video
                  src={getMediaUrl(currentHero.video || currentHero.mediaUrl)}
                  className="w-full h-auto block max-h-[85vh] object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                currentHero.image && (
                  <picture className="block w-full">
                    {currentHero.mobileImage && (
                      <source media="(max-width: 767px)" srcSet={getMediaUrl(currentHero.mobileImage)} />
                    )}
                    <img
                      src={getMediaUrl(currentHero.image)}
                      alt={currentHero.title || 'Hero Banner'}
                      className="w-full h-auto block object-contain select-none"
                      loading="eager"
                    />
                  </picture>
                )
              );

              return currentHero.link ? (
                <Link to={currentHero.link} className="block w-full">
                  {mediaContent}
                </Link>
              ) : (
                <div className="block w-full">{mediaContent}</div>
              );
            })()}
          </div>

          {/* Carousel Chevrons */}
          {heroBanners.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActiveHeroIdx((prev) => (prev - 1 + heroBanners.length) % heroBanners.length)}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer shadow-md"
                aria-label="Previous hero banner"
              >
                <HiOutlineChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveHeroIdx((prev) => (prev + 1) % heroBanners.length)}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer shadow-md"
                aria-label="Next hero banner"
              >
                <HiOutlineChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Dots indicator at bottom */}
              <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                {heroBanners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveHeroIdx(idx)}
                    className={`transition-all rounded-full ${
                      idx === activeHeroIdx
                        ? 'w-5 sm:w-6 h-1.5 sm:h-2 bg-white shadow-sm'
                        : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          2. CELEBRATE WITH NEIRAH
      ─────────────────────────────────────────────────────────────────── */}
      {effectiveCategoryItems.length > 0 && (
        <section style={sectionStyle('categories')} className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-stone-900 font-normal tracking-wide">
              Celebrate With Neirah
            </h2>
            <LuxuryDivider className="mt-2.5 sm:mt-3" />
          </div>

          <div
            className="relative group/celebrate px-1 w-full mx-auto"
            onMouseEnter={() => setIsCelebrateHovered(true)}
            onMouseLeave={() => setIsCelebrateHovered(false)}
          >
            <button
              type="button"
              onClick={() => scrollCelebrate('prev')}
              aria-label="Previous categories"
              className={`absolute -left-2 sm:-left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-md border border-stone-200/90 transition-all hover:bg-stone-50 hover:scale-110 active:scale-95 cursor-pointer ${
                effectiveCategoryItems.length <= 4 ? 'lg:hidden' : ''
              }`}
            >
              <HiOutlineChevronLeft className="h-5 w-5" />
            </button>

            <div
              ref={celebrateScrollRef}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex items-center overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 [&::-webkit-scrollbar]:hidden w-full gap-[10px] sm:gap-[12px] md:gap-[16px] lg:gap-[18px] xl:gap-[20px] 2xl:gap-[20px]"
            >
              {effectiveCategoryItems.map((item) => (
                <Link
                  key={item._id}
                  to={item.link}
                  style={{ borderRadius: '22px', aspectRatio: '4 / 5' }}
                  className="celebrate-card group relative overflow-hidden aspect-[4/5] w-[calc((100%-12px)/2.2)] sm:w-[calc((100%-18px)/2.5)] md:w-[calc((100%-40px)/3.5)] lg:w-[calc((100%-54px)/4)] xl:w-[calc((100%-60px)/4)] 2xl:w-[calc((100%-60px)/4)] min-w-0 bg-stone-100 border border-stone-200/80 shadow-xs hover:shadow-xl transition-all duration-500 shrink-0 snap-start flex flex-col justify-end cursor-pointer isolate"
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
                  <div className="relative z-10 p-3.5 sm:p-5 text-left">
                    <span className="text-sm sm:text-base font-medium text-white tracking-wide block drop-shadow-sm truncate">
                      {item.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollCelebrate('next')}
              aria-label="Next categories"
              className={`absolute -right-2 sm:-right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-md border border-stone-200/90 transition-all hover:bg-stone-50 hover:scale-110 active:scale-95 cursor-pointer ${
                effectiveCategoryItems.length <= 4 ? 'lg:hidden' : ''
              }`}
            >
              <HiOutlineChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          3. PRODUCTS SECTION
      ─────────────────────────────────────────────────────────────────── */}
      <section style={sectionStyle('products')} className="w-full max-w-[95%] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
        {/* Most Loved on Neirah - Gold Products Sub-Section */}
        {(goldProducts.length > 0 || platinumProducts.length > 0) && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl text-gray-900 leading-tight">
                Most Loved on Neirah
              </h2>
            </div>

            <div
              ref={mostLovedScrollRef}
              onMouseEnter={() => setIsMostLovedHovered(true)}
              onMouseLeave={() => setIsMostLovedHovered(false)}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto pb-4 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden snap-x snap-mandatory scroll-smooth"
            >
              {(goldProducts.length > 0 ? goldProducts : platinumProducts).slice(0, 10).map((product) => (
                <div
                  key={product._id}
                  className="product-card-container flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-15px)] xl:w-[calc(20%-16px)] snap-start"
                >
                  <HomeProductCard product={product} isSilver={false} />
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6 sm:mt-8">
              <Link
                to="/shop"
                className="px-12 py-2.5 border border-gray-800 rounded text-[13px] uppercase hover:bg-black hover:text-white transition-all font-medium"
              >
                DISCOVER
              </Link>
            </div>
          </div>
        )}

        {/* Silver Jewellery Sub-Section */}
        {silverProducts.length > 0 && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl text-gray-900 leading-tight">
                Silver Jewellery
              </h2>
            </div>

            <div
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto pb-4 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden snap-x snap-mandatory scroll-smooth"
            >
              {silverProducts.slice(0, 10).map((product) => (
                <div
                  key={product._id}
                  className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-15px)] xl:w-[calc(20%-16px)] snap-start"
                >
                  <HomeProductCard product={product} isSilver={true} />
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6 sm:mt-8">
              <Link
                to="/silver-collection"
                className="px-12 py-2.5 border border-gray-800 rounded text-[13px] uppercase hover:bg-black hover:text-white transition-all font-medium"
              >
                DISCOVER
              </Link>
            </div>
          </div>
        )}

        {/* Dynamic Curated Home Sections */}
        {homeSections.map((sec) => (
          <div key={sec._id || sec.sectionKey}>
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl text-gray-900 leading-tight capitalize">
                {sec.title}
              </h2>
              {sec.subtitle && (
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  {sec.subtitle}
                </p>
              )}
            </div>

            <div
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto pb-4 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden snap-x snap-mandatory scroll-smooth"
            >
              {sec.products?.map((product) => (
                <div
                  key={product._id}
                  className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-15px)] xl:w-[calc(20%-16px)] snap-start"
                >
                  <HomeProductCard product={product} isSilver={product.isSilver} />
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6 sm:mt-8">
              <Link
                to={sec.buttonLink || (sec.sectionKey ? `/shop?section=${encodeURIComponent(sec.sectionKey)}` : '/shop')}
                className="px-12 py-2.5 border border-gray-800 rounded text-[13px] uppercase hover:bg-black hover:text-white transition-all font-medium"
              >
                {sec.buttonText || 'DISCOVER'}
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          4. CURATED COLLECTION BANNERS (Bento Grid)
      ─────────────────────────────────────────────────────────────────── */}
      {collectionBanners.length > 0 && (
        <section style={sectionStyle('collections')} className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {collectionBanners.map((collection) => {
            const [image1, image2, image3, image4] = collection.images || [];
            if (!image1 || !image2 || !image3 || !image4) return null;
            const tileClass = 'group relative block overflow-hidden rounded-2xl sm:rounded-[22px] bg-stone-100 shadow-2xs hover:shadow-md transition-shadow duration-300';
            const tileImageClass = 'h-full w-full object-cover rounded-2xl sm:rounded-[22px] transition-transform duration-700 group-hover:scale-[1.02]';
            return (
              <div key={collection.id} className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 lg:aspect-[2/1]">
                <div className="grid grid-cols-2 grid-rows-[1fr_auto] gap-4 lg:gap-5 h-full">
                  <Link to={image1.link} className={`${tileClass} aspect-square`} aria-label={`${collection.title} image 1`}>
                    <img src={getMediaUrl(image1.url)} alt={image1.categoryName || `${collection.title} 1`} loading="lazy" className={tileImageClass} />
                  </Link>
                  <Link to={image2.link} className={`${tileClass} aspect-square`} aria-label={`${collection.title} image 2`}>
                    <img src={getMediaUrl(image2.url)} alt={image2.categoryName || `${collection.title} 2`} loading="lazy" className={tileImageClass} />
                  </Link>
                  <Link to={image3.link} className={`${tileClass} col-span-2 aspect-[2/1]`} aria-label={`${collection.title} image 3`}>
                    <img src={getMediaUrl(image3.url)} alt={image3.categoryName || `${collection.title} 3`} loading="lazy" className={tileImageClass} />
                  </Link>
                </div>
                <Link to={image4.link} className={`${tileClass} aspect-[2/1] lg:aspect-auto lg:h-full`} aria-label={`${collection.title} image 4`}>
                  <img src={getMediaUrl(image4.url)} alt={image4.categoryName || `${collection.title} 4`} loading="lazy" className={tileImageClass} />
                </Link>
              </div>
            );
          })}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          5. TRUST BADGES ROW
      ─────────────────────────────────────────────────────────────────── */}
      {activeTrustBadges.length > 0 && (
        <section style={sectionStyle('trustBadges')} className="w-full max-w-7xl 2xl:max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="py-2 sm:py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 items-center justify-items-center gap-y-6 gap-x-4 sm:gap-x-6 lg:gap-x-6 text-center">
              {activeTrustBadges.map((item, index) => {
                const imageUrl = item.image?.url ? getMediaUrl(item.image.url) : null;
                return (
                  <div key={item._id || index} className="flex flex-col items-center justify-center text-center group w-full max-w-[160px]">
                    {imageUrl && (
                      <div className="h-11 sm:h-12 lg:h-12 w-full flex items-center justify-center mb-2.5 sm:mb-3">
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="h-9 sm:h-10 lg:h-11 w-auto max-w-[56px] object-contain transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <span className="text-[10px] sm:text-[11px] lg:text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#1a1815] text-center leading-tight">
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          6. CUSTOM JEWELLERY BANNER
      ─────────────────────────────────────────────────────────────────── */}
      {customBanner?.image && (
        <section style={sectionStyle('customBanner')} className="pt-6 sm:pt-10 relative overflow-hidden">
          {/* Desktop view */}
          <div className="hidden md:block relative w-full">
            {customBanner.link?.startsWith('http') ? (
              <a
                href={customBanner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full cursor-pointer"
              >
                <img
                  src={getMediaUrl(customBanner.image)}
                  alt={customBanner.title || 'Custom Jewellery Journey'}
                  className="w-full h-auto block"
                />
              </a>
            ) : (
              <Link
                to={customBanner.link}
                className="block w-full h-full cursor-pointer"
              >
                <img
                  src={getMediaUrl(customBanner.image)}
                  alt={customBanner.title || 'Custom Jewellery Journey'}
                  className="w-full h-auto block"
                />
              </Link>
            )}
          </div>

          {/* Mobile view */}
          <div className="block md:hidden px-3 sm:px-4">
            <div className="relative w-full rounded-[20px] sm:rounded-[24px] overflow-hidden border border-[#E8E0D8]/80 shadow-md bg-[#FAF6F0]">
              {customBanner.link?.startsWith('http') ? (
                <a
                  href={customBanner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full cursor-pointer"
                >
                  <img
                    src={getMediaUrl(customBanner.mobileImage || customBanner.image)}
                    alt={customBanner.title || 'Custom Jewellery Journey'}
                    className="w-full h-auto object-cover"
                  />
                </a>
              ) : (
                <Link
                  to={customBanner.link}
                  className="block w-full h-full cursor-pointer"
                >
                  <img
                    src={getMediaUrl(customBanner.mobileImage || customBanner.image)}
                    alt={customBanner.title || 'Custom Jewellery Journey'}
                    className="w-full h-auto object-cover"
                  />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          7. GIFTS SECTION
      ─────────────────────────────────────────────────────────────────── */}
      {giftItems.length > 0 && (
        <section style={sectionStyle('gifts')} className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-stone-900 font-normal tracking-wide">
              Gifts That Say It All
            </h2>
            <LuxuryDivider className="mt-2.5 sm:mt-3" />
          </div>

          <div
            className="relative group/gifts px-1 w-full mx-auto"
            onMouseEnter={() => setIsGiftsHovered(true)}
            onMouseLeave={() => setIsGiftsHovered(false)}
          >
            <button
              type="button"
              onClick={() => scrollGifts('prev')}
              aria-label="Previous gifts"
              className={`absolute -left-2 sm:-left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-md border border-stone-200/90 transition-all hover:bg-stone-50 hover:scale-110 active:scale-95 cursor-pointer ${
                giftItems.length <= 4 ? 'lg:hidden' : ''
              }`}
            >
              <HiOutlineChevronLeft className="h-5 w-5" />
            </button>

            <div
              ref={giftsScrollRef}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="flex items-center overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 [&::-webkit-scrollbar]:hidden w-full gap-[10px] sm:gap-[12px] md:gap-[16px] lg:gap-[18px] xl:gap-[20px] 2xl:gap-[20px]"
            >
              {giftItems.map((gift) => (
                <Link
                  key={gift._id}
                  to={gift.link}
                  style={{ borderRadius: '22px', aspectRatio: '4 / 5' }}
                  className="gifts-card group relative overflow-hidden aspect-[4/5] w-[calc((100%-12px)/2.2)] sm:w-[calc((100%-18px)/2.5)] md:w-[calc((100%-40px)/3.5)] lg:w-[calc((100%-54px)/4)] xl:w-[calc((100%-60px)/4)] 2xl:w-[calc((100%-60px)/4)] min-w-0 bg-stone-100 border border-stone-200/80 shadow-xs hover:shadow-xl transition-all duration-500 shrink-0 snap-start flex flex-col justify-end cursor-pointer isolate"
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
                  <div className="relative z-10 p-3.5 sm:p-5 text-left">
                    <span className="text-sm sm:text-base font-medium text-white tracking-wide block drop-shadow-sm truncate">
                      {gift.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollGifts('next')}
              aria-label="Next gifts"
              className={`absolute -right-2 sm:-right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-md border border-stone-200/90 transition-all hover:bg-stone-50 hover:scale-110 active:scale-95 cursor-pointer ${
                giftItems.length <= 4 ? 'lg:hidden' : ''
              }`}
            >
              <HiOutlineChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          8. MOBILE APP BANNER
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
              {(mobileAppBanner.googlePlayUrl || mobileAppBanner.appStoreUrl) && (
                <div className="absolute right-4 sm:right-8 md:right-12 lg:right-16 bottom-5 sm:bottom-7 lg:bottom-9 z-10 flex items-center gap-2 sm:gap-3">
                  {mobileAppBanner.googlePlayUrl && (
                    <a
                      href={mobileAppBanner.googlePlayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-28 sm:w-32 lg:w-36 h-9 sm:h-10 lg:h-12 cursor-pointer"
                      title="Get it on Google Play"
                      aria-label="Google Play"
                    />
                  )}
                  {mobileAppBanner.appStoreUrl && (
                    <a
                      href={mobileAppBanner.appStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-28 sm:w-32 lg:w-36 h-9 sm:h-10 lg:h-12 cursor-pointer"
                      title="Download on the App Store"
                      aria-label="App Store"
                    />
                  )}
                </div>
              )}
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
          9. TRENDING JEWELLERY SECTION
      ─────────────────────────────────────────────────────────────────── */}
      <section style={sectionStyle('products')} className="w-full max-w-[95%] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h3 className="font-serif text-xl sm:text-2xl text-stone-900 font-normal mb-8">
          Trending jewellery in lab grown diamond
        </h3>

        {trendingProducts.length > 0 ? (
          <div
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto pb-4 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden snap-x snap-mandatory scroll-smooth"
          >
            {trendingProducts.map((product) => (
              <div
                key={product._id}
                className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-15px)] xl:w-[calc(20%-16px)] snap-start"
              >
                <HomeProductCard product={product} />
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
          9.5. MAKE BIRTHDAYS MORE COLOURFUL (Birthstones Carousel)
      ─────────────────────────────────────────────────────────────────── */}
      {storeSettings?.birthstones?.showOnStorefront === true && (
        <BirthstonesSection style={sectionStyle('birthstones')} />
      )}

      {/* ─────────────────────────────────────────────────────────────────
          10. BOOK A VIRTUAL APPOINTMENT BANNER
      ─────────────────────────────────────────────────────────────────── */}
      {bookAppointBanner?.image && (
        <section style={sectionStyle('appointment')} className="pt-10 sm:pt-16 relative overflow-hidden">
          {/* Desktop view */}
          <div className="hidden md:block relative w-full aspect-[2400/720]">
            {bookAppointBanner.link ? (
              bookAppointBanner.link.startsWith('http') ? (
                <a
                  href={bookAppointBanner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full cursor-pointer"
                >
                  <img
                    src={getMediaUrl(bookAppointBanner.image)}
                    alt={bookAppointBanner.title || 'Book A Virtual Appointment'}
                    className="w-full h-full object-cover"
                  />
                </a>
              ) : (
                <Link
                  to={bookAppointBanner.link}
                  className="block w-full h-full cursor-pointer"
                >
                  <img
                    src={getMediaUrl(bookAppointBanner.image)}
                    alt={bookAppointBanner.title || 'Book A Virtual Appointment'}
                    className="w-full h-full object-cover"
                  />
                </Link>
              )
            ) : (
              <div
                onClick={openAppointmentModal}
                className="w-full h-full cursor-pointer"
              >
                <img
                  src={getMediaUrl(bookAppointBanner.image)}
                  alt={bookAppointBanner.title || 'Book A Virtual Appointment'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Mobile view */}
          <div className="block md:hidden px-3 sm:px-4">
            <div className="relative w-full rounded-[20px] sm:rounded-[24px] overflow-hidden border border-[#E8E0D8]/80 shadow-md bg-[#FAF6F0]">
              {bookAppointBanner.link ? (
                bookAppointBanner.link.startsWith('http') ? (
                  <a
                    href={bookAppointBanner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full cursor-pointer"
                  >
                    <img
                      src={getMediaUrl(bookAppointBanner.mobileImage || bookAppointBanner.image)}
                      alt={bookAppointBanner.title || 'Book A Virtual Appointment'}
                      className="w-full h-auto object-cover"
                    />
                  </a>
                ) : (
                  <Link
                    to={bookAppointBanner.link}
                    className="block w-full h-full cursor-pointer"
                  >
                    <img
                      src={getMediaUrl(bookAppointBanner.mobileImage || bookAppointBanner.image)}
                      alt={bookAppointBanner.title || 'Book A Virtual Appointment'}
                      className="w-full h-auto object-cover"
                    />
                  </Link>
                )
              ) : (
                <div
                  onClick={openAppointmentModal}
                  className="w-full h-full cursor-pointer"
                >
                  <img
                    src={getMediaUrl(bookAppointBanner.mobileImage || bookAppointBanner.image)}
                    alt={bookAppointBanner.title || 'Book A Virtual Appointment'}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          11. WHAT OUR CLIENTS ARE SAYING
      ─────────────────────────────────────────────────────────────────── */}
      {displayReviews.length > 0 && (
        <section style={sectionStyle('reviews')} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-stone-900 font-normal tracking-wide">
              What Customers are Saying
            </h2>
            <LuxuryDivider className="mt-2.5 sm:mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
              >
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

                <div className="p-5 sm:p-6 flex flex-col flex-1 text-center justify-between">
                  <div className="flex items-center justify-center gap-1 text-amber-400 mb-2.5">
                    {Array.from({ length: Number(rev.rating) || 5 }).map((_, i) => (
                      <HiStar key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>

                  {rev.title && (
                    <h3 className="font-bold text-stone-900 text-sm sm:text-[14px] leading-snug mb-2 line-clamp-2">
                      {rev.title}
                    </h3>
                  )}

                  <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed mb-4 flex-1 line-clamp-3">
                    {rev.comment}
                  </p>

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
      )}

      {/* ─────────────────────────────────────────────────────────────────
          12. FOLLOW US ON INSTAGRAM
      ─────────────────────────────────────────────────────────────────── */}
      <section style={sectionStyle('instagram')} className="pt-16 pb-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl text-gray-900 leading-tight mb-2 font-normal">
              Follow Us on Instagram
            </h2>
            <a
              href={storeSettings?.socialMedia?.instagram || 'https://www.instagram.com/neirah.officials/'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-gray-600 hover:text-[#8B6B42] hover:underline font-medium text-sm md:text-base transition-colors"
            >
              {instagramHandle}
            </a>
          </div>

          {instagramPosts.length > 0 ? (
            <div className="flex flex-row overflow-x-auto lg:grid lg:grid-cols-4 gap-6 justify-start lg:justify-items-center w-full pb-4 scroll-smooth snap-x snap-mandatory scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-2">
              {instagramPosts.slice(0, 4).map((post) => (
                <div key={post._id} className="snap-center shrink-0 flex justify-center w-auto lg:w-full">
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
