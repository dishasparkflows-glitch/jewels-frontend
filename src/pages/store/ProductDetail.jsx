import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShare,
  HiOutlineChevronDown,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineX,
  HiOutlineInformationCircle,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { productsAPI, sizesAPI } from '../../api/services';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { getValidProductImages, getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';

// Helper to normalize media URL
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

// 3D Sphere Swatch generator for metal colors
const getSphereStyle = (colorName = '', fallbackCode = '') => {
  const map = {
    'White Gold': {
      gradient: 'radial-gradient(circle at 35% 35%, #ffffff, #f1f5f9 40%, #cbd5e1 75%, #94a3b8 100%)',
      shadow: 'inset -2px -2px 4px rgba(100,116,139,0.3), inset 1px 1px 3px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.12)',
    },
    'Rose Gold': {
      gradient: 'radial-gradient(circle at 35% 35%, #fde2d6, #e7a192 45%, #cb7768 75%, #9a3412 100%)',
      shadow: 'inset -2px -2px 4px rgba(154,52,18,0.35), inset 1px 1px 2px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.12)',
    },
    'Yellow Gold': {
      gradient: 'radial-gradient(circle at 35% 35%, #fffbeb, #fed7aa 25%, #eab308 60%, #a16207 100%)',
      shadow: 'inset -2px -2px 4px rgba(161,98,7,0.4), inset 1px 1px 2px rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.12)',
    },
  };
  return map[colorName] || {
    gradient: fallbackCode ? `radial-gradient(circle at 35% 35%, #ffffff 0%, ${fallbackCode} 60%)` : '#d4af37',
    shadow: '0 2px 4px rgba(0,0,0,0.15)',
  };
};

const referenceName = (value) => (value && typeof value === 'object' ? value.name || '' : '');

const getProductCategory = (product) => {
  for (const field of ['category', 'categoryId', 'categoryIds']) {
    const value = product?.[field];
    if (Array.isArray(value) && value.length) return value[0];
    if (value && !Array.isArray(value)) return value;
  }
  return null;
};

const getReferenceId = (value) =>
  value && typeof value === 'object' ? value._id || value.id : value;

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Product state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostLikedProducts, setMostLikedProducts] = useState([]);
  const [sizes, setSizes] = useState([]);

  // Selections
  const [selectedPurity, setSelectedPurity] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedCarat, setSelectedCarat] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

  // Lightbox & Size modal
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showSizeModal, setShowSizeModal] = useState(false);

  // Accordion active sections (multiple can be open)
  const [openAccordions, setOpenAccordions] = useState({
    desc: true,
    specs: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Extract clean studio gallery images (prioritizing current selected metal color)
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (selectedColor && Array.isArray(product.colorImages)) {
      const match = product.colorImages.find((ci) => {
        const cName = ci.metalColorId?.name || ci.metalColor?.name || ci.colorName || '';
        return cName.toLowerCase() === selectedColor.toLowerCase();
      });
      if (match && Array.isArray(match.images) && match.images.length > 0) {
        const colorImgs = match.images
          .filter((img) => !isOrnateImage(img))
          .map((img) => (typeof img === 'string' ? img : img.url))
          .filter(Boolean);
        if (colorImgs.length > 0) return colorImgs;
      }
    }
    return getValidProductImages(product);
  }, [product, selectedColor]);

  // Safe category name string resolver
  const categoryName = useMemo(() => {
    if (!product) return '';
    const cat = getProductCategory(product);
    if (cat && typeof cat === 'object') {
      return cat.name || cat.title || '';
    }
    if (typeof cat === 'string' && cat.trim() && !/^[a-f\d]{24}$/i.test(cat.trim())) {
      return cat.trim();
    }
    return '';
  }, [product]);

  // Determine whether this product is Case 1 (Center Diamond Driven) or Case 2 (Side Diamond Driven)
  const isCenterDriven = useMemo(() => {
    if (!product) return false;
    const hasCenterRows = Array.isArray(product.centerDiamondRows) && product.centerDiamondRows.length > 0;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const hasCenterWeights = variants.some((v) => Number(v.centerDiamondWeight) > 0);
    return Boolean(hasCenterRows || hasCenterWeights);
  }, [product]);

  const isSideDriven = useMemo(() => {
    if (!product || isCenterDriven) return false;
    const hasSideRows = Array.isArray(product.sideDiamondRows) && product.sideDiamondRows.length > 0;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const hasSideWeights = variants.some((v) => Number(v.sideDiamondWeight) > 0);
    return Boolean(hasSideRows || hasSideWeights);
  }, [product, isCenterDriven]);

  // Extract dimensions available across variants
  const { purities, colors, carats, qualities } = useMemo(() => {
    const raw = Array.isArray(product?.variants) ? product.variants : [];
    const pSet = new Set();
    const cMap = new Map();
    const ctSet = new Set();
    const qSet = new Set();

    raw.forEach((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      if (p) pSet.add(p);

      const cObj = v.metalColor || v.metalColorId;
      const cName = referenceName(cObj) || v.color || '';
      if (cName && !cMap.has(cName)) {
        cMap.set(cName, {
          name: cName,
          code: cObj?.code || cObj?.hex || '',
        });
      }

      const ct = Number(v.centerDiamondWeight || v.caratWeight || 0);
      if (ct > 0) ctSet.add(ct);

      const col = referenceName(v.diamondColor || v.diamondColorId) || v.diamondColor || '';
      const cla = referenceName(v.diamondClarity || v.diamondClarityId) || v.diamondClarity || '';
      if (col || cla) {
        qSet.add([col, cla].filter(Boolean).join(' · '));
      }
    });

    if (Array.isArray(product?.metalColorIds)) {
      product.metalColorIds.forEach((c) => {
        if (c?.name && !cMap.has(c.name)) {
          cMap.set(c.name, { name: c.name, code: c.code || c.hex || '' });
        }
      });
    }

    return {
      purities: Array.from(pSet),
      colors: Array.from(cMap.values()),
      carats: Array.from(ctSet).sort((a, b) => a - b),
      qualities: Array.from(qSet),
    };
  }, [product]);

  // Auto-initialize options on product load
  useEffect(() => {
    if (!product) return;
    if (purities.length && !selectedPurity) {
      const defaultP = purities.find((p) => p.includes('14')) || purities[0];
      setSelectedPurity(defaultP);
    }
    if (colors.length && !selectedColor) {
      setSelectedColor(colors[0].name);
    }
    if (carats.length && !selectedCarat) {
      setSelectedCarat(carats[0]);
    }
    if (qualities.length && !selectedQuality) {
      setSelectedQuality(qualities[0]);
    }
  }, [product, purities, colors, carats, qualities, selectedPurity, selectedColor, selectedCarat, selectedQuality]);

  // Multi-dimensional variant resolution
  const selectedVariant = useMemo(() => {
    const raw = Array.isArray(product?.variants) ? product.variants : [];
    if (!raw.length) return null;

    // 1. Exact match across all active dimensions
    let match = raw.find((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      const c = referenceName(v.metalColor || v.metalColorId) || v.color || '';
      const ct = Number(v.centerDiamondWeight || v.caratWeight || 0);
      const col = referenceName(v.diamondColor || v.diamondColorId) || v.diamondColor || '';
      const cla = referenceName(v.diamondClarity || v.diamondClarityId) || v.diamondClarity || '';
      const q = [col, cla].filter(Boolean).join(' · ');

      const matchP = !selectedPurity || p === selectedPurity;
      const matchC = !selectedColor || c === selectedColor;
      const matchCt = !selectedCarat || ct === Number(selectedCarat);
      const matchQ = !selectedQuality || q === selectedQuality;

      return matchP && matchC && (isCenterDriven ? matchCt : true) && matchQ;
    });

    if (match) return match;

    // 2. Partial match: purity + color + (carat if center driven)
    match = raw.find((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      const c = referenceName(v.metalColor || v.metalColorId) || v.color || '';
      const ct = Number(v.centerDiamondWeight || v.caratWeight || 0);
      const matchP = !selectedPurity || p === selectedPurity;
      const matchC = !selectedColor || c === selectedColor;
      const matchCt = !selectedCarat || ct === Number(selectedCarat);
      return matchP && matchC && (isCenterDriven ? matchCt : true);
    });

    if (match) return match;

    // 3. Fallback: purity + color
    match = raw.find((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      const c = referenceName(v.metalColor || v.metalColorId) || v.color || '';
      return (!selectedPurity || p === selectedPurity) && (!selectedColor || c === selectedColor);
    });

    return match || raw[0] || null;
  }, [product, selectedPurity, selectedColor, selectedCarat, selectedQuality, isCenterDriven]);

  const currentPrice = [selectedVariant?.price, product?.pricing?.salePrice]
    .find((value) => Number(value) > 0);
  const mrpPrice = [product?.pricing?.mrp].find((value) => Number(value) > 0) ?? currentPrice;
  const discountPercent =
    Number(mrpPrice) > Number(currentPrice) ? Math.round(((mrpPrice - currentPrice) / mrpPrice) * 100) : 0;

  // 5-Pillar Price Breakdown
  const breakdown = useMemo(() => {
    if (!selectedVariant) return null;
    const v = selectedVariant;
    const metalWeight = Number(v.metalWeight || v.weight || product?.specifications?.metalWeight || 0);
    const metalRate = Number(v.metalRate || 0);
    const metalCost = Number(v.metalCost || (metalWeight * metalRate) || 0);
    const diamondCost = Number(v.diamondCost || (Number(v.centerDiamondCost || 0) + Number(v.sideDiamondCost || 0)) || 0);
    const labourCharge = Number(v.labourCharge || v.computedMakingCharge || 0);
    const gstAmount = Number(v.computedGst || 0);
    const finalPrice = Number(v.price || currentPrice || 0);

    return {
      metalWeight,
      metalRate,
      metalCost,
      centerCarat: Number(v.centerDiamondWeight || v.caratWeight || 0),
      centerRate: Number(v.centerDiamondRate || 0),
      centerCost: Number(v.centerDiamondCost || 0),
      sideCarat: Number(v.sideDiamondWeight || 0),
      sideCost: Number(v.sideDiamondCost || 0),
      diamondCost,
      labourCharge,
      gstAmount,
      finalPrice,
    };
  }, [selectedVariant, currentPrice, product]);

  const category = getProductCategory(product);
  const categoryId = getReferenceId(category);

  useEffect(() => {
    let active = true;
    setSizes([]);
    setSelectedSize('');
    if (!categoryId) {
      return () => { active = false; };
    }

    sizesAPI.getLookup({ categoryId })
      .then((response) => {
        const data = response.data?.data || response.data;
        if (active) setSizes(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setSizes([]);
      });

    return () => { active = false; };
  }, [categoryId]);

  // Fetch product data
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setProduct(null);
        setSelectedVariantId('');
        setActiveImageIndex(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const res = await productsAPI.getById(id);
        const prodData = res.data?.data || res.data;
        if (prodData) {
          setProduct(prodData);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
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
        } else setMostLikedProducts([]);
      } catch (err) {
        console.warn('Could not load related products:', err);
      }
    };

    fetchRelated();
  }, []);

  // Format INR Currency
  const formatPrice = (val) => {
    if (val === undefined || val === null || val === '') return '—';
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Add to cart handler
  const handleAddToCart = () => {
    if (!product) return;
    if (productVariants.length && !selectedVariant) {
      toast.error('Please choose a product option');
      return;
    }
    if (sizes.length && !selectedSize) {
      toast.error('Please choose a size');
      return;
    }
    if (!currentPrice || Number(currentPrice) <= 0) {
      toast.error('Product price is not configured');
      return;
    }
    setAddingToCart(true);

    const cartItem = {
      _id: product._id,
      title: product.basicInfo?.title,
      price: currentPrice,
      image: galleryImages[0] || getPrimaryProductImage(product),
      category: categoryName,
    };

    addToCart(cartItem, 1, {
      selectedMetal: selectedVariant?.label || '',
      selectedVariantId: selectedVariant?._id || '',
      size: selectedSize,
      selectedSize,
    });

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

  if (loading) {
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

  if (!product) {
    return (
      <div className="bg-white min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-stone-600">Product details are unavailable.</p>
        <Link to="/shop" className="text-sm font-semibold text-[#8f6d43] hover:underline">Back to shop</Link>
      </div>
    );
  }

  const specificationRows = [
    ['Metal', referenceName(selectedVariant?.metalPurity || selectedVariant?.metalPurityId) || product.specifications?.metalName],
    ['Diamond type', referenceName(selectedVariant?.diamondType || selectedVariant?.diamondTypeId)],
    ['Diamond color', referenceName(selectedVariant?.diamondColor || selectedVariant?.diamondColorId)],
    ['Diamond clarity', referenceName(selectedVariant?.diamondClarity || selectedVariant?.diamondClarityId)],
    ['Diamond shape', referenceName(selectedVariant?.diamondShape || selectedVariant?.diamondShapeId)],
    ['Metal weight', product.specifications?.metalWeight != null ? `${product.specifications.metalWeight} g` : ''],
    ['Size', selectedSize],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');

  return (
    <div className="bg-white text-stone-900 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-4">
        {/* ─── Breadcrumb Navigation ─── */}
        <nav className="text-[11px] text-stone-400 py-3 flex items-center gap-1.5 overflow-hidden whitespace-nowrap border-b border-stone-100 mb-6">
          <Link to="/" className="hover:text-stone-800 transition-colors">
            Home
          </Link>
          {categoryName && <><span>/</span><Link to={`/shop?category=${encodeURIComponent(categoryName.toLowerCase())}`} className="hover:text-stone-800 transition-colors">{categoryName}</Link></>}
          <span>/</span>
          <span className="text-stone-700 font-semibold truncate max-w-sm sm:max-w-md">
            {product.basicInfo?.title}
          </span>
        </nav>

        {/* ─── Main Product Section: 2-Column Gallery Grid & Purchase Sidebar ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Product gallery */}
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
            <div className="group relative aspect-square overflow-hidden bg-[#f8f7f5] sm:rounded-sm">
              {galleryImages.length > 0 ? (
                <>
                  <button type="button" onClick={() => setLightboxImage(getMediaUrl(galleryImages[activeImageIndex]))} className="h-full w-full cursor-zoom-in p-5 sm:p-8" aria-label="Zoom product image">
                    <img src={getMediaUrl(galleryImages[activeImageIndex])} alt={`${product.basicInfo?.title || ''} view ${activeImageIndex + 1}`} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]" />
                  </button>
                  {galleryImages.length > 1 && <>
                    <button type="button" onClick={() => setActiveImageIndex((index) => (index - 1 + galleryImages.length) % galleryImages.length)} aria-label="Previous product image" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm transition hover:bg-white"><HiOutlineChevronLeft className="h-5 w-5" /></button>
                    <button type="button" onClick={() => setActiveImageIndex((index) => (index + 1) % galleryImages.length)} aria-label="Next product image" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm transition hover:bg-white"><HiOutlineChevronRight className="h-5 w-5" /></button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2" aria-label="Product image position">
                      {galleryImages.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setActiveImageIndex(index)} aria-label={`Show image ${index + 1}`} aria-current={index === activeImageIndex} className={`h-1.5 rounded-full transition-all ${index === activeImageIndex ? 'w-6 bg-stone-900' : 'w-1.5 bg-stone-400/60'}`} />)}
                    </div>
                  </>}
                </>
              ) : <div className="flex h-full items-center justify-center text-sm text-stone-400">Image coming soon</div>}
            </div>
            {galleryImages.length > 1 && <div className="flex gap-3 overflow-x-auto pb-1">
              {galleryImages.slice(0, 8).map((image, index) => <button key={`${image}-thumb-${index}`} type="button" onClick={() => setActiveImageIndex(index)} aria-label={`View product image ${index + 1}`} aria-pressed={index === activeImageIndex} className={`h-20 w-20 shrink-0 overflow-hidden border bg-white p-1 transition sm:h-24 sm:w-24 ${index === activeImageIndex ? 'border-[#8f6d43]' : 'border-stone-200 hover:border-stone-400'}`}><img src={getMediaUrl(image)} alt="" className="h-full w-full object-contain" loading="lazy" /></button>)}
            </div>}
          </div>

          {/* ─── Right Side: Configuration & Purchase Sidebar (Sticky) ─── */}
          <div className="lg:col-span-5 space-y-5">
            {/* Title & Brand */}
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-normal text-stone-900 leading-snug tracking-tight font-serif">
                {product.basicInfo?.title}
              </h1>
            </div>

            {/* Price Row with Wishlist & Share */}
            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-medium text-stone-900 font-serif">
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

            {/* Dynamic Gold Weight & Transparent Pricing Trigger */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {breakdown?.metalWeight > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-stone-600">
                  <span className="text-stone-400 font-medium">Approx. Gold Weight:</span>
                  <strong className="font-mono text-stone-900 font-semibold">{breakdown.metalWeight} g</strong>
                  {selectedPurity && <span className="text-stone-400">({selectedPurity})</span>}
                </div>
              ) : <div />}

              {breakdown && breakdown.metalCost > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPriceBreakdown(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold text-[#8f6d43] bg-[#faf6f0] border border-[#e8d8c0] hover:bg-[#f4ebe0] active:scale-95 transition-all cursor-pointer shadow-2xs"
                  title="View transparent 5-pillar price calculation"
                >
                  <HiOutlineInformationCircle className="w-3.5 h-3.5" />
                  <span>Price Breakdown</span>
                </button>
              )}
            </div>

            {/* ─── 1. Metal Purity Selector ─── */}
            {purities.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                  Metal Purity
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {purities.map((p) => {
                    const isSel = selectedPurity === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelectedPurity(p)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                          isSel
                            ? 'bg-stone-900 text-white shadow-xs'
                            : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── 2. Metal Color Selector with 3D Spheres ─── */}
            {colors.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                    Metal Color: <span className="font-semibold text-stone-900 normal-case">{selectedColor}</span>
                  </label>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {colors.map((c) => {
                    const isSel = selectedColor === c.name;
                    const sphere = getSphereStyle(c.name, c.code);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          setSelectedColor(c.name);
                          setActiveImageIndex(0);
                        }}
                        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          isSel
                            ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900 shadow-xs'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shadow-2xs border border-black/10 shrink-0"
                          style={{ background: sphere.gradient, boxShadow: sphere.shadow }}
                        />
                        <span className="text-stone-800 text-[11px] font-medium">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── 3. Case 1: Solitaire Center Diamond Carat Weight ─── */}
            {isCenterDriven && carats.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                  Center Diamond Carat Weight
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {carats.map((ct) => {
                    const isSel = Number(selectedCarat) === Number(ct);
                    return (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => setSelectedCarat(ct)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                          isSel
                            ? 'bg-stone-900 text-white shadow-xs'
                            : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        {ct} ct
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── 4. Diamond Quality Selection ─── */}
            {qualities.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                    {isCenterDriven ? 'Diamond Quality (Color · Clarity)' : 'Diamond Quality Tier'}
                  </label>
                  {isSideDriven && product?.sideDiamondRows?.[0] && (
                    <span className="text-[10px] text-stone-400">
                      {product.sideDiamondRows[0].pieces ? `${product.sideDiamondRows[0].pieces} Stones` : ''}
                      {product.sideDiamondRows[0].caratWeight ? ` · ${product.sideDiamondRows[0].caratWeight} ct` : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {qualities.map((q) => {
                    const isSel = selectedQuality === q;
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setSelectedQuality(q)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSel
                            ? 'bg-stone-900 text-white shadow-xs'
                            : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="product-size" className="block text-[11px] font-bold text-stone-700">Size</label>
                  <button
                    type="button"
                    onClick={() => setShowSizeModal(true)}
                    className="text-[10px] font-bold text-[#8f6d43] hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    Size chart
                  </button>
                </div>
                <div className="relative">
                  <select
                    id="product-size"
                    value={selectedSize}
                    onChange={(event) => setSelectedSize(event.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-800 appearance-none focus:outline-none focus:border-[#8f6d43] cursor-pointer"
                  >
                    <option value="">Choose a size</option>
                    {sizes.map((size) => (
                      <option key={size._id} value={size.name}>{size.name}</option>
                    ))}
                  </select>
                  <HiOutlineChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
            )}

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
                    <p>{product.basicInfo?.description}</p>
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
                    {specificationRows.map(([label, value]) => (
                      <div key={label} className="flex justify-between py-1">
                        <span className="text-stone-400">{label}</span>
                        <span className="font-semibold text-stone-800">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── MOST LIKED PIECES (Screenshot 1 & Screenshot 2) ─── */}
        {mostLikedProducts.length > 0 && <div className="pt-16 sm:pt-20 border-t border-stone-100 mt-16">
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400">
              MOST LIKED PIECES
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {mostLikedProducts.filter((item) => getPrimaryProductImage(item)).map((item) => {
              const relImg = getPrimaryProductImage(item);
              const relPrice = item.pricing?.salePrice ?? item.pricing?.mrp;

              return (
                <div
                  key={item._id || item.basicInfo?.slug}
                  onClick={() => navigate(`/product/${item._id || item.basicInfo?.slug}`)}
                  className="group bg-white rounded-2xl border border-stone-100/90 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  {/* Image container */}
                  <div className="relative aspect-square bg-[#faf8f5] p-3 flex items-center justify-center overflow-hidden">
                    <img
                      src={getMediaUrl(relImg)}
                      alt={item.basicInfo?.title || ''}
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
                      {item.basicInfo?.title}
                    </h3>
                    <p className="text-xs font-bold text-stone-900 font-serif">
                      {formatPrice(relPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>}
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
                {categoryName ? `${categoryName} size guide` : 'Size guide'}
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
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200">
                      <th className="py-2 px-3">Available sizes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {sizes.map((size) => (
                      <tr key={size._id}>
                        <td className="py-1.5 px-3 font-semibold">{size.name}</td>
                      </tr>
                    ))}
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
      {/* ─── 5-Pillar Transparent Price Breakdown Modal ─── */}
      {showPriceBreakdown && breakdown && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowPriceBreakdown(false)}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 p-6 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#faf6f0] border border-[#e8d8c0] flex items-center justify-center text-[#8f6d43]">
                  <IoDiamondOutline className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Transparent Price Breakdown</h3>
                  <p className="text-[10px] text-stone-400">5-Pillar Commodity Valuation Model</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPriceBreakdown(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* 5-Pillar Item List */}
            <div className="space-y-3 text-xs divide-y divide-stone-100">
              {/* 1. Metal */}
              <div className="pt-2 flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-stone-800">1. Metal Cost ({selectedPurity || 'Gold'})</p>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                    {breakdown.metalWeight} g @ {breakdown.metalRate ? `₹${Number(breakdown.metalRate).toLocaleString('en-IN')}` : 'Market rate'} / g
                  </p>
                </div>
                <span className="font-mono font-bold text-stone-900 shrink-0 text-sm">
                  {formatPrice(breakdown.metalCost)}
                </span>
              </div>

              {/* 2. Diamond */}
              <div className="pt-2 flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-stone-800">2. Diamond Value</p>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                    {selectedQuality || 'Fine Certified Diamonds'}
                    {breakdown.centerCarat > 0 ? ` (${breakdown.centerCarat} ct Center Stone)` : ''}
                    {breakdown.sideCarat > 0 ? ` (${breakdown.sideCarat} ct Pavé Setting)` : ''}
                  </p>
                </div>
                <span className="font-mono font-bold text-stone-900 shrink-0 text-sm">
                  {formatPrice(breakdown.diamondCost)}
                </span>
              </div>

              {/* 3. Labour */}
              <div className="pt-2 flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-stone-800">3. Making Charges</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Artisan casting, micro-pavé setting & mirror polish</p>
                </div>
                <span className="font-mono font-bold text-stone-900 shrink-0 text-sm">
                  {formatPrice(breakdown.labourCharge)}
                </span>
              </div>

              {/* 4. GST */}
              <div className="pt-2 flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-stone-800">4. Applicable GST (3%)</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Statutory government tax on fine jewelry</p>
                </div>
                <span className="font-mono font-bold text-stone-900 shrink-0 text-sm">
                  {formatPrice(breakdown.gstAmount)}
                </span>
              </div>
            </div>

            {/* Total Price Bar */}
            <div className="p-3.5 rounded-2xl bg-[#faf6f0] border border-[#e8d8c0] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Final Selling Price</p>
                <p className="text-[10px] text-stone-400">All inclusive of taxes & certification</p>
              </div>
              <span className="font-mono font-extrabold text-base text-[#8f6d43]">
                {formatPrice(breakdown.finalPrice)}
              </span>
            </div>

            <p className="text-[9.5px] text-stone-400 text-center italic">
              Prices update dynamically with live bullion commodity market rates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
