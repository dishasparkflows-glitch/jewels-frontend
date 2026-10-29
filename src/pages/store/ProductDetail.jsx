import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShare,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineInformationCircle,
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
} from 'react-icons/hi';
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
import { productsAPI, couponsAPI } from '../../api/services';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { getValidProductImages, getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';
import { trackProductView } from '../../config/firebase';
import { useLiveViewers } from '../../hooks/useLiveViewers';
import Dropdown from '../../components/common/Dropdown';
import { formatPriceWithDecimals as formatPrice } from '../../utils/currency';

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
function ZoomableProductImage({ image, alt, index, onOpenLightbox }) {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  const isVideo = isVideoMedia(image);
  const LENS_SIZE = 160;
  const ZOOM_FACTOR = 2.6;

  const handleMouseMove = (e) => {
    if (isVideo || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    setCoords({
      x,
      y,
      width: rect.width,
      height: rect.height,
    });
  };

  const handleMouseEnter = (e) => {
    if (!isVideo) {
      handleMouseMove(e);
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const lensLeft = coords.width > 0
    ? Math.max(0, Math.min(coords.x - LENS_SIZE / 2, coords.width - LENS_SIZE))
    : 0;
  const lensTop = coords.height > 0
    ? Math.max(0, Math.min(coords.y - LENS_SIZE / 2, coords.height - LENS_SIZE))
    : 0;

  return (
    <div
      ref={containerRef}
      onClick={onOpenLightbox}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseLeave}
      className={`group relative aspect-square bg-[#fbf9f6] rounded-sm overflow-hidden border border-stone-100 flex items-center justify-center p-4 sm:p-6 select-none ${isVideo ? 'cursor-pointer' : 'cursor-crosshair'}`}
    >
      {isVideo ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={image}
            autoPlay
            loop
            muted
            playsInline
            controls
            preload="metadata"
            className="w-full h-full object-contain rounded-sm"
          />
        </div>
      ) : (
        <img
          src={image}
          alt={alt}
          className="w-full h-full object-contain pointer-events-none"
          loading={index < 2 ? 'eager' : 'lazy'}
        />
      )}

      {/* Floating Magnifier Loupe Lens (Images only) */}
      {!isVideo && isHovered && coords.width > 0 && (
        <div
          className="absolute pointer-events-none z-30 border border-white/90 rounded-sm overflow-hidden bg-[#fbf9f6]"
          style={{
            width: `${LENS_SIZE}px`,
            height: `${LENS_SIZE}px`,
            left: `${lensLeft}px`,
            top: `${lensTop}px`,
            boxShadow:
              '0 16px 36px -4px rgba(0, 0, 0, 0.35), 0 6px 14px -2px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.7)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: `${coords.width}px`,
              height: `${coords.height}px`,
              left: `${-lensLeft}px`,
              top: `${-lensTop}px`,
              transformOrigin: `${coords.x}px ${coords.y}px`,
              transform: `scale(${ZOOM_FACTOR})`,
            }}
            className="flex items-center justify-center p-4 sm:p-6 bg-[#fbf9f6]"
          >
            <img
              src={image}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Fullscreen Expansion Hint (Images only) */}
      {!isVideo && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none z-10">
          Click to expand
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { id, slug } = useParams();
  const identifier = slug || id;
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  // Product state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostLikedProducts, setMostLikedProducts] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [coupons, setCoupons] = useState([
    {
      _id: 'default-firstorder',
      coupon: { code: 'FIRSTORDER', description: 'Valid on your first fine jewelry purchase' },
      discount: { type: 'Percentage', value: 10, minimumOrderAmount: 0 }
    }
  ]);
  const [offersOpen, setOffersOpen] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    couponsAPI
      .getLookup()
      .then(({ data }) => {
        const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        const active = list.filter((c) => c.status === 'active' || !c.status);
        if (active.length > 0) {
          setCoupons(active);
        }
      })
      .catch(() => {});
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
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isLightboxDragging, setIsLightboxDragging] = useState(false);
  const [isLightboxFullscreen, setIsLightboxFullscreen] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const thumbnailContainerRef = useRef(null);

  const openLightboxAtIndex = (idx) => {
    setLightboxIndex(idx);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setIsLightboxFullscreen(false);
  };

  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const { settings: storeSettings } = useStoreSettings();

  const certificateUrl =
    product?.certificateImage?.url ||
    storeSettings?.certificateImage?.url ||
    'https://pub-82427c7fd20e4acaa4bdb3b933c0a3bf.r2.dev/certificates/certificate-1792672361210-d82f.png';

  // Mobile Gallery Carousel State & Handlers
  const mobileGalleryRef = useRef(null);
  const [activeMobileSlide, setActiveMobileSlide] = useState(0);

  const handleMobileGalleryScroll = (e) => {
    const el = e.currentTarget;
    if (el && el.clientWidth > 0) {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActiveMobileSlide(idx);
    }
  };

  const scrollToMobileSlide = (idx) => {
    if (mobileGalleryRef.current) {
      mobileGalleryRef.current.scrollTo({
        left: idx * mobileGalleryRef.current.clientWidth,
        behavior: 'smooth',
      });
      setActiveMobileSlide(idx);
    }
  };

  // Accordion active sections (multiple can be open simultaneously)
  const [openAccordions, setOpenAccordions] = useState({
    desc: false,
    specs: false,
    price: false,
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

      const cObj = v.metalColorId;
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
        const cObj = ci.metalColorId;
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

    // Default fallback to 3 core luxury colors if none configured (only for gold/non-silver products)
    if (cMap.size === 0 && product?.productType !== 'silver' && !product?.isOrnate) {
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

  const isSilver = (product?.productType === 'silver') || Boolean(product?.isOrnate);
  const isGold = !isSilver && ((product?.productType === 'gold') || !product?.productType || /gold/i.test(product?.basicInfo?.title || product?.title || ''));

  // Auto-initialize options on product load
  useEffect(() => {
    if (!product || !isGold) return;
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
  }, [product, isGold, purities, colors, carats, qualities, selectedPurity, selectedColor, selectedCarat, selectedQuality]);

  // Swatches for the combined Metal (Purity + Color) selector matching Neirah standard
  // Swatches for the combined Metal (Purity + Color) selector
  const metalSwatches = useMemo(() => {
    if (!isGold) {
      return [];
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
  }, [product, purities, colors, isGold]);

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
    if (!isGold) {
      return product?.specifications?.metalName || '925 Sterling Silver';
    }
    const pStr = (selectedPurity || '').replace(/ Gold/i, '').trim();
    const cStr = (selectedColor || '').trim();

    if (pStr && cStr) {
      return `${pStr} ${cStr}`;
    }
    return pStr || cStr || product?.specifications?.metalName || 'Gold';
  }, [selectedPurity, selectedColor, product, isGold]);

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
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, galleryImages.length]);

  const handleLightboxMouseDown = (e) => {
    if (lightboxZoom <= 1) return;
    setIsLightboxDragging(true);
    dragStartRef.current = {
      x: e.clientX - lightboxPan.x,
      y: e.clientY - lightboxPan.y,
    };
  };

  const handleLightboxMouseMove = (e) => {
    if (!isLightboxDragging || lightboxZoom <= 1) return;
    const maxPan = (lightboxZoom - 1) * 250;
    const newX = Math.max(-maxPan, Math.min(maxPan, e.clientX - dragStartRef.current.x));
    const newY = Math.max(-maxPan, Math.min(maxPan, e.clientY - dragStartRef.current.y));
    setLightboxPan({ x: newX, y: newY });
  };

  const handleLightboxMouseUp = () => {
    setIsLightboxDragging(false);
  };

  const handleLightboxDoubleClick = () => {
    if (lightboxZoom > 1) {
      setLightboxZoom(1);
      setLightboxPan({ x: 0, y: 0 });
    } else {
      setLightboxZoom(2);
    }
  };

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
      return { name: cName, gradient: grad };
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

    // 1. Exact match across all active dimensions
    let match = raw.find((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      const c = referenceName(v.metalColorId) || v.color || '';
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

  // isGold and isSilver are declared above
  const currentPrice = [selectedVariant?.price, product?.pricing?.salePrice]
    .find((value) => Number(value) > 0);
  const mrpPrice = [product?.pricing?.mrp].find((value) => Number(value) > 0) ?? currentPrice;
  // Itemized Transparent Price Breakdown (Matches Screenshot)
  const breakdown = useMemo(() => {
    if (!isGold) return null;
    const v = selectedVariant || {};
    const finalPrice = Number(
      v.price ||
      currentPrice ||
      product?.pricing?.salePrice ||
      product?.pricing?.calculatedPrice ||
      product?.pricing?.ornatePrice ||
      0
    );

    if (!finalPrice || finalPrice <= 0) return null;

    const gstPct = Number(product?.pricing?.gstPercentage || 3) / 100;
    const computedSubtotal = Math.round((finalPrice / (1 + gstPct)) * 100) / 100;

    const certificateCharge = Number(v.certificateCharge || product?.pricing?.certificateCharge || 1000);

    let labourCharge = Number(
      v.labourCharge ||
      v.computedMakingCharge ||
      product?.pricing?.baseLabourCharge ||
      product?.ornate?.labourAmt ||
      0
    );
    if (!labourCharge || labourCharge <= 0) {
      labourCharge = Math.round((computedSubtotal - certificateCharge) * 0.09);
    }

    const purityName = (selectedPurity || v.purity || '').toUpperCase();
    let defaultMetalRate = 5587.5; // default 9KT matching screenshot
    if (purityName.includes('14K') || purityName.includes('14KT')) defaultMetalRate = 6850;
    else if (purityName.includes('18K') || purityName.includes('18KT')) defaultMetalRate = 8450;
    else if (purityName.includes('22K') || purityName.includes('22KT')) defaultMetalRate = 9800;
    else if (purityName.includes('SILVER') || purityName.includes('925')) defaultMetalRate = 95;

    const metalRate = Number(v.metalRate || product?.pricing?.metalRate || defaultMetalRate);

    let metalWeight = Number(
      v.metalWeight ||
      v.weight ||
      product?.specifications?.metalWeight ||
      product?.specifications?.grossWeight ||
      product?.specifications?.netWeight ||
      product?.ornate?.metalWeight ||
      0
    );

    let metalCost = Number(v.metalCost || product?.ornate?.goldAmt || 0);
    if (!metalCost && metalWeight && metalRate) {
      metalCost = Math.round(metalWeight * metalRate * 100) / 100;
    }

    const diamondQuality = selectedQuality || (v.diamondColor && v.diamondClarity ? `${referenceName(v.diamondColor)} / ${referenceName(v.diamondClarity)}` : 'F-G / VS');
    let diamondCarat = Number(
      v.centerDiamondWeight ||
      v.caratWeight ||
      selectedCarat ||
      product?.specifications?.diamondWeight ||
      product?.ornate?.carat ||
      0
    );

    let diamondCost = Number(v.diamondCost || v.centerDiamondCost || product?.ornate?.diamondAmt || 0);

    const remainingForMaterial = Math.max(0, computedSubtotal - certificateCharge - labourCharge);
    if (!metalCost || !diamondCost) {
      if (isGold || !product?.productType || product?.productType === 'gold') {
        if (!metalCost) {
          metalCost = Math.round(remainingForMaterial * 0.35 * 100) / 100;
        }
        if (!diamondCost) {
          diamondCost = Math.round((remainingForMaterial - metalCost) * 100) / 100;
        }
      } else {
        metalCost = remainingForMaterial;
        diamondCost = 0;
      }
    }

    if (!metalWeight && metalRate > 0 && metalCost > 0) {
      metalWeight = Math.round((metalCost / metalRate) * 1000) / 1000;
    }

    if (!diamondCarat && diamondCost > 0) {
      diamondCarat = Math.round((diamondCost / 19000) * 100) / 100;
    }

    const calculatedSubtotal = Math.round((metalCost + diamondCost + labourCharge + certificateCharge) * 100) / 100;
    const finalSubtotal = calculatedSubtotal;
    const finalGst = Math.round((finalSubtotal * gstPct) * 100) / 100;
    const finalGrandTotal = Math.round((finalSubtotal + finalGst) * 100) / 100;

    return {
      metalName: metalDisplayName || '9KT Yellow Gold',
      metalRate,
      metalWeight,
      metalCost,
      diamondLabel: `Diamond (${diamondQuality})`,
      diamondCarat,
      diamondCost,
      labourCharge,
      certificateCharge,
      subtotal: finalSubtotal,
      gstAmount: finalGst,
      finalPrice: finalGrandTotal,
    };
  }, [selectedVariant, currentPrice, product, selectedPurity, selectedColor, selectedCarat, selectedQuality, isGold, metalDisplayName]);



  // Derive available sizes directly from product data without extra API calls
  useEffect(() => {
    const prodSizes = product?.sizes || product?.availableSizes || [];
    setSizes(Array.isArray(prodSizes) ? prodSizes : []);
    setSelectedSize('');
  }, [product]);

  // Fetch product data
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const res = await productsAPI.getById(identifier);
        const prodData = res.data?.data || res.data;
        if (prodData) {
          setProduct(prodData);
          trackProductView(prodData);

          // Use related products directly from product payload if provided
          if (Array.isArray(prodData.relatedProducts) && prodData.relatedProducts.length > 0) {
            setMostLikedProducts(prodData.relatedProducts.slice(0, 6));
          } else {
            setMostLikedProducts([]);
          }

          const activeSlug =
            prodData.basicInfo?.slug ||
            prodData.slug ||
            (prodData.basicInfo?.title || prodData.title || prodData.name
              ? String(prodData.basicInfo?.title || prodData.title || prodData.name)
                  .toLowerCase()
                  .trim()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')
              : '');
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
  const formatBreakdownValue = (val) => {
    if (val === undefined || val === null || val === '' || isNaN(val)) return '-';
    const num = Number(val);
    if (num === 0) return '-';
    if (num % 1 !== 0) {
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatBreakdownRate = (val) => {
    if (!val || isNaN(val) || Number(val) === 0) return '-';
    const num = Number(val);
    if (num % 1 !== 0) {
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}/g`;
    }
    return `₹${num.toLocaleString('en-IN')}/g`;
  };

  const formatBreakdownWeight = (val, unit = 'g') => {
    if (!val || isNaN(val) || Number(val) === 0) return '-';
    const num = Number(val);
    return `${num.toLocaleString('en-IN', { maximumFractionDigits: 3 })} ${unit}`;
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

    const price = Number(currentPrice) || 0;
    const quantity = 1;
    const totalItemPrice = price * quantity;
    const addedAt = new Date().toISOString();
    const isGold = (product.productType === 'gold');

    let selectedAttributes = null;
    if (isGold) {
      const attrs = {
        metalPurity: selectedVariant?.metalPurityId?._id || selectedVariant?.metalPurityId || product.metalPurityIds?.[0]?._id || product.metalPurityIds?.[0] || null,
        metalColor: selectedVariant?.metalColorId?._id || selectedVariant?.metalColorId || product.metalColorIds?.[0]?._id || product.metalColorIds?.[0] || null,
        diamondType: selectedVariant?.diamondTypeId?._id || selectedVariant?.diamondTypeId || null,
        diamondShape: selectedVariant?.diamondShapeId?._id || selectedVariant?.diamondShapeId || null,
        diamondClarity: selectedVariant?.diamondClarityId?._id || selectedVariant?.diamondClarityId || null,
        diamondColor: selectedVariant?.diamondColorId?._id || selectedVariant?.diamondColorId || null,
        caratWeight: Number(selectedVariant?.caratWeight || selectedCarat || 0) || null,
        size: selectedSize || null,
      };
      const validEntries = Object.entries(attrs).filter(([, val]) => val !== null && val !== undefined && val !== '');
      if (validEntries.length > 0) {
        selectedAttributes = Object.fromEntries(validEntries);
      }
    }

    const selectedMetalStr = `${selectedPurity} ${selectedColor}`.trim();

    const cartItem = {
      _id: product._id,
      productId: product._id,
      title: product.basicInfo?.title,
      price,
      totalItemPrice,
      addedAt,
      quantity,
      image: galleryImages.find((img) => !isVideoMedia(img)) || galleryImages[0] || getPrimaryProductImage(product),
      category: categoryName,
      productType: product.productType,
      selectedMetal: selectedMetalStr,
      selectedSize: selectedSize || '',
      selectedAttributes,
    };

    addToCart(cartItem, 1, {
      selectedMetal: selectedMetalStr,
      selectedSize,
      selectedAttributes,
    });

    setTimeout(() => {
      setAddingToCart(false);
    }, 400);
  };

  // Share state & handlers
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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
                isWishlisted(product.basicInfo?.slug) ||
                isWishlisted(product.slug))
        );

  const handleToggleWishlist = async () => {
    const nextState = !isItemWishlisted;
    setLocalWished(nextState);
    try {
      await toggleWishlist(product);
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

  const specificationRows = isGold
    ? [
        ['Metal', metalDisplayName || product.specifications?.metalName || 'Gold'],
        ['Diamond Type', diamondType],
        ['Diamond Color · Clarity', selectedQuality || '—'],
        ['Center Diamond Weight', selectedCarat ? `${selectedCarat} ct` : (breakdown?.centerCarat ? `${breakdown.centerCarat} ct` : '—')],
        ['Gross Weight', breakdown?.metalWeight ? `${breakdown.metalWeight} g` : (product.specifications?.metalWeight ? `${product.specifications.metalWeight} g` : '—')],
        ['Net Weight', breakdown?.metalWeight ? `${breakdown.metalWeight} g` : '—'],
        ['Size', selectedSize || (sizes.length > 0 ? 'Standard' : null)],
      ].filter(([, value]) => value !== undefined && value !== null && value !== '')
    : [
        ['Metal', product.specifications?.metalName || '925 Sterling Silver'],
        ['Gross Weight', product.specifications?.metalWeight ? `${product.specifications.metalWeight} g` : (product.ornate?.grossWeight ? `${product.ornate.grossWeight} g` : null)],
        ['Net Weight', product.specifications?.metalWeight ? `${product.specifications.metalWeight} g` : (product.ornate?.netWeight ? `${product.ornate.netWeight} g` : null)],
        ['Purity', product.specifications?.purity || (product.ornate?.purity ? `${product.ornate.purity}` : '92.5')],
        ['Size', selectedSize || null],
      ].filter(([, value]) => value !== undefined && value !== null && value !== '');

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
          <div className="lg:col-span-7">
            {galleryImages.length > 0 ? (
              <div className="sticky top-24 space-y-2.5">
                {/* Mobile Slider View (< sm) */}
                <div className="sm:hidden relative">
                  <div
                    ref={mobileGalleryRef}
                    onScroll={handleMobileGalleryScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory gap-2 no-scrollbar rounded-2xl"
                  >
                    {galleryImages.map((image, index) => (
                      <div
                        key={`mob-${image}-${index}`}
                        className="w-full min-w-full snap-center shrink-0"
                      >
                        <ZoomableProductImage
                          image={image}
                          index={index}
                          alt={`${product.basicInfo?.title || 'Fine Jewelry'} ${selectedColor} view ${index + 1}`}
                          onOpenLightbox={() => openLightboxAtIndex(index)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Mobile Indicator Dots */}
                  {galleryImages.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-2">
                      {galleryImages.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() => scrollToMobileSlide(dotIdx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            activeMobileSlide === dotIdx
                              ? 'w-5 bg-[#8b6f4e]'
                              : 'w-1.5 bg-stone-300'
                          }`}
                          aria-label={`Go to slide ${dotIdx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop 2-Column Studio Grid (sm+) */}
                <div className="hidden sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
                  {galleryImages.map((image, index) => (
                    <ZoomableProductImage
                      key={`${image}-${index}`}
                      image={image}
                      index={index}
                      alt={`${product.basicInfo?.title || 'Fine Jewelry'} ${selectedColor} view ${index + 1}`}
                      onOpenLightbox={() => openLightboxAtIndex(index)}
                    />
                  ))}
                </div>
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
              <h1 className="text-xl sm:text-2xl text-gray-900 mb-2 font-medium leading-tight tracking-[0.02em] font-poppins">
                {product.basicInfo?.title || product?.title || ''}
              </h1>
            </div>

            {/* ─── Social Proof & Urgency (Reviews & Sold Counter) ─── */}
            {(() => {
              const spConfig = storeSettings?.socialProof || {};
              const showReviews = spConfig.showReviews !== false;
              const showSold = spConfig.showSoldCounter !== false;
              if (!showReviews && !showSold) return null;

              const soldHours = spConfig.soldTimeHours || 3;
              const soldCount = Number(product?.demoMetrics?.soldCount ?? spConfig.defaultSoldCount ?? 24);
              const reviewCount = Number(product?.demoMetrics?.reviewCount ?? spConfig.defaultReviewCount ?? 13);

              if (soldCount <= 0 && reviewCount <= 0) return null;

              return (
                <div className="space-y-1.5 sm:space-y-2 pt-0.5 pb-1 select-none">
                  {/* Reviews Star Rating Badge */}
                  {showReviews && reviewCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center text-amber-400 text-xs sm:text-sm tracking-normal leading-none" aria-label="5 star rating">
                        ★★★★★
                      </div>
                      <span className="text-xs sm:text-sm text-stone-600 font-medium">
                        <strong className="font-semibold text-stone-900">{reviewCount}</strong> reviews
                      </span>
                    </div>
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
                {!isGold && Number(mrpPrice) > Number(currentPrice) && (
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

            {/* ══════════════════════════════════════════════════════════
                AVAILABLE OFFERS (Luxury Ticket & Celestial Sparkle)
            ═══════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E8DEC9] bg-gradient-to-br from-[#FCFAF6] via-[#FDFCF9] to-[#F7F2E8] p-3.5 sm:p-4 shadow-[0_2px_14px_rgba(139,111,78,0.06)] transition-all">
              {/* Celestial 8-Point Diamond Starburst Watermark (Matches Neirah Screenshot) */}
              <svg
                className="absolute -top-3 -right-3 w-20 h-20 text-[#C19B65]/35 pointer-events-none select-none"
                viewBox="0 0 100 100"
                fill="none"
              >
                <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
                <line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
                <polygon
                  points="50,26 55,45 74,50 55,55 50,74 45,55 26,50 45,45"
                  fill="currentColor"
                  fillOpacity="0.28"
                />
                <circle cx="50" cy="50" r="2.5" fill="currentColor" fillOpacity="0.7" />
              </svg>

              {/* Header Row: Tag Icon + Title + Toggle */}
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setOffersOpen((prev) => !prev)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#8b6f4e]/10 border border-[#8b6f4e]/20 flex items-center justify-center text-[#8b6f4e] shadow-2xs">
                    <HiOutlineTag className="w-3.5 h-3.5 -rotate-12 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#8b6f4e] font-poppins">
                    AVAILABLE OFFERS
                  </span>
                  {coupons.length > 1 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#8b6f4e]/12 text-[#8b6f4e]">
                      {coupons.length} Offers
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[#8b6f4e]">
                  <span className="text-[10.5px] font-medium text-stone-500 hidden sm:inline">
                    {offersOpen ? 'Hide' : 'View Offers'}
                  </span>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-[#8b6f4e]/10 transition-colors">
                    <HiChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        offersOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Offers List */}
              {offersOpen && (
                <div className="mt-3 space-y-2.5">
                  {coupons.map((c, idx) => {
                    const code = c.coupon?.code || 'FIRSTORDER';
                    const isPercentage = c.discount?.type === 'Percentage';
                    const discountVal = Number(c.discount?.value || 0);
                    const discountText = isPercentage
                      ? `${discountVal}% Off`
                      : `₹${discountVal.toLocaleString('en-IN')} Off`;



                    const isCopied = copiedCode === code;

                    return (
                      <div
                        key={c._id || code || idx}
                        className="relative group bg-white/95 hover:bg-white rounded-xl border border-[#EDE3D3] hover:border-[#8b6f4e]/50 p-3 sm:p-3.5 transition-all duration-200 shadow-[0_2px_8px_rgba(139,111,78,0.04)] hover:shadow-[0_4px_14px_rgba(139,111,78,0.08)]"
                      >
                        {/* Perforated Voucher Ticket Notches (Left & Right) */}
                        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#f8f3ea] border-r border-[#EDE3D3] pointer-events-none" />
                        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#f8f3ea] border-l border-[#EDE3D3] pointer-events-none" />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
                          {/* Left Details: Dashed Code Badge + Discount + Savings Tag */}
                          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                            {/* Dashed Code Badge */}
                            <button
                              type="button"
                              onClick={() => handleCopyCoupon(code)}
                              className="group/badge relative flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-dashed border-[#C5A880] bg-[#FAF5EE] hover:bg-[#F3EAD9] text-[#785934] font-mono font-bold text-xs tracking-wider cursor-pointer hover:border-[#8b6f4e] transition-all select-all shadow-2xs"
                              title="Click to copy coupon code"
                            >
                              <span>{code}</span>
                              <HiOutlineDuplicate className="w-3.5 h-3.5 text-[#8b6f4e] opacity-60 group-hover/badge:opacity-100 transition-opacity" />
                            </button>

                            {/* Discount Highlight */}
                            <div className="flex items-baseline gap-2">
                              <span className="text-[13px] sm:text-sm font-bold text-stone-900 tracking-tight font-poppins">
                                {discountText}
                              </span>
                            </div>
                          </div>

                          {/* Right: Action Button & Minimum Order Condition */}
                          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#f2eae0]">
                            {c.discount?.minimumOrderAmount > 0 && (
                              <span className="text-[10px] text-stone-400 font-medium">
                                Min. order ₹{Number(c.discount.minimumOrderAmount).toLocaleString('en-IN')}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCopyCoupon(code)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                                isCopied
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-[#8b6f4e] hover:bg-[#785e40] text-white shadow-xs'
                              }`}
                              title={isCopied ? 'Code copied!' : 'Copy code to clipboard'}
                            >
                              {isCopied ? (
                                <>
                                  <FaCheck className="w-3 h-3" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <span>Copy Code</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>


                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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

                  {/* 3. Metal Selector: Unified Purity + Color Swatches (Matches Neirah Screenshot) */}
                  {metalSwatches.length > 0 && (
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
                  )}

                  {/* 4. Solitaire Center Diamond Carat Weight Dropdown (Matches Screenshot 2) */}
                  {isCenterDriven && carats.length > 0 && (
                    <div className="space-y-1.5">
                      <label htmlFor="carat-select" className="block text-[11px] font-bold text-stone-700">
                        Total Center Diamond Weight
                      </label>
                      <Dropdown
                        id="carat-select"
                        value={selectedCarat}
                        onChange={(val) => setSelectedCarat(Number(val))}
                        options={carats.map((ct) => ({ value: ct, label: `${ct} CT` }))}
                        placeholder="Select Carat"
                        buttonClassName="w-full h-11 px-3.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-800 hover:border-stone-300 focus:outline-none focus:border-[#8f6d43] flex items-center justify-between cursor-pointer"
                        menuClassName="z-[50]"
                      />
                    </div>
                  )}
                </>
              )}

              {/* 5. Size Selection (If Applicable) */}
              {sizes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="product-size" className="block text-[11px] font-bold text-stone-800">Size</label>
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
                    value={selectedSize}
                    onChange={(val) => setSelectedSize(val)}
                    options={sizes.map((size) => ({ value: size.name, label: size.name }))}
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
            <div className="rounded-2xl border border-[#ede3d4] bg-[#FAF8F5] p-5 sm:p-6 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 pb-3.5 border-b border-[#e8dfd5] font-sans">
                THE NEIRAH DIFFERENCE
              </h3>

              <div className="pt-4 flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-[#e8dfd5]">
                {/* Left side: Trust Badges */}
                <div className="flex-1 w-full grid grid-cols-2 gap-y-5 gap-x-4 sm:gap-x-6">
                  {/* Badge 1: Global Online Jeweller */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200/90 flex items-center justify-center text-stone-700 shrink-0 shadow-2xs">
                      <svg className="w-4 h-4 text-stone-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="9" r="6" />
                        <path d="M8.5 14.5L6 21l6-3.5 6 3.5-2.5-6.5" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-medium text-stone-700 leading-tight">
                      Global Online Jeweller
                    </span>
                  </div>

                  {/* Badge 2: BIS Hallmark */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200/90 flex items-center justify-center text-stone-700 shrink-0 shadow-2xs">
                      <HiOutlineInformationCircle className="w-4.5 h-4.5 text-stone-700" />
                    </div>
                    <span className="text-[11px] font-medium text-stone-700 leading-tight">
                      BIS Hallmark
                    </span>
                  </div>

                  {/* Badge 3: Neirah Certified */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200/90 flex items-center justify-center text-stone-700 shrink-0 shadow-2xs">
                      <HiOutlineShieldCheck className="w-4.5 h-4.5 text-stone-700" />
                    </div>
                    <span className="text-[11px] font-medium text-stone-700 leading-tight">
                      Neirah Certified
                    </span>
                  </div>

                  {/* Badge 4: Free Secure Shipping */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200/90 flex items-center justify-center text-stone-700 shrink-0 shadow-2xs">
                      <HiOutlineTruck className="w-4.5 h-4.5 text-stone-700" />
                    </div>
                    <span className="text-[11px] font-medium text-stone-700 leading-tight">
                      Free Secure Shipping
                    </span>
                  </div>
                </div>

                {/* Right side: Certificate Preview (Only for Gold / Diamond items) */}
                {isGold && (
                  <div className="w-full md:w-[150px] shrink-0 pt-4 md:pt-0 md:pl-6 flex flex-col items-center justify-center">
                  <div
                    onClick={() => setShowCertificateModal(true)}
                    className="border border-stone-200 bg-white p-1.5 rounded shadow-xs hover:shadow-md transition-all cursor-pointer group max-w-[130px]"
                    title="Click to view full certificate"
                  >
                    <img
                      src={certificateUrl}
                      alt="Certificate Preview"
                      className="w-full h-auto max-h-[85px] object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCertificateModal(true)}
                    className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-stone-800 hover:text-[#92704E] transition-colors cursor-pointer"
                  >
                    <HiOutlineEye className="w-3.5 h-3.5 text-stone-600" />
                    <span>View Certificate</span>
                  </button>
                </div>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                ACCORDIONS: PRODUCT DESCRIPTION, SPECIFICATION, PRICE BREAK UP & ORIGIN
            ═══════════════════════════════════════════════════════════ */}
            {/* ══════════════════════════════════════════════════════════
                ACCORDIONS: PRODUCT DESCRIPTION, SPECIFICATION, PRICE BREAK UP & ORIGIN
                (Matches live website boxed layout and text colors)
            ═══════════════════════════════════════════════════════════ */}
            <div className="border border-stone-200 divide-y divide-stone-200 bg-white rounded-none sm:rounded-sm overflow-hidden text-xs">
              {/* Accordion 1: Product Description */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('desc')}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer transition-colors hover:bg-stone-50/50"
                >
                  <span className="text-xs sm:text-[13px] font-medium text-stone-900 tracking-normal">Product Description</span>
                  <span className="text-stone-500 text-sm font-light select-none">
                    {openAccordions.desc ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.desc && (
                  <div className="px-5 pb-5 pt-0 text-stone-600 text-xs sm:text-[12.5px] leading-relaxed animate-fadeIn space-y-2">
                    <p>
                      {product.basicInfo?.description ||
                        product.description ||
                        'Crafted with fine craftsmanship and certified diamonds, this exquisite piece is designed for everyday elegance.'}
                    </p>
                    {Array.isArray(product.descriptionSections) &&
                      product.descriptionSections.map((sec, i) => (
                        <div key={i} className="pt-1">
                          <strong className="text-stone-900 font-medium">{sec.header}: </strong>
                          <span className="text-stone-600">{sec.description}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Accordion 2: Specification */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('specs')}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer transition-colors hover:bg-stone-50/50"
                >
                  <span className="text-xs sm:text-[13px] font-medium text-stone-900 tracking-normal">Specification</span>
                  <span className="text-stone-500 text-sm font-light select-none">
                    {openAccordions.specs ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.specs && (
                  <div className="px-5 pb-5 pt-0 text-xs animate-fadeIn space-y-1.5">
                    {specificationRows.map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center py-1.5 border-b border-stone-100 last:border-b-0">
                        <span className="text-stone-500 font-normal">{label}</span>
                        <span className="font-medium text-stone-900">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 3: PRICE BREAK UP (Only for Gold items) */}
              {isGold && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleAccordion('price')}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer transition-colors hover:bg-stone-50/50"
                >
                  <span className="text-[11.5px] sm:text-xs font-semibold tracking-wider uppercase text-stone-900">
                    PRICE BREAK UP
                  </span>
                  <span className="text-stone-500 text-sm font-light select-none">
                    {openAccordions.price ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.price && breakdown && (
                  <div className="px-5 pb-5 pt-1 text-xs animate-fadeIn">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-stone-200 text-[10px] sm:text-[10.5px] font-medium text-stone-400 uppercase tracking-wider">
                            <th className="pb-2.5 px-1 font-medium text-stone-400 text-left">COMPONENT</th>
                            <th className="pb-2.5 px-1 font-medium text-stone-400 text-center">RATE</th>
                            <th className="pb-2.5 px-1 font-medium text-stone-400 text-center">WEIGHT</th>
                            <th className="pb-2.5 px-1 font-medium text-stone-400 text-right">VALUE</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs">
                          {/* METALS */}
                          <tr>
                            <td colSpan={4} className="pt-3.5 pb-1.5 px-1 text-[10.5px] font-bold tracking-wider text-stone-900 uppercase">
                              METALS
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-1 font-normal text-stone-800">{breakdown.metalName}</td>
                            <td className="py-1 px-1 text-center font-normal text-stone-700">{formatBreakdownRate(breakdown.metalRate)}</td>
                            <td className="py-1 px-1 text-center font-normal text-stone-700">{formatBreakdownWeight(breakdown.metalWeight, 'g')}</td>
                            <td className="py-1 px-1 text-right font-normal text-stone-900">{formatBreakdownValue(breakdown.metalCost)}</td>
                          </tr>

                          {/* DIAMONDS */}
                          <tr>
                            <td colSpan={4} className="pt-3.5 pb-1.5 px-1 text-[10.5px] font-bold tracking-wider text-stone-900 uppercase">
                              DIAMONDS
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-1 font-normal text-stone-800">{breakdown.diamondLabel}</td>
                            <td className="py-1 px-1 text-center text-stone-400">-</td>
                            <td className="py-1 px-1 text-center font-normal text-stone-700">{formatBreakdownWeight(breakdown.diamondCarat, 'cts')}</td>
                            <td className="py-1 px-1 text-right font-normal text-stone-900">{formatBreakdownValue(breakdown.diamondCost)}</td>
                          </tr>

                          {/* MAKING CHARGES */}
                          <tr>
                            <td colSpan={4} className="pt-3.5 pb-1.5 px-1 text-[10.5px] font-bold tracking-wider text-stone-900 uppercase">
                              MAKING CHARGES
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-1 font-normal text-stone-800">Making Charge</td>
                            <td className="py-1 px-1 text-center text-stone-400">-</td>
                            <td className="py-1 px-1 text-center text-stone-400">-</td>
                            <td className="py-1 px-1 text-right font-normal text-stone-900">{formatBreakdownValue(breakdown.labourCharge)}</td>
                          </tr>

                          {/* OTHER CHARGES */}
                          <tr>
                            <td colSpan={4} className="pt-3.5 pb-1.5 px-1 text-[10.5px] font-bold tracking-wider text-stone-900 uppercase">
                              OTHER CHARGES
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-1 font-normal text-stone-800">Certificate Charge</td>
                            <td className="py-1 px-1 text-center text-stone-400">-</td>
                            <td className="py-1 px-1 text-center text-stone-400">-</td>
                            <td className="py-1 px-1 text-right font-normal text-stone-900">{formatBreakdownValue(breakdown.certificateCharge)}</td>
                          </tr>

                          {/* SUMMARY */}
                          <tr>
                            <td colSpan={4} className="pt-3.5 pb-1.5 px-1 text-[10.5px] font-bold tracking-wider text-stone-900 uppercase">
                              SUMMARY
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-1 font-normal text-stone-800">Subtotal</td>
                            <td className="py-1 px-1 text-center text-stone-400">-</td>
                            <td className="py-1 px-1 text-center text-stone-400">-</td>
                            <td className="py-1 px-1 text-right font-normal text-stone-900">{formatBreakdownValue(breakdown.subtotal)}</td>
                          </tr>
                          <tr>
                            <td className="py-1 px-1 font-normal text-stone-800">GST (3%)</td>
                            <td className="py-1 px-1 text-center text-stone-400">-</td>
                            <td className="py-1 px-1 text-center text-stone-400">-</td>
                            <td className="py-1 px-1 text-right font-normal text-stone-900">{formatBreakdownValue(breakdown.gstAmount)}</td>
                          </tr>
                          <tr className="border-t border-stone-200">
                            <td className="pt-3 pb-1 px-1 font-bold text-stone-900 text-xs">Grand Total</td>
                            <td className="pt-3 pb-1 px-1 text-center text-stone-400 font-normal">-</td>
                            <td className="pt-3 pb-1 px-1 text-center text-stone-400 font-normal">-</td>
                            <td className="pt-3 pb-1 px-1 text-right font-bold text-stone-900 text-xs">{formatBreakdownValue(breakdown.finalPrice)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Variation in Weight Notice Card */}
                    <div className="mt-4 p-3 rounded border border-[#F0E6D8] bg-[#FAF8F5] flex items-center gap-2.5">
                      <svg className="w-3.5 h-3.5 text-[#C59B65] shrink-0 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="1.6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                      <p className="text-[11px] text-[#8C6D4F] leading-snug">
                        The final invoice amount will be adjusted in case of variation in weight.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Accordion 4: Manufacturer & Origin */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('origin')}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer transition-colors hover:bg-stone-50/50"
                >
                  <span className="text-xs sm:text-[13px] font-medium text-stone-900 tracking-normal">Manufacturer &amp; Origin</span>
                  <span className="text-stone-500 text-sm font-light select-none">
                    {openAccordions.origin ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.origin && (
                  <div className="px-5 pb-5 pt-0 text-xs animate-fadeIn space-y-1.5">
                    <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                      <span className="text-stone-500 font-normal">Manufacturer:</span>
                      <span className="font-medium text-stone-900">Neirah E-Retail India Pvt. Ltd.</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-stone-500 font-normal">Country of Origin:</span>
                      <span className="font-medium text-stone-900">India</span>
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
                      onClick={() => {
                        const targetSlug =
                          item.basicInfo?.slug ||
                          item.slug ||
                          (item.basicInfo?.title || item.title || item.name
                            ? String(item.basicInfo?.title || item.title || item.name)
                                .toLowerCase()
                                .trim()
                                .replace(/[^\w\s-]/g, '')
                                .replace(/\s+/g, '-')
                            : '');
                        if (targetSlug) {
                          navigate(`/product/${encodeURIComponent(targetSlug)}`);
                        }
                      }}
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

      {/* ─── Luxury High-Resolution Image Viewer Lightbox Modal ─── */}
      {lightboxIndex !== null && galleryImages[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={closeLightbox}
        >
          <div
            className={`bg-white shadow-2xl relative flex flex-col md:flex-row overflow-hidden transition-all duration-300 ${
              isLightboxFullscreen
                ? 'w-full h-full rounded-none'
                : 'w-full max-w-[960px] h-[88vh] max-h-[700px] rounded-2xl sm:rounded-3xl border border-stone-150'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button at top-right */}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute top-3.5 right-3.5 z-30 p-2 rounded-full bg-white/90 hover:bg-white text-stone-500 hover:text-stone-900 shadow-sm border border-stone-200/60 transition-colors cursor-pointer"
              aria-label="Close image viewer"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>

            {/* ─── COLUMN 1: Vertical Thumbnail Strip (Left) ─── */}
            <div className="hidden md:flex w-24 sm:w-28 shrink-0 flex-col items-center py-4 px-2 border-r border-stone-150 bg-[#FAFAFA]/80 select-none">
              <button
                type="button"
                onClick={() => {
                  thumbnailContainerRef.current?.scrollBy({ top: -120, behavior: 'smooth' });
                }}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer mb-2"
                aria-label="Scroll thumbnails up"
              >
                <HiChevronUp className="w-5 h-5" />
              </button>

              <div
                ref={thumbnailContainerRef}
                className="flex-1 w-full overflow-y-auto no-scrollbar space-y-2.5 px-1 py-1"
              >
                {galleryImages.map((img, idx) => {
                  const isActive = idx === lightboxIndex;
                  const isVid = isVideoMedia(img);
                  return (
                    <button
                      key={`thumb-${img}-${idx}`}
                      type="button"
                      onClick={() => openLightboxAtIndex(idx)}
                      className={`w-full aspect-square rounded-xl overflow-hidden p-1 bg-white cursor-pointer transition-all flex items-center justify-center relative ${
                        isActive
                          ? 'border-2 border-[#D4A373] ring-2 ring-[#D4A373]/20 shadow-xs scale-102'
                          : 'border border-stone-200/80 hover:border-stone-300 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {isVid ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 text-[#C59B65]">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  thumbnailContainerRef.current?.scrollBy({ top: 120, behavior: 'smooth' });
                }}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer mt-2"
                aria-label="Scroll thumbnails down"
              >
                <HiChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* ─── COLUMN 2: Main Image Canvas Stage (Center) ─── */}
            <div className="flex-1 relative flex items-center justify-center bg-[#FDFBF7] overflow-hidden select-none min-h-[350px]">
              {/* TOP: Metal Color Swatches (Only displayed if dynamic metal colors exist) */}
              {modalColorsToRender && modalColorsToRender.length > 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200/80 shadow-md">
                  <div className="flex items-center gap-2">
                    {modalColorsToRender.map((c) => {
                      const isSelected = selectedColor?.toLowerCase() === c.name?.toLowerCase();
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => {
                            setSelectedColor(c.name);
                            setLightboxIndex(0);
                            setLightboxZoom(1);
                            setLightboxPan({ x: 0, y: 0 });
                          }}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all cursor-pointer shadow-inner relative flex items-center justify-center border border-black/10 ${
                            isSelected
                              ? 'ring-2 ring-stone-900 ring-offset-2 scale-110'
                              : 'hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          style={{ background: c.gradient }}
                          title={c.name}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Previous Image Arrow */}
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
                    setLightboxZoom(1);
                    setLightboxPan({ x: 0, y: 0 });
                  }}
                  className="absolute left-3 sm:left-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white shadow-md border border-stone-200/70 flex items-center justify-center text-stone-700 hover:text-black cursor-pointer transition-all hover:scale-105 active:scale-95"
                  aria-label="Previous image"
                >
                  <HiChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Next Image Arrow */}
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
                    setLightboxZoom(1);
                    setLightboxPan({ x: 0, y: 0 });
                  }}
                  className="absolute right-3 sm:right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white shadow-md border border-stone-200/70 flex items-center justify-center text-stone-700 hover:text-black cursor-pointer transition-all hover:scale-105 active:scale-95"
                  aria-label="Next image"
                >
                  <HiChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Active Image / Video Stage with Zoom & Pan */}
              <div
                className={`w-full h-full flex items-center justify-center p-4 sm:p-8 pt-16 ${
                  lightboxZoom > 1 ? (isLightboxDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                }`}
                onMouseDown={handleLightboxMouseDown}
                onMouseMove={handleLightboxMouseMove}
                onMouseUp={handleLightboxMouseUp}
                onMouseLeave={handleLightboxMouseUp}
                onDoubleClick={handleLightboxDoubleClick}
              >
                {isVideoMedia(galleryImages[lightboxIndex]) ? (
                  <video
                    src={galleryImages[lightboxIndex]}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="max-h-full max-w-full object-contain rounded-xl shadow-md"
                  />
                ) : (
                  <div
                    style={{
                      transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom})`,
                      transition: isLightboxDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
                    }}
                    className="w-full h-full flex items-center justify-center origin-center pointer-events-none"
                  >
                    <img
                      src={galleryImages[lightboxIndex]}
                      alt="Zoomed Product View"
                      className="max-h-full max-w-full object-contain"
                      draggable={false}
                    />
                  </div>
                )}
              </div>

              {/* Floating Bottom Pill Toolbar (Zoom Controls) */}
              {!isVideoMedia(galleryImages[lightboxIndex]) && (
                <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-4 py-1.5 sm:py-2 rounded-full shadow-lg border border-stone-200/80 flex items-center gap-3 text-stone-700 select-none">
                  <button
                    type="button"
                    onClick={() => setLightboxZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                    className="p-1 hover:text-stone-950 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Zoom in"
                    aria-label="Zoom in"
                  >
                    <HiOutlinePlus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLightboxZoom(1);
                      setLightboxPan({ x: 0, y: 0 });
                    }}
                    className="text-xs font-semibold tracking-wider text-stone-800 min-w-[42px] text-center hover:text-[#92704E] cursor-pointer"
                    title="Click to reset zoom"
                  >
                    {Math.round(lightboxZoom * 100)}%
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLightboxZoom((z) => {
                        const next = Math.max(1, +(z - 0.25).toFixed(2));
                        if (next === 1) setLightboxPan({ x: 0, y: 0 });
                        return next;
                      });
                    }}
                    className="p-1 hover:text-stone-950 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Zoom out"
                    aria-label="Zoom out"
                  >
                    <HiOutlineMinus className="w-4 h-4" />
                  </button>

                  <div className="h-3.5 w-px bg-stone-300" />

                  <button
                    type="button"
                    onClick={() => setIsLightboxFullscreen((f) => !f)}
                    className="p-1 hover:text-stone-950 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title={isLightboxFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    aria-label="Toggle fullscreen"
                  >
                    <HiOutlineArrowsExpand className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Category Size Chart Download Modal ─── */}
      {showSizeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setShowSizeModal(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-100 text-center animate-scaleUp overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top-Right Circular Close Button */}
            <button
              type="button"
              onClick={() => setShowSizeModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <HiOutlineX className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Modal Title */}
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight mb-5">
              {sizeChart?.categoryName || categoryName || 'Jewelry'} Size Chart
            </h3>

            {/* Center PDF / Guide Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative flex flex-col items-center justify-center">
                <svg className="w-16 h-20 text-stone-800" viewBox="0 0 48 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4C4 1.79086 5.79086 0 8 0H32L44 12V56C44 58.2091 42.2091 60 40 60H8C5.79086 60 4 58.2091 4 56V4Z" fill="white" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
                  <path d="M32 0V12H44" fill="#E7E5E4" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
                  <rect x="9" y="22" width="30" height="15" rx="3" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5"/>
                  <text x="24" y="33" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#DC2626" fontFamily="sans-serif">PDF</text>
                  <path d="M24 43V51M24 51L20 47M24 51L28 47" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Document Title & Description */}
            <h4 className="text-sm font-bold text-stone-900 tracking-tight">
              Download {sizeChart?.categoryName || categoryName || 'Jewelry'} Size Guide{sizeChart?.isPdf ? ' PDF' : ''}
            </h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Click to download the practical Size Guide for this category.
            </p>

            {/* Image Preview if Size Chart is an Image */}
            {!sizeChart?.isPdf && sizeChart?.url && (
              <div className="mt-4 max-h-52 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center p-2">
                <img
                  src={sizeChart.url}
                  alt={`${sizeChart.categoryName} Size Guide`}
                  className="max-h-48 w-auto object-contain rounded"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}

            {/* CLICK HERE Action Button */}
            <div className="mt-6 flex justify-center">
              <a
                href={sizeChart?.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={(e) => {
                  if (!sizeChart?.url) {
                    e.preventDefault();
                    return;
                  }
                  // Open in new tab and auto-close modal
                  window.open(sizeChart.url, '_blank');
                  setShowSizeModal(false);
                }}
                className="inline-flex items-center justify-center px-10 py-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                CLICK HERE
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── Certificate Preview Lightbox Modal ─── */}
      {showCertificateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowCertificateModal(false)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                  Authenticity &amp; Grading Certificate
                </h3>
                <p className="text-xs text-stone-500">
                  {product.basicInfo?.title || 'Fine Jewellery Certificate'} • {product.basicInfo?.sku || 'Certified'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                aria-label="Close certificate modal"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-50 rounded-xl p-2 sm:p-4 border border-stone-200/80 flex items-center justify-center">
              <img
                src={certificateUrl}
                alt="Jewellery Certificate"
                className="max-h-[60vh] w-auto object-contain rounded shadow-md"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-stone-500 text-center sm:text-left">
                100% Certified Natural &amp; Lab Grown Diamonds • BIS Hallmarked Gold
              </span>
              <a
                href={certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#92704E] hover:bg-[#7e5f40] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
              >
                <span>Open Original</span>
                <HiOutlineExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile Sticky Bottom Action Bar ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="min-w-0">
          <div className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">Total (MRP Incl. taxes)</div>
          <div className="text-base sm:text-lg font-sans font-bold text-stone-900 leading-tight truncate">
            {formatPrice(currentPrice)}
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={addingToCart}
          className="flex-1 py-3 bg-[#141414] active:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          {addingToCart ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>ADD TO CART</span>
          )}
        </button>
        <button
          type="button"
          onClick={handleToggleWishlist}
          className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
            isItemWishlisted
              ? 'border-rose-200 bg-rose-50 text-[#e11d48]'
              : 'border-stone-200 bg-white text-stone-600 hover:text-[#e11d48]'
          }`}
          aria-label={isItemWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isItemWishlisted ? (
            <HiHeart className="w-5 h-5 text-[#e11d48] fill-current" />
          ) : (
            <HiOutlineHeart className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* ─── Luxury Share Modal (Fallback / Direct Dialog) ────── */}
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-stone-200 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <HiOutlineShare className="w-5 h-5 text-[#8b6f4e]" />
                <h3 className="font-serif text-lg font-bold text-stone-900 tracking-wide">
                  Share
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Close share dialog"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary */}
            <div className="flex items-center gap-3.5 my-4 p-3 rounded-xl bg-stone-50 border border-stone-200/80">
              {galleryImages?.[0] ? (
                <img
                  src={galleryImages[0]}
                  alt={product?.name || 'Product'}
                  className="w-14 h-14 object-cover rounded-lg border border-stone-200 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                  <HiOutlineShare className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-stone-900 truncate">
                  {product?.name || 'Neirah Jewellery'}
                </h4>
                {typeof formatPrice === 'function' && currentPrice ? (
                  <p className="text-xs font-bold text-[#8b6f4e] mt-0.5">
                    {formatPrice(currentPrice)}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Copy Link Input Bar */}
            <div className="space-y-1.5 mb-5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Link
              </label>
              <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl border border-stone-200 bg-stone-50/70 focus-within:border-[#8b6f4e] focus-within:bg-white transition-colors">
                <FaLink className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="w-full text-xs text-stone-700 bg-transparent outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    linkCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#8b6f4e] hover:bg-[#725a3d] text-white active:scale-95'
                  }`}
                >
                  {linkCopied ? (
                    <>
                      <FaCheck className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <span>Copy</span>
                  )}
                </button>
              </div>
            </div>

            {/* Social Share Options */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-3 text-center">
                Share directly via
              </p>
              <div className="grid grid-cols-5 gap-2 text-center">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent((product?.name ? product.name + '\n' : '') + window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-emerald-50 text-stone-600 hover:text-emerald-600 transition-colors group cursor-pointer"
                  title="Share on WhatsApp"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <FaWhatsapp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium truncate w-full">WhatsApp</span>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-blue-50 text-stone-600 hover:text-blue-600 transition-colors group cursor-pointer"
                  title="Share on Facebook"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <FaFacebookF className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium truncate w-full">Facebook</span>
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(product?.name || 'Neirah Fine Jewellery')}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-stone-100 text-stone-600 hover:text-black transition-colors group cursor-pointer"
                  title="Share on X"
                >
                  <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                    <FaXTwitter className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium truncate w-full">Twitter / X</span>
                </a>

                {/* Pinterest */}
                <a
                  href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(galleryImages?.[0] || '')}&description=${encodeURIComponent(product?.name || 'Neirah Jewellery')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-rose-50 text-stone-600 hover:text-rose-600 transition-colors group cursor-pointer"
                  title="Share on Pinterest"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                    <FaPinterestP className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium truncate w-full">Pinterest</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(product?.name || 'Neirah Luxury Jewellery')}&body=${encodeURIComponent('Check out this exquisite piece:\n' + window.location.href)}`}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-amber-50 text-stone-600 hover:text-amber-700 transition-colors group cursor-pointer"
                  title="Share via Email"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
                    <FaEnvelope className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium truncate w-full">Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
