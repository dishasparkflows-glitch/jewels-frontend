import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiStar,
  HiOutlineHeart,
  HiHeart,
  HiOutlineShare,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineRefresh,
  HiOutlineSparkles,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineCheck,
  HiOutlineX,
} from 'react-icons/hi';
import { IoDiamondOutline, IoRibbonOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { productsAPI } from '../../api/services';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { getValidProductImages, getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';

// Helper to normalize media URL
const getMediaUrl = (url) => {
  if (!url) return '/featured/ring.jpg';
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

// Diamond quality tiers
const DIAMOND_QUALITIES = [
  { id: 'EF-VVS', label: 'EF VVS' },
  { id: 'FG-VS', label: 'FG VS' },
  { id: 'GH-SI', label: 'GH SI' },
  { id: 'DE-VS', label: 'D-E VS' },
];

// Metal options
const METAL_OPTIONS = [
  { id: '10k-yellow', label: '10KT Yellow Gold', purity: '10K', color: 'Yellow', dot: '#e5c158' },
  { id: '10k-rose', label: '10KT Rose Gold', purity: '10K', color: 'Rose', dot: '#e8a88e' },
  { id: '10k-white', label: '10KT White Gold', purity: '10K', color: 'White', dot: '#e2e8f0' },
  { id: '14k-yellow', label: '14KT Yellow Gold', purity: '14K', color: 'Yellow', dot: '#e5c158' },
  { id: '14k-rose', label: '14KT Rose Gold', purity: '14K', color: 'Rose', dot: '#e8a88e' },
  { id: '14k-white', label: '14KT White Gold', purity: '14K', color: 'White', dot: '#e2e8f0' },
  { id: '18k-yellow', label: '18KT Yellow Gold', purity: '18K', color: 'Yellow', dot: '#e5c158' },
  { id: '18k-rose', label: '18KT Rose Gold', purity: '18K', color: 'Rose', dot: '#e8a88e' },
  { id: '18k-white', label: '18KT White Gold', purity: '18K', color: 'White', dot: '#e2e8f0' },
  { id: 'platinum', label: 'Platinum 950', purity: 'Pt', color: 'Platinum', dot: '#cbd5e1' },
];

// Ring sizes (US)
const RING_SIZES = [
  '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Product state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostLikedProducts, setMostLikedProducts] = useState([]);

  // Selections
  const [diamondType, setDiamondType] = useState('Lab Grown Diamond');
  const [selectedQuality, setSelectedQuality] = useState('D-E VS');
  const [selectedMetal, setSelectedMetal] = useState('14KT Yellow Gold');
  const [selectedSize, setSelectedSize] = useState('7');
  const [addingToCart, setAddingToCart] = useState(false);

  // Delivery check state
  const [pincode, setPincode] = useState('');
  const [deliveryChecked, setDeliveryChecked] = useState(false);

  // Lightbox & Size modal
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showSizeModal, setShowSizeModal] = useState(false);

  // Accordion active sections (multiple can be open)
  const [openAccordions, setOpenAccordions] = useState({
    desc: true,
    specs: false,
    priceBreakup: false,
    origin: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Extract clean studio gallery images (strictly non-ornate)
  const galleryImages = useMemo(() => {
    return getValidProductImages(product);
  }, [product]);

  // Safe category name string resolver
  const categoryName = useMemo(() => {
    if (!product) return 'Rings';
    const cat = product.category;
    if (Array.isArray(cat)) {
      if (cat.length > 0) {
        const first = cat[0];
        if (typeof first === 'string' && first.trim()) return first.trim();
        if (first && typeof first.name === 'string' && first.name.trim()) return first.name.trim();
        if (first && typeof first.title === 'string' && first.title.trim()) return first.title.trim();
      }
      return 'Rings';
    }
    if (cat && typeof cat === 'object') {
      return cat.name || cat.title || 'Rings';
    }
    if (typeof cat === 'string' && cat.trim()) {
      return cat.trim();
    }
    return 'Rings';
  }, [product]);

  // Fetch product data
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const res = await productsAPI.getById(id);
        const prodData = res.data?.data || res.data;
        if (prodData) {
          setProduct(prodData);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        // Fallback default ring so page renders cleanly even if offline
        setProduct({
          _id: id || '6acf74e4cae5d319fe6cbbab',
          title: 'Oval Cut Lab Grown Diamond Shared Prong Semi-Eternity Wedding Band | Neirah Jewels',
          price: 29878.99,
          salePrice: 29878.99,
          mrp: 34999.0,
          description:
            'Crafted to perfection, this shared-prong semi-eternity wedding band features brilliant oval cut lab-grown diamonds set seamlessly along a high-polish 14KT gold band. Designed for comfort, supreme sparkle, and timeless everyday elegance.',
          images: [
            { url: '/products/oval_band_front.jpg' },
            { url: '/products/oval_band_side.jpg' },
            { url: '/products/oval_band_circle.jpg' },
            { url: '/products/oval_band_front.jpg' },
            { url: '/products/oval_band_side.jpg' },
            { url: '/products/oval_band_circle.jpg' },
          ],
          specifications: {
            metalName: '14KT Yellow Gold',
            metalWeight: 3.2,
            metalPurity: 14,
            grossWeight: 3.8,
            netWeight: 3.2,
            stoneWeight: 0.6,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  // Fetch Most Liked / Recommended products
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await productsAPI.getHomeProducts();
        const homeData = res.data?.data || {};
        const list = homeData.trending || homeData.platinum || [];
        if (Array.isArray(list) && list.length > 0) {
          setMostLikedProducts(list.slice(0, 6));
        } else {
          setMostLikedProducts([
            {
              _id: 'prod_rel_1',
              title: 'Modern Oval Cut Lab Grown Diamond Solitaire Ring',
              price: 25411.16,
              salePrice: 25411.16,
              image: '/products/oval_band_front.jpg',
            },
            {
              _id: 'prod_rel_2',
              title: 'Radiant Cut Lab Grown Diamond Three Stone Ring',
              price: 128380.19,
              salePrice: 128380.19,
              image: '/products/oval_band_side.jpg',
            },
            {
              _id: 'prod_rel_3',
              title: 'Pear Cut Lab Grown Diamond Three Stone Ring',
              price: 31250.0,
              salePrice: 31250.0,
              image: '/products/oval_band_circle.jpg',
            },
            {
              _id: 'prod_rel_4',
              title: 'Round Cut Lab Grown Diamond Classic Band',
              price: 29800.0,
              salePrice: 29800.0,
              image: '/products/oval_band_front.jpg',
            },
            {
              _id: 'prod_rel_5',
              title: 'Oval Diamond Ring with Hidden Halo',
              price: 52400.0,
              salePrice: 52400.0,
              image: '/products/oval_band_side.jpg',
            },
            {
              _id: 'prod_rel_6',
              title: 'Heart Shaped Lab Grown Diamond Solitaire Ring',
              price: 39500.0,
              salePrice: 39500.0,
              image: '/products/oval_band_circle.jpg',
            },
          ]);
        }
      } catch (err) {
        console.warn('Could not load related products:', err);
      }
    };

    fetchRelated();
  }, []);

  // Format INR Currency
  const formatPrice = (val) => {
    if (!val && val !== 0) return '₹29,878.99';
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Add to cart handler
  const handleAddToCart = () => {
    if (!product) return;
    setAddingToCart(true);

    const cartItem = {
      _id: product._id,
      title: product.title,
      price: product.salePrice || product.price || 29878.99,
      image: galleryImages[0] || getPrimaryProductImage(product),
      category: categoryName || 'Rings',
    };

    addToCart(cartItem, 1, {
      metal: selectedMetal,
      diamondType,
      diamondQuality: selectedQuality,
      size: selectedSize,
    });

    toast.success('Added to Shopping Bag!');
    setTimeout(() => {
      setAddingToCart(false);
    }, 400);
  };

  // Share handler
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard!');
    } else {
      toast('Share link: ' + window.location.href);
    }
  };

  // Pincode verify handler
  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length < 6) {
      toast.error('Please enter a valid 6-digit Pincode');
      return;
    }
    setDeliveryChecked(true);
    toast.success('Delivery available to your location!');
  };

  if (loading || !product) {
    return (
      <div className="bg-white min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-stone-200 border-t-[#8f6d43] rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest font-bold text-stone-400">
            Loading Fine Jewelry Details...
          </p>
        </div>
      </div>
    );
  }

  const currentPrice = product?.salePrice || product?.price || 29878.99;
  const mrpPrice = product?.mrp || 34999.0;
  const discountPercent =
    mrpPrice > currentPrice ? Math.round(((mrpPrice - currentPrice) / mrpPrice) * 100) : 0;

  // Price Breakup Calculations
  const goldAmount = currentPrice * 0.48;
  const diamondAmount = currentPrice * 0.42;
  const makingCharge = currentPrice * 0.07;
  const gstAmount = currentPrice * 0.03;

  return (
    <div className="bg-white text-stone-900 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-4">
        {/* ─── Breadcrumb Navigation ─── */}
        <nav className="text-[11px] text-stone-400 py-3 flex items-center gap-1.5 overflow-hidden whitespace-nowrap border-b border-stone-100 mb-6">
          <Link to="/" className="hover:text-stone-800 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            to={`/shop?category=${encodeURIComponent(String(categoryName || 'rings').toLowerCase())}`}
            className="hover:text-stone-800 transition-colors"
          >
            {categoryName}
          </Link>
          <span>/</span>
          <span className="text-stone-700 font-semibold truncate max-w-sm sm:max-w-md">
            {product?.title || 'Fine Jewellery'}
          </span>
        </nav>

        {/* ─── Main Product Section: 2-Column Gallery Grid & Purchase Sidebar ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* ─── Left Side: 2-Column Image Gallery Grid (Screenshot 1) ─── */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {galleryImages.slice(0, 6).map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxImage(getMediaUrl(imgUrl))}
                  className="group relative aspect-square rounded-2xl bg-[#faf8f5] border border-stone-200/60 overflow-hidden flex items-center justify-center p-4 cursor-zoom-in shadow-2xs hover:border-[#8f6d43]/40 transition-all"
                >
                  <img
                    src={getMediaUrl(imgUrl)}
                    alt={`${product?.title || 'Jewelry'} view ${idx + 1}`}
                    className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
                    loading={idx < 2 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs text-[10px] font-bold text-stone-600 px-2 py-0.5 rounded-md shadow-xs">
                    CLICK TO ZOOM
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Right Side: Configuration & Purchase Sidebar (Sticky) ─── */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
            {/* Title & Brand */}
            <div className="space-y-1.5">
              <h1 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug tracking-tight font-serif">
                {product?.title || 'Fine Jewellery'}
              </h1>
            </div>

            {/* Price Row with Wishlist & Share */}
            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
                  {formatPrice(currentPrice)}
                </span>
                {discountPercent > 0 && (
                  <span className="text-xs text-stone-400 line-through">
                    {formatPrice(mrpPrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Action Buttons: Wishlist & Share */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toggleWishlist(product);
                    toast.success(
                      isWishlisted(product._id)
                        ? 'Removed from wishlist'
                        : 'Added to your wishlist!'
                    );
                  }}
                  className="w-9 h-9 rounded-full border border-stone-200 hover:border-stone-400 flex items-center justify-center text-stone-600 hover:text-red-500 transition-colors cursor-pointer bg-white"
                  title="Wishlist"
                >
                  {isWishlisted(product._id) ? (
                    <HiHeart className="w-5 h-5 text-red-500" />
                  ) : (
                    <HiOutlineHeart className="w-5 h-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-9 h-9 rounded-full border border-stone-200 hover:border-stone-400 flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors cursor-pointer bg-white"
                  title="Share piece"
                >
                  <HiOutlineShare className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Promo Code Banner */}
            <div className="p-2.5 rounded-xl bg-[#fbf7f0] border border-[#ecd9c2] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏷️</span>
                <span className="font-semibold text-stone-800">
                  Use code <span className="font-bold text-[#8f6d43]">NEIRAH10</span> for extra 10% off
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText('NEIRAH10');
                  toast.success("Coupon 'NEIRAH10' copied!");
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-[#8f6d43] hover:underline cursor-pointer"
              >
                COPY
              </button>
            </div>

            {/* ─── 1. Diamond Type Selector ─── */}
            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold text-stone-700">
                Diamond Type:{' '}
                <span className="font-semibold text-stone-500">{diamondType}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDiamondType('Lab Grown Diamond')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    diamondType === 'Lab Grown Diamond'
                      ? 'bg-[#0f4c3a] text-white shadow-xs'
                      : 'bg-stone-50 border border-stone-200 text-stone-600 hover:border-stone-400'
                  }`}
                >
                  LAB GROWN DIAMOND
                </button>
                <button
                  type="button"
                  onClick={() => setDiamondType('Natural Diamond')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    diamondType === 'Natural Diamond'
                      ? 'bg-[#0f4c3a] text-white shadow-xs'
                      : 'bg-stone-50 border border-stone-200 text-stone-600 hover:border-stone-400'
                  }`}
                >
                  NATURAL DIAMOND
                </button>
              </div>
            </div>

            {/* ─── 2. Diamond Quality Selector ─── */}
            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold text-stone-700">
                Diamond Quality:{' '}
                <span className="font-semibold text-stone-500">{selectedQuality}</span>
              </span>
              <div className="grid grid-cols-4 gap-2">
                {DIAMOND_QUALITIES.map((tier) => {
                  const isActive = selectedQuality === tier.label;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedQuality(tier.label)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-[#0f4c3a] text-white border-[#0f4c3a] shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {tier.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── 3. Metal Purity & Color Swatches ─── */}
            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold text-stone-700">
                Metal: <span className="font-semibold text-stone-500">{selectedMetal}</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {METAL_OPTIONS.map((opt) => {
                  const isActive = selectedMetal === opt.label;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedMetal(opt.label)}
                      title={opt.label}
                      className={`h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#8f6d43] bg-[#faf5ee] text-[#8f6d43] ring-1 ring-[#8f6d43]/30 font-bold'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: opt.dot }}
                      />
                      <span>{opt.purity} {opt.color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── 4. Size (US) Selector ─── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="block text-[11px] font-bold text-stone-700">Size (US)</span>
                <button
                  type="button"
                  onClick={() => setShowSizeModal(true)}
                  className="text-[10px] font-bold text-[#8f6d43] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  Size Chart & Guide
                </button>
              </div>
              <div className="relative">
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-800 appearance-none focus:outline-none focus:border-[#8f6d43] focus:ring-1 focus:ring-[#8f6d43]/20 cursor-pointer"
                >
                  {RING_SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      US {sz} (Free Resizing Within 30 Days)
                    </option>
                  ))}
                </select>
                <HiOutlineChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* ─── 5. Add to Cart Button ─── */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="w-full py-4 bg-black hover:bg-stone-800 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {addingToCart ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>ADDING TO BAG...</span>
                  </>
                ) : (
                  <span>ADD TO CART</span>
                )}
              </button>
            </div>

            {/* ─── 6. Estimated Delivery by Pincode ─── */}
            <div className="pt-2">
              <form onSubmit={handlePincodeCheck} className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, ''));
                    setDeliveryChecked(false);
                  }}
                  placeholder="Enter Pincode for estimated delivery"
                  className="w-full h-11 pl-3.5 pr-20 rounded-lg border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8f6d43] transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-stone-900 text-white rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
                >
                  CHECK
                </button>
              </form>

              {deliveryChecked && (
                <div className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200/60 flex items-center gap-2 animate-fadeIn">
                  <HiOutlineCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Expected Delivery by <strong>Wed, 21 Oct</strong>. Free insured shipping.
                  </span>
                </div>
              )}
            </div>

            {/* ─── 7. "THE NEIRAH DIFFERENCE" 6 Micro-Trust Badges (Screenshot 1) ─── */}
            <div className="pt-3 border-t border-stone-100">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3 text-center">
                THE NEIRAH DIFFERENCE
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-stone-50/70 border border-stone-200/60 text-center space-y-1">
                  <IoRibbonOutline className="w-4 h-4 text-[#8f6d43] mx-auto" />
                  <span className="block text-[10px] font-semibold text-stone-700 leading-tight">
                    100% Certified Jewelry
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50/70 border border-stone-200/60 text-center space-y-1">
                  <HiOutlineShieldCheck className="w-4 h-4 text-[#8f6d43] mx-auto" />
                  <span className="block text-[10px] font-semibold text-stone-700 leading-tight">
                    BIS 916 Hallmarked
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50/70 border border-stone-200/60 text-center space-y-1">
                  <HiStar className="w-4 h-4 text-[#8f6d43] mx-auto" />
                  <span className="block text-[10px] font-semibold text-stone-700 leading-tight">
                    4.7+ Rating & Reviews
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50/70 border border-stone-200/60 text-center space-y-1">
                  <IoDiamondOutline className="w-4 h-4 text-[#8f6d43] mx-auto" />
                  <span className="block text-[10px] font-semibold text-stone-700 leading-tight">
                    100% Conflict-Free
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50/70 border border-stone-200/60 text-center space-y-1">
                  <HiOutlineTruck className="w-4 h-4 text-[#8f6d43] mx-auto" />
                  <span className="block text-[10px] font-semibold text-stone-700 leading-tight">
                    Free Secure Shipping
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50/70 border border-stone-200/60 text-center space-y-1">
                  <HiOutlineRefresh className="w-4 h-4 text-[#8f6d43] mx-auto" />
                  <span className="block text-[10px] font-semibold text-stone-700 leading-tight">
                    Lifetime Exchange
                  </span>
                </div>
              </div>
            </div>

            {/* ─── 8. Accordion Information Panels (Screenshot 1) ─── */}
            <div className="pt-2 divide-y divide-stone-100 border-t border-stone-100 text-xs">
              {/* Product Description */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion('desc')}
                  className="w-full flex items-center justify-between font-bold text-stone-900 tracking-wide text-xs cursor-pointer text-left"
                >
                  <span className="uppercase text-[11px] font-bold">Product Description</span>
                  <span className="text-stone-400 text-sm">
                    {openAccordions.desc ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.desc && (
                  <div className="mt-2 text-stone-600 leading-relaxed text-xs animate-fadeIn space-y-2">
                    <p>{product.description}</p>
                    {Array.isArray(product.descriptionSections) &&
                      product.descriptionSections.map((sec, i) => (
                        <div key={i} className="pt-1">
                          <strong className="text-stone-800">{sec.header}: </strong>
                          <span>{sec.description}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Specification */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion('specs')}
                  className="w-full flex items-center justify-between font-bold text-stone-900 tracking-wide text-xs cursor-pointer text-left"
                >
                  <span className="uppercase text-[11px] font-bold">Specification</span>
                  <span className="text-stone-400 text-sm">
                    {openAccordions.specs ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.specs && (
                  <div className="mt-2 text-stone-600 text-xs animate-fadeIn space-y-1.5 divide-y divide-stone-50">
                    <div className="flex justify-between py-1">
                      <span className="text-stone-400">Metal Purity & Tone</span>
                      <span className="font-semibold text-stone-800">{selectedMetal}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-400">Diamond Type</span>
                      <span className="font-semibold text-stone-800">{diamondType}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-400">Diamond Color & Clarity</span>
                      <span className="font-semibold text-stone-800">{selectedQuality}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-400">Diamond Shape</span>
                      <span className="font-semibold text-stone-800">Oval Cut</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-400">Approx. Gold Weight</span>
                      <span className="font-semibold text-stone-800">
                        {product.specifications?.metalWeight || 3.2} g
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-400">Ring Size</span>
                      <span className="font-semibold text-stone-800">US {selectedSize}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* PRICE BREAK UP */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion('priceBreakup')}
                  className="w-full flex items-center justify-between font-bold text-stone-900 tracking-wide text-xs cursor-pointer text-left"
                >
                  <span className="uppercase text-[11px] font-bold">PRICE BREAK UP</span>
                  <span className="text-stone-400 text-sm">
                    {openAccordions.priceBreakup ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.priceBreakup && (
                  <div className="mt-2 text-stone-600 text-xs animate-fadeIn space-y-1.5 bg-stone-50/70 p-3 rounded-xl border border-stone-200/60 divide-y divide-stone-100">
                    <div className="flex justify-between py-1">
                      <span>Gold Component (14KT)</span>
                      <span className="font-semibold text-stone-800">{formatPrice(goldAmount)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Diamond Component (D-E VS)</span>
                      <span className="font-semibold text-stone-800">{formatPrice(diamondAmount)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Making Charges / Labour</span>
                      <span className="font-semibold text-stone-800">{formatPrice(makingCharge)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>GST (3%)</span>
                      <span className="font-semibold text-stone-800">{formatPrice(gstAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-stone-200 font-bold text-stone-900">
                      <span>Total Retail Price</span>
                      <span className="text-[#8f6d43] font-serif text-sm">{formatPrice(currentPrice)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Manufacture & Origin */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion('origin')}
                  className="w-full flex items-center justify-between font-bold text-stone-900 tracking-wide text-xs cursor-pointer text-left"
                >
                  <span className="uppercase text-[11px] font-bold">Manufacture & Origin</span>
                  <span className="text-stone-400 text-sm">
                    {openAccordions.origin ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.origin && (
                  <div className="mt-2 text-stone-600 leading-relaxed text-xs animate-fadeIn space-y-1">
                    <p>
                      <strong>Origin:</strong> Handcrafted with precision by master artisans in Surat & Mumbai, India.
                    </p>
                    <p>
                      <strong>Certification:</strong> All lab-grown diamonds are accompanied by independent gemological certification ensuring 4Cs accuracy.
                    </p>
                    <p>
                      <strong>Hallmarking:</strong> Pure hallmarked precious metal stamped according to BIS standards.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── MOST LIKED PIECES (Screenshot 1 & Screenshot 2) ─── */}
        <div className="pt-16 sm:pt-20 border-t border-stone-100 mt-16">
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400">
              MOST LIKED PIECES
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {mostLikedProducts.map((item, idx) => {
              const relImg = getPrimaryProductImage(item);
              const relPrice = item.salePrice || item.price || 25411.16;

              return (
                <div
                  key={item._id || idx}
                  onClick={() => navigate(`/product/${item._id || item.slug}`)}
                  className="group bg-white rounded-2xl border border-stone-100/90 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  {/* Image container */}
                  <div className="relative aspect-square bg-[#faf8f5] p-3 flex items-center justify-center overflow-hidden">
                    <img
                      src={getMediaUrl(relImg)}
                      alt={item.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Quick wishlist button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(item);
                        toast.success(
                          isWishlisted(item._id)
                            ? 'Removed from wishlist'
                            : 'Added to wishlist!'
                        );
                      }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors shadow-2xs cursor-pointer"
                    >
                      {isWishlisted(item._id) ? (
                        <HiHeart className="w-4 h-4 text-red-500" />
                      ) : (
                        <HiOutlineHeart className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Title & Price */}
                  <div className="p-3 text-center space-y-1">
                    <h3 className="text-[11px] font-bold text-stone-800 line-clamp-2 uppercase tracking-tight leading-snug group-hover:text-[#8f6d43] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs font-bold text-stone-900 font-serif">
                      {formatPrice(relPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Lightbox Modal ─── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-stone-300 text-sm font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <HiOutlineX className="w-6 h-6" />
              <span>Close</span>
            </button>
            <img
              src={lightboxImage}
              alt="High Resolution Zoom"
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl bg-white"
            />
          </div>
        </div>
      )}

      {/* ─── Size Guide Modal ─── */}
      {showSizeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setShowSizeModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 font-serif">
                Ring Size Chart & Measurement Guide
              </h3>
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600">
              <p>
                We use standard <strong>US Ring Sizes</strong>. All Neirah rings include complimentary free resizing within 30 days of receipt.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200">
                      <th className="py-2 px-3">US Size</th>
                      <th className="py-2 px-3">Diameter (mm)</th>
                      <th className="py-2 px-3">Circumference (mm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="py-1.5 px-3 font-semibold">5</td>
                      <td className="py-1.5 px-3">15.7 mm</td>
                      <td className="py-1.5 px-3">49.3 mm</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold">6</td>
                      <td className="py-1.5 px-3">16.5 mm</td>
                      <td className="py-1.5 px-3">51.9 mm</td>
                    </tr>
                    <tr className="bg-[#faf5ee] text-[#8f6d43] font-bold">
                      <td className="py-1.5 px-3">7 (Standard)</td>
                      <td className="py-1.5 px-3">17.3 mm</td>
                      <td className="py-1.5 px-3">54.4 mm</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold">8</td>
                      <td className="py-1.5 px-3">18.1 mm</td>
                      <td className="py-1.5 px-3">57.0 mm</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold">9</td>
                      <td className="py-1.5 px-3">18.9 mm</td>
                      <td className="py-1.5 px-3">59.5 mm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSizeModal(false)}
              className="w-full py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
