import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bannersAPI, featuredAPI, productsAPI, reviewsAPI } from '../../api/services';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineHeart,
  HiHeart,
  HiOutlineArrowNarrowRight,
  HiOutlineSparkles,
  HiOutlineGift,
  HiOutlineShieldCheck,
  HiOutlineChatAlt2,
  HiOutlinePencil,
  HiChevronUp,
  HiStar,
  HiOutlineCalendar,
  HiOutlineShoppingBag,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';

// Fallback banners if API returns empty
const DEFAULT_BANNERS = [
  {
    title: 'TIMELESS BEAUTY,',
    subtitle: 'Forever You',
    description:
      'Grace in every curve. Sparkle in every detail. A necklace that speaks the language of elegance and the promise of forever.',
    image: '/banners/hero_timeless.jpg',
    link: '/shop?category=pendant',
  },
];

// Fallback Collection Banners if API returns empty (Screenshot 2)
const DEFAULT_COLLECTION_BANNERS = [
  {
    id: 'col-1',
    title: 'The Essence Collection',
    subtitle: '',
    image: '/promos/essence_necklace.jpg',
    link: '/shop?category=pendant',
    position: 'top-left',
  },
  {
    id: 'col-2',
    title: 'A bracelet made distinctly yours.',
    subtitle: '',
    image: '/promos/bracelet_stone.jpg',
    link: '/shop?category=bangles-bracelets',
    position: 'top-center',
  },
  {
    id: 'col-3',
    title: 'Made to Shine. Made to Last.',
    subtitle: 'Discover timeless diamond rings crafted with elegance, brilliance and sophistication.',
    image: '/featured/ring.jpg',
    link: '/shop?category=rings',
    position: 'bottom-left',
  },
  {
    id: 'col-4',
    title: 'Beauty. With Intention',
    subtitle: 'Every facet is chosen to express something extraordinary.',
    image: '/banners/hero_timeless.jpg',
    link: '/shop?category=earrings',
    position: 'right-tall',
  },
];

// Fallback celebrate items if API returns empty
const DEFAULT_CELEBRATE = [
  { name: 'Necklace', image: '/featured/necklace.jpg', link: '/shop?category=pendant' },
  { name: 'Bangles & Bracelets', image: '/featured/bangles.jpg', link: '/shop?category=bangles-bracelets' },
  { name: 'Earring', image: '/featured/earring.jpg', link: '/shop?category=earrings' },
  { name: 'Ring', image: '/featured/ring.jpg', link: '/shop?category=rings' },
];

// Fallback Gifts items (Screenshot 2)
const DEFAULT_GIFTS = [
  { name: 'Rings for Loved Ones', image: '/featured/ring.jpg', link: '/shop?category=rings' },
  { name: 'Pendant & Necklaces Gift Set', image: '/featured/necklace.jpg', link: '/shop?category=pendant' },
  { name: 'Earrings Sparkle Box', image: '/featured/earring.jpg', link: '/shop?category=earrings' },
  { name: 'Heritage Solitaire Box', image: '/featured/bangles.jpg', link: '/shop?category=bangles-bracelets' },
];

// Curated Most Loved Items (Screenshot 2)
const DEFAULT_MOST_LOVED = [
  {
    id: 'ml-1',
    title: 'Round Diamond Engagement Ring with Diamond Accent - Neirah Jewels',
    price: 79644.18,
    image: '/featured/ring.jpg',
    category: 'rings',
  },
  {
    id: 'ml-2',
    title: 'Round Diamond Solitaire Ring with Multi Diamond Band - Neirah Jewels',
    price: 44117.40,
    image: '/featured/ring.jpg',
    category: 'rings',
  },
  {
    id: 'ml-3',
    title: 'Round Diamond Solitaire Ring with Multi Sculpted Gold Band - Neirah Jewels',
    price: 41833.62,
    image: '/featured/ring.jpg',
    category: 'rings',
  },
  {
    id: 'ml-4',
    title: 'Round Diamond Solitaire Ring with Multi Band Design - Neirah Jewels',
    price: 42738.43,
    image: '/featured/ring.jpg',
    category: 'rings',
  },
  {
    id: 'ml-5',
    title: 'Round Diamond Solitaire Ring with Half Diamond Gold Band - Neirah Jewels',
    price: 50556.40,
    image: '/featured/ring.jpg',
    category: 'rings',
  },
];

// Curated Silver Jewellery Items (Screenshot 3)
const DEFAULT_SILVER = [
  {
    id: 'sil-1',
    title: 'zfvq',
    price: 9900.00,
    originalPrice: 12001.00,
    image: '/promos/essence_necklace.jpg',
    category: 'silver-collection',
    swatches: ['#1f2937', '#ffffff'],
  },
  {
    id: 'sil-2',
    title: 'Light Weight Fancy Cut Stone Curve Pendant or Earring Set Dokiya for women..',
    price: 4080.00,
    originalPrice: 8989.00,
    image: '/featured/necklace.jpg',
    category: 'silver-collection',
    swatches: ['#ffffff', '#e5e7eb'],
  },
  {
    id: 'sil-3',
    title: 'S MIX MURTI 925',
    price: 16208.00,
    image: '/promos/essence_necklace.jpg',
    category: 'silver-collection',
  },
  {
    id: 'sil-4',
    title: '92.5 BRECELET',
    price: 4529.00,
    image: '/promos/bracelet_stone.jpg',
    category: 'silver-collection',
  },
  {
    id: 'sil-5',
    title: 'GOLD SHOW PC',
    price: 7438.00,
    image: '/featured/earring.jpg',
    category: 'silver-collection',
  },
];

// Trending Lab Grown Diamond Jewellery (Screenshot 2)
const DEFAULT_TRENDING = [
  {
    id: 'tr-1',
    title: 'Round Diamond Solitaire Ring with Scalloped Gold Band - Neirah Jewels',
    price: 48650.00,
    image: '/featured/ring.jpg',
    category: 'rings',
  },
  {
    id: 'tr-2',
    title: 'Round Diamond Solitaire Ring with Multi Band Design - Neirah Jewels',
    price: 42738.43,
    image: '/featured/ring.jpg',
    category: 'rings',
  },
  {
    id: 'tr-3',
    title: 'Round Diamond Solitaire Ring with Half Diamond Gold Band - Neirah Jewels',
    price: 50556.40,
    image: '/featured/ring.jpg',
    category: 'rings',
  },
  {
    id: 'tr-4',
    title: 'Emerald Cut Three-Stone Diamond Ring with Pave Set Band - Neirah Jewels',
    price: 64200.00,
    image: '/featured/ring.jpg',
    category: 'rings',
  },
  {
    id: 'tr-5',
    title: 'Round Diamond Three-Stone Ring with Cushion Side Stones - Neirah Jewels',
    price: 58800.00,
    image: '/featured/ring.jpg',
    category: 'rings',
  },
];

// Fallback Reviews (Screenshot 3)
const DEFAULT_REVIEWS = [
  {
    id: 'rev-1',
    clientName: 'Disha',
    rating: 5,
    comment:
      'I was looking for a budget-friendly jewellery set and this completely exceeded my expectations. The finishing is top-notch and it is the best handcrafted set I have ever bought.',
    image: '/promos/essence_necklace.jpg',
  },
  {
    id: 'rev-2',
    clientName: 'Krushnakant Jayswal',
    rating: 5,
    comment:
      'I was looking for a budget-friendly jewellery set and this completely exceeded my expectations. The finishing is top-notch and it is the most exquisite diamond piece in my collection.',
    image: '/featured/ring.jpg',
  },
  {
    id: 'rev-3',
    clientName: 'Ananya Deshmukh',
    rating: 5,
    comment:
      'The atelier service and private consultation were truly world-class. The sparkle on the natural diamond solitaire is unmatched.',
    image: '/featured/earring.jpg',
  },
  {
    id: 'rev-4',
    clientName: 'Vikramaditya Rathore',
    rating: 5,
    comment:
      'Prompt delivery, insured packaging, and certified hallmarked purity. Highly recommend Neirah Jewellers for fine heritage collections.',
    image: '/featured/bangles.jpg',
  },
];

const Home = () => {
  const { addToCart } = useCart();
  const [heroBanners, setHeroBanners] = useState(DEFAULT_BANNERS);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [collectionBanners, setCollectionBanners] = useState(DEFAULT_COLLECTION_BANNERS);
  const [celebrateItems, setCelebrateItems] = useState(DEFAULT_CELEBRATE);
  const [giftsItems, setGiftsItems] = useState(DEFAULT_GIFTS);
  const [mostLovedProducts, setMostLovedProducts] = useState(DEFAULT_MOST_LOVED);
  const [silverProducts] = useState(DEFAULT_SILVER);
  const [trendingProducts, setTrendingProducts] = useState(DEFAULT_TRENDING);
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Auto-advance hero banner carousel every 6s
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  // 1. Fetch Hero Banners from API (/api/banners?type=herobanner)
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await bannersAPI.getHeroBanners();
        const list = res?.data?.data?.items || res?.data?.data || res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map((b) => ({
            title: b.title || 'TIMELESS BEAUTY,',
            subtitle: b.subtitle || 'Forever You',
            description:
              b.description ||
              'Grace in every curve. Sparkle in every detail. A necklace that speaks the language of elegance and the promise of forever.',
            image: b.image?.url || '/banners/hero_timeless.jpg',
            link: b.link || '/shop',
          }));
          setHeroBanners(formatted);
        }
      } catch (err) {
        console.warn('Hero Banners API fetch failed, using default hero:', err);
      }
    };
    fetchBanners();
  }, []);

  // 2. Fetch Collection Banners from API (/api/banners?type=collectionbanner)
  useEffect(() => {
    const fetchCollectionBanners = async () => {
      try {
        const res = await bannersAPI.getCollectionBanners();
        const list = res?.data?.data?.items || res?.data?.data || res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map((b, idx) => ({
            id: b._id || `col-banner-${idx}`,
            title: b.title || DEFAULT_COLLECTION_BANNERS[idx % 4]?.title,
            subtitle: b.subtitle || DEFAULT_COLLECTION_BANNERS[idx % 4]?.subtitle,
            image: b.image?.url || DEFAULT_COLLECTION_BANNERS[idx % 4]?.image,
            link: b.link || DEFAULT_COLLECTION_BANNERS[idx % 4]?.link,
            position: b.position || DEFAULT_COLLECTION_BANNERS[idx % 4]?.position,
          }));
          setCollectionBanners(formatted);
        }
      } catch (err) {
        console.warn('Collection Banners API fetch failed, using defaults:', err);
      }
    };
    fetchCollectionBanners();
  }, []);

  // 3. Fetch Celebrate Category Items from API (/api/featured?placement=Celebrate)
  useEffect(() => {
    const fetchCelebrate = async () => {
      try {
        const res = await featuredAPI.getCelebrate();
        const list = res?.data?.data || res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map((item) => ({
            name: item.name || item.title || 'Fine Jewellery',
            image: item.image?.url || '/featured/necklace.jpg',
            link: `/shop?category=${encodeURIComponent((item.name || '').toLowerCase().replace(/\s+/g, '-'))}`,
          }));
          setCelebrateItems(formatted);
        }
      } catch (err) {
        console.warn('Celebrate API fetch failed, using defaults:', err);
      }
    };
    fetchCelebrate();
  }, []);

  // 4. Fetch Gifts Category Items from API (/api/featured?placement=Gifts)
  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const res = await featuredAPI.getGifts();
        const list = res?.data?.data || res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map((item) => ({
            name: item.name || item.title || 'Special Gift',
            image: item.image?.url || '/featured/ring.jpg',
            link: `/shop?category=${encodeURIComponent((item.name || '').toLowerCase().replace(/\s+/g, '-'))}`,
          }));
          setGiftsItems(formatted);
        }
      } catch (err) {
        console.warn('Gifts API fetch failed, using defaults:', err);
      }
    };
    fetchGifts();
  }, []);

  // 5. Fetch Products from API for Most Loved & Trending
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productsAPI.getAll({ status: 'active', limit: 12 });
        const list = res?.data?.data?.products || res?.data?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map((p, idx) => ({
            id: p._id || `api-prod-${idx}`,
            title: p.title || p.name || DEFAULT_MOST_LOVED[idx % DEFAULT_MOST_LOVED.length].title,
            price: p.price || p.salesPrice || 42000,
            image:
              p.images?.[0]?.url ||
              p.colorImages?.[0]?.images?.[0]?.url ||
              DEFAULT_MOST_LOVED[idx % DEFAULT_MOST_LOVED.length].image,
            category: p.category?.[0] || 'rings',
          }));
          setMostLovedProducts(formatted.slice(0, 5));
          if (formatted.length > 5) {
            setTrendingProducts(formatted.slice(5, 10));
          }
        }
      } catch (err) {
        console.warn('Products API fetch failed, using default Most Loved:', err);
      }
    };
    fetchProducts();
  }, []);

  // 6. Fetch Reviews from API (/api/reviews?status=approved)
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await reviewsAPI.getApproved();
        const list = res?.data?.data || res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map((r, idx) => ({
            id: r._id || `review-${idx}`,
            clientName: r.clientName || 'Verified Buyer',
            rating: r.rating || 5,
            comment: r.comment || '',
            image: DEFAULT_REVIEWS[idx % DEFAULT_REVIEWS.length].image,
          }));
          setReviews(formatted);
        }
      } catch (err) {
        console.warn('Reviews API fetch failed, using defaults:', err);
      }
    };
    fetchReviews();
  }, []);

  // Scroll to top visibility
  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const nextBanner = () => {
    setActiveBannerIndex((prev) => (prev + 1) % heroBanners.length);
  };

  const prevBanner = () => {
    setActiveBannerIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerVirtualAppointment = () => {
    window.dispatchEvent(new CustomEvent('open-virtual-appointment'));
  };

  const currentBanner = heroBanners[activeBannerIndex] || heroBanners[0];

  return (
    <div className="bg-white text-[#22201e] font-sans antialiased min-h-screen">
      {/* ─── 1. HERO BANNER (Neirah Peach #f7ebe4) ────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#faefe8] via-[#f7ebe4] to-[#f4e2d8] border-b border-[#ebdcd3]">
        <div className="max-w-[1400px] mx-auto min-h-[520px] lg:min-h-[580px] flex flex-col lg:flex-row items-center justify-between px-6 sm:px-12 lg:px-16 py-12 lg:py-8 gap-8 relative">
          {/* Left Text Content */}
          <div className="w-full lg:w-1/2 space-y-6 z-10 text-left">
            <div className="space-y-1">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-wide text-[#8a5042]">
                {currentBanner.title || 'TIMELESS BEAUTY,'}
              </h2>
              <div className="font-script text-6xl sm:text-7xl lg:text-8xl text-[#925446] leading-none -mt-1 sm:-mt-2">
                {currentBanner.subtitle || 'Forever You'}
              </div>
            </div>

            {/* Floral Divider */}
            <div className="flex items-center gap-3 text-[#925446]/60">
              <span className="h-[1px] w-16 bg-[#925446]/30" />
              <span className="text-base">✤</span>
              <span className="h-[1px] w-16 bg-[#925446]/30" />
            </div>

            <p className="text-xs sm:text-sm text-[#5d463d] leading-relaxed max-w-md font-light">
              {currentBanner.description}
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-md">
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/40 border border-[#ebdcd3]">
                <IoDiamondOutline className="w-5 h-5 text-[#8a5042] mb-1" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#5d463d]">
                  PREMIUM QUALITY
                </span>
              </div>
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/40 border border-[#ebdcd3]">
                <HiOutlineSparkles className="w-5 h-5 text-[#8a5042] mb-1" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#5d463d]">
                  EXPERTLY CRAFTED
                </span>
              </div>
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/40 border border-[#ebdcd3]">
                <HiOutlineGift className="w-5 h-5 text-[#8a5042] mb-1" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#5d463d]">
                  PERFECT FOR EVERY MOMENT
                </span>
              </div>
            </div>

            {/* Explore Button */}
            <div className="pt-2">
              <Link
                to={currentBanner.link || '/shop'}
                className="inline-flex items-center gap-2 bg-[#b37260] hover:bg-[#9e5e4d] text-white px-8 py-3 rounded-full text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
              >
                <span>EXPLORE NOW</span>
                <HiOutlineArrowNarrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Image Composition */}
          <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end relative">
            <div className="relative max-w-lg w-full">
              {/* Main Model Photo with curved organic mask */}
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/60 aspect-[4/3] sm:aspect-[16/11]">
                <img
                  src={currentBanner.image}
                  alt="Neirah Timeless Fine Jewellery"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Floating Circular Badge: "MADE TO SHINE ★" */}
              <div className="absolute -bottom-4 left-6 sm:left-10 bg-[#e8ded8]/90 backdrop-blur-md border border-white/80 rounded-full w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center shadow-lg text-center p-2 animate-fade-in">
                <span className="text-[10px] sm:text-xs font-cinzel font-semibold tracking-widest text-[#8a5042] uppercase leading-tight">
                  MADE TO
                  <br />
                  SHINE
                </span>
                <span className="text-amber-500 text-xs mt-0.5">★</span>
              </div>
            </div>
          </div>

          {/* Carousel Arrows */}
          <button
            onClick={prevBanner}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-700 shadow-md flex items-center justify-center transition-all z-20 cursor-pointer"
            aria-label="Previous banner"
          >
            <HiOutlineChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextBanner}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-700 shadow-md flex items-center justify-center transition-all z-20 cursor-pointer"
            aria-label="Next banner"
          >
            <HiOutlineChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {heroBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveBannerIndex(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  activeBannerIndex === i ? 'w-6 bg-[#8a5042]' : 'w-2 bg-[#8a5042]/30'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. CELEBRATE WITH NEIRAH JEWELS (Screenshot 2) ─────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-10">
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#22201e] font-normal tracking-wide">
            Celebrate With Neirah Jewels
          </h3>
        </div>

        <div className="relative">
          <div className="flex items-center justify-center gap-6 sm:gap-8 overflow-x-auto pb-4 no-scrollbar">
            {celebrateItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.link}
                className="group flex flex-col items-center flex-shrink-0"
              >
                <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-[24px] sm:rounded-[28px] overflow-hidden bg-[#faf7f2] border border-stone-200/80 shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <span className="text-xs sm:text-sm font-normal text-[#22201e] group-hover:text-[#8a5042] transition-colors mt-3 text-center tracking-wide">
                  {item.name}
                </span>
              </Link>
            ))}
          </div>

          <button
            className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm items-center justify-center text-stone-600 hover:text-black transition-colors"
            aria-label="Previous category"
          >
            <HiOutlineChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm items-center justify-center text-stone-600 hover:text-black transition-colors"
            aria-label="Next category"
          >
            <HiOutlineChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ─── 3. MOST LOVED ON NEIRAH JEWELS (Screenshot 2) ─────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#22201e] font-normal tracking-wide">
            Most Loved on Neirah Jewels
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {mostLovedProducts.map((product) => {
            const isWish = isWishlisted(product.id);
            return (
              <div
                key={product.id}
                className="group bg-[#fcfbfa] rounded-2xl border border-stone-100 p-3 sm:p-4 flex flex-col justify-between hover:shadow-md transition-all duration-300"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white mb-3 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-stone-500 hover:text-red-500 transition-colors cursor-pointer"
                      aria-label="Save to Wishlist"
                    >
                      {isWish ? (
                        <HiHeart className="w-4 h-4 text-black" />
                      ) : (
                        <HiOutlineHeart className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <Link
                    to={`/product/${product.id}`}
                    className="text-[11px] sm:text-xs text-stone-800 font-normal line-clamp-2 hover:text-[#8a5042] transition-colors leading-relaxed block mb-2"
                  >
                    {product.title}
                  </Link>

                  {/* ADD TO CART Button (Screenshot match) */}
                  <button
                    type="button"
                    onClick={() => addToCart(product, 1)}
                    className="w-full bg-[#c6913c] hover:bg-[#b07d2c] active:scale-[0.98] text-white py-2 px-3 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 cursor-pointer mb-2.5"
                    aria-label={`Add ${product.title} to cart`}
                  >
                    <HiOutlineShoppingBag className="w-3.5 h-3.5" />
                    <span>ADD TO CART</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f2d08a] border border-stone-300 cursor-pointer" title="Yellow Gold" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e3a89a] border border-stone-300 cursor-pointer" title="Rose Gold" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e5e7eb] border border-stone-300 cursor-pointer" title="White Gold" />
                  </div>

                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-xs sm:text-sm font-semibold text-[#22201e]">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                        ₹{Number(product.originalPrice).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/shop"
            className="inline-block border border-[#22201e] text-[#22201e] hover:bg-[#22201e] hover:text-white px-9 py-2.5 rounded-full text-xs font-medium tracking-[0.2em] uppercase transition-all duration-200"
          >
            DISCOVER
          </Link>
        </div>
      </section>

      {/* ─── 4. SILVER JEWELLERY (Screenshot 3) ──────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#22201e] font-normal tracking-wide">
            Silver Jewellery
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {silverProducts.map((product) => {
            const isWish = isWishlisted(product.id);
            return (
              <div
                key={product.id}
                className="group bg-[#fcfbfa] rounded-2xl border border-stone-100 p-3 sm:p-4 flex flex-col justify-between hover:shadow-md transition-all duration-300"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white mb-3 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-stone-500 hover:text-red-500 transition-colors cursor-pointer"
                      aria-label="Save to Wishlist"
                    >
                      {isWish ? (
                        <HiHeart className="w-4 h-4 text-black" />
                      ) : (
                        <HiOutlineHeart className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <Link
                    to={`/product/${product.id}`}
                    className="text-[11px] sm:text-xs text-stone-800 font-normal line-clamp-2 hover:text-[#8a5042] transition-colors leading-relaxed block mb-2"
                  >
                    {product.title}
                  </Link>

                  {/* ADD TO CART Button (Screenshot match) */}
                  <button
                    type="button"
                    onClick={() => addToCart(product, 1)}
                    className="w-full bg-[#c6913c] hover:bg-[#b07d2c] active:scale-[0.98] text-white py-2 px-3 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 cursor-pointer mb-2.5"
                    aria-label={`Add ${product.title} to cart`}
                  >
                    <HiOutlineShoppingBag className="w-3.5 h-3.5" />
                    <span>ADD TO CART</span>
                  </button>
                </div>

                <div>
                  {product.swatches && product.swatches.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {product.swatches.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-3 h-3 rounded-full border border-stone-300 inline-block shadow-2xs"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-xs sm:text-sm font-semibold text-[#22201e]">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                        ₹{Number(product.originalPrice).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/shop?category=silver-collection"
            className="inline-block border border-[#22201e] text-[#22201e] hover:bg-[#22201e] hover:text-white px-9 py-2.5 rounded-full text-xs font-medium tracking-[0.2em] uppercase transition-all duration-200"
          >
            DISCOVER
          </Link>
        </div>
      </section>

      {/* ─── 5. CURATED COLLECTION BANNERS (/api/banners?type=collectionbanner) ──── */}
      {(() => {
        const col1 = collectionBanners[0] || DEFAULT_COLLECTION_BANNERS[0];
        const col2 = collectionBanners[1] || DEFAULT_COLLECTION_BANNERS[1];
        const col3 = collectionBanners[2] || DEFAULT_COLLECTION_BANNERS[2];
        const col4 = collectionBanners[3] || DEFAULT_COLLECTION_BANNERS[3];

        return (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 cols): Top 2 Tiles + Bottom Wide Tile */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Top 2 Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Tile 1: The Essence Collection */}
                  <Link
                    to={col1.link || '/shop'}
                    className="relative rounded-2xl overflow-hidden bg-[#faeee7] aspect-[4/3] sm:aspect-square group p-6 flex flex-col justify-end"
                  >
                    <img
                      src={col1.image}
                      alt={col1.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="relative z-10 text-white">
                      <h4 className="font-serif text-xl sm:text-2xl font-light">
                        {col1.title}
                      </h4>
                    </div>
                  </Link>

                  {/* Tile 2: A bracelet made distinctly yours */}
                  <Link
                    to={col2.link || '/shop'}
                    className="relative rounded-2xl overflow-hidden bg-[#f7ebe4] aspect-[4/3] sm:aspect-square group p-6 flex flex-col justify-between"
                  >
                    <img
                      src={col2.image}
                      alt={col2.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />
                    <div className="relative z-10 text-white">
                      <h4 className="font-serif text-lg sm:text-xl font-normal max-w-[200px]">
                        {col2.title}
                      </h4>
                    </div>
                  </Link>
                </div>

                {/* Tile 3: Made to Shine, Made to Last (Wide Card) */}
                <div className="relative rounded-2xl overflow-hidden bg-[#fbf3ee] border border-stone-200/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 max-w-sm">
                    <h4 className="font-serif text-2xl font-medium text-[#8a5042]">
                      {col3.title}
                    </h4>
                    {col3.subtitle && (
                      <p className="text-xs text-stone-600 leading-relaxed font-light">
                        {col3.subtitle}
                      </p>
                    )}
                    <div className="pt-2">
                      <Link
                        to={col3.link || '/shop'}
                        className="text-xs font-semibold text-[#8a5042] hover:text-[#22201e] flex items-center gap-1 uppercase tracking-wider"
                      >
                        <span>Explore Collection</span>
                        <HiOutlineArrowNarrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                  <Link
                    to={col3.link || '/shop'}
                    className="w-full sm:w-56 h-40 rounded-xl overflow-hidden bg-white shadow-sm shrink-0 block"
                  >
                    <img
                      src={col3.image}
                      alt={col3.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                </div>
              </div>

              {/* Right Column (5 cols): Beauty. With Intention Tall Editorial Card */}
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden bg-[#f6eae2] border border-stone-200/60 p-8 flex flex-col justify-between min-h-[480px]">
                <div className="space-y-2 text-right">
                  <h4 className="font-serif text-3xl font-medium text-[#8a5042]">
                    {col4.title}
                  </h4>
                  {col4.subtitle && (
                    <p className="text-xs text-stone-600 leading-relaxed max-w-xs ml-auto font-light">
                      {col4.subtitle}
                    </p>
                  )}
                </div>

                <Link
                  to={col4.link || '/shop'}
                  className="relative mt-6 flex items-end justify-center group block"
                >
                  <img
                    src={col4.image}
                    alt={col4.title}
                    className="rounded-2xl w-full max-h-72 object-cover object-top shadow-md group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute -bottom-3 -right-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white">
                    <img
                      src="/featured/earring.jpg"
                      alt="Diamond Cascades"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  </div>
                </Link>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ─── 6. CERTIFICATIONS BAR (Screenshot 3) ────────────────────── */}
      <section className="border-t border-b border-stone-200/80 bg-[#faf8f5] py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-around gap-6 text-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#60574d] text-white flex items-center justify-center font-bold text-xs">
              BIS
            </div>
            <div className="text-left">
              <span className="text-xs font-bold tracking-wider uppercase text-stone-800 block">
                BIS HALLMARK
              </span>
              <span className="text-[10px] text-stone-500">100% Certified Gold Purity</span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-stone-300" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8a5042] text-white flex items-center justify-center">
              <HiOutlineShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold tracking-wider uppercase text-stone-800 block">
                NEIRAH JEWELS CERTIFIED
              </span>
              <span className="text-[10px] text-stone-500">Conflict-Free Lab & Natural Diamonds</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. CUSTOM JEWELLERY, CRAFTED FOR YOU (Screenshot 1) ─────── */}
      <section className="relative overflow-hidden bg-[#e8ded5] py-20 px-4 sm:px-6 lg:px-8 border-b border-stone-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Card: Custom Jewellery Box */}
            <div className="lg:col-span-5 bg-[#faf8f5]/95 backdrop-blur-md rounded-2xl border border-white/60 p-8 sm:p-10 shadow-lg space-y-6">
              <div className="space-y-3">
                <h3 className="font-serif text-2xl sm:text-3xl text-[#22201e] font-normal leading-snug">
                  Custom Jewellery, <br />Crafted for You
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                  Bring your vision to life with a one-of-a-kind piece, designed and handcrafted to reflect your unique style.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={triggerVirtualAppointment}
                  className="bg-[#d95c52] hover:bg-[#c24e45] text-white px-7 py-3 rounded-md text-xs font-semibold tracking-[0.15em] uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  CUSTOMIZE NOW
                </button>
              </div>
            </div>

            {/* Right: Consultation Scene with 5 Milestones Curve */}
            <div className="lg:col-span-7 relative flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Curve Milestones list */}
              <div className="space-y-5 text-right z-10 w-full md:w-auto">
                <div className="flex items-center justify-end gap-3">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    TELL US YOUR IDEA
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/80 border border-stone-300 flex items-center justify-center text-stone-700 shadow-sm shrink-0">
                    <IoDiamondOutline className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    PERSONALIZED CONSULTATION
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/80 border border-stone-300 flex items-center justify-center text-stone-700 shadow-sm shrink-0">
                    <HiOutlineChatAlt2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    CUSTOM DESIGN JUST FOR YOU
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/80 border border-stone-300 flex items-center justify-center text-stone-700 shadow-sm shrink-0">
                    <HiOutlineSparkles className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    EXPERT CRAFTSMANSHIP & QUALITY ASSURED
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/80 border border-stone-300 flex items-center justify-center text-stone-700 shadow-sm shrink-0">
                    <HiOutlineShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    DELIVERED WITH CARE, MADE TO TREASURE
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/80 border border-stone-300 flex items-center justify-center text-stone-700 shadow-sm shrink-0">
                    <HiOutlineGift className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Consultation Image */}
              <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-white/80 w-full md:w-80 h-80 shrink-0">
                <img
                  src="/banners/hero_timeless.jpg"
                  alt="Jewellery Consultation"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </div>

          {/* Bottom 4 Step Process Horizontal Chain */}
          <div className="pt-8 border-t border-stone-300/60 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/80 border border-stone-300 mx-auto flex items-center justify-center text-stone-700">
                <HiOutlineChatAlt2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-stone-800 uppercase tracking-wider block">
                SHARE YOUR IDEA
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/80 border border-stone-300 mx-auto flex items-center justify-center text-stone-700">
                <IoDiamondOutline className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-stone-800 uppercase tracking-wider block">
                WE CRAFT THE PERFECT DESIGN
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/80 border border-stone-300 mx-auto flex items-center justify-center text-stone-700">
                <HiOutlinePencil className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-stone-800 uppercase tracking-wider block">
                HANDCRAFTED WITH PRECISION
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/80 border border-stone-300 mx-auto flex items-center justify-center text-stone-700">
                <HiOutlineGift className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-stone-800 uppercase tracking-wider block">
                DELIVERED TO YOU, MADE TO BE CHERISHED
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. GIFTS THAT SAY IT ALL (Screenshot 2 - /api/featured?placement=Gifts) ─ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#22201e] font-normal tracking-wide">
            Gifts That Say It All
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {giftsItems.map((gift, idx) => (
            <Link
              key={idx}
              to={gift.link || '/shop'}
              className="group flex flex-col items-center"
            >
              <div className="w-full aspect-square rounded-[24px] overflow-hidden bg-[#faf7f2] border border-stone-200/80 shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                <img
                  src={gift.image}
                  alt={gift.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <span className="text-xs sm:text-sm font-normal text-[#22201e] group-hover:text-[#8a5042] transition-colors mt-3 text-center tracking-wide">
                {gift.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 9. TRENDING JEWELLERY IN LAB GROWN DIAMOND (Screenshot 2) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#22201e] font-normal tracking-wide">
            Trending Jewellery in lab grown diamond
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {trendingProducts.map((product) => {
            const isWish = isWishlisted(product.id);
            return (
              <div
                key={product.id}
                className="group bg-[#fcfbfa] rounded-2xl border border-stone-100 p-3 sm:p-4 flex flex-col justify-between hover:shadow-md transition-all duration-300"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white mb-3 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-stone-500 hover:text-red-500 transition-colors cursor-pointer"
                      aria-label="Save to Wishlist"
                    >
                      {isWish ? (
                        <HiHeart className="w-4 h-4 text-black" />
                      ) : (
                        <HiOutlineHeart className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <Link
                    to={`/product/${product.id}`}
                    className="text-[11px] sm:text-xs text-stone-800 font-normal line-clamp-2 hover:text-[#8a5042] transition-colors leading-relaxed block mb-2"
                  >
                    {product.title}
                  </Link>

                  {/* ADD TO CART Button (Screenshot match) */}
                  <button
                    type="button"
                    onClick={() => addToCart(product, 1)}
                    className="w-full bg-[#c6913c] hover:bg-[#b07d2c] active:scale-[0.98] text-white py-2 px-3 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 cursor-pointer mb-2.5"
                    aria-label={`Add ${product.title} to cart`}
                  >
                    <HiOutlineShoppingBag className="w-3.5 h-3.5" />
                    <span>ADD TO CART</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f2d08a] border border-stone-300 cursor-pointer" title="Yellow Gold" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e3a89a] border border-stone-300 cursor-pointer" title="Rose Gold" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e5e7eb] border border-stone-300 cursor-pointer" title="White Gold" />
                  </div>

                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-xs sm:text-sm font-semibold text-[#22201e]">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                        ₹{Number(product.originalPrice).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 10. BOOK A VIRTUAL APPOINTMENT BANNER (Screenshot 2) ────── */}
      <section className="relative overflow-hidden bg-[#e0d3c6] py-16 px-4 sm:px-6 lg:px-8 border-t border-b border-stone-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Floating Card */}
          <div className="lg:col-span-6 bg-[#faf8f5]/95 backdrop-blur-md rounded-2xl border border-white/60 p-8 sm:p-10 shadow-lg space-y-5">
            <h3 className="font-serif text-2xl sm:text-3xl text-[#22201e] font-normal">
              Book A Virtual Appointment
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
              Book a personalized appointment to explore designs that match your style. Let our experts guide you in finding or creating something truly special.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={triggerVirtualAppointment}
                className="bg-[#d95c52] hover:bg-[#c24e45] text-white px-7 py-3 rounded-md text-xs font-semibold tracking-[0.15em] uppercase transition-all shadow-md active:scale-95 cursor-pointer"
              >
                BOOK APPOINTMENT
              </button>
            </div>
          </div>

          {/* Right Specialist Illustration */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            {/* Calendar Badge */}
            <div className="absolute -top-4 left-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-stone-200 flex items-center gap-3 z-10">
              <HiOutlineCalendar className="w-8 h-8 text-[#8a5042]" />
              <div className="text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-800 block">
                  Interactive Video Call
                </span>
                <span className="text-[10px] text-stone-500">Directly with Master Gemologist</span>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 max-w-md w-full aspect-[4/3]">
              <img
                src="/banners/hero_timeless.jpg"
                alt="Virtual Jewellery Specialist"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. WHAT CUSTOMERS ARE SAYING (Screenshot 3 - /api/reviews) ─ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#22201e] font-normal tracking-wide">
            What Customers are Saying
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.slice(0, 4).map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(review.rating || 5)].map((_, i) => (
                    <HiStar key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                {/* Comment */}
                <p className="text-xs text-stone-600 leading-relaxed font-light italic">
                  "{review.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-900">
                  {review.clientName}
                </span>
                <span className="text-[10px] text-stone-400">Verified Client</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 12. FOLLOW US ON INSTAGRAM (Screenshot 3) ───────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center border-t border-stone-200">
        <div className="space-y-2 mb-8">
          <h3 className="font-serif text-2xl sm:text-3xl text-[#22201e] font-normal tracking-wide">
            Follow Us on Instagram
          </h3>
          <a
            href="https://instagram.com/neirahjewelsofficial"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#8a5042] hover:underline font-medium tracking-wider inline-flex items-center gap-1.5"
          >
            <FaInstagram className="w-4 h-4" />
            <span>@neirahjewelsofficial</span>
          </a>
        </div>
        <p className="text-xs text-stone-400 italic font-light">
          Stay tuned! Our Instagram feed is coming soon.
        </p>
      </section>
    </div>
  );
};

export default Home;
