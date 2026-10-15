import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  bannersAPI,
  featuredAPI,
  productsAPI,
  reviewsAPI,
  instagramAPI,
  categoriesAPI,
} from '../../api/services';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineHeart,
  HiHeart,
  HiOutlineShieldCheck,
  HiStar,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import { FaInstagram, FaGooglePlay, FaApple } from 'react-icons/fa';
import { getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';

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

const formatProductPrice = (price) => {
  const amount = Number(price);
  return amount > 0 ? '₹' + amount.toLocaleString('en-IN') : '';
};

const Home = () => {
  const { isWishlisted, toggleWishlist } = useWishlist();

  // ─── 100% Dynamic API State (No Static Fallback Content) ────────────
  const [heroBanners, setHeroBanners] = useState([]);
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);

  const [celebrateItems, setCelebrateItems] = useState([]);

  const [platinumProducts, setPlatinumProducts] = useState([]);
  const [silverProducts, setSilverProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [collectionBanners, setCollectionBanners] = useState([]);

  const [giftItems, setGiftItems] = useState([]);

  const [mobileAppBanner, setMobileAppBanner] = useState(null);

  const [bookAppointBanner, setBookAppointBanner] = useState(null);

  const [customBanner, setCustomBanner] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  const [instagramPosts, setInstagramPosts] = useState([]);

  // ─── 1. FETCH HERO BANNERS (/api/banners?type=herobanner) ───────────
  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await bannersAPI.getHeroBanners();
        const list = res?.data?.data?.items || res?.data?.data || [];
        if (Array.isArray(list)) {
          const formatted = list.map((b) => ({
            _id: b._id,
            title: b.content?.title || b.title || '',
            subtitle: b.content?.subtitle || b.subtitle || '',
            description: b.content?.description || b.description || '',
            image: b.image?.url || '',
            video: b.video?.url || '',
            mediaType: b.mediaType || 'image',
            link: b.link || '/shop',
            buttonText: 'SHOP NOW',
          }));
          setHeroBanners(formatted);
        }
      } catch (err) {
        console.error('Failed to load hero banners:', err);
      }
    };
    fetchHero();
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
        setLoadingProducts(true);
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
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchHomeProducts();
  }, []);

  // ─── 4. FETCH COLLECTION BANNERS (/api/banners?type=collectionbanner)
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await bannersAPI.getCollectionBanners();
        const list = res?.data?.data?.items || res?.data?.data || [];
        if (Array.isArray(list)) {
          const formatted = list.map((b) => ({
            id: b._id,
            title: b.content?.title || b.title || '',
            subtitle: b.content?.subtitle || b.subtitle || '',
            image: b.image?.url || '',
            video: b.video?.url || '',
            mediaType: b.mediaType || 'image',
            link: b.link || '/shop',
            position: b.display?.position || b.position || 'none',
          }));
          setCollectionBanners(formatted);
        }
      } catch (err) {
        console.error('Failed to load collection banners:', err);
      }
    };
    fetchCollection();
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

  // ─── 6. FETCH MOBILE APP BANNER (/api/banners?type=mobileappbanner) ──
  useEffect(() => {
    const fetchMobileApp = async () => {
      try {
        const res = await bannersAPI.getMobileAppBanner();
        const list = res?.data?.data?.items || res?.data?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const b = list[0];
          setMobileAppBanner({
            title: b.content?.title || b.title || '',
            subtitle: b.content?.subtitle || b.subtitle || '',
            image: b.image?.url || '',
            link: b.link || '',
            appStoreUrl: b.appStoreUrl || 'https://www.apple.com/app-store/',
            googlePlayUrl: b.googlePlayUrl || 'https://play.google.com/store',
          });
        }
      } catch (err) {
        console.error('Failed to load mobile app banner:', err);
      }
    };
    fetchMobileApp();
  }, []);

  // ─── 7. FETCH BOOK APPOINTMENT BANNER (/api/banners?type=bookappointbanner)
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const res = await bannersAPI.getBookAppointBanner();
        const list = res?.data?.data?.items || res?.data?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const b = list[0];
          setBookAppointBanner({
            title: b.content?.title || b.title || '',
            subtitle: b.content?.subtitle || b.subtitle || '',
            image: b.image?.url || '',
            buttonText: 'SCHEDULE APPOINTMENT',
          });
        }
      } catch (err) {
        console.error('Failed to load book appointment banner:', err);
      }
    };
    fetchAppointment();
  }, []);

  // ─── 8. FETCH CUSTOM JEWELLERY BANNER (/api/banners?bannerKey=custom_jewellery)
  useEffect(() => {
    const fetchCustom = async () => {
      try {
        const res = await bannersAPI.getCustomJewelleryBanner();
        const list = res?.data?.data?.items || res?.data?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const b = list[0];
          setCustomBanner({
            title: b.content?.title || b.title || '',
            subtitle: b.content?.subtitle || b.subtitle || '',
            image: b.image?.url || '',
            buttonText: 'START CUSTOMISING',
          });
        }
      } catch (err) {
        console.error('Failed to load custom banner:', err);
      }
    };
    fetchCustom();
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

  // Bento tiles dynamically resolved from API positions
  const bento1 = collectionBanners.find((b) => b.position === 'top-left') || collectionBanners[0];
  const bento2 = collectionBanners.find((b) => b.position === 'top-center') || collectionBanners[1];
  const bento3 = collectionBanners.find((b) => b.position === 'bottom-left') || collectionBanners[2];
  const bento4 = collectionBanners.find((b) => b.position === 'right-tall') || collectionBanners[3];

  return (
    <div className="bg-white text-stone-900 font-sans antialiased overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────────
          1. HERO BANNER (Dynamic from /api/banners?type=herobanner)
      ─────────────────────────────────────────────────────────────────── */}
      {heroBanners.length > 0 && currentHero && (
        <section className="relative overflow-hidden bg-gradient-to-r from-[#061e17] via-[#092820] to-[#051a14] text-white min-h-[500px] sm:min-h-[580px] lg:min-h-[640px] flex items-center border-b border-emerald-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(20,83,64,0.35),transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-black/25 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16 w-full relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* Left Media: Only rendered if image or video exists from API */}
            <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-start">
              {currentHero.image ? (
                <div className="relative max-w-md w-full">
                  <div className="w-64 h-64 sm:w-80 sm:h-80 mx-auto rounded-full bg-gradient-to-b from-[#0f3d30] to-[#041610] p-1 shadow-2xl relative flex items-center justify-center border border-emerald-600/30 overflow-hidden">
                    <img
                      src={getMediaUrl(currentHero.image)}
                      alt={currentHero.title || 'Hero Banner'}
                      className="w-full h-full object-cover rounded-full shadow-inner transform hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              ) : currentHero.video ? (
                <div className="w-64 h-64 sm:w-80 sm:h-80 mx-auto rounded-full overflow-hidden shadow-2xl border border-emerald-600/30">
                  <video
                    src={getMediaUrl(currentHero.video)}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              ) : null}
            </div>

            {/* Right: Typography & Action Button from API */}
            <div className="w-full lg:w-1/2 text-center lg:text-left space-y-5 lg:pl-6">
              {currentHero.title && (
                <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-wide text-[#f5f1eb] leading-tight">
                  {currentHero.title}
                </h1>
              )}
              {currentHero.subtitle && (
                <p className="font-serif italic text-base sm:text-lg lg:text-xl text-[#d4e4dd]/90 font-light">
                  {currentHero.subtitle}
                </p>
              )}
              {currentHero.description && (
                <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-lg">
                  {currentHero.description}
                </p>
              )}

              <div className="pt-4 flex items-center justify-center lg:justify-start">
                <Link
                  to={currentHero.link || '/shop'}
                  className="inline-flex items-center justify-center px-9 py-3 border border-emerald-400/70 hover:border-amber-400 text-xs font-semibold tracking-[0.25em] text-white hover:text-amber-200 bg-emerald-950/40 hover:bg-emerald-900/60 uppercase rounded-sm transition-all duration-300 shadow-lg hover:shadow-emerald-900/50 backdrop-blur-sm"
                >
                  {currentHero.buttonText || 'SHOP NOW'}
                </Link>
              </div>
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
              {platinumProducts.map((product) => {
                const isWish = isWishlisted(product.id || product._id);
                const rawImg = product.image && !isOrnateImage(product.image) ? product.image : getPrimaryProductImage(product);
                const imageUrl = getMediaUrl(rawImg);

                return (
                  <div
                    key={product.id || product._id}
                    className="group bg-white rounded-2xl border border-stone-200/80 p-3.5 flex flex-col justify-between hover:shadow-lg transition-all duration-300"
                  >
                    <div>
                      {/* Product Thumbnail (Dynamic only, no static mock paths) */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-50 mb-3 flex items-center justify-center border border-stone-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300 bg-stone-50">
                            <IoDiamondOutline className="w-10 h-10" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleWishlist(product)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-xs flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                          aria-label="Wishlist"
                        >
                          {isWish ? (
                            <HiHeart className="w-4 h-4 text-red-500" />
                          ) : (
                            <HiOutlineHeart className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <Link
                        to={`/product/${product.id || product._id}`}
                        className="text-xs text-stone-800 font-normal line-clamp-2 hover:text-[#9e5e4d] transition-colors leading-relaxed block mb-2"
                      >
                        {product.title}
                      </Link>
                    </div>

                    <div>
                      {/* Swatches from product metadata */}
                      {product.swatches?.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-2">
                          {product.swatches.map((c, i) => (
                            <span
                              key={i}
                              className="w-2.5 h-2.5 rounded-full border border-stone-300 inline-block shadow-2xs"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-sm font-semibold text-stone-900">
                          {formatProductPrice(product.salePrice || product.price)}
                        </span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-[10px] text-stone-400 line-through">
                            {formatProductPrice(product.mrp)}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/product/${product.id || product._id}`}
                        className="w-full py-2 border border-stone-800 text-stone-900 hover:bg-stone-900 hover:text-white rounded-lg text-[10px] font-bold tracking-widest uppercase flex items-center justify-center transition-colors text-center"
                      >
                        VIEW MORE
                      </Link>
                    </div>
                  </div>
                );
              })}
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
              {silverProducts.map((product) => {
                const isWish = isWishlisted(product.id || product._id);
                const rawImg = product.image && !isOrnateImage(product.image) ? product.image : getPrimaryProductImage(product);
                const imageUrl = getMediaUrl(rawImg);

                return (
                  <div
                    key={product.id || product._id}
                    className="group bg-white rounded-2xl border border-stone-200/80 p-3.5 flex flex-col justify-between hover:shadow-lg transition-all duration-300"
                  >
                    <div>
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-50 mb-3 flex items-center justify-center border border-stone-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300 bg-stone-50">
                            <IoDiamondOutline className="w-10 h-10" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleWishlist(product)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-xs flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                          aria-label="Wishlist"
                        >
                          {isWish ? (
                            <HiHeart className="w-4 h-4 text-red-500" />
                          ) : (
                            <HiOutlineHeart className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <Link
                        to={`/product/${product.id || product._id}`}
                        className="text-xs text-stone-800 font-normal line-clamp-2 hover:text-[#9e5e4d] transition-colors leading-relaxed block mb-2"
                      >
                        {product.title}
                      </Link>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-sm font-semibold text-stone-900">
                          {formatProductPrice(product.salePrice || product.price)}
                        </span>
                      </div>

                      <Link
                        to={`/product/${product.id || product._id}`}
                        className="w-full py-2 border border-stone-800 text-stone-900 hover:bg-stone-900 hover:text-white rounded-lg text-[10px] font-bold tracking-widest uppercase flex items-center justify-center transition-colors text-center"
                      >
                        VIEW MORE
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          4. CURATED COLLECTION BANNERS (Dynamic Bento Grid from /api/banners)
      ─────────────────────────────────────────────────────────────────── */}
      {collectionBanners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column (7 cols): Top 2 tiles + Bottom wide tile */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {bento1 && (
                  <Link
                    to={bento1.link || '/shop'}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-emerald-950 border border-stone-200/80 shadow-xs flex flex-col justify-end p-5"
                  >
                    {bento1.image && (
                      <img
                        src={getMediaUrl(bento1.image)}
                        alt={bento1.title}
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="relative z-10 text-white">
                      <h4 className="font-serif text-lg font-medium leading-snug">{bento1.title}</h4>
                    </div>
                  </Link>
                )}

                {bento2 && (
                  <Link
                    to={bento2.link || '/shop'}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-emerald-950 border border-stone-200/80 shadow-xs flex flex-col justify-end p-5"
                  >
                    {bento2.image && (
                      <img
                        src={getMediaUrl(bento2.image)}
                        alt={bento2.title}
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="relative z-10 text-white">
                      <h4 className="font-serif text-lg font-medium leading-snug">{bento2.title}</h4>
                    </div>
                  </Link>
                )}
              </div>

              {bento3 && (
                <Link
                  to={bento3.link || '/shop'}
                  className="group relative rounded-2xl overflow-hidden aspect-[16/7] bg-emerald-950 border border-stone-200/80 shadow-xs flex flex-col justify-end p-6"
                >
                  {bento3.image && (
                    <img
                      src={getMediaUrl(bento3.image)}
                      alt={bento3.title}
                      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="relative z-10 text-white space-y-1">
                    <h4 className="font-serif text-xl sm:text-2xl font-medium">{bento3.title}</h4>
                    {bento3.subtitle && (
                      <p className="text-xs sm:text-sm text-stone-300 font-light max-w-md">{bento3.subtitle}</p>
                    )}
                  </div>
                </Link>
              )}
            </div>

            {/* Right Column (5 cols): Right-Tall Model Banner */}
            {bento4 && (
              <div className="lg:col-span-5">
                <Link
                  to={bento4.link || '/shop'}
                  className="group relative rounded-2xl overflow-hidden h-full min-h-[380px] lg:min-h-full bg-emerald-950 border border-stone-200/80 shadow-xs flex flex-col justify-start p-8"
                >
                  {bento4.image && (
                    <img
                      src={getMediaUrl(bento4.image)}
                      alt={bento4.title}
                      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/60" />
                  <div className="relative z-10 text-white max-w-xs space-y-2">
                    <h4 className="font-serif text-2xl sm:text-3xl font-light leading-snug">{bento4.title}</h4>
                    {bento4.subtitle && (
                      <p className="text-xs sm:text-sm text-stone-200 font-light leading-relaxed">
                        {bento4.subtitle}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          5. TRUST BADGES ROW (Clean SVG Line Icons)
      ─────────────────────────────────────────────────────────────────── */}
      <section className="border-y border-stone-200/70 bg-[#faf9f7] py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
          <div className="flex flex-col items-center gap-1.5 text-stone-600">
            <HiOutlineShieldCheck className="w-6 h-6 text-emerald-800" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-800">
              100% Certified
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-stone-600">
            <IoDiamondOutline className="w-6 h-6 text-emerald-800" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-800">
              BIS Hallmarked
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-stone-600">
            <HiOutlineRefresh className="w-6 h-6 text-emerald-800" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-800">
              Lifetime Exchange
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-stone-600">
            <HiOutlineCalendar className="w-6 h-6 text-emerald-800" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-800">
              15-Day Return Policy
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-stone-600">
            <HiOutlineTruck className="w-6 h-6 text-emerald-800" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-800">
              Insured Shipping
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-stone-600">
            <HiOutlineCheckCircle className="w-6 h-6 text-emerald-800" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-800">
              Free Resizing
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          6. CUSTOM JEWELLERY BANNER (Dynamic from /api/banners?bannerKey=custom_jewellery)
      ─────────────────────────────────────────────────────────────────── */}
      {customBanner && (
        <section className="bg-gradient-to-r from-[#062018] via-[#092b21] to-[#051711] text-white py-14 px-4 sm:px-6 lg:px-8 border-y border-emerald-950 relative overflow-hidden">
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
          8. MOBILE APP BANNER (Dynamic from /api/banners?type=mobileappbanner)
      ─────────────────────────────────────────────────────────────────── */}
      {mobileAppBanner && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-3xl bg-gradient-to-r from-[#061e17] via-[#092a20] to-[#041610] text-white p-8 sm:p-12 relative overflow-hidden shadow-xl border border-emerald-950 flex flex-col md:flex-row items-center justify-between gap-10">
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
            {trendingProducts.map((product) => {
              const isWish = isWishlisted(product.id || product._id);
              const rawImg = product.image && !isOrnateImage(product.image) ? product.image : getPrimaryProductImage(product);
              const imageUrl = getMediaUrl(rawImg);

              return (
                <div
                  key={product.id || product._id}
                  className="group bg-white rounded-2xl border border-stone-200/80 p-3.5 flex flex-col justify-between hover:shadow-lg transition-all duration-300"
                >
                  <div>
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-50 mb-3 flex items-center justify-center border border-stone-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300 bg-stone-50">
                          <IoDiamondOutline className="w-10 h-10" />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleWishlist(product)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-xs flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                        aria-label="Wishlist"
                      >
                        {isWish ? (
                          <HiHeart className="w-4 h-4 text-red-500" />
                        ) : (
                          <HiOutlineHeart className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <Link
                      to={`/product/${product.id || product._id}`}
                      className="text-xs text-stone-800 font-normal line-clamp-2 hover:text-[#9e5e4d] transition-colors leading-relaxed block mb-2"
                    >
                      {product.title}
                    </Link>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-sm font-semibold text-stone-900">
                        {formatProductPrice(product.salePrice || product.price)}
                      </span>
                    </div>

                    <Link
                      to={`/product/${product.id || product._id}`}
                      className="w-full py-2 border border-stone-800 text-stone-900 hover:bg-stone-900 hover:text-white rounded-lg text-[10px] font-bold tracking-widest uppercase flex items-center justify-center transition-colors text-center"
                    >
                      VIEW MORE
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 space-y-3">
            <span className="text-xs text-stone-400 font-light block">No Products Found</span>
            <div className="w-24 h-[1px] bg-stone-300 mx-auto" />
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          10. BOOK A VIRTUAL APPOINTMENT BANNER (Dynamic from /api/banners)
      ─────────────────────────────────────────────────────────────────── */}
      {bookAppointBanner && (
        <section className="bg-gradient-to-r from-[#062018] via-[#092b21] to-[#051711] text-white py-14 px-4 sm:px-6 lg:px-8 border-y border-emerald-950 relative overflow-hidden">
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
              "{currentReview.comment}"
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
