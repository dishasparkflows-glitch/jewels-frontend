import ProductCard from '../../components/product/ProductCard';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  bannersAPI,
  featuredAPI,
  productsAPI,
  reviewsAPI,
  instagramAPI,
} from '../../api/services';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineShieldCheck,
  HiStar,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineRefresh,
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
  const { settings: storeSettings } = useStoreSettings();

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

  // Load all active banner placements in one request, then select each placement locally.
  useEffect(() => {
    let mounted = true;
    bannersAPI.getActive()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        const typeOf = (banner) => banner.display?.type || banner.type || '';
        const contentOf = (banner) => banner.content || {};
        const mediaOf = (banner) => ({
          image: banner.image?.url || '',
          video: banner.video?.url || '',
          mediaType: banner.mediaType || 'image',
        });
        const selectType = (type) => list.filter((banner) => typeOf(banner) === type);
        const firstType = (type) => selectType(type)[0];

        setHeroBanners(selectType('herobanner').map((banner) => ({
          _id: banner._id,
          title: contentOf(banner).title || banner.title || '',
          subtitle: contentOf(banner).subtitle || banner.subtitle || '',
          description: contentOf(banner).description || banner.description || '',
          ...mediaOf(banner),
          link: banner.link || '/shop',
          buttonText: contentOf(banner).buttonText || 'SHOP NOW',
        })));
        setCollectionBanners(selectType('collectionbanner').map((banner) => ({
          id: banner._id,
          title: contentOf(banner).title || banner.title || '',
          subtitle: contentOf(banner).subtitle || banner.subtitle || '',
          images: (Array.isArray(banner.collectionImages) && banner.collectionImages.length
            ? banner.collectionImages
            : (banner.image?.url ? [banner.image] : [])).map((image) => image.url || '').filter(Boolean),
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

        const appointmentBanner = firstType('bookappointbanner');
        if (appointmentBanner) setBookAppointBanner({
          title: contentOf(appointmentBanner).title || appointmentBanner.title || '',
          subtitle: contentOf(appointmentBanner).subtitle || appointmentBanner.subtitle || '',
          image: appointmentBanner.image?.url || '',
          buttonText: contentOf(appointmentBanner).buttonText || 'SCHEDULE APPOINTMENT',
        });

        const customBannerData = list.find((banner) => banner.display?.bannerKey === 'custom_jewellery');
        if (customBannerData) setCustomBanner({
          title: contentOf(customBannerData).title || customBannerData.title || '',
          subtitle: contentOf(customBannerData).subtitle || customBannerData.subtitle || '',
          image: customBannerData.image?.url || '',
          buttonText: contentOf(customBannerData).buttonText || 'START CUSTOMISING',
        });
      })
      .catch((err) => console.error('Failed to load banners:', err));
    return () => { mounted = false; };
  }, []);

  // Carousel auto-slide when multiple banners exist
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveHeroIdx((prev) => (prev + 1) % heroBanners.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

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
  }, []);

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

  // ─── 10. FETCH INSTAGRAM POSTS (/api/instagram-posts) ────────────────
  useEffect(() => {
    const fetchInstagram = async () => {
      try {
        const res = await instagramAPI.getAll({ isActive: true });
        const list = res?.data?.data?.items || res?.data?.data || [];
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

  const currentHero = heroBanners[activeHeroIdx] || heroBanners[0];
  const currentReview = reviews[activeReviewIdx] || reviews[0];

  return (
    <div className="bg-white text-stone-900 font-sans antialiased overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────────
          1. HERO BANNER (Selected from the shared active-banners response)
      ─────────────────────────────────────────────────────────────────── */}
      {heroBanners.length > 0 && currentHero && (
        <section className="relative isolate min-h-[280px] sm:min-h-[420px] lg:min-h-[560px] overflow-hidden bg-[#d6bea1] text-[#29231d]">
          {currentHero.image && <img src={getMediaUrl(currentHero.image)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          {currentHero.video && !currentHero.image && <video src={getMediaUrl(currentHero.video)} className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline />}
          <div className="absolute inset-0 bg-gradient-to-r from-[#241c16]/50 via-[#241c16]/10 to-transparent" />
          <div className="relative z-10 mx-auto flex min-h-[280px] max-w-7xl items-center px-7 py-10 sm:min-h-[420px] sm:px-12 lg:min-h-[560px] lg:px-16">
            <div className="max-w-xl space-y-3 text-white drop-shadow-sm sm:space-y-5">
              {currentHero.title && <h1 className="font-serif text-3xl font-normal leading-tight sm:text-5xl lg:text-6xl">{currentHero.title}</h1>}
              {currentHero.subtitle && <p className="font-serif text-base sm:text-xl">{currentHero.subtitle}</p>}
              {currentHero.description && <p className="max-w-md text-xs leading-6 text-white/90 sm:text-sm">{currentHero.description}</p>}
              <Link to={currentHero.link || '/shop'} className="inline-flex items-center justify-center border border-white/80 bg-[#86684d]/90 px-6 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#6e513b] sm:px-8">
                {currentHero.buttonText || 'Discover more'}
              </Link>
            </div>
          </div>

          {/* Carousel Chevrons (only shown when multiple API banners exist) */}
          {heroBanners.length > 1 && (
            <>
              <button
                onClick={() => setActiveHeroIdx((prev) => (prev - 1 + heroBanners.length) % heroBanners.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all z-20 cursor-pointer"
                aria-label="Previous hero banner"
              >
                <HiOutlineChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveHeroIdx((prev) => (prev + 1) % heroBanners.length)}
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
      {celebrateItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-stone-900 font-normal tracking-wide">
              Celebrate With Neirah
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {celebrateItems.map((item) => (
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
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
      {collectionBanners.length > 0 && (
        <section className="mx-auto max-w-[1440px] space-y-8 px-4 py-12 sm:px-6 lg:px-8">
          {collectionBanners.map((collection) => {
            const [image1, image2, image3, image4] = collection.images || [];
            if (!image1 || !image2 || !image3 || !image4) return null;
            const tileClass = 'group relative block overflow-hidden bg-stone-100';
            const tileImageClass = 'h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]';
            return (
              <div key={collection.id} className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Link to={collection.link} className={`${tileClass} aspect-[4/3]`} aria-label={`${collection.title} image 1`}>
                    <img src={getMediaUrl(image1)} alt={`${collection.title} 1`} loading="lazy" className={tileImageClass} />
                  </Link>
                  <Link to={collection.link} className={`${tileClass} aspect-[4/3]`} aria-label={`${collection.title} image 2`}>
                    <img src={getMediaUrl(image2)} alt={`${collection.title} 2`} loading="lazy" className={tileImageClass} />
                  </Link>
                  <Link to={collection.link} className={`${tileClass} aspect-[16/7] sm:col-span-2`} aria-label={`${collection.title} image 3`}>
                    <img src={getMediaUrl(image3)} alt={`${collection.title} 3`} loading="lazy" className={tileImageClass} />
                  </Link>
                </div>
                <Link to={collection.link} className={`${tileClass} min-h-[300px] lg:min-h-full`} aria-label={`${collection.title} image 4`}>
                  <img src={getMediaUrl(image4)} alt={`${collection.title} 4`} loading="lazy" className={tileImageClass} />
                </Link>
              </div>
            );
          })}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          5. TRUST BADGES ROW (Clean SVG Line Icons)
      ─────────────────────────────────────────────────────────────────── */}
      <section className="border-y border-stone-200/70 bg-[#faf9f7] py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
          {(storeSettings.trustBadges?.length ? storeSettings.trustBadges : [
            { title: '100% Certified', Icon: HiOutlineShieldCheck },
            { title: 'BIS Hallmarked', Icon: IoDiamondOutline },
            { title: 'Lifetime Exchange', Icon: HiOutlineRefresh },
            { title: '15-Day Return Policy', Icon: HiOutlineCalendar },
            { title: 'Insured Shipping', Icon: HiOutlineTruck },
            { title: 'Free Resizing', Icon: HiOutlineCheckCircle },
          ]).map((item, index) => {
            const Icon = item.Icon || HiOutlineShieldCheck;
            return (
              <div key={item._id || index} className="flex flex-col items-center gap-1.5 text-stone-600">
                {item.image?.url ? (
                  <img src={getMediaUrl(item.image.url)} alt="" className="h-6 w-6 object-contain" />
                ) : (
                  <Icon className="h-6 w-6 text-[#92704e]" />
                )}
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-800">{item.title}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          6. CUSTOM JEWELLERY BANNER (Selected from the shared active-banners response)
      ─────────────────────────────────────────────────────────────────── */}
      {customBanner && (
        <section className="bg-gradient-to-r from-[#292622] via-[#39332d] to-[#292622] text-white py-14 px-4 sm:px-6 lg:px-8 border-y border-stone-700 relative overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
            <div className="w-full lg:w-5/12 bg-[#f4ede4] text-stone-900 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-5 border border-amber-100">
              <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight leading-snug">
                {customBanner.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
                {customBanner.subtitle}
              </p>
              <div>
                <button
                  type="button"
                  onClick={openAppointmentModal}
                  className="px-7 py-3 rounded-full bg-[#d4af37] hover:bg-[#c39e2d] text-stone-900 text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {customBanner.buttonText || 'START CUSTOMISING'}
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
              {customBanner.image && (
                <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/30 aspect-[4/3] w-full max-w-sm">
                  <img
                    src={getMediaUrl(customBanner.image)}
                    alt={customBanner.title}
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
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
        <section className="bg-gradient-to-r from-[#292622] via-[#39332d] to-[#292622] text-white py-14 px-4 sm:px-6 lg:px-8 border-y border-stone-700 relative overflow-hidden">
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
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
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
