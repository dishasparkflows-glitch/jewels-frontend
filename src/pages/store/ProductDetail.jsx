import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShare,
  HiOutlineX,
  HiOutlineEye,
  HiOutlineExternalLink,
  HiChevronUp,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineArrowsExpand,
  HiOutlineTag,
  HiOutlineDuplicate,
  HiOutlineRefresh,
  HiOutlineDocumentText,
  HiOutlineStar,
  HiSparkles,
} from 'react-icons/hi';
import { IoStar } from 'react-icons/io5';
import {
  FaWhatsapp,
  FaFacebookF,
  FaXTwitter,
  FaPinterestP,
  FaEnvelope,
  FaLink,
  FaCheck,
} from 'react-icons/fa6';
import toast from 'react-hot-toast';
import { productsAPI, couponsAPI, reviewsAPI } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { getValidProductImages, getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';
import { trackProductView } from '../../config/firebase';
import { useLiveViewers } from '../../hooks/useLiveViewers';
import Dropdown from '../../components/common/Dropdown';
import ProductCard from '../../components/product/ProductCard';
import SimilarProductsDrawer from '../../components/store/SimilarProductsDrawer';
import { formatPriceWithDecimals as formatPrice } from '../../utils/currency';
import {
  calculateSizeAdjustedMetalWeight,
  sortSizesNumerically,
  getCategorySizeLabel,
} from '../../utils/sizePriceCalculator';
import { getMetallicColorStyle } from '../../utils/productCard';
import { isRawObjectId, cleanAttribute } from '../../utils/metalColors';

const referenceName = (value) => (value && typeof value === 'object' ? value.name || '' : (typeof value === 'string' ? value : ''));

/**
 * Checks if a given media item or URL is a video
 */
const isVideoMedia = (media) => {
  if (!media) return false;
  if (typeof media === 'object') {
    if (media.mediaType === 'video') return true;
    const url = media.url || '';
    return /\.(mp4|webm|mov|m4v|ogg)(?:[?#]|$)/i.test(url);
  }
  return /\.(mp4|webm|mov|m4v|ogg)(?:[?#]|$)/i.test(String(media));
};

/**
 * High-definition interactive loupe zoom image / video card for product detail gallery
 */
import {
  ProductGallery,
  ProductOffersSection,
  ProductTrustBadges,
  ProductAccordions,
  ProductReviewsSection,
  ProductSimilarPieces,
  ProductMobileBottomBar,
  ProductImageLightboxModal,
  ProductSizeGuideModal,
  ProductCertificateModal,
  ProductShareModal,
  ProductWriteReviewModal,
} from '../../components/product/detail';

export default function ProductDetail() {
  const { id, slug } = useParams();
  const identifier = slug || id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  // Product state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostLikedProducts, setMostLikedProducts] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [offersOpen, setOffersOpen] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    couponsAPI
      .getLookup()
      .then(({ data }) => {
        const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        setCoupons(list);
      })
      .catch(() => {
        setCoupons([]);
      });
  }, []);

  const handleCopyCoupon = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    toast.success(`Coupon "${code}" copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2500);
  };

  // ─── Customer Reviews State ───
  const [productReviews, setProductReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSort] = useState('recent');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [newReview, setNewReview] = useState({
    rating: 5,
    name: '',
    email: '',
    title: '',
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProductReviews = useCallback(async (prodId) => {
    if (!prodId) return;
    try {
      setReviewsLoading(true);
      const res = await reviewsAPI.getAll({ productId: prodId, status: 'approved' });
      const items = res.data?.data?.items || res.data?.data || [];
      setProductReviews(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn('Could not load reviews for product:', err);
      setProductReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (product?._id) {
      if (Array.isArray(product.reviews)) {
        setProductReviews(product.reviews);
      } else {
        fetchProductReviews(product._id);
      }
    }
  }, [product?._id, product?.reviews, fetchProductReviews]);

  useEffect(() => {
    if (user) {
      setNewReview((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const reviewStats = useMemo(() => {
    const total = productReviews.length;
    if (total === 0) {
      return {
        total: 0,
        average: '5.0',
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }
    const sum = productReviews.reduce((acc, r) => acc + (Number(r.review?.rating) || 5), 0);
    const avg = (sum / total).toFixed(1);
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round(Number(r.review?.rating) || 5)));
      dist[star] = (dist[star] || 0) + 1;
    });
    const pcts = {
      5: Math.round(((dist[5] || 0) / total) * 100),
      4: Math.round(((dist[4] || 0) / total) * 100),
      3: Math.round(((dist[3] || 0) / total) * 100),
      2: Math.round(((dist[2] || 0) / total) * 100),
      1: Math.round(((dist[1] || 0) / total) * 100),
    };
    return {
      total,
      average: avg,
      distribution: dist,
      percentages: pcts,
    };
  }, [productReviews]);

  const sortedReviews = useMemo(() => {
    const list = [...productReviews];
    if (reviewSort === 'recent') {
      return list.sort((a, b) => new Date(b.review?.reviewDate || b.meta?.createdAt || 0) - new Date(a.review?.reviewDate || a.meta?.createdAt || 0));
    }
    if (reviewSort === 'highest') {
      return list.sort((a, b) => (Number(b.review?.rating) || 5) - (Number(a.review?.rating) || 5));
    }
    if (reviewSort === 'lowest') {
      return list.sort((a, b) => (Number(a.review?.rating) || 5) - (Number(b.review?.rating) || 5));
    }
    return list;
  }, [productReviews, reviewSort]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.title.trim() || !newReview.comment.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }
    try {
      setSubmittingReview(true);
      const payload = {
        customer: {
          name: newReview.name.trim(),
          email: newReview.email.trim(),
        },
        review: {
          rating: Number(newReview.rating) || 5,
          title: newReview.title.trim(),
          comment: newReview.comment.trim(),
          reviewDate: new Date().toISOString(),
        },
        productId: product._id,
        status: 'approved',
      };
      await reviewsAPI.create(payload);
      toast.success('Thank you! Your verified review has been published.');
      setShowReviewModal(false);
      setNewReview({
        rating: 5,
        name: user?.name || '',
        email: user?.email || '',
        title: '',
        comment: '',
      });
      if (product?._id) {
        fetchProductReviews(product._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatReviewDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const { count: liveViewersCount, hasUpdated: liveViewersUpdated } = useLiveViewers(product?._id || id);

  // Selections
  const [selectedPurity, setSelectedPurity] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedCarat, setSelectedCarat] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);


  // Luxury Image Viewer Lightbox Modal & Size modal
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const openLightboxAtIndex = (idx) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);

  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const openCertificateModal = () => setShowCertificateModal(true);
  const closeCertificateModal = () => setShowCertificateModal(false);

  const { settings: storeSettings } = useStoreSettings();

  const certificateUrl =
    product?.certificateImage?.url ||
    storeSettings?.certificateImage?.url ||
    'https://pub-82427c7fd20e4acaa4bdb3b933c0a3bf.r2.dev/certificates/certificate-1792672361210-d82f.png';

  // Product specifications key-value pairs (Admin Step 4: Care & Specs)
  const productSpecs = useMemo(() => {
    const list = [];
    if (Array.isArray(product?.productSpecifications)) {
      product.productSpecifications.forEach((spec) => {
        if (spec && (spec.key?.trim() || spec.value?.trim())) {
          list.push({
            key: spec.key?.trim() || '',
            value: spec.value?.trim() || '',
            id: spec._id || spec.id,
          });
        }
      });
    }
    return list;
  }, [product?.productSpecifications]);


  // Determine whether this product is Case 1 (Center Diamond Driven) or Case 2 (Side Diamond Driven)
  const isCenterDriven = useMemo(() => {
    if (!product) return false;
    // Explicit 0 center diamonds configured in admin panel
    if (Array.isArray(product.centerDiamondRows) && product.centerDiamondRows.length === 0) {
      return false;
    }
    const hasCenterRows = Array.isArray(product.centerDiamondRows) && product.centerDiamondRows.length > 0;
    if (hasCenterRows) return true;

    const variants = Array.isArray(product.variants) ? product.variants : [];
    // Only center-driven if variants actually have configured center diamond weight AND positive center cost
    const hasCenterWeights = variants.some((v) => Number(v.centerDiamondWeight) > 0 && Number(v.centerDiamondCost || 0) > 0);
    return Boolean(hasCenterWeights);
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
      if (p && !/^[a-f0-9]{24}$/i.test(p)) pSet.add(p);

      const cObj = v.metalColorId;
      const cName = referenceName(cObj) || referenceName(v.metalColor) || '';
      if (cName && !/^[a-f0-9]{24}$/i.test(cName)) {
        const existing = cMap.get(cName) || {};
        cMap.set(cName, {
          name: cName,
          code: cObj?.code || existing.code || '',
          colorCode: cObj?.colorCode || existing.colorCode || '',
          colorCodeEnd: cObj?.colorCodeEnd || existing.colorCodeEnd || '',
        });
      }

      // Only add to carat dropdown if this is a center diamond driven product or variant has genuine center diamond weight
      const ct = isCenterDriven
        ? Number(v.centerDiamondWeight || v.caratWeight || 0)
        : Number(v.centerDiamondWeight || 0);
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
        if (name && typeof name === 'string' && !/^[a-f0-9]{24}$/i.test(name)) pSet.add(name);
      });
    }

    const sourceColors = Array.isArray(product?.metalColors) && product.metalColors.length > 0
      ? product.metalColors
      : (Array.isArray(product?.metalColorIds) ? product.metalColorIds : []);

    sourceColors.forEach((c) => {
      if (!c) return;
      const name = typeof c === 'object' ? c.name : c;
      if (name && typeof name === 'string' && !/^[a-f0-9]{24}$/i.test(name)) {
        const existing = cMap.get(name) || {};
        cMap.set(name, {
          id: c.id || c._id || existing.id || '',
          name,
          code: c.code || existing.code || '',
          colorCode: c.colorCode || c.hex || existing.colorCode || '',
          colorCodeEnd: c.colorCodeEnd || existing.colorCodeEnd || '',
          hex: c.hex || existing.hex || '',
          variantIcon: c.variantIcon?.url || (typeof c.variantIcon === 'string' ? c.variantIcon : '') || existing.variantIcon || '',
        });
      }
    });

    if (Array.isArray(product?.colorImages)) {
      product.colorImages.forEach((ci) => {
        if (!ci || ci.status === 'inactive') return;
        const cObj = ci.metalColorId;
        let cName = '';
        let cMeta = typeof cObj === 'object' ? cObj : null;
        if (cMeta?.name) {
          cName = cMeta.name;
        } else if (typeof cObj === 'string') {
          const found = sourceColors.find((m) => String(m?.id || m?._id || m) === cObj);
          if (found && typeof found === 'object' && found.name) {
            cName = found.name;
            cMeta = found;
          } else if (!/^[a-f0-9]{24}$/i.test(cObj)) {
            cName = cObj;
          }
        }
        if (!cName) {
          cName = ci.colorName || ci.name || '';
        }

        if (cName && typeof cName === 'string' && !/^[a-f0-9]{24}$/i.test(cName)) {
          const existing = cMap.get(cName) || {};
          cMap.set(cName, {
            id: cMeta?._id || cMeta?.id || (typeof cObj === 'string' ? cObj : '') || existing.id || '',
            name: cName,
            code: cMeta?.code || existing.code || '',
            colorCode: cMeta?.colorCode || cMeta?.hex || existing.colorCode || '',
            colorCodeEnd: cMeta?.colorCodeEnd || existing.colorCodeEnd || '',
            hex: cMeta?.hex || existing.hex || '',
            variantIcon: ci.variantIcon?.url || (typeof ci.variantIcon === 'string' ? ci.variantIcon : '') || cMeta?.variantIcon?.url || existing.variantIcon || '',
          });
        }
      });
    }

    return {
      purities: Array.from(pSet),
      colors: Array.from(cMap.values()),
      carats: Array.from(ctSet).sort((a, b) => a - b),
      qualities: Array.from(qSet),
      diamondType: dType,
    };
  }, [product]);

  const isSilver = (product?.productType === 'silver') || Boolean(product?.isOrnate);
  const isGold = !isSilver;

  // Auto-initialize options on product load
  useEffect(() => {
    if (!product) return;

    if (colors.length && (!selectedColor || !colors.some((c) => c.name.toLowerCase() === selectedColor.toLowerCase()))) {
      const defaultC = isGold
        ? (colors.find((c) => c.name.toLowerCase().includes('yellow')) ||
           colors.find((c) => c.name.toLowerCase().includes('rose')) ||
           colors[0])
        : colors[0];
      if (defaultC?.name) {
        setSelectedColor(defaultC.name);
      }
    }

    if (!isGold) return;

    if (purities.length && !selectedPurity) {
      const defaultP = purities.find((p) => p.includes('9K') || p.includes('9KT')) ||
                       purities.find((p) => p.includes('14')) ||
                       purities[0];
      setSelectedPurity(defaultP);
    }
    if (isCenterDriven && carats.length && !selectedCarat) {
      setSelectedCarat(carats[0]);
    }
    if (qualities.length && !selectedQuality) {
      // Default to F-G VS or first quality
      const defaultQ =
        qualities.find((q) => {
          const tokens = q.split(/\s*·\s*/).map((t) => t.trim());
          return tokens.includes('F-G') && tokens.includes('VS');
        }) || qualities[0];
      setSelectedQuality(defaultQ);
    }
  }, [product, isGold, isCenterDriven, purities, colors, carats, qualities, selectedPurity, selectedColor, selectedCarat, selectedQuality]);

  // Swatches for the combined Metal (Purity + Color) selector matching Neirah standard
  const { metalSwatches, purityGroups } = useMemo(() => {
    if (!isGold || !purities.length) {
      return { metalSwatches: [], purityGroups: [] };
    }

    // Standard gold color palette order: White Gold, Rose Gold, Yellow Gold
    const standardGoldColors = [
      { name: 'White Gold', aliases: ['white gold', 'white'], colorCode: '#f1f5f9', colorCodeEnd: '#cbd5e1' },
      { name: 'Rose Gold', aliases: ['rose gold', 'rose', 'pink'], colorCode: '#e89f8f', colorCodeEnd: '#cb7768' },
      { name: 'Yellow Gold', aliases: ['yellow gold', 'yellow'], colorCode: '#f5d77f', colorCodeEnd: '#d4b85b' },
    ];

    // Filter to standard colors actually configured in product (or fallback to all 3)
    const availableColorNames = (colors || [])
      .map((c) => (c.name || '').toLowerCase().trim())
      .filter((n) => n && !/^[a-f0-9]{24}$/i.test(n));

    const activeColorDefs = standardGoldColors.filter((def) =>
      availableColorNames.some((ac) => def.aliases.some((alias) => ac.includes(alias)))
    );
    const colorsToUse = activeColorDefs.length > 0 ? activeColorDefs : standardGoldColors;

    // Standard purities order: 9K, 10K, 14K, 18K
    const purityOrder = [
      { key: '9K', full: '9KT Gold', aliases: ['9kt gold', '9kt', '9k'] },
      { key: '10K', full: '10KT Gold', aliases: ['10kt gold', '10kt', '10k'] },
      { key: '14K', full: '14KT Gold', aliases: ['14kt gold', '14kt', '14k'] },
      { key: '18K', full: '18KT Gold', aliases: ['18kt gold', '18kt', '18k'] },
    ];

    // Filter to purities actually configured in this product
    const activePurityDefs = purityOrder.filter((pDef) =>
      purities.some((p) => pDef.aliases.some((a) => String(p).toLowerCase().includes(a)))
    );

    // Any non-standard configured purities (e.g. 22K, 24K)
    const extraPurities = purities.filter(
      (p) => !/^[a-f0-9]{24}$/i.test(String(p)) && !purityOrder.some((pDef) => pDef.aliases.some((a) => String(p).toLowerCase().includes(a)))
    );

    const listToRender = activePurityDefs.length > 0 ? activePurityDefs : purityOrder;
    const groups = [];

    listToRender.forEach((pDef) => {
      const matchedPurity = purities.find((p) =>
        pDef.aliases.some((a) => String(p).toLowerCase().includes(a))
      ) || pDef.full;

      const groupSwatches = colorsToUse.map((def) => {
        const matchedObj = (colors || []).find((c) => {
          const name = (c.name || '').toLowerCase().trim();
          return def.aliases.some((alias) => name.includes(alias));
        });
        const colorCode = matchedObj?.colorCode || matchedObj?.hex || def.colorCode;
        const colorCodeEnd = matchedObj?.colorCodeEnd || def.colorCodeEnd;

        return {
          id: `${pDef.key}-${def.name}`,
          label: pDef.key,
          purity: matchedPurity,
          color: def.name,
          colorCode,
          colorCodeEnd,
          type: 'gold',
        };
      });

      if (groupSwatches.length > 0) {
        groups.push({
          key: pDef.key,
          label: pDef.key,
          purity: matchedPurity,
          swatches: groupSwatches,
        });
      }
    });

    extraPurities.forEach((extraP) => {
      const label = String(extraP).replace(/[^0-9a-zA-Z]/g, '').slice(0, 4) || extraP;
      const groupSwatches = colorsToUse.map((def) => {
        const matchedObj = (colors || []).find((c) => {
          const name = (c.name || '').toLowerCase().trim();
          return def.aliases.some((alias) => name.includes(alias));
        });
        const colorCode = matchedObj?.colorCode || matchedObj?.hex || def.colorCode;
        const colorCodeEnd = matchedObj?.colorCodeEnd || def.colorCodeEnd;

        return {
          id: `${label}-${def.name}`,
          label,
          purity: extraP,
          color: def.name,
          colorCode,
          colorCodeEnd,
          type: 'gold',
        };
      });

      if (groupSwatches.length > 0) {
        groups.push({
          key: label,
          label,
          purity: extraP,
          swatches: groupSwatches,
        });
      }
    });

    // Only include silver if the product actually has silver purity configured (no static silver)
    const actualSilverPurity = purities.find((p) =>
      String(p).toLowerCase().includes('silver') || String(p).toLowerCase().includes('925')
    );
    if (actualSilverPurity) {
      const silverSwatch = {
        id: 'SS-Silver',
        label: 'SS',
        purity: actualSilverPurity,
        color: 'Silver',
        colorCode: '#e2e8f0',
        colorCodeEnd: '#cbd5e1',
        type: 'silver',
      };
      groups.push({
        key: 'SS',
        label: 'SS',
        purity: actualSilverPurity,
        swatches: [silverSwatch],
      });
    }

    const swatches = groups.flatMap((g) => g.swatches);

    return { metalSwatches: swatches, purityGroups: groups };
  }, [purities, colors, isGold]);

  const isSwatchSelected = useCallback((swatch) => {
    const curPurity = (selectedPurity || '').toLowerCase();
    const curColor = (selectedColor || '').toLowerCase();

    const matchP = curPurity.includes(swatch.label.toLowerCase()) ||
                   (swatch.purity && (curPurity.includes(swatch.purity.toLowerCase()) || swatch.purity.toLowerCase().includes(curPurity)));
    const matchC = curColor.includes(swatch.color.toLowerCase()) || swatch.color.toLowerCase().includes(curColor);

    return Boolean(matchP && matchC);
  }, [selectedPurity, selectedColor]);

  const handleSelectMetalSwatch = useCallback((swatch) => {
    setSelectedPurity(swatch.purity);
    setSelectedColor(swatch.color);
  }, []);

  // Active metal display title (e.g. "9KT Yellow Gold")
  const metalDisplayName = useMemo(() => {
    if (!isGold) {
      return '925 Sterling Silver';
    }
    const pStr = (selectedPurity || '').replace(/ Gold/i, '').trim();
    const cStr = (selectedColor || '').trim();

    if (pStr && cStr) {
      return `${pStr} ${cStr}`;
    }
    return pStr || cStr || 'Gold';
  }, [selectedPurity, selectedColor, isGold]);

  // Extract clean studio gallery images for the current selected metal color
  const galleryImages = useMemo(() => {
    if (!product) return [];

    if (selectedColor && Array.isArray(product.colorImages)) {
      const match = product.colorImages.find((ci) => {
        const cName = ci.metalColorId?.name || ci.colorName || ci.name || '';
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

  // Keyboard navigation & handlers for Luxury Image Viewer Modal
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, galleryImages.length]);


  const modalColorsToRender = useMemo(() => {
    // Only display metal colors in modal if dynamic metal colors are actually configured on this product
    const hasDynamicColors =
      (Array.isArray(product?.metalColors) && product.metalColors.length > 0) ||
      (Array.isArray(product?.metalColorIds) &&
        product.metalColorIds.some(
          (c) => (typeof c === 'object' && c?.name) || (typeof c === 'string' && !/^[a-f0-9]{24}$/i.test(c))
        )) ||
      (Array.isArray(product?.colorImages) &&
        product.colorImages.some((ci) => {
          const cObj = ci.metalColorId;
          return (typeof cObj === 'object' && cObj?.name) || ci.metalColorName || ci.colorName;
        }));

    if (!hasDynamicColors || !colors || colors.length === 0) {
      return [];
    }

    return colors.map((c) => {
      const cName = c.name || '';
      let grad =
        c.colorCode && c.colorCodeEnd
          ? `linear-gradient(135deg, ${c.colorCode} 0%, ${c.colorCodeEnd} 100%)`
          : c.colorCode || null;

      if (!grad) {
        if (cName.toLowerCase().includes('yellow')) {
          grad = 'linear-gradient(135deg, #F5D382 0%, #D8A546 100%)';
        } else if (cName.toLowerCase().includes('rose') || cName.toLowerCase().includes('pink')) {
          grad = 'linear-gradient(135deg, #F7C8BC 0%, #E39987 100%)';
        } else if (cName.toLowerCase().includes('white') || cName.toLowerCase().includes('platinum')) {
          grad = 'linear-gradient(135deg, #F0F2F5 0%, #CCD1D9 100%)';
        } else if (cName.toLowerCase().includes('silver')) {
          grad = 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)';
        } else {
          grad = 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)';
        }
      }
      return { name: cName, gradient: grad, variantIcon: c.variantIcon };
    });
  }, [colors, product]);

  // Category from final schema (categoryIds[0])
  const category = product?.categoryIds?.[0] || null;
  const categoryId = category?._id || '';
  const categoryName = category?.name || '';

  // Category size chart returned directly from backend (no extra frontend conditions needed)
  const sizeChart = product?.sizeChart || null;
  const hasCategorySizeChart = Boolean(sizeChart?.url);

  // Multi-dimensional variant resolution
  const selectedVariant = useMemo(() => {
    const raw = Array.isArray(product?.variants) ? product.variants : [];
    if (!raw.length) return null;

    const normPurity = (str) =>
      String(str || '')
        .toLowerCase()
        .replace(/kt\b/gi, 'k')
        .replace(/\s*gold/gi, '')
        .trim();

    const normQuality = (str) =>
      String(str || '')
        .toLowerCase()
        .replace(/\s*·\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const isQualityMatch = (v, targetQuality) => {
      if (!targetQuality) return true;
      const col = referenceName(v.diamondColor || v.diamondColorId) || v.diamondColor || '';
      const cla = referenceName(v.diamondClarity || v.diamondClarityId) || v.diamondClarity || '';
      const q = [col, cla].filter(Boolean).join(' · ');

      if (q && normQuality(q) === normQuality(targetQuality)) {
        return true;
      }
      if (v.combination) {
        const tokens = v.combination.split(/\s*·\s*/).map((t) => t.trim().toLowerCase());
        const requiredParts = targetQuality.split(/\s*·\s*/).map((p) => p.trim().toLowerCase());
        return requiredParts.every((part) => tokens.includes(part));
      }
      return false;
    };

    // 1. Exact match across all active dimensions
    let match = raw.find((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      const c = referenceName(v.metalColorId) || referenceName(v.metalColor) || '';
      const ct = Number(v.centerDiamondWeight || v.caratWeight || 0);

      const matchP =
        !selectedPurity ||
        normPurity(p) === normPurity(selectedPurity) ||
        (p && selectedPurity && (p.toLowerCase().includes(selectedPurity.toLowerCase()) || selectedPurity.toLowerCase().includes(p.toLowerCase())));
      // Allow matching if variant has no explicit metalColorId (purity rates apply across colors)
      const matchC =
        !selectedColor ||
        !c ||
        c.toLowerCase() === selectedColor.toLowerCase() ||
        (c && selectedColor && (c.toLowerCase().includes(selectedColor.toLowerCase()) || selectedColor.toLowerCase().includes(c.toLowerCase())));
      const matchCt = !selectedCarat || ct === Number(selectedCarat);
      const matchQ = isQualityMatch(v, selectedQuality);

      return matchP && matchC && (isCenterDriven ? matchCt : true) && matchQ;
    });

    if (match) return match;

    // 2. Partial match: purity + carat + quality
    match = raw.find((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      const ct = Number(v.centerDiamondWeight || v.caratWeight || 0);

      const matchP = !selectedPurity || normPurity(p) === normPurity(selectedPurity);
      const matchCt = !selectedCarat || ct === Number(selectedCarat);
      const matchQ = isQualityMatch(v, selectedQuality);

      return matchP && (isCenterDriven ? matchCt : true) && matchQ;
    });

    if (match) return match;

    // 3. Fallback: purity only
    match = raw.find((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      return !selectedPurity || normPurity(p) === normPurity(selectedPurity);
    });

    return match || raw[0] || null;
  }, [product, selectedPurity, selectedColor, selectedCarat, selectedQuality, isCenterDriven]);

  const displayedSku = useMemo(() => {
    return product?.basicInfo?.sku || '';
  }, [product]);

  // isGold and isSilver are declared above
  // Derive base metal weight before size adjustment
  const rawBaseMetalWeight = useMemo(() => {
    return Number(
      selectedVariant?.metalWeight ||
      selectedVariant?.weight ||
      product?.specifications?.metalWeight ||
      0
    );
  }, [selectedVariant, product?.specifications?.metalWeight]);

  // Numerically sorted sizes (e.g. 4 -> 4.5 -> 5 -> 5.5 -> 6 -> 10)
  const sortedSizes = useMemo(() => {
    return sortSizesNumerically(sizes);
  }, [sizes]);

  // Category-specific size label (Size (US) for rings, Size otherwise)
  const sizeLabel = useMemo(() => {
    return getCategorySizeLabel(product?.categoryIds || categoryName);
  }, [product?.categoryIds, categoryName]);

  // Size-adjusted metal weight dynamically computed from category steps
  const sizeAdjustedMetalWeight = useMemo(() => {
    return calculateSizeAdjustedMetalWeight({
      baseMetalWeight: rawBaseMetalWeight,
      selectedSize,
      sizeList: sortedSizes,
      category: product?.categoryIds || categoryName,
    });
  }, [rawBaseMetalWeight, selectedSize, sortedSizes, product?.categoryIds, categoryName]);

  // Base price of variant before size adjustment
  const rawBaseVariantPrice = Number(
    selectedVariant?.price ||
    product?.pricing?.salePrice ||
    0
  );

  // Dynamic price recalculated from size-adjusted metal weight
  const currentPrice = useMemo(() => {
    if (!rawBaseVariantPrice || rawBaseVariantPrice <= 0) return 0;
    if (
      !isGold ||
      !rawBaseMetalWeight ||
      rawBaseMetalWeight <= 0 ||
      !sizeAdjustedMetalWeight ||
      sizeAdjustedMetalWeight === rawBaseMetalWeight
    ) {
      return rawBaseVariantPrice;
    }

    const gstPct = Number(product?.pricing?.gstPercentage ?? 3) / 100;
    const baseSubtotal = rawBaseVariantPrice / (1 + gstPct);

    const certCharge = Number(selectedVariant?.certificateCharge || product?.pricing?.certificateCharge || 0);
    const labCharge = Number(
      selectedVariant?.labourCharge ||
      selectedVariant?.computedMakingCharge ||
      product?.pricing?.baseLabourCharge ||
      0
    );
    let diaCost = Number(
      selectedVariant?.diamondCost ||
      (Number(selectedVariant?.centerDiamondCost || 0) + Number(selectedVariant?.sideDiamondCost || 0)) ||
      selectedVariant?.sideDiamondCost ||
      selectedVariant?.centerDiamondCost ||
      0
    );

    if (!diaCost && Array.isArray(product?.sideDiamondRows) && product.sideDiamondRows.length > 0) {
      const matchedSideRow = product.sideDiamondRows.find((r) => {
        const colId = String(r.diamondColorId?._id || r.diamondColorId || '');
        const claId = String(r.diamondClarityId?._id || r.diamondClarityId || '');
        const vColId = String(selectedVariant?.diamondColorId?._id || selectedVariant?.diamondColorId || '');
        const vClaId = String(selectedVariant?.diamondClarityId?._id || selectedVariant?.diamondClarityId || '');
        return (vColId && colId === vColId) && (vClaId && claId === vClaId);
      }) || product.sideDiamondRows[0];

      if (matchedSideRow) {
        const rate = Number(matchedSideRow.priceINR || 0);
        const wt = Number(matchedSideRow.caratWeight || selectedVariant?.caratWeight || 0);
        if (rate > 0 && wt > 0) {
          diaCost = Math.round(rate * wt * 100) / 100;
        }
      }
    }

    const baseMetalCost = Math.max(0, baseSubtotal - (diaCost + labCharge + certCharge));
    const goldRate = (selectedVariant?.metalRate && Number(selectedVariant.metalRate) > 0)
      ? Number(selectedVariant.metalRate)
      : (rawBaseMetalWeight > 0 ? (baseMetalCost / rawBaseMetalWeight) : 0);

    const adjustedMetalCost = sizeAdjustedMetalWeight * goldRate;
    const weightMultiplier = rawBaseMetalWeight > 0 ? (sizeAdjustedMetalWeight / rawBaseMetalWeight) : 1;
    const adjustedLabour = labCharge * weightMultiplier;

    const newSubtotal = adjustedMetalCost + diaCost + adjustedLabour + certCharge;
    const newGst = newSubtotal * gstPct;
    return Math.round(newSubtotal + newGst);
  }, [rawBaseVariantPrice, isGold, rawBaseMetalWeight, sizeAdjustedMetalWeight, product?.pricing, selectedVariant]);

  const mrpPrice = Number(product?.pricing?.mrp || 0) || currentPrice;

  // Itemized Transparent Price Breakdown (Matches Screenshot)
  const breakdown = useMemo(() => {
    if (!isGold) return null;
    const v = selectedVariant || {};
    const finalPrice = Number(
      currentPrice ||
      v.price ||
      product?.pricing?.salePrice ||
      0
    );

    if (!finalPrice || finalPrice <= 0) return null;

    const gstPct = Number(product?.pricing?.gstPercentage || 3) / 100;
    const computedSubtotal = Math.round((finalPrice / (1 + gstPct)) * 100) / 100;

    const certificateCharge = Number(v.certificateCharge || product?.pricing?.certificateCharge || 0);

    const baseLabourCharge = Number(
      v.labourCharge ||
      v.computedMakingCharge ||
      product?.pricing?.baseLabourCharge ||
      0
    );

    const metalRate = Number(v.metalRate || product?.pricing?.metalRate || 0);
    const metalWeight = sizeAdjustedMetalWeight > 0 ? sizeAdjustedMetalWeight : rawBaseMetalWeight;
    const weightMultiplier = rawBaseMetalWeight > 0 ? (metalWeight / rawBaseMetalWeight) : 1;
    const labourCharge = Math.round(baseLabourCharge * weightMultiplier * 100) / 100;

    const diamondQuality = selectedQuality || (v.diamondColor && v.diamondClarity ? `${referenceName(v.diamondColor)} / ${referenceName(v.diamondClarity)}` : '');
    const diamondCarat = Number(
      (Number(v.centerDiamondWeight || 0) + Number(v.sideDiamondWeight || 0)) ||
      v.sideDiamondWeight ||
      v.centerDiamondWeight ||
      v.caratWeight ||
      selectedCarat ||
      0
    );

    let diamondCost = Number(
      v.diamondCost ||
      (Number(v.centerDiamondCost || 0) + Number(v.sideDiamondCost || 0)) ||
      v.sideDiamondCost ||
      v.centerDiamondCost ||
      0
    );

    if (!diamondCost && Array.isArray(product?.sideDiamondRows) && product.sideDiamondRows.length > 0) {
      const matchedSideRow = product.sideDiamondRows.find((r) => {
        const colId = String(r.diamondColorId?._id || r.diamondColorId || '');
        const claId = String(r.diamondClarityId?._id || r.diamondClarityId || '');
        const vColId = String(v.diamondColorId?._id || v.diamondColorId || '');
        const vClaId = String(v.diamondClarityId?._id || v.diamondClarityId || '');
        return (vColId && colId === vColId) && (vClaId && claId === vClaId);
      }) || product.sideDiamondRows[0];

      if (matchedSideRow) {
        const rate = Number(matchedSideRow.priceINR || 0);
        const wt = Number(matchedSideRow.caratWeight || diamondCarat || 0);
        if (rate > 0 && wt > 0) {
          diamondCost = Math.round(rate * wt * 100) / 100;
        }
      }
    }

    const baseMetalCost = Math.max(0, computedSubtotal - (diamondCost + labourCharge + certificateCharge));
    const effectiveMetalRate = metalRate > 0 ? metalRate : (rawBaseMetalWeight > 0 ? (baseMetalCost / rawBaseMetalWeight) : 0);

    let metalCost = Number(v.metalCost || product?.ornate?.goldAmt || 0);
    if (!metalCost || (sizeAdjustedMetalWeight && sizeAdjustedMetalWeight !== rawBaseMetalWeight)) {
      metalCost = Math.round(metalWeight * effectiveMetalRate * 100) / 100;
    }

    const calculatedSubtotal = Math.round((metalCost + diamondCost + labourCharge + certificateCharge) * 100) / 100;
    const finalSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : computedSubtotal;
    const finalGst = Math.round((finalSubtotal * gstPct) * 100) / 100;
    const finalGrandTotal = Math.round((finalSubtotal + finalGst) * 100) / 100;

    return {
      metalName: metalDisplayName || selectedPurity || '',
      metalRate: effectiveMetalRate,
      metalWeight,
      metalCost,
      diamondLabel: diamondQuality ? `Diamond (${diamondQuality})` : 'Diamond',
      diamondCarat,
      diamondCost,
      labourCharge,
      certificateCharge,
      subtotal: finalSubtotal,
      gstAmount: finalGst,
      finalPrice: finalGrandTotal,
    };
  }, [
    isGold,
    selectedVariant,
    currentPrice,
    product,
    selectedPurity,
    selectedQuality,
    selectedCarat,
    rawBaseMetalWeight,
    sizeAdjustedMetalWeight,
    metalDisplayName,
  ]);



  // Derive available sizes directly from product data without extra API calls and default to size 7
  useEffect(() => {
    const prodSizes = product?.sizes || [];
    const validSizes = Array.isArray(prodSizes) ? prodSizes : [];
    setSizes(validSizes);

    if (validSizes.length > 0) {
      const sorted = sortSizesNumerically(validSizes);
      // Default to Size 7 (e.g. "7", "7 In", "7 Inch", "7.0")
      const matchedSeven = sorted.find((s) => {
        const name = String(s.name || s);
        const match = name.match(/(\d+(?:\.\d+)?)/);
        const num = match ? parseFloat(match[1]) : parseFloat(name);
        return num === 7;
      });
      const defaultOption = matchedSeven || sorted[0];
      setSelectedSize(String(defaultOption._id || defaultOption.id || defaultOption.name || defaultOption));
    } else {
      setSelectedSize('');
    }
  }, [product]);

  // Fetch product data
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const res = await productsAPI.getBySku(identifier);
        const prodData = res.data?.data || res.data;
        if (prodData) {
          setProduct(prodData);
          if (Array.isArray(prodData.reviews)) {
            setProductReviews(prodData.reviews);
          }
          trackProductView(prodData);

          // Fetch most liked products from API
          productsAPI
            .getMostLiked({
              limit: 6,
              productId: prodData._id,
            })
            .then(({ data }) => {
              const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
              if (list.length > 0) {
                setMostLikedProducts(list);
              } else if (Array.isArray(prodData.relatedProducts) && prodData.relatedProducts.length > 0) {
                setMostLikedProducts(prodData.relatedProducts.slice(0, 6));
              } else {
                setMostLikedProducts([]);
              }
            })
            .catch(() => {
              if (Array.isArray(prodData.relatedProducts) && prodData.relatedProducts.length > 0) {
                setMostLikedProducts(prodData.relatedProducts.slice(0, 6));
              } else {
                setMostLikedProducts([]);
              }
            });

          const activeSlug = prodData.basicInfo?.slug || '';
          if (activeSlug && identifier && identifier !== activeSlug) {
            navigate(`/product/${encodeURIComponent(activeSlug)}`, { replace: true });
          }
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [identifier, navigate]);

  // Format INR Currency
    // Price Breakup specific formatting matching screenshot

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

    const price = Number(currentPrice) || 0;
    const quantity = 1;
    const totalItemPrice = price * quantity;
    const addedAt = new Date().toISOString();
    const resolvedDiamondTypeName = isSilver
      ? ''
      : (selectedVariant?.diamondTypeId?.name ||
        selectedVariant?.diamondType?.name ||
        diamondType ||
        'Lab Grown Diamond');

    const resolvedShapeName =
      selectedVariant?.diamondShapeId?.name ||
      selectedVariant?.diamondShape?.name ||
      '';

    const resolvedClarityName = selectedQuality ||
      selectedVariant?.diamondClarityId?.name ||
      '';

    const resolvedColorName =
      selectedVariant?.diamondColorId?.name ||
      '';

    let selectedAttributes = null;
    if (isGold) {
      const attrs = {
        metalPurity: selectedPurity || '9KT Gold',
        metalColor: selectedColor || 'Rose Gold',
        diamondType: resolvedDiamondTypeName,
        diamondShape: cleanAttribute(resolvedShapeName),
        diamondClarity: cleanAttribute(resolvedClarityName),
        diamondColor: cleanAttribute(resolvedColorName),
        caratWeight: Number(selectedVariant?.caratWeight || selectedCarat || 0) || null,
        size: resolvedSizeName || null,
        metalPurityId: selectedVariant?.metalPurityId?._id || selectedVariant?.metalPurityId || product.metalPurityIds?.[0]?._id || product.metalPurityIds?.[0] || null,
        metalColorId: selectedVariant?.metalColorId?._id || selectedVariant?.metalColorId?.id || selectedVariant?.metalColorId || product.metalColors?.[0]?.id || product.metalColors?.[0]?._id || product.metalColorIds?.[0]?._id || product.metalColorIds?.[0] || null,
        diamondTypeId: selectedVariant?.diamondTypeId?._id || selectedVariant?.diamondTypeId || null,
        diamondShapeId: selectedVariant?.diamondShapeId?._id || selectedVariant?.diamondShapeId || null,
        diamondClarityId: selectedVariant?.diamondClarityId?._id || selectedVariant?.diamondClarityId || null,
        diamondColorId: selectedVariant?.diamondColorId?._id || selectedVariant?.diamondColorId || null,
      };
      const validEntries = Object.entries(attrs).filter(([, val]) => val !== null && val !== undefined && val !== '');
      if (validEntries.length > 0) {
        selectedAttributes = Object.fromEntries(validEntries);
      }
    } else {
      const attrs = {
        metalPurity: 'Silver',
        metalColor: 'Silver',
        size: resolvedSizeName || null,
      };
      const validEntries = Object.entries(attrs).filter(([, val]) => val !== null && val !== undefined && val !== '');
      if (validEntries.length > 0) {
        selectedAttributes = Object.fromEntries(validEntries);
      }
    }

    const selectedMetalStr = isGold ? `${selectedPurity} ${selectedColor}`.trim() : 'Silver';

    const cartItem = {
      _id: product._id,
      productId: product._id,
      title: product.basicInfo?.title,
      sku: product.basicInfo?.sku || '',
      price,
      totalItemPrice,
      addedAt,
      quantity,
      image: galleryImages.find((img) => !isVideoMedia(img)) || galleryImages[0] || getPrimaryProductImage(product),
      category: categoryName,
      productType: product.productType,
      selectedMetal: selectedMetalStr,
      selectedSize: resolvedSizeName || '',
      selectedAttributes,
    };

    addToCart(cartItem, 1, {
      selectedMetal: selectedMetalStr,
      selectedSize: resolvedSizeName,
      selectedAttributes,
    });

    setTimeout(() => {
      setAddingToCart(false);
    }, 400);
  };

  // Share state & handlers
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [similarDrawerOpen, setSimilarDrawerOpen] = useState(false);

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      toast.success('Product link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2500);
    } else {
      toast('Share link: ' + window.location.href);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = product?.name || 'Neirah Luxury Jewellery';
    const shareText = `Discover ${product?.name || 'this luxury piece'} on Neirah Fine Jewellery`;

    const shareData = {
      title: shareTitle,
      text: shareText,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // If user cancelled / closed native share window, do not error or open modal
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback: Open in-app luxury share dialog
    setShareModalOpen(true);
  };

  const [localWished, setLocalWished] = useState(null);

  useEffect(() => {
    if (product?.inWishlist !== undefined) {
      setLocalWished(Boolean(product.inWishlist));
    }
  }, [product?.inWishlist]);

  const isItemWishlisted =
    localWished !== null
      ? localWished
      : Boolean(
          product &&
            (product.inWishlist !== undefined
              ? product.inWishlist
              : isWishlisted(product._id) ||
                isWishlisted(product.id) ||
                isWishlisted(product.basicInfo?.slug))
        );

  const handleToggleWishlist = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token && !user) {
      await toggleWishlist(product, isItemWishlisted);
      return;
    }
    const nextState = !isItemWishlisted;
    setLocalWished(nextState);
    try {
      const res = await toggleWishlist(product, isItemWishlisted);
      if (typeof res === 'boolean') {
        setLocalWished(res);
      }
    } catch {
      setLocalWished(!nextState);
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

  return (
    <div className="bg-white text-stone-900 min-h-screen pb-24 lg:pb-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-1.5 sm:py-2.5">
        {/* ─── Breadcrumb Navigation ─── */}
        <nav className="text-[10px] sm:text-[11px] text-stone-400 py-1.5 sm:py-2 flex items-center gap-1.5 overflow-hidden whitespace-nowrap border-b border-stone-100 mb-3 sm:mb-4">
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
          <span className="text-stone-700 font-semibold truncate max-w-[200px] sm:max-w-md">
            {product.basicInfo?.title}
          </span>
        </nav>

        {/* ─── Main Product Section: 2-Column Gallery Grid & Purchase Sidebar ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-start">
          {/* ══════════════════════════════════════════════════════════
              LEFT: Product Studio Image Gallery
              - Mobile (<sm): Interactive horizontal swipe carousel with indicators
              - Desktop (sm+): 2-Column Product Studio Image Grid
          ═══════════════════════════════════════════════════════════ */}

            <ProductGallery
              galleryImages={galleryImages}
              product={product}
              selectedColor={selectedColor}
              openLightboxAtIndex={openLightboxAtIndex}
            />

          <div className="lg:col-span-5 space-y-6">
            {/* Title & Brand */}
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl text-gray-900 font-medium leading-tight tracking-[0.02em] font-poppins">
                {product.basicInfo?.title || ''}
              </h1>

              {/* SKU Reference */}
              {displayedSku && (
                <div className="pt-0.5 pb-1">
                  <span className="text-[11px] sm:text-xs text-stone-500 font-medium tracking-wide">
                    SKU: <span className="font-semibold text-stone-700 tracking-wider font-mono">{displayedSku}</span>
                  </span>
                </div>
              )}
            </div>

            {/* ─── Social Proof & Urgency (Reviews & Sold Counter) ─── */}
            {(() => {
              const spConfig = storeSettings?.socialProof || {};
              const showReviews = spConfig.showReviews !== false;
              const showSold = spConfig.showSoldCounter !== false;
              if (!showReviews && !showSold) return null;

              const soldHours = spConfig.soldTimeHours || 3;
              const soldCount = Number(product?.demoMetrics?.soldCount ?? spConfig.defaultSoldCount ?? 24);
              const displayReviewCount = reviewStats.total > 0 ? reviewStats.total : Number(product?.demoMetrics?.reviewCount ?? spConfig.defaultReviewCount ?? 13);

              if (soldCount <= 0 && displayReviewCount <= 0) return null;

              return (
                <div className="space-y-1.5 sm:space-y-2 pt-0.5 pb-1 select-none">
                  {/* Reviews Star Rating Badge */}
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

                  {/* Hourly Sold Counter Badge */}
                  {showSold && soldCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm leading-none" role="img" aria-label="fire">🔥</span>
                      <span className="text-xs sm:text-sm font-medium text-stone-700">
                        <strong className="font-semibold text-stone-900">{soldCount}</strong> sold in last {soldHours} hours
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Price Row with Wishlist & Share */}
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-100">
              <div className="flex items-baseline flex-wrap gap-2 sm:gap-2.5">
                <span className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight font-sans">
                  {formatPrice(currentPrice)}
                </span>
                {Number(mrpPrice) > Number(currentPrice) && (
                  <span className="text-sm sm:text-base text-stone-400 line-through">
                    {formatPrice(mrpPrice)}
                  </span>
                )}
                <span className="text-[11px] sm:text-xs text-stone-400 font-normal whitespace-nowrap">
                  (MRP Incl. of all taxes)
                </span>
              </div>

              {/* Action Buttons: Wishlist & Share (Styled matching GIVA) */}
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    className="p-1.5 rounded-full hover:bg-rose-50/80 text-stone-400 hover:text-[#e11d48] transition-all cursor-pointer flex items-center justify-center active:scale-90"
                    aria-label={isItemWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {isItemWishlisted ? (
                      <HiHeart className="w-6 h-6 text-[#e11d48] fill-current drop-shadow-xs transition-transform duration-200 scale-105" />
                    ) : (
                      <HiOutlineHeart className="w-6 h-6 transition-transform duration-200 hover:scale-110" />
                    )}
                  </button>
                  {/* Tooltip matching GIVA reference screenshot */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                    <div className="bg-black text-white text-[11px] font-medium px-2.5 py-1 rounded shadow-lg whitespace-nowrap">
                      {isItemWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    </div>
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-black" />
                  </div>
                </div>

                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                    aria-label="Share piece"
                  >
                    <HiOutlineShare className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                    <div className="bg-black text-white text-[11px] font-medium px-2.5 py-1 rounded shadow-lg whitespace-nowrap">
                      Share piece
                    </div>
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-black" />
                  </div>
                </div>

                {/* View Similar Products Button */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => setSimilarDrawerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 hover:border-[#8b6f4e]/60 bg-stone-50/80 hover:bg-[#FAF7F2] text-stone-700 hover:text-[#8b6f4e] transition-all cursor-pointer text-xs font-medium active:scale-95 shadow-2xs"
                    aria-label="View similar products"
                    title="View Similar Products"
                  >
                    <HiSparkles className="w-3.5 h-3.5 text-[#8b6f4e] shrink-0" />
                    <span className="text-[11.5px] font-semibold tracking-wide">Similar</span>
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                    <div className="bg-black text-white text-[11px] font-medium px-2.5 py-1 rounded shadow-lg whitespace-nowrap">
                      View Similar Products
                    </div>
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-black" />
                  </div>
                </div>
              </div>
            </div>

            {/* People Viewing Banner (Live Socket Real Viewer Count) */}
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


            <ProductOffersSection coupons={coupons} />

            {/* ══════════════════════════════════════════════════════════
                VARIANT SELECTORS (Gold Jewelry Only; Silver has no diamond/metal variants)
            ═══════════════════════════════════════════════════════════ */}
            <div className="space-y-4 pt-1">
              {isGold && (
                <>
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

                  {/* 3. Metal Selector: Unified Purity + Color Swatches (Exact Guide Spec) */}
                  {metalSwatches.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-stone-700">
                        Metal: <span className="font-semibold text-stone-900">{metalDisplayName}</span>
                      </label>

                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap mb-2">
                        {purityGroups.map((group) => (
                          <div key={group.key} className="flex items-center gap-2 shrink-0">
                            {group.swatches.map((swatch) => {
                              const isSel = isSwatchSelected(swatch);
                              const metallic = getMetallicColorStyle(swatch.color, swatch.colorCode, swatch.colorCodeEnd);

                              return (
                                <button
                                  key={swatch.id}
                                  type="button"
                                  onClick={() => handleSelectMetalSwatch(swatch)}
                                  className={`relative w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer select-none ${
                                    isSel
                                      ? 'ring-2 ring-black ring-offset-2 ring-offset-white shadow-md scale-105 z-10'
                                      : 'hover:scale-105 opacity-90 hover:opacity-100'
                                  }`}
                                  style={{
                                    background: metallic.background,
                                    boxShadow: isSel ? '0 0 0 2px #ffffff, 0 0 0 4px #000000, 0 4px 12px rgba(0, 0, 0, 0.2)' : metallic.boxShadow,
                                    border: isSel ? '2px solid #000000' : (metallic.border || '1px solid rgba(0, 0, 0, 0.08)'),
                                  }}
                                  title={`${swatch.label} ${swatch.color}`}
                                  aria-label={`${swatch.label} ${swatch.color}`}
                                >
                                  <span
                                    className={`text-[10px] font-bold select-none drop-shadow-sm ${
                                      isSel ? 'text-black' : 'text-gray-800'
                                    }`}
                                    style={{ textShadow: '0 1px 1px rgba(255, 255, 255, 0.7)' }}
                                  >
                                    {swatch.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Standalone Color Selector (For products with distinct color variants / swatches) */}
              {(!isGold || metalSwatches.length === 0) && colors.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1 text-xs sm:text-[13px] text-stone-700">
                    <span>Color:</span>
                    <span className="font-bold text-stone-900 capitalize">{selectedColor || colors[0]?.name}</span>
                  </div>

                  <div className="flex items-center gap-3.5 sm:gap-4 flex-wrap">
                    {colors.map((c) => {
                      const isSel = selectedColor?.toLowerCase() === c.name?.toLowerCase();

                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => {
                            setSelectedColor(c.name);
                          }}
                          className="flex flex-col items-center gap-1.5 cursor-pointer group focus:outline-none"
                          title={c.name}
                          aria-label={`Select color ${c.name}`}
                        >
                          {/* Circular Swatch with active dark ring & white gap matching screenshot */}
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all flex items-center justify-center p-0.5 relative ${
                              isSel
                                ? 'ring-2 ring-black ring-offset-2 ring-offset-white scale-105 shadow-md'
                                : 'ring-1 ring-stone-200/90 hover:ring-stone-400 group-hover:scale-105 opacity-90 hover:opacity-100'
                            }`}
                          >
                            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border border-stone-200 bg-white">
                              {c.variantIcon ? (
                                <img
                                  src={c.variantIcon}
                                  alt={c.name}
                                  className="w-full h-full object-cover rounded-full"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-full h-full rounded-full relative overflow-hidden"
                                  style={{
                                    background: getMetallicColorStyle(c.name, c.colorCode, c.colorCodeEnd).background,
                                    boxShadow: getMetallicColorStyle(c.name, c.colorCode, c.colorCodeEnd).boxShadow,
                                  }}
                                >
                                  <span
                                    className="absolute inset-0 rounded-full pointer-events-none"
                                    style={{
                                      background:
                                        'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 28%, rgba(255,255,255,0) 55%)',
                                    }}
                                    aria-hidden="true"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Color label underneath swatch */}
                          <span
                            className={`text-[11px] sm:text-xs font-semibold capitalize tracking-tight transition-colors ${
                              isSel ? 'text-stone-900 font-bold' : 'text-stone-600 group-hover:text-stone-900'
                            }`}
                          >
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Size Selection (If Applicable) */}
              {sortedSizes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="product-size" className="block text-[11px] font-bold text-stone-800">
                      {sizeLabel}
                    </label>
                    {hasCategorySizeChart && (
                      <button
                        type="button"
                        onClick={() => setShowSizeModal(true)}
                        className="text-[11px] font-bold text-stone-900 hover:text-[#8f6d43] uppercase tracking-wider underline underline-offset-2 cursor-pointer transition-colors"
                      >
                        SIZE CHART
                      </button>
                    )}
                  </div>
                  <Dropdown
                    id="product-size"
                    direction="down"
                    value={selectedSize}
                    onChange={(val) => setSelectedSize(val)}
                    options={sortedSizes.map((size) => ({
                      value: String(size._id || size.id || size.name || size),
                      label: size.name || String(size),
                    }))}
                    placeholder="Choose a size"
                    buttonClassName="w-full h-11 px-3.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-800 hover:border-stone-300 focus:outline-none focus:border-[#8f6d43] flex items-center justify-between cursor-pointer"
                    menuClassName="z-[50]"
                  />
                </div>
              )}

              {/* If no size options configured on product but category has a size chart, provide the SIZE CHART link */}
              {sizes.length === 0 && hasCategorySizeChart && (
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSizeModal(true)}
                    className="text-[11px] font-bold text-stone-900 hover:text-[#8f6d43] uppercase tracking-wider underline underline-offset-2 cursor-pointer transition-colors"
                  >
                    SIZE CHART
                  </button>
                </div>
              )}

              {/* 4. Solitaire Center Diamond Carat Weight Dropdown */}
              {isCenterDriven && carats.length > 0 && (
                <div className="space-y-1.5">
                  <label htmlFor="carat-select" className="block text-[11px] font-bold text-stone-700">
                    Total Center Diamond Weight
                  </label>
                  <Dropdown
                    id="carat-select"
                    direction="down"
                    value={selectedCarat}
                    onChange={(val) => setSelectedCarat(Number(val))}
                    options={carats.map((ct) => ({ value: ct, label: `${ct} CT` }))}
                    placeholder="Select Carat"
                    buttonClassName="w-full h-11 px-3.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-800 hover:border-stone-300 focus:outline-none focus:border-[#8f6d43] flex items-center justify-between cursor-pointer"
                    menuClassName="z-[50]"
                  />
                </div>
              )}
            </div>

            {/* ─── ADD TO CART Button Row ─── */}
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
                THE NEIRAH DIFFERENCE (Matches Reference Screenshot)
            ═══════════════════════════════════════════════════════════ */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 mb-6 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 pb-3.5 border-b border-stone-200 font-sans">
                THE NEIRAH DIFFERENCE
              </h3>


              <ProductTrustBadges
                isGold={isGold}
                certificateUrl={certificateUrl}
                onOpenCertificate={openCertificateModal}
              />
            </div>


            {/* ══════════════════════════════════════════════════════════
                ACCORDIONS: PRODUCT DESCRIPTION, SPECIFICATION, PRICE BREAK UP & ORIGIN
            ═══════════════════════════════════════════════════════════ */}
            <ProductAccordions
              product={product}
              productSpecs={productSpecs}
              isGold={isGold}
              breakdown={breakdown}
            />
          </div>
        </div>

        {/* ─── CUSTOMER REVIEWS & RATINGS SECTION ─── */}
        <ProductReviewsSection
          reviewsLoading={reviewsLoading}
          sortedReviews={sortedReviews}
        />

        {/* ─── MOST LIKED PIECES ─── */}
        <ProductSimilarPieces mostLikedProducts={mostLikedProducts} />
      </div>

      {/* ─── Luxury High-Resolution Image Viewer Lightbox Modal ─── */}
      <ProductImageLightboxModal
        isOpen={lightboxIndex !== null}
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndex}
        onClose={closeLightbox}
        galleryImages={galleryImages}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        modalColorsToRender={modalColorsToRender}
      />

      {/* ─── Category Size Chart Download Modal ─── */}
      <ProductSizeGuideModal
        isOpen={showSizeModal}
        onClose={() => setShowSizeModal(false)}
        sizeChart={sizeChart}
        categoryName={categoryName}
      />

      {/* ─── Luxury Authenticity & Grading Certificate Viewer Modal ─── */}
      <ProductCertificateModal
        isOpen={showCertificateModal}
        onClose={closeCertificateModal}
        certificateUrl={certificateUrl}
        product={product}
      />

      {/* ─── Mobile Sticky Bottom Action Bar ─── */}
      <ProductMobileBottomBar
        currentPrice={currentPrice}
        formatPrice={formatPrice}
        handleAddToCart={handleAddToCart}
        addingToCart={addingToCart}
        handleToggleWishlist={handleToggleWishlist}
        isItemWishlisted={isItemWishlisted}
      />

      {/* ─── Luxury Share Modal ─── */}
      <ProductShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        product={product}
        galleryImages={galleryImages}
        currentPrice={currentPrice}
        formatPrice={formatPrice}
      />

      {/* ─── Write a Review Modal ─── */}
      <ProductWriteReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        newReview={newReview}
        setNewReview={setNewReview}
        onSubmit={handleReviewSubmit}
        submittingReview={submittingReview}
      />

      {/* Similar Products Bottom Slide-Up Drawer */}
      <SimilarProductsDrawer
        open={similarDrawerOpen}
        onClose={() => setSimilarDrawerOpen(false)}
        productId={product?._id || product?.id}
        currentProduct={product}
      />
    </div>
  );
}
