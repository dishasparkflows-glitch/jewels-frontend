import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShare,
  HiOutlineChevronDown,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineRefresh,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { productsAPI, sizesAPI } from '../../api/services';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { getValidProductImages, getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';
import { trackProductView } from '../../config/firebase';



const referenceName = (value) => (value && typeof value === 'object' ? value.name || '' : (typeof value === 'string' ? value : ''));

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
  const [addingToCart, setAddingToCart] = useState(false);

  // Lightbox & Size modal
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showSizeModal, setShowSizeModal] = useState(false);

  // Accordion active sections (multiple can be open simultaneously)
  const [openAccordions, setOpenAccordions] = useState({
    desc: true,
    specs: false,
    price: true, // Opened by default to showcase the requested price breakdown table
    origin: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Determine whether this product is Case 1 (Center Diamond Driven) or Case 2 (Side Diamond Driven)
  const isCenterDriven = useMemo(() => {
    if (!product) return false;
    const hasCenterRows = Array.isArray(product.centerDiamondRows) && product.centerDiamondRows.length > 0;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const hasCenterWeights = variants.some((v) => Number(v.centerDiamondWeight) > 0);
    return Boolean(hasCenterRows || hasCenterWeights);
  }, [product]);

  // Extract dimensions available across variants
  const { purities, colors, carats, qualities, diamondType } = useMemo(() => {
    const raw = Array.isArray(product?.variants) ? product.variants : [];
    const pSet = new Set();
    const cMap = new Map();
    const ctSet = new Set();
    const qSet = new Set();
    let dType = 'Lab Grown Diamond';

    raw.forEach((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      if (p) pSet.add(p);

      const cObj = v.metalColor || v.metalColorId;
      const cName = referenceName(cObj) || v.color || '';
      if (cName) {
        const existing = cMap.get(cName) || {};
        cMap.set(cName, {
          name: cName,
          code: cObj?.code || existing.code || '',
          colorCode: cObj?.colorCode || existing.colorCode || '',
          colorCodeEnd: cObj?.colorCodeEnd || existing.colorCodeEnd || '',
        });
      }

      const ct = Number(v.centerDiamondWeight || v.caratWeight || 0);
      if (ct > 0) ctSet.add(ct);

      const col = referenceName(v.diamondColor || v.diamondColorId) || v.diamondColor || '';
      const cla = referenceName(v.diamondClarity || v.diamondClarityId) || v.diamondClarity || '';
      if (col || cla) {
        qSet.add([col, cla].filter(Boolean).join(' · '));
      }

      const dt = referenceName(v.diamondType || v.diamondTypeId);
      if (dt) dType = dt;
    });

    if (Array.isArray(product?.metalPurityIds)) {
      product.metalPurityIds.forEach((p) => {
        const name = typeof p === 'object' ? p.name : p;
        if (name) pSet.add(name);
      });
    }

    if (Array.isArray(product?.metalColorIds)) {
      product.metalColorIds.forEach((c) => {
        if (!c) return;
        const name = typeof c === 'object' ? c.name : c;
        if (name) {
          const existing = cMap.get(name) || {};
          cMap.set(name, {
            name,
            code: c.code || existing.code || '',
            colorCode: c.colorCode || existing.colorCode || '',
            colorCodeEnd: c.colorCodeEnd || existing.colorCodeEnd || '',
          });
        }
      });
    }

    if (Array.isArray(product?.colorImages)) {
      product.colorImages.forEach((ci) => {
        const cObj = ci.metalColorId || ci.metalColor;
        const cName = referenceName(cObj) || ci.colorName || ci.name || '';
        if (cName) {
          const existing = cMap.get(cName) || {};
          cMap.set(cName, {
            name: cName,
            code: cObj?.code || existing.code || '',
            colorCode: cObj?.colorCode || existing.colorCode || '',
            colorCodeEnd: cObj?.colorCodeEnd || existing.colorCodeEnd || '',
          });
        }
      });
    }

    // Default fallback to 3 core luxury colors if none configured
    if (cMap.size === 0) {
      cMap.set('Rose Gold', { name: 'Rose Gold', code: '' });
      cMap.set('Yellow Gold', { name: 'Yellow Gold', code: '' });
      cMap.set('White Gold', { name: 'White Gold', code: '' });
    }

    return {
      purities: Array.from(pSet),
      colors: Array.from(cMap.values()),
      carats: Array.from(ctSet).sort((a, b) => a - b),
      qualities: Array.from(qSet),
      diamondType: dType,
    };
  }, [product]);

  // Auto-initialize options on product load
  useEffect(() => {
    if (!product) return;
    if (purities.length && !selectedPurity) {
      const defaultP = purities.find((p) => p.includes('9K') || p.includes('9KT')) ||
                       purities.find((p) => p.includes('14')) ||
                       purities[0];
      setSelectedPurity(defaultP);
    }
    if (colors.length && !selectedColor) {
      // Default to Yellow Gold if available to match Neirah default, or Rose Gold
      const defaultC = colors.find((c) => c.name.toLowerCase().includes('yellow')) ||
                       colors.find((c) => c.name.toLowerCase().includes('rose')) ||
                       colors[0];
      setSelectedColor(defaultC.name);
    }
    if (carats.length && !selectedCarat) {
      setSelectedCarat(carats[0]);
    }
    if (qualities.length && !selectedQuality) {
      // Default to F-G VS or first quality
      const defaultQ = qualities.find((q) => q.includes('F-G') && q.includes('VS')) || qualities[0];
      setSelectedQuality(defaultQ);
    }
  }, [product, purities, colors, carats, qualities, selectedPurity, selectedColor, selectedCarat, selectedQuality]);

  // Swatches for the combined Metal (Purity + Color) selector matching Neirah standard
  // Swatches for the combined Metal (Purity + Color) selector
  const metalSwatches = useMemo(() => {
    const isSilverProduct = product?.productType === 'silver';
    if (isSilverProduct) {
      const silverPurity = purities.find((p) =>
        p.toLowerCase().includes('silver') || p.toLowerCase().includes('925')
      ) || '925 Silver';

      return [{
        id: 'SS-Silver',
        label: 'SS',
        purity: silverPurity,
        color: 'Silver',
        type: 'silver',
      }];
    }

    // Standard gold color palette order: White Gold, Rose Gold, Yellow Gold
    const colorOrder = ['White Gold', 'Rose Gold', 'Yellow Gold'];

    // Map existing colors in product if available
    const availableColorNames = colors.map((c) => c.name);
    const activeColors = colorOrder.filter((co) =>
      availableColorNames.length === 0 || availableColorNames.some((ac) => ac.toLowerCase() === co.toLowerCase())
    );
    if (!activeColors.length) {
      activeColors.push('White Gold', 'Rose Gold', 'Yellow Gold');
    }

    // Standard purities order: 9K, 10K, 14K, 18K
    const purityOrder = [
      { key: '9K', full: '9KT Gold', aliases: ['9KT Gold', '9KT', '9K'] },
      { key: '10K', full: '10KT Gold', aliases: ['10KT Gold', '10KT', '10K'] },
      { key: '14K', full: '14KT Gold', aliases: ['14KT Gold', '14KT', '14K'] },
      { key: '18K', full: '18KT Gold', aliases: ['18KT Gold', '18KT', '18K'] },
    ];

    // Filter to purities actually configured in this product
    const activePurityDefs = purityOrder.filter((pDef) =>
      purities.length === 0 || purities.some((p) => pDef.aliases.some((a) => p.toLowerCase().includes(a.toLowerCase())))
    );
    const listToRender = activePurityDefs.length > 0 ? activePurityDefs : purityOrder;

    const swatches = [];

    listToRender.forEach((pDef) => {
      const matchedPurity = purities.find((p) =>
        pDef.aliases.some((a) => p.toLowerCase().includes(a.toLowerCase()))
      ) || pDef.full;

      activeColors.forEach((colorName) => {
        const cObj = colors.find((c) => c.name?.toLowerCase() === colorName.toLowerCase());
        swatches.push({
          id: `${pDef.key}-${colorName}`,
          label: pDef.key,
          purity: matchedPurity,
          color: colorName,
          colorCode: cObj?.colorCode || '',
          colorCodeEnd: cObj?.colorCodeEnd || '',
          type: 'gold',
        });
      });
    });

    // Only include silver if the product actually has silver purity configured (no static silver)
    const actualSilverPurity = purities.find((p) =>
      p.toLowerCase().includes('silver') || p.toLowerCase().includes('925')
    );
    if (actualSilverPurity) {
      swatches.push({
        id: 'SS-Silver',
        label: 'SS',
        purity: actualSilverPurity,
        color: 'Silver',
        type: 'silver',
      });
    }

    return swatches;
  }, [product, purities, colors]);

  const isSwatchSelected = useCallback((swatch) => {
    const curPurity = (selectedPurity || '').toLowerCase();
    const curColor = (selectedColor || '').toLowerCase();

    const matchP = curPurity.includes(swatch.label.toLowerCase()) ||
                   (swatch.purity && curPurity.includes(swatch.purity.toLowerCase()));
    const matchC = curColor === swatch.color.toLowerCase();

    return Boolean(matchP && matchC);
  }, [selectedPurity, selectedColor]);

  const handleSelectMetalSwatch = useCallback((swatch) => {
    setSelectedPurity(swatch.purity);
    setSelectedColor(swatch.color);
  }, []);

  // Active metal display title (e.g. "9KT Yellow Gold")
  const metalDisplayName = useMemo(() => {
    const pStr = (selectedPurity || '').replace(/ Gold/i, '').trim();
    const cStr = (selectedColor || '').trim();

    if (pStr && cStr) {
      return `${pStr} ${cStr}`;
    }
    return pStr || cStr || product?.specifications?.metalName || 'Gold';
  }, [selectedPurity, selectedColor, product]);

  // Extract clean studio gallery images for the current selected metal color
  const galleryImages = useMemo(() => {
    if (!product) return [];

    if (selectedColor && Array.isArray(product.colorImages)) {
      const match = product.colorImages.find((ci) => {
        const cName = ci.metalColorId?.name || ci.metalColor?.name || ci.colorName || ci.name || '';
        if (cName && cName.toLowerCase() === selectedColor.toLowerCase()) return true;
        const matchedFromList = colors.find(
          (c) => String(c.id || c._id) === String(ci.metalColorId?._id || ci.metalColorId)
        );
        return Boolean(matchedFromList && matchedFromList.name?.toLowerCase() === selectedColor.toLowerCase());
      });

      if (match && Array.isArray(match.images) && match.images.length > 0) {
        const colorImgs = match.images
          .filter((img) => !isOrnateImage(img))
          .map((img) => (typeof img === 'string' ? img : img.url))
          .filter(Boolean);
        if (colorImgs.length > 0) return colorImgs;
      }
    }

    const fallback = getValidProductImages(product);
    return fallback.length > 0 ? fallback : [];
  }, [product, selectedColor, colors]);

  // Category from final schema (categoryIds[0])
  const category = product?.categoryIds?.[0] || null;
  const categoryId = category?._id || '';
  const categoryName = category?.name || '';

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
      // Allow matching if variant has no explicit metalColorId (purity rates apply across colors)
      const matchC = !selectedColor || !c || c.toLowerCase() === selectedColor.toLowerCase();
      const matchCt = !selectedCarat || ct === Number(selectedCarat);
      const matchQ = !selectedQuality || q === selectedQuality;

      return matchP && matchC && (isCenterDriven ? matchCt : true) && matchQ;
    });

    if (match) return match;

    // 2. Partial match: purity + carat + quality
    match = raw.find((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      const ct = Number(v.centerDiamondWeight || v.caratWeight || 0);
      const col = referenceName(v.diamondColor || v.diamondColorId) || v.diamondColor || '';
      const cla = referenceName(v.diamondClarity || v.diamondClarityId) || v.diamondClarity || '';
      const q = [col, cla].filter(Boolean).join(' · ');

      const matchP = !selectedPurity || p === selectedPurity;
      const matchCt = !selectedCarat || ct === Number(selectedCarat);
      const matchQ = !selectedQuality || q === selectedQuality;

      return matchP && (isCenterDriven ? matchCt : true) && matchQ;
    });

    if (match) return match;

    // 3. Fallback: purity only
    match = raw.find((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      return !selectedPurity || p === selectedPurity;
    });

    return match || raw[0] || null;
  }, [product, selectedPurity, selectedColor, selectedCarat, selectedQuality, isCenterDriven]);

  const currentPrice = [selectedVariant?.price, product?.pricing?.salePrice]
    .find((value) => Number(value) > 0);
  const mrpPrice = [product?.pricing?.mrp].find((value) => Number(value) > 0) ?? currentPrice;
  const discountPercent =
    Number(mrpPrice) > Number(currentPrice) ? Math.round(((mrpPrice - currentPrice) / mrpPrice) * 100) : 0;

  // Itemized Transparent Price Breakdown (Matches Screenshot 4)
  const breakdown = useMemo(() => {
    if (!selectedVariant) return null;
    const v = selectedVariant;
    const metalWeight = Number(v.metalWeight || v.weight || product?.specifications?.metalWeight || 0);
    const metalRate = Number(v.metalRate || 0);
    const metalCost = Number(v.metalCost || (metalWeight * metalRate) || 0);

    const centerCarat = Number(v.centerDiamondWeight || v.caratWeight || selectedCarat || 0);
    const centerRate = Number(v.centerDiamondRate || 0);
    const centerCost = Number(v.centerDiamondCost || (centerRate * centerCarat) || 0);

    const sideCarat = Number(v.sideDiamondWeight || 0);
    const sideCost = Number(v.sideDiamondCost || 0);
    const diamondCost = Number(v.diamondCost || (centerCost + sideCost) || 0);

    const labourCharge = Number(v.labourCharge || v.computedMakingCharge || 0);
    const certificateCharge = Number(v.certificateCharge || product?.pricing?.certificateCharge || 0);
    const subtotal = Number(v.subtotal || (metalCost + diamondCost + labourCharge + certificateCharge) || 0);
    const gstAmount = Number(v.computedGst || (subtotal * 0.03) || 0);
    const finalPrice = Number(v.price || (subtotal + gstAmount) || currentPrice || 0);

    return {
      metalWeight,
      metalRate,
      metalCost,
      centerCarat,
      centerRate,
      centerCost,
      sideCarat,
      sideCost,
      diamondCost,
      labourCharge,
      certificateCharge,
      subtotal,
      gstAmount,
      finalPrice,
    };
  }, [selectedVariant, selectedCarat, currentPrice, product]);



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
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const res = await productsAPI.getById(id);
        const prodData = res.data?.data || res.data;
        if (prodData) {
          setProduct(prodData);
          trackProductView(prodData);
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

  // Format delivery date (7 days out)
  const deliveryDateString = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }, []);

  // Add to cart handler
  const handleAddToCart = () => {
    if (!product) return;
    if (product.variants?.length && !selectedVariant) {
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
      selectedMetal: `${selectedPurity} ${selectedColor}`.trim(),
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
    ['Metal', metalDisplayName || product.specifications?.metalName || 'Gold'],
    ['Diamond Type', diamondType],
    ['Diamond Color · Clarity', selectedQuality || '—'],
    ['Center Diamond Weight', selectedCarat ? `${selectedCarat} ct` : (breakdown?.centerCarat ? `${breakdown.centerCarat} ct` : '—')],
    ['Gross Weight', breakdown?.metalWeight ? `${breakdown.metalWeight} g` : (product.specifications?.metalWeight ? `${product.specifications.metalWeight} g` : '—')],
    ['Net Weight', breakdown?.metalWeight ? `${breakdown.metalWeight} g` : '—'],
    ['Size', selectedSize || 'Standard'],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');

  return (
    <div className="bg-white text-stone-900 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-4">
        {/* ─── Breadcrumb Navigation ─── */}
        <nav className="text-[11px] text-stone-400 py-3 flex items-center gap-1.5 overflow-hidden whitespace-nowrap border-b border-stone-100 mb-6">
          <Link to="/" className="hover:text-stone-800 transition-colors">
            Home
          </Link>
          {categoryName && (
            <>
              <span>/</span>
              <Link
                to={`/shop?category=${encodeURIComponent(categoryId || categoryName.toLowerCase())}`}
                className="hover:text-stone-800 transition-colors"
              >
                {categoryName}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-stone-700 font-semibold truncate max-w-sm sm:max-w-md">
            {product.basicInfo?.title}
          </span>
        </nav>

        {/* ─── Main Product Section: 2-Column Gallery Grid & Purchase Sidebar ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* ══════════════════════════════════════════════════════════
              LEFT: 2-Column Product Studio Image Grid (Matches Screenshot 2)
          ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7">
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 sticky top-24">
                {galleryImages.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    onClick={() => setLightboxImage(image)}
                    className="group relative aspect-square bg-[#fbf9f6] rounded-sm overflow-hidden border border-stone-100 flex items-center justify-center p-4 sm:p-6 cursor-zoom-in hover:shadow-xs transition-all"
                  >
                    <img
                      src={image}
                      alt={`${product.basicInfo?.title || 'Fine Jewelry'} ${selectedColor} view ${index + 1}`}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      loading={index < 2 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
                      Click to zoom
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-square bg-[#fbf9f6] rounded-sm border border-stone-100 flex items-center justify-center text-sm text-stone-400">
                Image coming soon
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT: Product Info, Multi-Variant Selectors & Accordions
          ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title & Brand */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-normal text-stone-900 leading-snug tracking-tight font-serif">
                {product.basicInfo?.title}
              </h1>
            </div>

            {/* Price Row with Wishlist & Share */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="space-y-0.5">
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
                <p className="text-[10.5px] text-stone-400 italic">
                  (MRP Incl. of all taxes)
                </p>
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

            {/* People Viewing Banner (Matches Screenshot 2) */}
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[11.5px] font-medium text-stone-600">
                <strong className="text-stone-900 font-semibold">40 people</strong> are viewing this right now
              </span>
            </div>

            {/* Available Offers Box (Matches Screenshot 2) */}
            <div className="p-3 rounded-xl bg-[#faf8f5] border border-[#eee4d6] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b6f4e]">
                  AVAILABLE OFFERS
                </span>
                <span className="text-[11px] font-bold text-stone-800">✦</span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="px-2 py-0.5 rounded bg-white border border-[#d6cfc2] text-[11px] font-bold tracking-wider font-mono text-stone-900">
                  FIRSTORDER
                </span>
                <span className="text-xs text-stone-600 font-medium">10% Off</span>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                VARIANT SELECTORS (Matches Screenshot 2)
            ═══════════════════════════════════════════════════════════ */}
            <div className="space-y-4 pt-1">
              {/* 1. Diamond Type Selector */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-stone-700">
                  Diamond Type: <span className="font-semibold text-stone-900">{diamondType}</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase bg-[#1f3a2b] text-white shadow-xs cursor-default"
                  >
                    {diamondType}
                  </button>
                </div>
              </div>

              {/* 2. Diamond Quality Selector (Grid Format matching Screenshot 2) */}
              {qualities.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-stone-700">
                    Diamond Quality: <span className="font-semibold text-stone-900">{selectedQuality.replace(' · ', ' ')}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {qualities.map((q) => {
                      const isSel = selectedQuality === q;
                      const label = q.replace(' · ', ' ');
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setSelectedQuality(q)}
                          className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#1f3a2b] text-white shadow-xs ring-1 ring-[#1f3a2b]'
                              : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-400'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Metal Selector: Unified Purity + Color Swatches (Matches Neirah Screenshot) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-stone-700">
                  Metal: <span className="font-semibold text-stone-900">{metalDisplayName}</span>
                </label>

                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                  {metalSwatches.map((swatch) => {
                    const isSel = isSwatchSelected(swatch);
                    const bg = swatch.colorCode && swatch.colorCodeEnd
                      ? `linear-gradient(135deg, ${swatch.colorCode} 0%, ${swatch.colorCodeEnd} 100%)`
                      : (swatch.colorCode || swatch.colorCodeEnd || '#f1f5f9');

                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => handleSelectMetalSwatch(swatch)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[9px] sm:text-[10px] tracking-tight transition-all cursor-pointer shadow-2xs ${
                          isSel
                            ? 'ring-2 ring-stone-900 ring-offset-2 scale-105 z-10'
                            : 'hover:scale-105 active:scale-95 opacity-90 hover:opacity-100'
                        }`}
                        style={{
                          background: bg,
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          color: '#334155',
                        }}
                        title={`${swatch.label} ${swatch.color}`}
                        aria-label={`${swatch.label} ${swatch.color}`}
                      >
                        {swatch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Solitaire Center Diamond Carat Weight Dropdown (Matches Screenshot 2) */}
              {isCenterDriven && carats.length > 0 && (
                <div className="space-y-1.5">
                  <label htmlFor="carat-select" className="block text-[11px] font-bold text-stone-700">
                    Total Center Diamond Weight
                  </label>
                  <div className="relative">
                    <select
                      id="carat-select"
                      value={selectedCarat}
                      onChange={(e) => setSelectedCarat(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-800 appearance-none focus:outline-none focus:border-[#8f6d43] cursor-pointer"
                    >
                      {carats.map((ct) => (
                        <option key={ct} value={ct}>
                          {ct} CT
                        </option>
                      ))}
                    </select>
                    <HiOutlineChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* 5. Size Selection (If Applicable) */}
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
            </div>

            {/* ─── ADD TO CART Button (Matches Screenshot 2) ─── */}
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

            {/* Delivery Estimate Bar (Matches Screenshot 3) */}
            <div className="text-center pt-1 text-xs text-stone-500">
              Order Now for estimated delivery by <strong className="text-stone-800 font-semibold">{deliveryDateString}</strong>
            </div>

            {/* ══════════════════════════════════════════════════════════
                THE NEIRAH DIFFERENCE (Matches Screenshot 3)
            ═══════════════════════════════════════════════════════════ */}
            <div className="p-4 rounded-xl border border-stone-100 bg-[#faf8f5]/60 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                The NEIRAH Difference
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="space-y-1.5 p-2 rounded-lg bg-white border border-stone-100 shadow-2xs">
                  <HiOutlineShieldCheck className="w-5 h-5 mx-auto text-[#8b6f4e]" />
                  <p className="text-[10px] font-bold text-stone-800 leading-tight">100% Certified</p>
                  <p className="text-[9px] text-stone-400 leading-tight">Global Online Jeweller</p>
                </div>
                <div className="space-y-1.5 p-2 rounded-lg bg-white border border-stone-100 shadow-2xs">
                  <HiOutlineRefresh className="w-5 h-5 mx-auto text-[#8b6f4e]" />
                  <p className="text-[10px] font-bold text-stone-800 leading-tight">15 Days Return</p>
                  <p className="text-[9px] text-stone-400 leading-tight">BIS Hallmark &amp; Certified</p>
                </div>
                <div className="space-y-1.5 p-2 rounded-lg bg-white border border-stone-100 shadow-2xs">
                  <HiOutlineTruck className="w-5 h-5 mx-auto text-[#8b6f4e]" />
                  <p className="text-[10px] font-bold text-stone-800 leading-tight">Free Secure</p>
                  <p className="text-[9px] text-stone-400 leading-tight">Insured Shipping</p>
                </div>
                <div className="space-y-1.5 p-2 rounded-lg bg-white border border-stone-100 shadow-2xs">
                  <HiOutlineDocumentText className="w-5 h-5 mx-auto text-[#8b6f4e]" />
                  <p className="text-[10px] font-bold text-stone-800 leading-tight">Certificate</p>
                  <p className="text-[9px] text-stone-400 leading-tight">View Certificate</p>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                ACCORDIONS: DESCRIPTION, SPECS, PRICE BREAK UP & ORIGIN
            ═══════════════════════════════════════════════════════════ */}
            <div className="pt-2 divide-y divide-stone-150 border-t border-stone-200 text-xs">
              {/* Accordion 1: Product Description */}
              <div className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('desc')}
                  className="w-full flex items-center justify-between font-bold text-stone-900 tracking-wide text-xs cursor-pointer text-left"
                >
                  <span className="uppercase text-[11px] font-bold">Product Description</span>
                  <span className="text-stone-400 text-sm font-bold">
                    {openAccordions.desc ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.desc && (
                  <div className="mt-2.5 text-stone-600 leading-relaxed text-xs animate-fadeIn space-y-2 pt-1 border-t border-stone-100">
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

              {/* Accordion 2: Specification */}
              <div className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('specs')}
                  className="w-full flex items-center justify-between font-bold text-stone-900 tracking-wide text-xs cursor-pointer text-left"
                >
                  <span className="uppercase text-[11px] font-bold">Specification</span>
                  <span className="text-stone-400 text-sm font-bold">
                    {openAccordions.specs ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.specs && (
                  <div className="mt-2.5 text-stone-600 text-xs animate-fadeIn space-y-1.5 divide-y divide-stone-50 pt-1 border-t border-stone-100">
                    {specificationRows.map(([label, value]) => (
                      <div key={label} className="flex justify-between py-1">
                        <span className="text-stone-400">{label}</span>
                        <span className="font-semibold text-stone-800">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 3: PRICE BREAK UP (Exact Match to Screenshot 4) */}
              <div className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('price')}
                  className="w-full flex items-center justify-between font-bold text-stone-900 tracking-wide text-xs cursor-pointer text-left"
                >
                  <span className="uppercase text-[11px] font-bold text-stone-900">PRICE BREAK UP</span>
                  <span className="text-stone-400 text-sm font-bold">
                    {openAccordions.price ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.price && breakdown && (
                  <div className="mt-3 animate-fadeIn space-y-3 pt-1 border-t border-stone-100 text-[11px]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-stone-200 text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                            <th className="py-1.5 px-1 font-bold">COMPONENT</th>
                            <th className="py-1.5 px-1 font-bold">RATE</th>
                            <th className="py-1.5 px-1 font-bold">WEIGHT</th>
                            <th className="py-1.5 px-1 text-right font-bold">VALUE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-stone-700">
                          {/* METALS Section */}
                          <tr className="bg-stone-50/50">
                            <td colSpan={4} className="pt-2.5 pb-1 px-1 font-bold text-[10px] uppercase tracking-wider text-stone-800">
                              METALS
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-1 font-medium">{metalDisplayName}</td>
                            <td className="py-1.5 px-1 font-mono">{breakdown.metalRate ? `₹${Number(breakdown.metalRate).toLocaleString('en-IN')}/g` : '—'}</td>
                            <td className="py-1.5 px-1 font-mono">{breakdown.metalWeight ? `${breakdown.metalWeight} g` : '—'}</td>
                            <td className="py-1.5 px-1 font-mono font-semibold text-right text-stone-900">{formatPrice(breakdown.metalCost)}</td>
                          </tr>

                          {/* DIAMONDS Section */}
                          <tr className="bg-stone-50/50">
                            <td colSpan={4} className="pt-2.5 pb-1 px-1 font-bold text-[10px] uppercase tracking-wider text-stone-800">
                              DIAMONDS
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-1 font-medium">Center Diamond</td>
                            <td className="py-1.5 px-1 font-mono">{breakdown.centerRate ? `₹${Number(breakdown.centerRate).toLocaleString('en-IN')}` : '—'}</td>
                            <td className="py-1.5 px-1 font-mono">{breakdown.centerCarat ? `${breakdown.centerCarat.toFixed(2)} cts` : '—'}</td>
                            <td className="py-1.5 px-1 font-mono font-semibold text-right text-stone-900">{formatPrice(breakdown.centerCost || breakdown.diamondCost)}</td>
                          </tr>
                          {breakdown.sideCarat > 0 && (
                            <tr>
                              <td className="py-1.5 px-1 font-medium">Side Diamond</td>
                              <td className="py-1.5 px-1 font-mono">—</td>
                              <td className="py-1.5 px-1 font-mono">{breakdown.sideCarat} cts</td>
                              <td className="py-1.5 px-1 font-mono font-semibold text-right text-stone-900">{formatPrice(breakdown.sideCost)}</td>
                            </tr>
                          )}

                          {/* MAKING CHARGES Section */}
                          <tr className="bg-stone-50/50">
                            <td colSpan={4} className="pt-2.5 pb-1 px-1 font-bold text-[10px] uppercase tracking-wider text-stone-800">
                              MAKING CHARGES
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-1 font-medium">Making Charge</td>
                            <td className="py-1.5 px-1 font-mono">—</td>
                            <td className="py-1.5 px-1 font-mono">—</td>
                            <td className="py-1.5 px-1 font-mono font-semibold text-right text-stone-900">{formatPrice(breakdown.labourCharge)}</td>
                          </tr>

                          {/* OTHER CHARGES Section */}
                          <tr className="bg-stone-50/50">
                            <td colSpan={4} className="pt-2.5 pb-1 px-1 font-bold text-[10px] uppercase tracking-wider text-stone-800">
                              OTHER CHARGES
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-1 font-medium">Certificate Charge</td>
                            <td className="py-1.5 px-1 font-mono">—</td>
                            <td className="py-1.5 px-1 font-mono">—</td>
                            <td className="py-1.5 px-1 font-mono font-semibold text-right text-stone-900">{formatPrice(breakdown.certificateCharge)}</td>
                          </tr>

                          {/* SUMMARY Section */}
                          <tr className="bg-stone-50/80 border-t border-stone-200">
                            <td colSpan={4} className="pt-2.5 pb-1 px-1 font-bold text-[10px] uppercase tracking-wider text-stone-800">
                              SUMMARY
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="py-1.5 px-1 font-medium text-stone-600">Subtotal</td>
                            <td className="py-1.5 px-1 font-mono font-semibold text-right text-stone-900">{formatPrice(breakdown.subtotal)}</td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="py-1.5 px-1 font-medium text-stone-600">GST (3%)</td>
                            <td className="py-1.5 px-1 font-mono font-semibold text-right text-stone-900">{formatPrice(breakdown.gstAmount)}</td>
                          </tr>
                          <tr className="border-t border-stone-300 font-bold">
                            <td colSpan={3} className="py-2 px-1 text-xs font-bold text-stone-900">Grand Total</td>
                            <td className="py-2 px-1 font-mono text-xs font-bold text-right text-[#8b6f4e]">{formatPrice(breakdown.finalPrice)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p className="text-[10px] text-stone-400 italic pt-1 border-t border-stone-100">
                      * The final invoice amount will be adjusted in case of variation in weight
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 4: Manufacturer & Origin (Matches Screenshot 5) */}
              <div className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('origin')}
                  className="w-full flex items-center justify-between font-bold text-stone-900 tracking-wide text-xs cursor-pointer text-left"
                >
                  <span className="uppercase text-[11px] font-bold">Manufacturer &amp; Origin</span>
                  <span className="text-stone-400 text-sm font-bold">
                    {openAccordions.origin ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.origin && (
                  <div className="mt-2.5 text-stone-700 text-xs animate-fadeIn space-y-2 pt-1 border-t border-stone-100">
                    <div className="grid grid-cols-3 gap-2 py-1">
                      <span className="text-stone-500 font-medium">Manufacturer:</span>
                      <span className="col-span-2 font-semibold text-stone-900">Neirah E-Retail India Pvt. Ltd.</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-1">
                      <span className="text-stone-500 font-medium">Country of Origin:</span>
                      <span className="col-span-2 font-semibold text-stone-900">India</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── MOST LIKED PIECES ─── */}
        {mostLikedProducts.length > 0 && (
          <div className="pt-16 sm:pt-20 border-t border-stone-100 mt-16">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400">
                MOST LIKED PIECES
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {mostLikedProducts
                .filter((item) => getPrimaryProductImage(item))
                .map((item) => {
                  const relImg = getPrimaryProductImage(item);
                  const relPrice = item.pricing?.salePrice ?? item.pricing?.mrp;

                  return (
                    <div
                      key={item._id || item.basicInfo?.slug}
                      onClick={() => navigate(`/product/${item.basicInfo?.slug || item._id}`)}
                      className="group bg-white rounded-2xl border border-stone-100/90 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      {/* Image container */}
                      <div className="relative aspect-square bg-[#faf8f5] p-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={relImg}
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
          </div>
        )}
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
    </div>
  );
}
