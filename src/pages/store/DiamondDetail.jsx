import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShare,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { diamondsAPI, couponsAPI, reviewsAPI } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { useLiveViewers } from '../../hooks/useLiveViewers';
import ProductCard from '../../components/product/ProductCard';
import { formatPriceWithDecimals as formatPrice } from '../../utils/currency';
import {
  ProductGallery,
  ProductOffersSection,
  ProductTrustBadges,
  ProductReviewsSection,
  ProductMobileBottomBar,
  ProductImageLightboxModal,
  ProductCertificateModal,
  ProductShareModal,
  ProductWriteReviewModal,
} from '../../components/product/detail';

const refName = (val) => (val && typeof val === 'object' ? val.name || '' : typeof val === 'string' ? val : '');

export default function DiamondDetail() {
  const { id, slug } = useParams();
  const identifier = slug || id;
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { settings: storeSettings } = useStoreSettings();

  const [diamond, setDiamond] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarDiamonds, setSimilarDiamonds] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);

  // Modals & Lightbox
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Accordions
  const [openAccordions, setOpenAccordions] = useState({
    desc: false,
    specs: true,
    price: false,
  });

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    name: '',
    email: '',
    title: '',
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch Coupons
  useEffect(() => {
    couponsAPI
      .getLookup()
      .then(({ data }) => {
        const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        setCoupons(list);
      })
      .catch(() => setCoupons([]));
  }, []);

  // Fetch Diamond Data
  useEffect(() => {
    if (!identifier) return;
    let active = true;
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    diamondsAPI
      .getById(identifier)
      .catch(() => diamondsAPI.getBySku(identifier))
      .then((res) => {
        if (!active) return;
        const d = res?.data?.data || res?.data || null;
        setDiamond(d);
        if (d?.title) {
          document.title = `${d.title} | Neirah Fine Jewellery`;
        }
      })
      .catch(() => {
        if (active) setDiamond(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [identifier]);

  // Fetch Similar Diamonds
  useEffect(() => {
    if (!diamond?._id) return;
    let active = true;
    const shapeId = diamond.shapeId?._id || diamond.shapeId;
    diamondsAPI
      .getAll({ limit: 9, ...(shapeId ? { shapeId } : {}) })
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : (res?.data?.data?.items || []);
        const filtered = list
          .filter((item) => String(item._id) !== String(diamond._id))
          .slice(0, 8)
          .map((d) => ({
            _id: d._id,
            id: d._id,
            itemType: 'diamond',
            productType: 'diamond',
            sku: d.sku || '',
            title: d.title || '',
            basicInfo: { title: d.title || '', slug: d.sku || String(d._id) },
            pricing: { salePrice: Number(d.price) || 0, mrp: Number(d.price) || 0 },
            image: d.image?.url || '',
            images: d.image?.url ? [d.image.url] : [],
            carat: d.carat,
            colorId: d.colorId,
            clarityId: d.clarityId,
            shapeId: d.shapeId,
            typeId: d.typeId,
          }));
        setSimilarDiamonds(filtered);
      })
      .catch(() => {
        if (active) setSimilarDiamonds([]);
      });
    return () => {
      active = false;
    };
  }, [diamond?._id, diamond?.shapeId]);

  // Reviews
  const fetchReviews = useCallback(async (targetId) => {
    if (!targetId) return;
    try {
      setReviewsLoading(true);
      const res = await reviewsAPI.getAll({ productId: targetId, status: 'approved' });
      const items = res.data?.data?.items || res.data?.data || [];
      setReviews(Array.isArray(items) ? items : []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (diamond?._id) {
      fetchReviews(diamond._id);
    }
  }, [diamond?._id, fetchReviews]);

  useEffect(() => {
    if (user) {
      setNewReview((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.title.trim() || !newReview.comment.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }
    try {
      setSubmittingReview(true);
      await reviewsAPI.create({
        customer: { name: newReview.name.trim(), email: newReview.email.trim() },
        review: {
          rating: Number(newReview.rating) || 5,
          title: newReview.title.trim(),
          comment: newReview.comment.trim(),
          reviewDate: new Date().toISOString(),
        },
        productId: diamond._id,
        status: 'approved',
      });
      toast.success('Thank you! Your review has been published.');
      setShowReviewModal(false);
      setNewReview({ rating: 5, name: user?.name || '', email: user?.email || '', title: '', comment: '' });
      fetchReviews(diamond._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const { count: liveViewersCount, hasUpdated: liveViewersUpdated } = useLiveViewers(diamond?._id || identifier);

  const diamondTypeName = refName(diamond?.typeId) || 'Certified Diamond';
  const diamondShapeName = refName(diamond?.shapeId);
  const diamondColorName = refName(diamond?.colorId);
  const diamondClarityName = refName(diamond?.clarityId);
  const caratWeight = Number(diamond?.carat || 0);
  const currentPrice = Number(diamond?.price || 0);
  const ratePerCarat = Number(diamond?.rate || 0) || (caratWeight > 0 && currentPrice > 0 ? Math.round(currentPrice / caratWeight) : 0);

  const galleryImages = useMemo(() => {
    const imgUrl = diamond?.image?.url || (typeof diamond?.image === 'string' ? diamond.image : '');
    return imgUrl ? [imgUrl] : [];
  }, [diamond?.image]);

  // Normalized product-like representation for shared modals & wishlist
  const diamondProductAdapter = useMemo(() => {
    if (!diamond) return null;
    return {
      _id: diamond._id,
      id: diamond._id,
      itemType: 'diamond',
      productType: 'diamond',
      sku: diamond.sku,
      title: diamond.title,
      name: diamond.title,
      price: currentPrice,
      image: galleryImages[0] || '',
      basicInfo: {
        title: diamond.title,
        slug: diamond.sku || String(diamond._id),
        sku: diamond.sku,
        description: diamond.description || '',
      },
      pricing: {
        salePrice: currentPrice,
        mrp: currentPrice,
      },
    };
  }, [diamond, currentPrice, galleryImages]);

  const certificateUrl =
    storeSettings?.certificateImage?.url ||
    'https://pub-82427c7fd20e4acaa4bdb3b933c0a3bf.r2.dev/certificates/certificate-1792672361210-d82f.png';

  const deliveryDateString = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }, []);

  const [localWished, setLocalWished] = useState(null);
  const isItemWishlisted =
    localWished !== null
      ? localWished
      : Boolean(diamond && (isWishlisted(diamond._id) || isWishlisted(diamond.sku)));

  const handleToggleWishlist = async () => {
    if (!diamondProductAdapter) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token && !user) {
      await toggleWishlist(diamondProductAdapter, isItemWishlisted);
      return;
    }
    const nextState = !isItemWishlisted;
    setLocalWished(nextState);
    try {
      const res = await toggleWishlist(diamondProductAdapter, isItemWishlisted);
      if (typeof res === 'boolean') setLocalWished(res);
    } catch {
      setLocalWished(!nextState);
    }
  };

  const handleAddToCart = () => {
    if (!diamond) return;
    if (!currentPrice || currentPrice <= 0) {
      toast.error('Diamond price is not configured');
      return;
    }
    setAddingToCart(true);

    try {
      const selectedAttributes = {
        diamondType: diamondTypeName,
        diamondShape: diamondShapeName,
        diamondColor: diamondColorName,
        diamondClarity: diamondClarityName,
        caratWeight: caratWeight || null,
      };
      const cleanAttrs = Object.fromEntries(
        Object.entries(selectedAttributes).filter(([, v]) => v !== null && v !== undefined && v !== '')
      );

      addToCart(
        {
          refId: diamond._id,
          id: diamond._id,
          itemType: 'diamond',
          productType: 'diamond',
          title: diamond.title,
          sku: diamond.sku || '',
          slug: diamond.sku || String(diamond._id),
          price: currentPrice,
          totalItemPrice: currentPrice,
          quantity: 1,
          image: galleryImages[0] || '',
          category: 'Diamond',
          selectedAttributes: cleanAttrs,
        },
        1,
        {
          itemType: 'diamond',
          selectedAttributes: cleanAttrs,
        }
      );
    } catch (err) {
      console.error('Failed to add diamond to cart:', err);
      toast.error('Failed to add diamond to bag. Please try again.');
    } finally {
      setTimeout(() => setAddingToCart(false), 400);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: diamond?.title || 'Neirah Certified Diamond',
          text: `Discover ${diamond?.title || 'this certified diamond'} on Neirah Fine Jewellery`,
          url: window.location.href,
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    setShareModalOpen(true);
  };

  if (loading) {
    return (
      <div className="bg-white min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-stone-200 border-t-[#8f6d43] rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest font-bold text-stone-400">
            Loading Diamond Details...
          </p>
        </div>
      </div>
    );
  }

  if (!diamond) {
    return (
      <div className="bg-white min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <IoDiamondOutline className="w-10 h-10 text-stone-300" />
        <p className="text-stone-600">Diamond details are unavailable.</p>
        <Link to="/shop?category=diamond" className="text-sm font-semibold text-[#8f6d43] hover:underline">
          Back to Diamonds
        </Link>
      </div>
    );
  }

  const spConfig = storeSettings?.socialProof || {};
  const showReviews = spConfig.showReviews !== false;
  const showSold = spConfig.showSoldCounter !== false;
  const soldHours = spConfig.soldTimeHours || 3;
  const soldCount = Number(diamond?.demoMetrics?.soldCount ?? spConfig.defaultSoldCount ?? 24);
  const displayReviewCount = reviews.length > 0 ? reviews.length : Number(diamond?.demoMetrics?.reviewCount ?? spConfig.defaultReviewCount ?? 13);

  const specsRows = [
    { label: 'SKU', value: diamond.sku },
    { label: 'Diamond Type', value: diamondTypeName },
    { label: 'Shape', value: diamondShapeName },
    { label: 'Carat Weight', value: caratWeight ? `${caratWeight} CT` : '' },
    { label: 'Color', value: diamondColorName },
    { label: 'Clarity', value: diamondClarityName },
    { label: 'Rate per Carat', value: ratePerCarat > 0 ? `${formatPrice(ratePerCarat)} / ct` : '' },
  ].filter((r) => Boolean(r.value));

  return (
    <div className="bg-white text-stone-900 min-h-screen pb-24 lg:pb-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-1.5 sm:py-2.5">
        {/* ─── Breadcrumb Navigation ─── */}
        <nav className="text-[10px] sm:text-[11px] text-stone-400 py-1.5 sm:py-2 flex items-center gap-1.5 overflow-hidden whitespace-nowrap border-b border-stone-100 mb-3 sm:mb-4">
          <Link to="/" className="hover:text-stone-800 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop?category=diamond" className="hover:text-stone-800 transition-colors">
            Diamond
          </Link>
          <span>/</span>
          <span className="text-stone-700 font-semibold truncate max-w-[200px] sm:max-w-md">
            {diamond.title}
          </span>
        </nav>

        {/* ─── Main 2-Column Layout matching ProductDetail ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-start">
          {/* Left: Studio Image Gallery */}
          <ProductGallery
            galleryImages={galleryImages}
            product={diamondProductAdapter}
            selectedColor=""
            openLightboxAtIndex={(idx) => setLightboxIndex(idx)}
          />

          {/* Right: Purchase & Specification Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title & SKU */}
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl text-gray-900 font-medium leading-tight tracking-[0.02em] font-poppins">
                {diamond.title}
              </h1>

              {diamond.sku && (
                <div className="pt-0.5 pb-1">
                  <span className="text-[11px] sm:text-xs text-stone-500 font-medium tracking-wide">
                    SKU: <span className="font-semibold text-stone-700 tracking-wider font-mono">{diamond.sku}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Social Proof & Urgency */}
            {(showReviews || showSold) && (soldCount > 0 || displayReviewCount > 0) && (
              <div className="space-y-1.5 sm:space-y-2 pt-0.5 pb-1 select-none">
                {showReviews && displayReviewCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('customer-reviews');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity text-left cursor-pointer"
                  >
                    <div className="flex items-center text-amber-400 text-xs sm:text-sm tracking-normal leading-none" aria-label="star rating">
                      ★★★★★
                    </div>
                    <span className="text-xs sm:text-sm text-stone-600 font-medium">
                      <strong className="font-semibold text-stone-900">{displayReviewCount}</strong> reviews
                    </span>
                  </button>
                )}

                {showSold && soldCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm leading-none" role="img" aria-label="fire">🔥</span>
                    <span className="text-xs sm:text-sm font-medium text-stone-700">
                      <strong className="font-semibold text-stone-900">{soldCount}</strong> sold in last {soldHours} hours
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Price Row with Wishlist & Share */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-baseline flex-wrap gap-1.5 sm:gap-2.5">
                  <span className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight font-sans">
                    {formatPrice(currentPrice)}
                  </span>
                </div>
                <span className="text-[10.5px] sm:text-xs text-stone-400 font-normal whitespace-nowrap">
                  (MRP Incl. of all taxes)
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="p-1.5 rounded-full hover:bg-rose-50/80 text-stone-400 hover:text-[#e11d48] transition-all cursor-pointer flex items-center justify-center active:scale-90"
                  aria-label={isItemWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isItemWishlisted ? (
                    <HiHeart className="w-5 h-5 sm:w-6 sm:h-6 text-[#e11d48] fill-current drop-shadow-xs" />
                  ) : (
                    <HiOutlineHeart className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                  aria-label="Share diamond"
                >
                  <HiOutlineShare className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Viewer Count */}
            {liveViewersCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-stone-600 select-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                <span className="text-[11.5px] font-medium text-stone-600 flex items-center gap-1">
                  <strong
                    className={`font-semibold text-stone-900 transition-all duration-300 inline-block ${
                      liveViewersUpdated ? 'text-[#8b6f4e] scale-110' : ''
                    }`}
                  >
                    {liveViewersCount} {liveViewersCount === 1 ? 'person is' : 'people are'}
                  </strong>{' '}
                  viewing this right now
                </span>
              </div>
            )}

            {/* Available Coupons */}
            <ProductOffersSection coupons={coupons} />

            {/* Diamond Type & 4Cs Specification Badges */}
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-stone-700">
                  Diamond Type: <span className="font-semibold text-stone-900">{diamondTypeName}</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="inline-block px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase bg-[#1f3a2b] text-white shadow-xs">
                    {diamondTypeName}
                  </span>
                </div>
              </div>

              {/* 4Cs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {diamondShapeName && (
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-[#FAF8F5] text-center">
                    <span className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Shape</span>
                    <span className="block text-xs font-bold text-stone-900 mt-0.5">{diamondShapeName}</span>
                  </div>
                )}
                {caratWeight > 0 && (
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-[#FAF8F5] text-center">
                    <span className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Carat</span>
                    <span className="block text-xs font-bold text-stone-900 mt-0.5">{caratWeight} CT</span>
                  </div>
                )}
                {diamondColorName && (
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-[#FAF8F5] text-center">
                    <span className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Color</span>
                    <span className="block text-xs font-bold text-stone-900 mt-0.5">{diamondColorName}</span>
                  </div>
                )}
                {diamondClarityName && (
                  <div className="p-2.5 rounded-lg border border-stone-200 bg-[#FAF8F5] text-center">
                    <span className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Clarity</span>
                    <span className="block text-xs font-bold text-stone-900 mt-0.5">{diamondClarityName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ADD TO CART Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="w-full py-4 bg-[#141414] hover:bg-black active:scale-[0.99] text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
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

            {/* Delivery Estimate */}
            <div className="text-center pt-1 text-xs text-stone-500">
              Order Now for estimated delivery by <strong className="text-stone-800 font-semibold">{deliveryDateString}</strong>
            </div>

            {/* THE NEIRAH DIFFERENCE */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 mb-6 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 pb-3.5 border-b border-stone-200 font-sans">
                THE NEIRAH DIFFERENCE
              </h3>
              <ProductTrustBadges
                isGold={true}
                certificateUrl={certificateUrl}
                onOpenCertificate={() => setShowCertificateModal(true)}
              />
            </div>

            {/* Accordions: Description, Diamond Specifications, Price Break Up */}
            <div className="border border-[#EFE8DD] divide-y divide-[#EFE8DD] rounded-none sm:rounded-sm overflow-hidden text-xs bg-white">
              {Boolean((diamond.description || '').trim()) && (
                <div>
                  <button
                    type="button"
                    onClick={() => setOpenAccordions((p) => ({ ...p, desc: !p.desc }))}
                    className="w-full flex items-center justify-between px-5 py-3.5 sm:py-4 text-left cursor-pointer transition-colors bg-[#FAF7F2] hover:bg-[#F5EFE6]"
                  >
                    <span className="text-xs sm:text-[13px] font-medium text-stone-900">
                      Diamond Description
                    </span>
                    <span className="text-stone-600 text-lg sm:text-xl font-light w-6 h-6 flex items-center justify-center">
                      {openAccordions.desc ? '−' : '+'}
                    </span>
                  </button>
                  {openAccordions.desc && (
                    <div className="px-5 pb-5 pt-3 bg-white border-t border-[#EFE8DD] text-stone-600 leading-relaxed whitespace-pre-line">
                      {diamond.description}
                    </div>
                  )}
                </div>
              )}

              {/* Diamond Specifications Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenAccordions((p) => ({ ...p, specs: !p.specs }))}
                  className="w-full flex items-center justify-between px-5 py-3.5 sm:py-4 text-left cursor-pointer transition-colors bg-[#FAF7F2] hover:bg-[#F5EFE6]"
                >
                  <span className="text-xs sm:text-[13px] font-medium text-stone-900">
                    Diamond Specifications
                  </span>
                  <span className="text-stone-600 text-lg sm:text-xl font-light w-6 h-6 flex items-center justify-center">
                    {openAccordions.specs ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.specs && (
                  <div className="px-5 pb-5 pt-3 bg-white border-t border-[#EFE8DD]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {specsRows.map((spec) => (
                        <div
                          key={spec.label}
                          className="flex items-center justify-between px-3.5 py-2.5 bg-[#FAF8F5] border border-stone-200/80 rounded text-xs"
                        >
                          <span className="font-medium text-stone-500">{spec.label}</span>
                          <span className="font-semibold text-stone-900 text-right">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Break Up Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenAccordions((p) => ({ ...p, price: !p.price }))}
                  className="w-full flex items-center justify-between px-5 py-3.5 sm:py-4 text-left cursor-pointer transition-colors bg-[#FAF7F2] hover:bg-[#F5EFE6]"
                >
                  <span className="text-[11.5px] sm:text-xs font-semibold tracking-wider uppercase text-stone-900">
                    PRICE BREAK UP
                  </span>
                  <span className="text-stone-600 text-lg sm:text-xl font-light w-6 h-6 flex items-center justify-center">
                    {openAccordions.price ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.price && (
                  <div className="px-5 pb-5 pt-3 bg-white border-t border-[#EFE8DD] text-xs space-y-2">
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-600">Carat Weight</span>
                      <span className="font-medium text-stone-900">{caratWeight} ct</span>
                    </div>
                    {ratePerCarat > 0 && (
                      <div className="flex justify-between py-1 border-b border-stone-100">
                        <span className="text-stone-600">Rate per Carat</span>
                        <span className="font-medium text-stone-900">{formatPrice(ratePerCarat)} / ct</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 font-bold text-stone-900 text-sm">
                      <span>Total Value</span>
                      <span>{formatPrice(currentPrice)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews */}
        <ProductReviewsSection
          reviewsLoading={reviewsLoading}
          sortedReviews={reviews}
        />

        {/* Similar Diamonds */}
        {similarDiamonds.length > 0 && (
          <section className="mt-14 pt-10 border-t border-stone-200/80">
            <h2 className="font-serif text-xl sm:text-2xl text-stone-900 text-center mb-8">
              Similar Diamonds
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 sm:gap-x-3.5 gap-y-3 sm:gap-y-6">
              {similarDiamonds.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox Modal */}
      <ProductImageLightboxModal
        isOpen={lightboxIndex !== null}
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
        galleryImages={galleryImages}
        selectedColor=""
        setSelectedColor={() => {}}
        modalColorsToRender={[]}
      />

      {/* Certificate Modal */}
      <ProductCertificateModal
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        certificateUrl={certificateUrl}
        product={diamondProductAdapter}
      />

      {/* Mobile Sticky Bottom Action Bar */}
      <ProductMobileBottomBar
        currentPrice={currentPrice}
        formatPrice={formatPrice}
        handleAddToCart={handleAddToCart}
        addingToCart={addingToCart}
        handleToggleWishlist={handleToggleWishlist}
        isItemWishlisted={isItemWishlisted}
      />

      {/* Share Modal */}
      <ProductShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        product={diamondProductAdapter}
        galleryImages={galleryImages}
        currentPrice={currentPrice}
        formatPrice={formatPrice}
      />

      {/* Write Review Modal */}
      <ProductWriteReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        newReview={newReview}
        setNewReview={setNewReview}
        onSubmit={handleReviewSubmit}
        submittingReview={submittingReview}
      />
    </div>
  );
}
